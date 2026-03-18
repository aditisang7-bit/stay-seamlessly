import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

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

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !booking_id) {
      throw new Error("Missing required payment verification fields");
    }

    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_SECRET) throw new Error("Razorpay secret not configured");

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const key = new TextEncoder().encode(KEY_SECRET);
    const message = new TextEncoder().encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    const expectedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(signature)));

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch - expected:", expectedSignature.substring(0, 16), "got:", razorpay_signature.substring(0, 16));
      throw new Error("Payment signature verification failed");
    }

    const isTestPayment = razorpay_payment_id?.startsWith("pay_test_") || razorpay_order_id?.startsWith("order_test_");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update payment
    const { error: payErr } = await serviceClient.from("payments").update({
      razorpay_payment_id,
      status: "completed",
    }).eq("razorpay_order_id", razorpay_order_id);

    if (payErr) console.error("Payment update error:", payErr);

    // Confirm booking
    const { error: bookErr } = await serviceClient.from("bookings").update({
      status: "confirmed",
    }).eq("id", booking_id);

    if (bookErr) console.error("Booking update error:", bookErr);

    console.log(`Payment verified: ${razorpay_payment_id}, booking: ${booking_id}, test: ${isTestPayment}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking_id,
        payment_id: razorpay_payment_id,
        is_test_mode: isTestPayment,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("verify-razorpay-payment error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
