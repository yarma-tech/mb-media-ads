import ExcelJS from "exceljs";
import { PLATEFORMES, type Ad, type Plateforme } from "./types";
import {
  allowedRatios,
  getVariantSpec,
  legacyFormat,
  parseVariant,
  type AdVariant,
  type Placement,
  type VariantChoice,
} from "./specs";

export type ImportedAd = Omit<
  Ad,
  | "id"
  | "plan_id"
  | "created_at"
  | "updated_at"
  | "plateforme"
  | "placement"
  | "type_media"
  | "ratio"
> &
  AdVariant;
export type ImportIssue = {
  feuille: string;
  ligne: number;
  colonne?: string;
  code: "compatibility" | "unknown_sheet" | "missing_column" | "invalid_row";
  message: string;
};
export type ImportResult = {
  status: "valid" | "partial" | "rejected";
  nom: string;
  ads: ImportedAd[];
  issues: ImportIssue[];
};
import { normalize } from "./normalize";
const platform = (s: string): Plateforme | undefined =>
  PLATEFORMES.find((p) => p === normalize(s).replace(/\s/g, ""));

export function parseExcelFormat(value: string, p: Plateforme): AdVariant {
  const text = normalize(value).replace(/\//g, ":");
  const ratio = text.match(/(1\.91:1|16:9|9:16|4:5|1:1)/)?.[1];
  let placement: Placement =
    p === "youtube" || p === "tiktok" ? "in_feed" : "feed";
  if (/shorts?/.test(text)) placement = "shorts";
  else if (/in[- ]?stream/.test(text)) placement = "in_stream";
  else if (/in[- ]?feed/.test(text)) placement = "in_feed";
  else if (/stor(y|ies)/.test(text)) placement = "stories";
  else if (/reels?/.test(text)) placement = "reels";
  const type_media = /carrou?sel|carousel/.test(text)
    ? "carrousel"
    : /video|reels?|shorts?/.test(text)
      ? "video"
      : /image/.test(text)
        ? "image"
        : null;
  const remainder = text
    .replace(
      /(1\.91:1|16:9|9:16|4:5|1:1)|carrou?sel|carousel|video|images?|reels?|shorts?|stor(y|ies)|in[- ]?stream|in[- ]?feed|feed/g,
      "",
    )
    .trim();
  if (!type_media || remainder)
    throw new Error(`Format inconnu ou ambigu: ${value}.`);
  const choice = { plateforme: p, placement, type_media } as VariantChoice;
  const parsed = parseVariant({
    ...choice,
    ratio: ratio || allowedRatios(choice)[0],
  });
  if (parsed.status === "invalid") throw new Error(parsed.message);
  return parsed.variant;
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return String(v.result ?? "");
  }
  return String(v);
}

