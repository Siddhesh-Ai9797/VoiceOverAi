import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const PLANS = {
  starter: {
    name:     "Starter",
    price:    2900,
    interval: "month" as const,
    minutes:  30,
  },
  pro: {
    name:     "Pro",
    price:    9900,
    interval: "month" as const,
    minutes:  180,
  },
  studio: {
    name:     "Studio",
    price:    29900,
    interval: "month" as const,
    minutes:  99999,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    const selected = PLANS[plan as keyof typeof PLANS];

    if (!selected) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode:                 "subscription",
      line_items: [{
        price_data: {
          currency:     "usd",
          product_data: {
            name:        `VoiceOverAI ${selected.name}`,
            description: `${selected.minutes === 99999 ? "Unlimited" : selected.minutes + " minutes"} of AI dubbing per month`,
          },
          recurring:  { interval: selected.interval },
          unit_amount: selected.price,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`,
      metadata:    { plan, minutes: String(selected.minutes) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
