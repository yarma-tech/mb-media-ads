// Client Stripe côté serveur. Renvoie null tant que STRIPE_SECRET_KEY n'est pas
// fournie -> l'app reste fonctionnelle (le bouton Payer affiche un message).
import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripeConfigured = Boolean(key);

let client: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}
