import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { property_id, start_date, end_date, rent_amount, security_deposit, total_amount } = await req.json();

    const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_live_SP7mhMxAuk9Izg";
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_SECRET) throw new Error("Razorpay secret not configured");

    // Detect test mode
    const isTestMode = KEY_ID.startsWith("rzp_test_");
    if (isTestMode) {
      console.warn("⚠ Razorpay is running in TEST MODE");
    }

    // Generate reference ID
    const refId = `RMA-${Date.now().toString(36).toUpperCase()}`;

    // Check for overlapping bookings
    const { data: overlapping } = await supabase
      .from("bookings")
      .select("id")
      .eq("property_id", property_id)
      .in("status", ["confirmed", "pending"])
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlapping && overlapping.length > 0) {
      throw new Error("Selected dates overlap with an existing booking");
    }

    // Create booking in pending state
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: bookingErr } = await serviceClient
      .from("bookings")
      .insert({
        property_id,
        buyer_id: user.id,
        start_date,
        end_date,
        total_price: total_amount,
        rent_amount,
        security_deposit,
        reference_id: refId,
        status: "pending",
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${KEY_ID}:${KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(total_amount * 100),
        currency: "INR",
        receipt: refId,
        notes: { booking_id: booking.id, property_id, buyer_id: user.id },
      }),
    });

    const order = await orderRes.json();
    if (order.error) throw new Error(order.error.description);

    // Create payment record
    await serviceClient.from("payments").insert({
      booking_id: booking.id,
      amount: total_amount,
      razorpay_order_id: order.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        booking_id: booking.id,
        reference_id: refId,
        key_id: KEY_ID,
        is_test_mode: isTestMode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
