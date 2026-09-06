// Module Social Ads — génération de copy marketing par LLM.
//
// Fournisseur pluggable : OpenRouter (compatible OpenAI, route vers Claude et
// d'autres modèles) si OPENROUTER_API_KEY est défini, sinon Anthropic direct.
// Expertise « rédaction social ads » encodée dans le system prompt : hook fort,
// une idée par annonce, ton par plateforme, respect des limites de caractères,
// CTA clair. Retourne plusieurs variations prêtes à coller dans l'éditeur.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSpec, PLATEFORME_LABEL, type Format, type Plateforme } from "./types";

export type CopyInput = {
  plateforme: Plateforme;
  format: Format;
  objectif: string; // Notoriété / Trafic / Conversion / Leads…
  brief: string; // description du produit / offre / message
  marque?: string;
  ton?: string; // ex. "dynamique", "premium", "chaleureux"
  nbVariations?: number;
};

export type CopyVariation = {
  texte_principal: string;
  titre: string;
  description: string;
  cta: string;
  hashtags: string[];
};

type Provider = "openrouter" | "anthropic";

// OpenRouter prioritaire s'il est configuré, sinon Anthropic.
function provider(): Provider | null {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export function copyConfigured(): boolean {
  return provider() !== null;
}

const SYSTEM = `Tu es un directeur de création publicitaire expert en social ads, spécialisé dans la rédaction de messages marketing qui convertissent. Tu maîtrises les codes propres à chaque plateforme (Facebook, Instagram, LinkedIn, TikTok).

Principes que tu appliques systématiquement :
- Un hook percutant dès les premiers mots (les 3 premières secondes / la première ligne décident tout).
- Une seule idée forte par annonce ; bénéfice concret avant caractéristique.
- Ton adapté à la plateforme : LinkedIn = professionnel et crédible ; TikTok/Instagram = spontané, direct, émotionnel ; Facebook = clair et rassurant.
- Preuve, urgence ou curiosité selon l'objectif, sans surpromesse ni claim trompeur.
- CTA explicite et unique.
- Emojis avec parcimonie (0 sur LinkedIn, 1–3 sur IG/TikTok/FB max) ; jamais de "clickbait" grossier.
- Respect STRICT des limites de caractères indiquées.
- Rédige en français, sauf si le brief demande une autre langue.

Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :
{"variations":[{"texte_principal":"...","titre":"...","description":"...","cta":"...","hashtags":["...","..."]}]}
- "titre" (headline) : court, accrocheur.
- "description" : sous-titre du lien, une ligne.
- "cta" : libellé de bouton court (ex. "En savoir plus", "Acheter").
- "hashtags" : 0 sur LinkedIn/Facebook si non pertinent ; 3–6 max sur IG/TikTok.`;

export async function genererCopy(input: CopyInput): Promise<CopyVariation[]> {
  const p = provider();
  if (!p) throw new Error("Aucune clé LLM (OPENROUTER_API_KEY ou ANTHROPIC_API_KEY) configurée.");
  const n = Math.min(Math.max(input.nbVariations ?? 3, 1), 5);
  const spec = getSpec(input.plateforme, input.format);

  const prompt = `Plateforme : ${PLATEFORME_LABEL[input.plateforme]}
Format : ${input.format}
Objectif : ${input.objectif}
${input.marque ? `Marque : ${input.marque}\n` : ""}${input.ton ? `Ton souhaité : ${input.ton}\n` : ""}Contraintes de caractères (STRICTES) :
- Texte principal : vise ≤ ${spec.texteShown} caractères (au-delà, la plateforme masque derrière « Voir plus ») ; ne dépasse jamais ${spec.texteMax}.
- L'essentiel du message et le CTA doivent tenir dans les ${spec.texteShown} premiers caractères.
${spec.titreMax > 0 ? `- Titre : ≤ ${spec.titreMax} caractères${spec.titreHard ? " (coupe DURE, pas de « voir plus »)" : ""}.` : "- Pas de titre séparé pour ce format."}

Brief :
${input.brief}

Génère ${n} variation(s) distinctes (angles différents), en respectant les limites.`;

  const text = p === "openrouter" ? await callOpenRouter(prompt) : await callAnthropic(prompt);
  return parseVariations(text);
}

// --- OpenRouter (API compatible OpenAI) ------------------------------------
async function callOpenRouter(prompt: string): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      // En-têtes recommandés par OpenRouter (classement / attribution).
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mb-media-ads.vercel.app",
      "X-Title": "MB Media Ads — Social Ads",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status} : ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

// --- Anthropic direct ------------------------------------------------------
async function callAnthropic(prompt: string): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Extraction robuste du JSON même si le modèle ajoute du texte autour.
function parseVariations(text: string): CopyVariation[] {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);

  const parsed = JSON.parse(raw) as { variations?: unknown };
  const arr = Array.isArray(parsed.variations) ? parsed.variations : [];
  return arr.map((v) => {
    const o = (v ?? {}) as Record<string, unknown>;
    return {
      texte_principal: String(o.texte_principal ?? ""),
      titre: String(o.titre ?? ""),
      description: String(o.description ?? ""),
      cta: String(o.cta ?? ""),
      hashtags: Array.isArray(o.hashtags) ? o.hashtags.map((h) => String(h)) : [],
    };
  });
}
