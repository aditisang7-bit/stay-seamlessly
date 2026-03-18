import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Unauthorized");
    const userId = claimsData.claims.sub;

    const { property_id, start_date, end_date, rent_amount, security_deposit, total_amount } = await req.json();

    if (!property_id || !start_date || !end_date || !total_amount) {
      throw new Error("Missing required fields: property_id, start_date, end_date, total_amount");
    }

    if (total_amount <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_ID) throw new Error("Razorpay key ID not configured");
    if (!KEY_SECRET) throw new Error("Razorpay secret not configured");

    const isTestMode = KEY_ID.startsWith("rzp_test_");
    if (isTestMode) {
      console.warn("⚠ Razorpay is running in TEST MODE");
    }

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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error: bookingErr } = await serviceClient
      .from("bookings")
      .insert({
        property_id,
        buyer_id: userId,
        start_date,
        end_date,
        total_price: total_amount,
        rent_amount: rent_amount || 0,
        security_deposit: security_deposit || 0,
        reference_id: refId,
        status: "pending",
      })
      .select()
      .single();

    if (bookingErr) {
      console.error("Booking creation error:", bookingErr);
      throw new Error("Failed to create booking: " + bookingErr.message);
    }

    // Create Razorpay order
    console.log(`Creating Razorpay order: amount=${Math.round(total_amount * 100)} paise, key=${KEY_ID.substring(0, 12)}...`);
    
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
        notes: { booking_id: booking.id, property_id, buyer_id: userId },
      }),
    });

    const order = await orderRes.json();
    
    if (!orderRes.ok || order.error) {
      console.error("Razorpay order creation failed:", JSON.stringify(order));
      // Clean up the booking
      await serviceClient.from("bookings").delete().eq("id", booking.id);
      throw new Error(order.error?.description || "Failed to create Razorpay order");
    }

    // Create payment record
    const { error: paymentErr } = await serviceClient.from("payments").insert({
      booking_id: booking.id,
      amount: total_amount,
      razorpay_order_id: order.id,
      status: "pending",
    });

    if (paymentErr) {
      console.error("Payment record creation error:", paymentErr);
    }

    console.log(`Order created successfully: ${order.id}, booking: ${booking.id}`);

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
    console.error("create-razorpay-order error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
