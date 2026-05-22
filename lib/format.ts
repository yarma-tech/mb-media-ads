// Formatage fr-FR.

const nf = (d: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: 0 });

export function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function num(n: number, d = 0): string {
  return nf(d).format(n);
}

// Audiences exprimées en "K vues". Au-delà de 1000 K -> millions.
export function kvues(k: number): string {
  if (k >= 1000) return `${nf(1).format(k / 1000)} M`;
  return `${nf(0).format(k)} K`;
}

export function pct(p: number): string {
  return `${Math.round(p * 100)} %`;
}

export type NiveauConfiance = "faible" | "moyen" | "élevé";
export function niveauConfiance(c: number): NiveauConfiance {
  if (c < 0.6) return "faible";
  if (c < 0.78) return "moyen";
  return "élevé";
}

export function formatPeriode(dateDebut: string, dateFin: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const f = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", opts);
  return `${f(dateDebut)} → ${f(dateFin)}`;
}
