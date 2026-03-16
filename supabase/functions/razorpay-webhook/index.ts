import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!KEY_SECRET) throw new Error("Razorpay secret not configured");

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) throw new Error("No signature header");

    // Verify webhook signature
    const key = new TextEncoder().encode(KEY_SECRET);
    const message = new TextEncoder().encode(body);
    const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, message);
    const expectedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(sig)));

    if (expectedSignature !== signature) {
      console.error("Webhook signature mismatch");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Webhook event: ${eventType}`);

    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await serviceClient.from("payments").update({
        razorpay_payment_id: payment.id,
        status: "completed",
      }).eq("razorpay_order_id", orderId);

      // Find booking via payment and confirm
      const { data: paymentRecord } = await serviceClient.from("payments").select("booking_id").eq("razorpay_order_id", orderId).single();
      if (paymentRecord) {
        await serviceClient.from("bookings").update({ status: "confirmed" }).eq("id", paymentRecord.booking_id);
      }

      console.log(`Payment captured: ${payment.id} for order ${orderId}`);
    } else if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await serviceClient.from("payments").update({
        status: "failed",
      }).eq("razorpay_order_id", orderId);

      const { data: paymentRecord } = await serviceClient.from("payments").select("booking_id").eq("razorpay_order_id", orderId).single();
      if (paymentRecord) {
        await serviceClient.from("bookings").update({ status: "failed" }).eq("id", paymentRecord.booking_id);
      }

      console.log(`Payment failed: ${payment.id}`);
    } else if (eventType === "order.paid") {
      const order = event.payload.order.entity;
      console.log(`Order paid: ${order.id}`);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
