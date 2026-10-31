import { CATALOG } from "./catalog";
import { ImportAdSchema } from "./commands";
import type { AdFields, Channel } from "./types";
export type ImportedAd = Partial<AdFields> & { format: string; name: string };
export function importHeaders(channel: Channel): string[] {
  return channel === "google"
    ? [
        "Format",
        "Nom",
        "Thématique",
        ...Array.from({ length: 15 }, (_, i) => `Titre ${i + 1}`),
        ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
        "URL",
        "Chemin 1",
        "Chemin 2",
      ]
    : channel === "display"
      ? ["Format", "Nom", "Thématique", "URL"]
      : ["Format", "Nom", "Thématique", "Texte", "Titre", "CTA", "URL"];
}
// RFC 4180-style quoting, including escaped quotes and newlines. Both common
// French (semicolon) and international (comma) templates are accepted.
export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (quoted || !value) quoted = !quoted;
      else throw new Error(`Ligne ${rows.length + 1} : guillemet inattendu.`);
    } else if (!quoted && char === delimiter) {
      row.push(value);
      value = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  if (quoted) throw new Error("CSV invalide : guillemets non fermés.");
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}
export function parseImportRows(
  channel: Channel,
  matrix: string[][],
): ImportedAd[] {
  const headers = importHeaders(channel);
  if (
    !matrix.length ||
    matrix[0].length !== headers.length ||
    matrix[0].some((value, i) => value.trim() !== headers[i])
  )
    throw new Error(
      "Colonnes incorrectes. Utilisez le gabarit de ce canal, sans modifier ses en-têtes.",
    );
  const populated = matrix
    .slice(1)
    .map((cells, i) => ({ cells, line: i + 2 }))
    .filter(({ cells }) => cells.some((value) => value.trim()));
  if (!populated.length) throw new Error("Aucune annonce dans le fichier.");
  if (populated.length > 200)
    throw new Error("Import limité à 200 annonces par fichier.");
  return populated.map(({ cells, line }) => {
    if (
      cells.length > headers.length &&
      cells.slice(headers.length).some((value) => value.trim())
    )
      throw new Error(`Ligne ${line} : trop de colonnes.`);
    const values = Object.fromEntries(
      headers.map((header, i) => [header, cells[i]?.trim() ?? ""]),
    );
    if (!CATALOG[channel].some((format) => format.id === values.Format))
      throw new Error(
        `Ligne ${line} : format « ${values.Format} » inconnu pour ce canal.`,
      );
    if (!values.Nom) throw new Error(`Ligne ${line} : nom requis.`);
    const common = {
      format: values.Format,
      name: values.Nom,
      theme: values["Thématique"],
      url: values.URL,
    };
    const row =
      channel === "google"
        ? {
            ...common,
            headlines: Array.from(
              { length: 15 },
              (_, i) => values[`Titre ${i + 1}`],
            ).filter(Boolean),
            descriptions: Array.from(
              { length: 4 },
              (_, i) => values[`Description ${i + 1}`],
            ).filter(Boolean),
            path1: values["Chemin 1"],
            path2: values["Chemin 2"],
          }
        : channel === "display"
          ? common
          : {
              ...common,
              copy: values.Texte,
              headline: values.Titre,
              cta: values.CTA,
            };
    if (row.url && !/^https?:\/\//i.test(row.url))
      throw new Error(`Ligne ${line} : URL HTTP(S) requise.`);
    const parsed = ImportAdSchema.safeParse(row);
    if (!parsed.success)
      throw new Error(
        `Ligne ${line} : ${parsed.error.issues.map((issue) => `${issue.path.join(".")} : ${issue.message}`).join(" ; ")}`,
      );
    return parsed.data;
  });
}
export function templateCsv(channel: Channel): string {
  return "\uFEFF" + importHeaders(channel).join(";") + "\r\n";
}
