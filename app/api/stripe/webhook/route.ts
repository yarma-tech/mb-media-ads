import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { markDemandePayee } from "@/lib/demandes";
import { getStripe } from "@/lib/stripe";

// Webhook Stripe : confirme le paiement et passe la demande à "payee".
// Route publique (exclue de l'auth par proxy.ts) ; la signature Stripe authentifie l'appel.
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const demandeId = session.metadata?.demande_id ?? session.client_reference_id ?? null;
    if (demandeId) {
      const paymentIntent =
        typeof session.payment_intent === "string" ? session.payment_intent : null;
      await markDemandePayee(demandeId, paymentIntent, (session.amount_total ?? 0) / 100);
    }
  }

  return NextResponse.json({ received: true });
}