export async function parseCampaignWorkbook(
  bytes: Uint8Array,
  filename: string,
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  const ads: ImportedAd[] = [];
  const issues: ImportIssue[] = [];
  let nom = filename.replace(/\.xlsx$/i, "");
  workbook.worksheets.forEach((sheet, sheetIndex) => {
    const rows: { line: number; cells: string[] }[] = [];
    sheet.eachRow((r, line) => {
      const cells: string[] = [];
      r.eachCell({ includeEmpty: true }, (c, col) => {
        cells[col - 1] = cellText(c);
      });
      rows.push({ line, cells });
    });
    const header = rows.find((r) =>
      r.cells.some((c) => normalize(c) === "texte principal"),
    );
    if (sheetIndex === 0) {
      const title = rows.find(
        (r) => r.line < (header?.line ?? 1) && r.cells[0]?.trim(),
      );
      if (title) nom = title.cells[0].trim();
    }
    if (!header) {
      issues.push({
        feuille: sheet.name,
        ligne: 0,
        code: "missing_column",
        message: "Colonne Texte principal manquante.",
      });
      return;
    }
    const headers = header.cells.map((c) => normalize(c ?? ""));
    const index = (name: string) => headers.indexOf(normalize(name));
    const get = (r: typeof header, name: string) =>
      r.cells[index(name)]?.trim() ?? "";
    for (const required of ["Plateforme", "Format", "Texte principal"]) {
      if (index(required) < 0) {
        issues.push({
          feuille: sheet.name,
          ligne: header.line,
          colonne: required,
          code: "missing_column",
          message: `Colonne ${required} manquante.`,
        });
        return;
      }
    }
    const dataRows = rows.filter(
      (r) => r.line > header.line && r.cells.some((c) => c?.trim()),
    );
    let p = platform(sheet.name);
    if (!p) {
      const values = new Set(
        dataRows.map((r) => platform(get(r, "Plateforme"))),
      );
      if (values.size === 1 && !values.has(undefined)) {
        p = [...values][0];
        issues.push({
          feuille: sheet.name,
          ligne: header.line,
          code: "compatibility",
          message: `Feuille historique importée via Plateforme: ${p}.`,
        });
      } else {
        issues.push({
          feuille: sheet.name,
          ligne: header.line,
          code: "unknown_sheet",
          message: "Feuille inconnue et Plateforme non univoque.",
        });
        return;
      }
    }
    const sheetPlatform = p!;
    for (const r of dataRows) {
      try {
        const rowPlatform = get(r, "Plateforme");
        if (rowPlatform && platform(rowPlatform) !== sheetPlatform)
          throw new Error(
            "Conflit entre plateforme de feuille et plateforme de ligne.",
          );
        const texte_principal = get(r, "Texte principal");
        if (!texte_principal) throw new Error("Texte principal vide.");
        const v = parseExcelFormat(get(r, "Format"), sheetPlatform);
        const spec = getVariantSpec(v);
        for (const [column, limit] of [
          ["Texte principal", spec.hardLimits.text],
          ["Titre", spec.hardLimits.title],
          ["Description", spec.hardLimits.description],
        ] as const) {
          if (limit !== null && get(r, column).length > limit)
            throw new Error(`${column}: plafond ${limit} caractères dépassé.`);
        }
        const destination_url =
          get(r, "Lien de destination (tracké)") || get(r, "URL");
        if (destination_url && !/^https?:\/\//i.test(destination_url))
          throw new Error("URL de destination invalide (http/https requis).");
        const medias = headers
          .map((h, i) => ({ h, i, n: Number(h.match(/^photo\s*(\d+)/)?.[1]) }))
          .filter((x) => x.n && r.cells[x.i]?.trim())
          .sort((a, b) => a.n - b.n)
          .map((x) => ({
            type: "image" as const,
            url: "",
            creative_ref: r.cells[x.i].trim(),
            titre:
              get(r, `Titre ${x.n}`) || get(r, `Fiche ${x.n}`).split("\n")[0],
            description:
              get(r, `Description ${x.n}`) ||
              get(r, `Fiche ${x.n}`).split("\n").slice(1).join("\n"),
          }));
        if (
          v.type_media === "carrousel" &&
          (medias.length < 2 || medias.length > 10)
        )
          throw new Error(
            "Carrousel: renseigner 2 à 10 cartes Photo n / Fiche n.",
          );
        ads.push({
          ...v,
          format: legacyFormat(v),
          variant_status: "valid",
          ordre: ads.length,
          texte_principal,
          titre: get(r, "Titre") || null,
          description: get(r, "Description") || null,
          cta: get(r, "CTA") || null,
          destination_url: destination_url || null,
          creative_ref: get(r, "Fichier") || null,
          lien_libelle: destination_url
            ? new URL(destination_url).hostname
            : null,
          marque_nom: null,
          marque_handle: null,
          marque_logo: null,
          medias,
          import_meta: {
            objectif: get(r, "Type"),
            angle: get(r, "Angle / Déclinaison"),
            feuille: sheet.name,
            ligne: r.line,
            ordre_source: get(r, "#"),
          },
        });
      } catch (error) {
        issues.push({
          feuille: sheet.name,
          ligne: r.line,
          code: "invalid_row",
          message: error instanceof Error ? error.message : "Ligne invalide.",
        });
      }
    }
  });
  return {
    status: ads.length === 0 ? "rejected" : issues.length ? "partial" : "valid",
    nom,
    ads,
    issues,
  };
}
