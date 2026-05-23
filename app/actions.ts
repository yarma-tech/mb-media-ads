"use server";

import { headers } from "next/headers";
import { loadCatalogue } from "@/lib/catalog";
import { createDemande, setEtat, setStripeSession } from "@/lib/demandes";
import type { EtatDemande, Secteur, TypeCampagne, TypeEntreprise } from "@/lib/enums";
import { optimiser, predictTarif } from "@/lib/optimizer";
import { getStripe } from "@/lib/stripe";
import { getProfile, getUser } from "@/lib/supabase-server";
import type {
  CampagneAutoInput,
  ConfigManuelle,
  DemandeInput,
  PaiementPayload,
  Recommandation,
} from "@/lib/types";

// Complète le brief campagne avec les infos entreprise du profil connecté (jamais du client).
async function buildDemandeInput(campagne: CampagneAutoInput): Promise<DemandeInput> {
  const [profile, user] = await Promise.all([getProfile(), getUser()]);
  return {
    nomEntreprise: profile?.nom_entreprise ?? "Mon entreprise",
    nomContact: profile?.email ?? user?.email ?? "—",
    secteur: (profile?.secteur as Secteur) ?? "Tech",
    typeEntreprise: (profile?.type_entreprise as TypeEntreprise) ?? "Privé",
    ...campagne,
  };
}

// Calcule la campagne idéale (sans persister) -> affichage inline.
export async function recommander(campagne: CampagneAutoInput): Promise<Recommandation> {
  const [input, catalogue] = await Promise.all([buildDemandeInput(campagne), loadCatalogue()]);
  return optimiser(input, catalogue);
}

// Mode manuel : tarif d'une configuration unique. Secteur + type d'entreprise
// viennent du profil de l'utilisateur connecté (jamais du client).
export async function tarif(config: ConfigManuelle): Promise<Recommandation> {
  const [profile, catalogue] = await Promise.all([getProfile(), loadCatalogue()]);
  const secteur = (profile?.secteur as Secteur) ?? "Tech";
  const typeEntreprise = (profile?.type_entreprise as TypeEntreprise) ?? "Privé";
  return predictTarif(config, secteur, typeEntreprise, catalogue);
}

// Recalcule la recommandation côté serveur (jamais de prix venant du client) à partir
// du payload, et construit le DemandeInput à persister (auto = optimiseur ; manuel = tarif).
async function buildInputReco(
  payload: PaiementPayload,
): Promise<{ input: DemandeInput; reco: Recommandation; typeCampagne: TypeCampagne }> {
  const catalogue = await loadCatalogue();
  if (payload.kind === "auto") {
    const input = await buildDemandeInput(payload.campagne);
    return { input, reco: optimiser(input, catalogue), typeCampagne: "auto" };
  }
  const [profile, user] = await Promise.all([getProfile(), getUser()]);
  const secteur = (profile?.secteur as Secteur) ?? "Tech";
  const typeEntreprise = (profile?.type_entreprise as TypeEntreprise) ?? "Privé";
  const c = payload.config;
  const reco = predictTarif(c, secteur, typeEntreprise, catalogue);
  const input: DemandeInput = {
    nomEntreprise: profile?.nom_entreprise ?? "Mon entreprise",
    nomContact: profile?.email ?? user?.email ?? "—",
    secteur,
    typeEntreprise,
    dateDebut: c.dateDebut,
    dateFin: c.dateFin,
    objectifPrincipal: c.objectifPrincipal,
    mode: "budget",
    budget: Math.max(1, Math.round(reco.budgetTotal)),
  };
  return { input, reco, typeCampagne: "manuel" };
}

// Voie "expert" : crée la demande (état "soumise") pour le pipeline admin.
export async function creerDemandeExpert(payload: PaiementPayload): Promise<{ id: string }> {
  const user = await getUser();
  const { input, reco, typeCampagne } = await buildInputReco(payload);
  const demande = await createDemande(input, {
    reco,
    userId: user?.id ?? null,
    canal: "expert",
    typeCampagne,
  });
  return { id: demande.id };
}

// Voie self-service : crée la demande puis une session Stripe Checkout. Renvoie l'URL
// de paiement, ou un message si Stripe n'est pas configuré.
export async function payer(payload: PaiementPayload): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { error: "Le paiement en ligne n'est pas encore activé. Parlez à un expert en attendant." };
  }
  const user = await getUser();
  const { input, reco, typeCampagne } = await buildInputReco(payload);
  if (reco.statut === "infaisable" || reco.budgetTotal <= 0) {
    return { error: "Cette configuration n'est pas finançable en l'état." };
  }
  const demande = await createDemande(input, {
    reco,
    userId: user?.id ?? null,
    canal: "self_service",
    typeCampagne,
  });

  const origin =
    (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(reco.budgetTotal * 100),
          product_data: {
            name: `Campagne MB Média — ${input.nomEntreprise}`,
            description: `${reco.placements.length} placement(s), commission incluse`,
          },
        },
      },
    ],
    success_url: `${origin}/campagne/merci?demande=${demande.id}`,
    cancel_url: `${origin}/campagne`,
    client_reference_id: demande.id,
    metadata: { demande_id: demande.id },
  });

  if (!session.url) return { error: "Impossible de créer la session de paiement. Réessayez." };
  await setStripeSession(demande.id, session.id);
  return { url: session.url };
}

// Vue admin : fait avancer l'état d'une demande.
export async function changerEtat(id: string, etat: EtatDemande): Promise<void> {
  await setEtat(id, etat);
}
