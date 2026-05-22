"use server";

import { loadCatalogue } from "@/lib/catalog";
import { createDemande, setEtat } from "@/lib/demandes";
import type { EtatDemande } from "@/lib/enums";
import { optimiser } from "@/lib/optimizer";
import type { DemandeInput, Recommandation } from "@/lib/types";

// Calcule la campagne idéale (sans persister) -> affichage inline.
export async function recommander(input: DemandeInput): Promise<Recommandation> {
  const catalogue = await loadCatalogue();
  return optimiser(input, catalogue);
}

// Workflow simulé : crée la demande (état "soumise"). Aucun email réellement envoyé.
export async function envoyerDemande(input: DemandeInput): Promise<{ id: string }> {
  const demande = await createDemande(input);
  return { id: demande.id };
}

// Vue admin : fait avancer l'état d'une demande.
export async function changerEtat(id: string, etat: EtatDemande): Promise<void> {
  await setEtat(id, etat);
}
