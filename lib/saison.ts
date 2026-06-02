import type { Periode } from "./enums";

// Mapping date -> période commerciale (calendrier québécois). La période est une
// feature catégorielle des modèles (lib/models.ts) : on retient la période de la
// date représentative (milieu de la campagne).

function parse(d: string): Date {
  return new Date(`${d}T00:00:00`);
}

function dateRepresentative(dateDebut: string, dateFin: string): Date {
  return new Date((parse(dateDebut).getTime() + parse(dateFin).getTime()) / 2);
}

// (mois, jour) -> entier comparable pour situer un point dans l'année.
const md = (m: number, d: number) => m * 100 + d;

// De la plus spécifique à la plus large : la 1re plage qui contient le point gagne.
// (ex. fin juillet -> "Vacances de construction" plutôt que "Vacances d'été").
// Temps des Fêtes enjambe l'année (déc -> janv), géré par le test wrap ci-dessous.
const RANGES: [Periode, number, number][] = [
  ["Temps des Fêtes", md(12, 1), md(1, 6)],
  ["Black Friday", md(11, 20), md(11, 30)],
  ["Halloween", md(10, 15), md(10, 31)],
  ["Rentrée scolaire", md(8, 20), md(9, 20)],
  ["Vacances de construction", md(7, 19), md(8, 4)],
  ["Vacances d'été", md(6, 15), md(8, 31)],
  ["Pâques", md(3, 22), md(4, 25)],
  ["Semaine de relâche", md(3, 1), md(3, 10)],
  ["Saint-Valentin", md(2, 1), md(2, 14)],
];

export function periodeCommerciale(dateDebut: string, dateFin: string): Periode {
  const mid = dateRepresentative(dateDebut, dateFin);
  const point = md(mid.getMonth() + 1, mid.getDate());
  for (const [periode, start, end] of RANGES) {
    const match = start <= end ? point >= start && point <= end : point >= start || point <= end;
    if (match) return periode;
  }
  return "Hors période";
}

// Durée de la période en mois (≥ ~0,03) — affichage / contexte (hors modèle).
export function dureeMois(dateDebut: string, dateFin: string): number {
  const jours = Math.max(1, (parse(dateFin).getTime() - parse(dateDebut).getTime()) / 86_400_000 + 1);
  return jours / 30;
}
