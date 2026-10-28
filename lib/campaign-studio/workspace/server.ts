import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { CommandSchema, type Command } from "./commands";
import {
  addAd,
  createCampaign,
  decideAd,
  editAd,
  finishCampaign,
  newVersion,
  publishAd,
  reopenCampaign,
  submitAds,
  safeUrl,
} from "./workflow";
import {
  CATALOG,
  CHANNELS,
  compatibleFormats,
  mediaChannels,
  uniqueMediaFor,
} from "./catalog";
import type { Actor, AdFields, Campaign, Media } from "./types";
import { createMediaAds } from "./media-batch";
import { verifyMedia } from "./verify-media";
export class StudioError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function database() {
  if (
    process.env.STUDIO_CONNECTED !== "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw new StudioError("Le studio connecté n’est pas configuré.", 503);
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function authenticate(request: Request): Promise<Actor> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new StudioError("Connexion requise.", 401);
  const db = database();
  if (token.startsWith("studio_")) {
    const { data, error } = await db
      .from("studio_agents")
      .select("id,name")
      .eq("token_hash", createHash("sha256").update(token).digest("hex"))
      .is("revoked_at", null)
      .maybeSingle();
    if (error || !data) throw new StudioError("Jeton agent invalide.", 401);
    return { ...data, kind: "agent", role: "preparer" };
  }
  const {
    data: { user },
    error,
  } = await db.auth.getUser(token);
  if (error || !user) throw new StudioError("Session expirée.", 401);
  const { data } = await db
    .from("studio_members")
    .select("*")
    .eq("id", user.id)
    .eq("access", "active")
    .maybeSingle();
  if (!data) throw new StudioError("Accès studio non attribué.", 403);
  return { id: user.id, name: data.name, role: data.role, kind: "human" };
}
function validator(actor: Actor) {
  if (actor.kind !== "human" || actor.role !== "validator")
    throw new StudioError("Action réservée au Validateur humain.", 403);
}
export async function readCampaign(id: string): Promise<Campaign> {
  const { data, error } = await database()
    .from("studio_campaigns")
    .select("document")
    .eq("id", id)
    .single();
  if (error || !data) throw new StudioError("Campagne introuvable.", 404);
  return data.document;
}
async function commit(
  before: Campaign,
  after: Campaign,
  actor: Actor,
  adId?: string,
  token?: string,
) {
  if (before === after) return;
  const { data, error } = await database().rpc("studio_commit", {
    p_id: before.id,
    p_revision: before.revision,
    p_document: after,
    p_ad: adId ?? null,
    p_owner: actor.id,
    p_token: token ?? null,
  });
  if (error || !data)
    throw new StudioError(
      error
        ? "Verrou expiré ou indisponible. Reprenez l’édition."
        : "Les données ont changé. Rechargez avant de modifier.",
      409,
    );
}
export async function expireCampaigns() {
  const db = database();
  const { data, error } = await db.from("studio_campaigns").select("document");
  if (error) throw error;
  for (const row of data ?? []) {
    const before: Campaign = row.document;
    const after = finishCampaign(before, new Date().toISOString());
    if (before !== after) {
      const { error } = await db.rpc("studio_commit", {
        p_id: before.id,
        p_revision: before.revision,
        p_document: after,
      });
      if (error) throw error;
    }
  }
}
export async function state(actor: Actor) {
  await expireCampaigns();
  const db = database();
  const [{ data: campaigns, error }, { data: brands }, { data: locks }] =
    await Promise.all([
      db
        .from("studio_campaigns")
        .select("document")
        .order("updated_at", { ascending: false }),
      db.from("studio_brands").select("*").order("name"),
      db
        .from("studio_locks")
        .select("ad_id,owner_id,owner_name,expires_at")
        .gt("expires_at", new Date().toISOString()),
    ]);
  if (error) throw error;
  const docs: Campaign[] = (campaigns ?? []).map((r) => r.document);
  const mediaUrls: Record<string, string> = {};
  const media = docs.flatMap((c) => c.media.filter((m) => m.state === "ready"));
  if (media.length) {
    const { data: signed } = await db.storage
      .from("studio-media")
      .createSignedUrls(
        media.map((m) => m.path),
        3600,
      );
    for (const entry of signed ?? []) {
      const m = media.find((m) => m.path === entry.path);
      if (m && entry.signedUrl) mediaUrls[m.id] = entry.signedUrl;
    }
  }

  const access = actor.kind === "human" && actor.role === "validator";
  const members = access
    ? (await db.from("studio_members").select("id,name,role,access")).data
    : [];
  const agents = access
    ? (await db.from("studio_agents").select("id,name,revoked_at")).data
    : [];
  return {
    actor,
    members: members ?? [],
    agents: agents ?? [],
    campaigns: docs,
    brands: brands ?? [],
    locks: locks ?? [],
    catalog: CATALOG,
    channels: CHANNELS,
    mediaUrls,
  };
}
export async function execute(raw: unknown, actor: Actor) {
  const parsed = CommandSchema.safeParse(raw);
  if (!parsed.success)
    throw new StudioError(
      parsed.error.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; "),
    );
  const command: Command = parsed.data,
    db = database(),
    now = new Date().toISOString();
  if (
    [
      "decide",
      "publish",
      "stop",
      "reopen",
      "invite",
      "agent",
      "member",
      "revoke_agent",
      "undo",
    ].includes(command.type) ||
    (command.type === "edit" && command.source === "validation")
  )
    validator(actor);
  if (command.type === "create_campaign") {
    const c = createCampaign(command.name, actor, now);
    const { error } = await db
      .from("studio_campaigns")
      .insert({ id: c.id, revision: c.revision, document: c });
    if (error) throw error;
    return { campaign: c };
  }
  if (command.type === "create_brand") {
    if (command.website && !safeUrl(command.website))
      throw new StudioError("Site web HTTP(S) requis.");
    if (
      command.logo &&
      !safeUrl(command.logo) &&
      !command.logo.startsWith("/deck-demo/")
    )
      throw new StudioError("URL du logo invalide.");
    const brand = {
      id: crypto.randomUUID(),
      name: command.name,
      website: command.website,
      logo: command.logo,
    };
    const { error } = await db.from("studio_brands").insert(brand);
    if (error) throw error;
    return { brand };
  }
  if (command.type === "agent") {
    validator(actor);
    const token = "studio_" + randomBytes(32).toString("hex");
    const { error } = await db.from("studio_agents").insert({
      name: command.name,
      created_by: actor.id,
      token_hash: createHash("sha256").update(token).digest("hex"),
    });
    if (error) throw error;
    return { token };
  }
  if (command.type === "member") {
    validator(actor);
    const { error } = await db.rpc("studio_update_member", {
      p_actor: actor.id,
      p_member: command.memberId,
      p_role: command.role,
      p_access: command.access,
    });
    if (error) throw new StudioError(error.message);
    return { updated: true };
  }
  if (command.type === "revoke_agent") {
    validator(actor);
    const { error } = await db
      .from("studio_agents")
      .update({ revoked_at: now })
      .eq("id", command.agentId);
    if (error) throw error;
    return { revoked: true };
  }
  if (command.type === "invite") {
    validator(actor);
    const { data, error } = await db.auth.admin.inviteUserByEmail(
      command.email,
      {
        data: { name: command.name },
        redirectTo: new URL(
          "/studio",
          process.env.STUDIO_URL ?? "http://127.0.0.1:3002",
        ).href,
      },
    );
    if (error) throw new StudioError(error.message);
    const { error: memberError } = await db
      .from("studio_members")
      .insert({ id: data.user.id, name: command.name, role: command.role });
    if (memberError) throw memberError;
    return { invited: true };
  }
  let c = await readCampaign(command.campaignId);
  const ended = finishCampaign(c, now);
  if (ended !== c) {
    await commit(c, ended, actor);
    c = ended;
  }
  if (command.type === "lock" || command.type === "release") {
    if (!c.ads.some((a) => a.id === command.adId))
      throw new StudioError("Annonce introuvable.", 404);
    if (
      command.type === "lock" &&
      (c.status === "finished" ||
        c.ads.some(
          (a) =>
            a.id === command.adId && ["on_air", "stopped"].includes(a.status),
        ))
    )
      throw new StudioError("Version figée.");
    if (command.type === "release") {
      await db
        .from("studio_locks")
        .delete()
        .eq("ad_id", command.adId)
        .eq("owner_id", actor.id)
        .eq("token", command.token);
      return { released: true };
    }
    const { data, error } = await db.rpc("studio_acquire_lock", {
      p_campaign: c.id,
      p_ad: command.adId,
      p_owner: actor.id,
      p_name: actor.name,
      p_token: command.token,
    });
    if (error) throw error;
    if (!data?.length)
      throw new StudioError(
        "Annonce en cours de modification par un autre utilisateur.",
        409,
      );
    return { lock: data[0], campaign: await readCampaign(c.id) };
  }
  if (c.revision !== command.revision)
    throw new StudioError(
      "Une autre personne a modifié cette campagne. Rechargez les données.",
      409,
    );
  if (c.status === "finished" && command.type !== "reopen")
    throw new StudioError("Campagne terminée.");
  let next = c;
  switch (command.type) {
    case "campaign": {
      if (
        command.fields.brandId !== undefined &&
        command.fields.brandId !== c.brandId &&
        c.ads.some((a) => ["approved", "on_air", "stopped"].includes(a.status))
      )
        throw new StudioError(
          "La marque est figée dès qu’une annonce est approuvée. Créez une nouvelle campagne pour une autre marque.",
        );
      if (command.fields.brandId) {
        const { data } = await db
          .from("studio_brands")
          .select("id")
          .eq("id", command.fields.brandId)
          .maybeSingle();
        if (!data) throw new StudioError("Marque introuvable.");
      }
      if (command.fields.defaultUrl && !safeUrl(command.fields.defaultUrl))
        throw new StudioError("URL HTTP(S) requise.");
      // Published/approved announcements retain their inherited destination and brand snapshot.
      const ads = c.ads.map((a) =>
        ["approved", "on_air", "stopped"].includes(a.status)
          ? { ...a, url: a.url || c.defaultUrl }
          : a,
      );
      next = { ...c, ...command.fields, ads, revision: c.revision + 1 };
      if (next.startDate && next.endDate && next.startDate > next.endDate)
        throw new StudioError("La fin doit suivre le début.");
      break;
    }
    case "add_media_batch": {
      const result = createMediaAds(
        c,
        command.mediaIds,
        command.channels,
        actor,
        now,
      );
      if (result.campaign !== c) await commit(c, result.campaign, actor);
      return result;
    }
    case "add":
      for (const format of command.formats) {
        next = addAd(next, command.channel, format, actor, now);
        const a = next.ads.at(-1)!;
        const media = command.mediaId
          ? next.media.find(
              (m) =>
                m.id === command.mediaId &&
                m.state === "ready" &&
                mediaChannels(m).includes(command.channel) &&
                compatibleFormats(m, command.channel).some(
                  (f) => f.id === format,
                ),
            )
          : uniqueMediaFor(format, command.channel, next.media);
        if (command.mediaId && !media)
          throw new StudioError("Média incompatible avec le placement choisi.");
        if (media) a.mediaId = media.id;
      }
      break;
    case "edit":
      next = editAd(
        c,
        command.adId,
        command.fields,
        actor,
        command.source,
        now,
        command.unlocked,
      );
      next = await snapshotBrands(c, next);
      await commit(c, next, actor, command.adId, command.lockToken);
      return { campaign: next };
    case "batch": {
      const skipped: string[] = [];
      for (const adId of command.adIds) {
        const ad = next.ads.find((a) => a.id === adId);
        if (!ad || ["approved", "on_air", "stopped"].includes(ad.status)) {
          skipped.push(adId);
          continue;
        }
        const { data: lock } = await db
          .from("studio_locks")
          .select("*")
          .eq("ad_id", adId)
          .gt("expires_at", now)
          .maybeSingle();
        if (lock && lock.owner_id !== actor.id) {
          skipped.push(adId);
          continue;
        }
        const fields = Object.fromEntries(
          Object.entries(command.fields).filter(
            ([key]) =>
              command.replace ||
              !ad[key as keyof AdFields] ||
              (Array.isArray(ad[key as keyof AdFields]) &&
                !(ad[key as keyof AdFields] as string[]).length),
          ),
        ) as Partial<AdFields>;
        next = editAd(next, adId, fields, actor, "configuration", now);
      }
      await commit(c, next, actor);
      return { campaign: next, skipped };
    }
    case "submit": {
      const result = submitAds(c, command.adIds, actor, now);
      await commit(c, result.campaign, actor);
      return result;
    }
    case "decide":
      next = decideAd(
        c,
        command.adId,
        command.status,
        actor,
        now,
        command.comment,
      );
      break;
    case "undo": {
      validator(actor);
      const a = c.ads.find((a) => a.id === command.adId);
      if (!a || a.status !== "approved")
        throw new StudioError("Annonce non approuvée.");
      next = {
        ...c,
        revision: c.revision + 1,
        ads: c.ads.map((x) =>
          x.id === a.id
            ? {
                ...x,
                status: "pending",
                revision: x.revision + 1,
                history: [
                  ...x.history,
                  {
                    id: crypto.randomUUID(),
                    at: now,
                    actorId: actor.id,
                    actorName: actor.name,
                    action: "unapproved",
                    before: { status: "approved" },
                    after: { status: "pending" },
                  },
                ],
              }
            : x,
        ),
      };
      break;
    }
    case "publish":
      next = publishAd(c, command.adId, actor, now);
      break;
    case "version":
      next = newVersion(c, command.adId, actor, now);
      break;
    case "duplicate": {
      const old = c.ads.find((a) => a.id === command.adId);
      if (!old) throw new StudioError("Annonce introuvable.");
      next = addAd(c, old.channel, old.format, actor, now);
      const fresh = next.ads.at(-1)!;
      const {
        name,
        copy,
        headline,
        headlines,
        descriptions,
        cta,
        url,
        mediaId,
        path1,
        path2,
      } = old;
      Object.assign(fresh, {
        name: name + " (copie)",
        copy,
        headline,
        headlines: [...headlines],
        descriptions: [...descriptions],
        cta,
        url,
        mediaId,
        path1,
        path2,
      });
      break;
    }
    case "stop": {
      validator(actor);
      const a = c.ads.find((a) => a.id === command.adId);
      if (!a || a.status !== "on_air")
        throw new StudioError("Annonce non diffusée.");
      next = {
        ...c,
        revision: c.revision + 1,
        ads: c.ads.map((a) =>
          a.id === command.adId
            ? {
                ...a,
                status: "stopped" as const,
                stopReason: "manual" as const,
                revision: a.revision + 1,
                history: [
                  ...a.history,
                  {
                    id: crypto.randomUUID(),
                    at: now,
                    actorId: actor.id,
                    actorName: actor.name,
                    action: "stopped",
                    before: { status: "on_air" },
                    after: { status: "stopped", reason: "manual" },
                  },
                ],
              }
            : a,
        ),
      };
      break;
    }
    case "reopen":
      next = reopenCampaign(c, command.endDate, actor, now);
      break;
    case "upload": {
      const media: Media = {
        id: crypto.randomUUID(),
        name: command.name,
        path: "",
        mime: command.mime,
        bytes: command.bytes,
        width: 0,
        height: 0,
        duration: null,
        channel: command.channel,
        ...(command.channels
          ? { channels: [...new Set([command.channel, ...command.channels])] }
          : {}),
        state: "uploading",
        errors: [],
      };
      media.path = c.id + "/" + media.id;
      next = { ...c, revision: c.revision + 1, media: [...c.media, media] };
      await commit(c, next, actor);
      const { data, error } = await db.storage
        .from("studio-media")
        .createSignedUploadUrl(media.path);
      if (error) throw error;
      return {
        media,
        token: data.token,
        signedUrl: data.signedUrl,
        campaign: next,
      };
    }
    case "resume_upload": {
      const media = c.media.find(
        (m) => m.id === command.mediaId && m.state === "uploading",
      );
      if (!media) throw new StudioError("Transfert introuvable.");
      const { data, error } = await db.storage
        .from("studio-media")
        .createSignedUploadUrl(media.path);
      if (error) throw error;
      return {
        media,
        token: data.token,
        signedUrl: data.signedUrl,
        campaign: c,
      };
    }
    case "verify_media": {
      const media = c.media.find((m) => m.id === command.mediaId);
      if (!media || media.state !== "uploading")
        throw new StudioError("Média introuvable ou déjà vérifié.");
      const verified = await verifyMedia(db, media);
      next = {
        ...c,
        revision: c.revision + 1,
        media: c.media.map((m) => (m.id === media.id ? verified : m)),
      };
      if (
        !mediaChannels(verified).some(
          (channel) => compatibleFormats(verified, channel).length,
        )
      ) {
        verified.state = "invalid";
        verified.errors.push(
          "Aucun format compatible pour les canaux choisis.",
        );
      }
      if (verified.state === "ready") {
        const candidates = next.ads.filter(
          (a) =>
            ["draft", "changes_requested"].includes(a.status) &&
            !a.mediaId &&
            mediaChannels(verified).includes(a.channel) &&
            compatibleFormats(verified, a.channel).some(
              (f) => f.id === a.format,
            ),
        );
        for (const a of candidates) {
          if (
            candidates.filter(
              (other) =>
                other.channel === a.channel && other.format === a.format,
            ).length !== 1 ||
            uniqueMediaFor(a.format, a.channel, next.media)?.id !== verified.id
          )
            continue;
          // Verification must succeed independently of an open editor. Never
          // change an ad behind its local draft, including the uploader's own.
          const { data: activeLock, error: lockError } = await db
            .from("studio_locks")
            .select("ad_id")
            .eq("ad_id", a.id)
            .gt("expires_at", now)
            .maybeSingle();
          if (lockError) throw lockError;
          if (!activeLock)
            next = {
              ...next,
              ads: next.ads.map((x) =>
                x.id === a.id
                  ? {
                      ...x,
                      mediaId: verified.id,
                      revision: x.revision + 1,
                      history: [
                        ...x.history,
                        {
                          id: crypto.randomUUID(),
                          at: now,
                          actorId: actor.id,
                          actorName: actor.name,
                          action: "media_matched",
                          before: { mediaId: null },
                          after: { mediaId: verified.id },
                        },
                      ],
                    }
                  : x,
              ),
            };
        }
      }
      break;
    }
  }
  next = await snapshotBrands(c, next);
  if (next !== c && next.history === c.history)
    next = {
      ...next,
      history: [
        ...c.history,
        {
          id: crypto.randomUUID(),
          at: now,
          actorId: actor.id,
          actorName: actor.name,
          action: command.type,
          before:
            command.type === "campaign"
              ? Object.fromEntries(
                  Object.keys(command.fields).map((k) => [
                    k,
                    c[k as keyof Campaign],
                  ]),
                )
              : { revision: c.revision },
          after:
            command.type === "campaign"
              ? command.fields
              : { revision: next.revision },
        },
      ],
    };
  await commit(c, next, actor);
  return { campaign: next };
}

async function snapshotBrands(
  before: Campaign,
  next: Campaign,
): Promise<Campaign> {
  if (before === next || !next.brandId) return next;
  const { data: brand } = await database()
    .from("studio_brands")
    .select("*")
    .eq("id", next.brandId)
    .single();
  if (!brand) return next;
  return {
    ...next,
    ads: next.ads.map((a) =>
      ["approved", "on_air", "stopped"].includes(a.status) && !a.brandSnapshot
        ? { ...a, brandSnapshot: brand, url: a.url || next.defaultUrl }
        : a,
    ),
  };
}
