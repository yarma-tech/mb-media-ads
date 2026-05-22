import type { MediaId } from "./enums";

// Fenêtre commerciale propre au média (réplique data/enrich_dataset.py).
// Karata = Carnaval de Guadeloupe (T1) ; Lumen/Pulse = calendrier commercial classique.
export type Fenetre =
  | "Carnaval"
  | "Été"
  | "Standard"
  | "Soldes"
  | "St-Valentin"
  | "Fête-des-mères"
  | "Rentrée"
  | "Noël";

const CLASSIQUE: Record<number, Fenetre> = {
  1: "Soldes",
  2: "St-Valentin",
  5: "Fête-des-mères",
  6: "Fête-des-mères",
  7: "Été",
  8: "Été",
  9: "Rentrée",
  11: "Noël",
  12: "Noël",
};

export function fenetreCommerciale(media: MediaId, mois: number): Fenetre {
  if (media === "karata") {
    if (mois >= 1 && mois <= 3) return "Carnaval";
    if (mois === 7 || mois === 8) return "Été";
    return "Standard";
  }
  return CLASSIQUE[mois] ?? "Standard";
}

function parse(d: string): Date {
  return new Date(`${d}T00:00:00`);
}

// Mois représentatif de la période (milieu) — pour la feature saisonnière.
export function moisRepresentatif(dateDebut: string, dateFin: string): number {
  const mid = new Date((parse(dateDebut).getTime() + parse(dateFin).getTime()) / 2);
  return mid.getMonth() + 1;
}

// Durée de la période en mois (≥ ~0,03), pour borner la capacité (cadence × durée).
export function dureeMois(dateDebut: string, dateFin: string): number {
  const jours = Math.max(1, (parse(dateFin).getTime() - parse(dateDebut).getTime()) / 86_400_000 + 1);
  return jours / 30;
}
