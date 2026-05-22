// Module serveur uniquement (utilise la clé service_role + l'optimiseur).
import { loadCatalogue } from "./catalog";
import { CATALOGUE_SEED } from "./catalog-seed";
import type { EtatDemande } from "./enums";
import { optimiser } from "./optimizer";
import { getAdminClient, supabaseConfigured } from "./supabase";
import type { Demande, DemandeInput } from "./types";

// Données de démo (en mémoire) tant que Supabase n'est pas connecté : permettent à
// /admin d'afficher des demandes réalistes. Les recommandations sont calculées par
// l'optimiseur sur le catalogue local.
function demo(input: DemandeInput, etat: EtatDemande, ageHeures: number): Demande {
  const reco = optimiser(input, CATALOGUE_SEED);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(Date.now() - ageHeures * 3_600_000).toISOString(),
    input,
    recommandation: reco,
    leadScore: reco.leadScore,
    etat,
  };
}

const store: Demande[] = [
  demo(
    { nomEntreprise: "Gwada Fresh", nomContact: "Marie Lubin", secteur: "Food", typeEntreprise: "Privé", dateDebut: "2027-02-01", dateFin: "2027-03-15", objectifPrincipal: "vente", mode: "budget", budget: 5000 },
    "soumise",
    5,
  ),
  demo(
    { nomEntreprise: "Karukera Tourisme", nomContact: "Steve Madère", secteur: "Tourisme", typeEntreprise: "Association", dateDebut: "2027-06-01", dateFin: "2027-06-30", objectifPrincipal: "notoriete", mode: "goal", objectifValeur: 200 },
    "acceptee",
    28,
  ),
  demo(
    { nomEntreprise: "TechPro Caraïbes", nomContact: "Sandra Bernard", secteur: "Tech", typeEntreprise: "Privé", dateDebut: "2027-09-01", dateFin: "2027-10-31", objectifPrincipal: "lead", mode: "budget", budget: 12000 },
    "soumise",
    51,
  ),
];

export async function listDemandes(): Promise<Demande[]> {
  if (supabaseConfigured) {
    const sb = getAdminClient();
    if (sb) {
      const { data } = await sb.from("demandes").select("*").order("lead_score", { ascending: false });
      if (data) return data.map(rowToDemande);
    }
  }
  return [...store].sort((a, b) => b.leadScore - a.leadScore);
}

export async function createDemande(input: DemandeInput): Promise<Demande> {
  const reco = optimiser(input, await loadCatalogue());
  const demande: Demande = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    recommandation: reco,
    leadScore: reco.leadScore,
    etat: "soumise",
  };

  if (supabaseConfigured) {
    const sb = getAdminClient();
    if (sb) {
      const { data } = await sb
        .from("demandes")
        .insert({
          nom_entreprise: input.nomEntreprise,
          nom_contact: input.nomContact,
          secteur: input.secteur,
          type_entreprise: input.typeEntreprise,
          date_debut: input.dateDebut,
          date_fin: input.dateFin,
          mode: input.mode,
          objectif_principal: input.objectifPrincipal,
          budget: input.budget ?? null,
          objectif_valeur: input.objectifValeur ?? null,
          etat: "soumise",
          lead_score: reco.leadScore,
          recommandation: reco,
          predictions: {
            audienceK: reco.audienceK,
            couvertureEfficaceK: reco.couvertureEfficaceK,
            leads: reco.leads,
            ventes: reco.ventes,
          },
        })
        .select("*")
        .single();
      if (data) return rowToDemande(data);
    }
  }

  store.unshift(demande);
  return demande;
}

export async function getDemande(id: string): Promise<Demande | null> {
  if (supabaseConfigured) {
    const sb = getAdminClient();
    if (sb) {
      const { data } = await sb.from("demandes").select("*").eq("id", id).maybeSingle();
      if (data) return rowToDemande(data);
    }
  }
  return store.find((d) => d.id === id) ?? null;
}

export async function setEtat(id: string, etat: EtatDemande): Promise<void> {
  if (supabaseConfigured) {
    const sb = getAdminClient();
    if (sb) {
      await sb.from("demandes").update({ etat }).eq("id", id);
      return;
    }
  }
  const d = store.find((x) => x.id === id);
  if (d) d.etat = etat;
}

// Mapping ligne Supabase -> Demande (chemin actif une fois la base connectée).
function rowToDemande(row: Record<string, unknown>): Demande {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    leadScore: Number(row.lead_score ?? 0),
    etat: row.etat as EtatDemande,
    recommandation: row.recommandation as Demande["recommandation"],
    input: {
      nomEntreprise: String(row.nom_entreprise),
      nomContact: String(row.nom_contact),
      secteur: row.secteur as DemandeInput["secteur"],
      typeEntreprise: row.type_entreprise as DemandeInput["typeEntreprise"],
      dateDebut: String(row.date_debut),
      dateFin: String(row.date_fin),
      objectifPrincipal: row.objectif_principal as DemandeInput["objectifPrincipal"],
      mode: row.mode as DemandeInput["mode"],
      budget: row.budget == null ? undefined : Number(row.budget),
      objectifValeur: row.objectif_valeur == null ? undefined : Number(row.objectif_valeur),
    },
  };
}
