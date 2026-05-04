import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan    = session.metadata?.plan;
      const minutes = session.metadata?.minutes;
      console.log(`✅ Payment complete — plan: ${plan}, minutes: ${minutes}`);
      // TODO: store subscription in database, unlock credits for user
      break;
    }
    case "customer.subscription.deleted": {
      console.log("❌ Subscription cancelled");
      // TODO: revoke user access
      break;
    }
  }

  return NextResponse.json({ received: true });
}
