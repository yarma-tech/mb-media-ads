import { CATALOG, compatibleFormats, mediaChannels } from "./catalog";
import type { Actor, Ad, AdFields, Campaign, Channel, Event } from "./types";
const id = () => crypto.randomUUID();
function humanValidator(a: Actor) {
  if (a.kind !== "human" || a.role !== "validator")
    throw new Error("Action réservée à un Validateur humain.");
}
function event(
  actor: Actor,
  action: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  now: string,
): Event {
  return {
    id: id(),
    at: now,
    actorId: actor.id,
    actorName: actor.name,
    action,
    before,
    after,
  };
}
function active(c: Campaign) {
  if (c.status === "finished") throw new Error("La campagne est terminée.");
}
function replace(c: Campaign, ad: Ad): Campaign {
  return {
    ...c,
    revision: c.revision + 1,
    ads: c.ads.map((a) => (a.id === ad.id ? ad : a)),
  };
}
function find(c: Campaign, adId: string) {
  const a = c.ads.find((a) => a.id === adId);
  if (!a) throw new Error("Annonce introuvable.");
  return a;
}
export function safeUrl(url: string): boolean {
  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
export function createCampaign(
  name: string,
  actor: Actor,
  now: string,
): Campaign {
  if (!name.trim() || name.length > 200)
    throw new Error("Nom de campagne requis (200 caractères maximum).");
  return {
    id: id(),
    name: name.trim(),
    brandId: null,
    defaultUrl: "",
    startDate: null,
    endDate: null,
    status: "active",
    createdBy: actor.id,
    revision: 0,
    ads: [],
    media: [],
    history: [event(actor, "created", {}, { name: name.trim() }, now)],
  };
}
export function addAd(
  c: Campaign,
  channel: Channel,
  format: string,
  actor: Actor,
  now: string,
): Campaign {
  active(c);
  if (!CATALOG[channel]?.some((f) => f.id === format))
    throw new Error("Format inconnu pour ce canal.");
  const adId = id();
  const ad: Ad = {
    id: adId,
    familyId: adId,
    version: 1,
    channel,
    format,
    status: "draft",
    stopReason: null,
    createdBy: actor.id,
    revision: 0,
    name: "Nouvelle annonce",
    copy: "",
    headline: "",
    headlines: [],
    descriptions: [],
    cta: "En savoir plus",
    url: "",
    mediaId: null,
    path1: "",
    path2: "",
    history: [event(actor, "created", {}, { channel, format }, now)],
    comments: [],
  };
  return { ...c, revision: c.revision + 1, ads: [...c.ads, ad] };
}
export function isComplete(ad: Ad, c: Campaign): string[] {
  const errors: string[] = [];
  if (!c.brandId) errors.push("Choisir une marque");
  if (!safeUrl(ad.url || c.defaultUrl))
    errors.push("URL de destination HTTP(S) requise");
  if (ad.channel === "google") {
    if (
      ad.headlines.filter((x) => x.trim()).length < 3 ||
      ad.headlines.length > 15
    )
      errors.push("Entre 3 et 15 titres requis");
    if (
      ad.descriptions.filter((x) => x.trim()).length < 2 ||
      ad.descriptions.length > 4
    )
      errors.push("Entre 2 et 4 descriptions requises");
    if (ad.headlines.some((x) => Array.from(x).length > 30))
      errors.push("Titre limité à 30 caractères");
    if (ad.descriptions.some((x) => Array.from(x).length > 90))
      errors.push("Description limitée à 90 caractères");
    if (Array.from(ad.path1).length > 15 || Array.from(ad.path2).length > 15)
      errors.push("Chemins limités à 15 caractères");
  } else {
    if (ad.channel !== "display" && !ad.copy.trim())
      errors.push("Texte publicitaire requis");
    const media = c.media.find((m) => m.id === ad.mediaId);
    if (
      !media ||
      media.state !== "ready" ||
      !mediaChannels(media).includes(ad.channel) ||
      !compatibleFormats(media, ad.channel).some((f) => f.id === ad.format)
    )
      errors.push("Média conforme au canal requis");
  }
  return errors;
}
export function editAd(
  c: Campaign,
  adId: string,
  patch: Partial<AdFields>,
  actor: Actor,
  source: "configuration" | "validation",
  now: string,
  unlocked = false,
): Campaign {
  active(c);
  const ad = find(c, adId);
  if (ad.status === "on_air" || ad.status === "stopped")
    throw new Error("Version figée : créez une nouvelle version.");
  if (source === "validation") humanValidator(actor);
  const allowed = [
    "name",
    "copy",
    "headline",
    "headlines",
    "descriptions",
    "cta",
    "url",
    "mediaId",
    "path1",
    "path2",
  ] as const;
  const before: Record<string, unknown> = {},
    after: Record<string, unknown> = {};
  for (const k of allowed)
    if (k in patch && JSON.stringify(patch[k]) !== JSON.stringify(ad[k])) {
      before[k] = ad[k];
      after[k] = patch[k];
    }
  if (!Object.keys(after).length)
    return source === "validation" && ad.status === "pending"
      ? decideAd(c, adId, "approved", actor, now)
      : c;
  if (source === "configuration" && ad.status === "approved" && !unlocked)
    throw new Error(
      "Déverrouillez cette annonce : modifier annulera son approbation.",
    );
  const next = { ...ad, ...after } as Ad;
  const complete = isComplete(next, c).length === 0;
  if (source === "validation" && !complete)
    throw new Error("Complétez les champs requis avant de valider.");
  next.status =
    source === "validation"
      ? "approved"
      : !complete
        ? "draft"
        : ad.status === "approved"
          ? "pending"
          : ad.status;
  if (source === "configuration") delete next.brandSnapshot;
  next.revision++;
  next.history = [
    ...ad.history,
    event(
      actor,
      source === "validation" ? "edited_and_approved" : "edited",
      before,
      { ...after, status: next.status },
      now,
    ),
  ];
  return replace(c, next);
}
export function submitAds(
  c: Campaign,
  ids: string[],
  actor: Actor,
  now: string,
) {
  active(c);
  const skipped: { id: string; errors: string[] }[] = [];
  let campaign = c;
  for (const adId of [...new Set(ids)]) {
    const ad = find(campaign, adId);
    const errors = isComplete(ad, campaign);
    if (!["draft", "changes_requested"].includes(ad.status))
      errors.push("Annonce déjà soumise ou version figée");
    if (errors.length) {
      skipped.push({ id: adId, errors });
      continue;
    }
    campaign = replace(campaign, {
      ...ad,
      status: "pending",
      revision: ad.revision + 1,
      history: [
        ...ad.history,
        event(
          actor,
          "submitted",
          { status: ad.status },
          { status: "pending" },
          now,
        ),
      ],
    });
  }
  return { campaign, skipped };
}
export function decideAd(
  c: Campaign,
  adId: string,
  status: "approved" | "changes_requested",
  actor: Actor,
  now: string,
  comment = "",
): Campaign {
  humanValidator(actor);
  active(c);
  const ad = find(c, adId);
  if (ad.status !== "pending")
    throw new Error("Cette annonce n’attend pas de validation.");
  if (status === "changes_requested" && !comment.trim())
    throw new Error("Commentaire requis.");
  if (status === "approved" && isComplete(ad, c).length)
    throw new Error("Annonce incomplète.");
  return replace(c, {
    ...ad,
    status,
    revision: ad.revision + 1,
    comments: comment.trim()
      ? [...ad.comments, { text: comment.trim(), author: actor.name, at: now }]
      : ad.comments,
    history: [
      ...ad.history,
      event(
        actor,
        status,
        { status: ad.status },
        { status, comment: comment.trim() },
        now,
      ),
    ],
  });
}
export function publishAd(
  c: Campaign,
  adId: string,
  actor: Actor,
  now: string,
): Campaign {
  humanValidator(actor);
  active(c);
  const ad = find(c, adId);
  if (
    ad.status !== "approved" &&
    !(
      ad.status === "stopped" &&
      ad.stopReason !== "replaced" &&
      !c.ads.some((a) => a.familyId === ad.familyId && a.status === "on_air")
    )
  )
    throw new Error("Approbation requise ou version remplacée.");
  if (isComplete(ad, c).length) throw new Error("Annonce incomplète.");
  return {
    ...c,
    revision: c.revision + 1,
    ads: c.ads.map((a) =>
      a.id === adId
        ? {
            ...a,
            url: a.url || c.defaultUrl,
            status: "on_air",
            revision: a.revision + 1,
            history: [
              ...a.history,
              event(
                actor,
                "on_air",
                { status: a.status },
                { status: "on_air" },
                now,
              ),
            ],
          }
        : a.familyId === ad.familyId && a.status === "on_air"
          ? {
              ...a,
              status: "stopped",
              stopReason: "replaced",
              revision: a.revision + 1,
              history: [
                ...a.history,
                event(
                  actor,
                  "stopped",
                  { status: a.status },
                  { status: "stopped", reason: "replaced" },
                  now,
                ),
              ],
            }
          : a,
    ),
  };
}
export function newVersion(
  c: Campaign,
  adId: string,
  actor: Actor,
  now: string,
): Campaign {
  active(c);
  const old = find(c, adId);
  if (!["on_air", "stopped"].includes(old.status))
    throw new Error(
      "Dupliquez un brouillon ; réservez les versions aux annonces diffusées.",
    );
  const version =
    Math.max(
      ...c.ads.filter((a) => a.familyId === old.familyId).map((a) => a.version),
    ) + 1;
  const next: Ad = {
    ...old,
    id: id(),
    version,
    status: "draft",
    stopReason: null,
    createdBy: actor.id,
    revision: 0,
    comments: [],
    history: [
      event(
        actor,
        "version_created",
        { id: old.id, version: old.version },
        { version },
        now,
      ),
    ],
  };
  return { ...c, revision: c.revision + 1, ads: [...c.ads, next] };
}
export function finishCampaign(c: Campaign, now: string): Campaign {
  if (c.status === "finished" || !c.endDate) return c;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const p = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const local = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
  if (local < `${c.endDate} 23:59`) return c;
  const actor: Actor = {
    kind: "agent",
    id: "scheduler",
    name: "Fin automatique",
    role: "preparer",
  };
  return {
    ...c,
    status: "finished",
    revision: c.revision + 1,
    history: [
      ...c.history,
      event(
        actor,
        "finished",
        { status: c.status },
        { status: "finished" },
        now,
      ),
    ],
    ads: c.ads.map((a) =>
      a.status === "on_air"
        ? {
            ...a,
            status: "stopped",
            stopReason: "campaign_finished",
            revision: a.revision + 1,
            history: [
              ...a.history,
              event(
                actor,
                "stopped",
                { status: "on_air" },
                { status: "stopped", reason: "campaign_finished" },
                now,
              ),
            ],
          }
        : a,
    ),
  };
}
export function reopenCampaign(
  c: Campaign,
  endDate: string,
  actor: Actor,
  now: string,
): Campaign {
  humanValidator(actor);
  if (c.status !== "finished")
    throw new Error("Cette campagne n’est pas terminée.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    Number.isNaN(Date.parse(endDate)) ||
    finishCampaign({ ...c, status: "active", endDate }, now).status ===
      "finished"
  )
    throw new Error("Nouvelle date de fin future requise.");
  return {
    ...c,
    status: "active",
    endDate,
    revision: c.revision + 1,
    history: [
      ...c.history,
      event(
        actor,
        "reopened",
        { status: c.status, endDate: c.endDate },
        { status: "active", endDate },
        now,
      ),
    ],
  };
}
