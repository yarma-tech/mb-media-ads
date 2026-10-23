"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Ad,
  AdFields,
  Campaign,
} from "@/lib/campaign-studio/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";
const fields = (a: Ad): AdFields => ({
  name: a.name,
  copy: a.copy,
  headline: a.headline,
  headlines: a.headlines,
  descriptions: a.descriptions,
  cta: a.cta,
  url: a.url,
  mediaId: a.mediaId,
  path1: a.path1,
  path2: a.path2,
});
function diff(before: AdFields, after: AdFields): Partial<AdFields> {
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) =>
        JSON.stringify(before[key as keyof AdFields]) !== JSON.stringify(value),
    ),
  ) as Partial<AdFields>;
}
export function useAdEditor(
  c: Campaign,
  ad: Ad,
  enabled: boolean,
  source: "configuration" | "validation",
  unlocked: boolean,
) {
  const { run, refresh, data } = useWorkspace();
  const [draft, setDraft] = useState(() => fields(ad)),
    [saved, setSaved] = useState(() => JSON.stringify(fields(ad))),
    [status, setStatus] = useState<
      "loading" | "ready" | "saving" | "error" | "locked"
    >("loading"),
    [error, setError] = useState("");
  const token = useRef(""),
    latest = useRef(draft),
    baseline = useRef(draft),
    modified = useRef(0),
    saving = useRef<Promise<unknown>>(Promise.resolve()),
    alive = useRef(true);
  const cacheKey = `studio:draft:${data?.actor.id}:${ad.id}`;
  const save = useCallback(
    async (final = false) => {
      const value = latest.current;
      const patch = diff(baseline.current, value);
      if (!final && !Object.keys(patch).length) return;
      if (alive.current) {
        setStatus("saving");
        setError("");
      }
      const promise = saving.current
        .catch(() => {})
        .then(async () => {
          const result = await run({
            type: "edit",
            campaignId: c.id,
            adId: ad.id,
            fields: patch,
            source: final ? "validation" : source,
            unlocked,
            lockToken: token.current,
          });
          const updated = (result.campaign as Campaign).ads.find(
            (a) => a.id === ad.id,
          )!;
          const server = fields(updated);
          const newer = diff(value, latest.current);
          baseline.current = server;
          latest.current = { ...server, ...newer };
          if (source === "configuration")
            try {
              if (!Object.keys(newer).length) localStorage.removeItem(cacheKey);
              else
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ revision: updated.revision, patch: newer }),
                );
            } catch {}
          if (alive.current) {
            setSaved(JSON.stringify(server));
            setDraft(latest.current);
            setStatus(Object.keys(newer).length ? "saving" : "ready");
          }
          return result;
        })
        .catch((e) => {
          if (alive.current) {
            setStatus("error");
            setError(e.message);
          }
          throw e;
        });
      saving.current = promise;
      return promise;
    },
    [ad.id, c.id, run, source, unlocked, cacheKey],
  );
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    alive.current = true;
    if (!enabled) {
      queueMicrotask(() => setStatus("locked"));
      return;
    }
    let active = true;
    modified.current = Date.now();
    const lockToken = crypto.randomUUID();
    token.current = lockToken;
    void run({ type: "lock", campaignId: c.id, adId: ad.id, token: lockToken })
      .then((result) => {
        if (!active) return;
        const current = (result.campaign as Campaign).ads.find(
          (a) => a.id === ad.id,
        )!;
        const value = fields(current);
        let restored: Partial<AdFields> = {};
        let conflict = false;
        if (source === "configuration")
          try {
            const raw = localStorage.getItem(cacheKey);
            if (raw) {
              const cache = JSON.parse(raw);
              if (cache && typeof cache.patch === "object") {
                restored = cache.patch;
                conflict = cache.revision !== current.revision;
              }
            }
          } catch {}
        baseline.current = value;
        latest.current = { ...value, ...restored };
        setSaved(JSON.stringify(value));
        setDraft(latest.current);
        setStatus(conflict ? "error" : "ready");
        setError(
          conflict
            ? "Brouillon local retrouvé après une modification serveur. Vérifiez vos changements, puis réessayez."
            : "",
        );
      })
      .catch((e) => {
        if (active) {
          setStatus("locked");
          setError(e.message);
        }
      });
    const interval = setInterval(() => {
      if (Date.now() - modified.current > 90000) {
        void run({
          type: "release",
          campaignId: c.id,
          adId: ad.id,
          token: lockToken,
        }).catch(() => {});
        if (active) setStatus("locked");
      } else
        void run({
          type: "lock",
          campaignId: c.id,
          adId: ad.id,
          token: lockToken,
        }).catch((e) => {
          if (active) {
            setStatus("locked");
            setError(e.message);
          }
        });
    }, 30000);
    return () => {
      active = false;
      alive.current = false;
      clearInterval(interval);
      const release = () =>
        run({
          type: "release",
          campaignId: c.id,
          adId: ad.id,
          token: lockToken,
        });
      if (
        source === "configuration" &&
        Object.keys(diff(baseline.current, latest.current)).length
      )
        void saveRef
          .current()
          .then(release)
          .catch(() => {});
      else void release().catch(() => {});
    };
    // A lock session belongs to one ad, not to each autosaved server revision.

  }, [c.id, ad.id, enabled, run, cacheKey, source]);
  useEffect(() => {
    if (!Object.keys(diff(baseline.current, latest.current)).length) {
      const value = fields(ad);
      baseline.current = value;
      latest.current = value;
      queueMicrotask(() => {
        setSaved(JSON.stringify(value));
        setDraft(value);
      });
    }
    // Only clean inputs follow a remote change. Dirty fields are retained for explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.revision]);
  useEffect(() => {
    if (
      !enabled ||
      source === "validation" ||
      ["loading", "locked", "error"].includes(status) ||
      JSON.stringify(draft) === saved
    )
      return;
    const timer = setTimeout(() => void save().catch(() => {}), 650);
    return () => clearTimeout(timer);
  }, [draft, saved, enabled, save, source, status]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.keys(diff(baseline.current, latest.current)).length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  const change = (patch: Partial<AdFields>) => {
    modified.current = Date.now();
    latest.current = { ...latest.current, ...patch };
    setDraft(latest.current);
    if (source === "configuration")
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            revision: ad.revision,
            patch: diff(baseline.current, latest.current),
          }),
        );
      } catch {
        setError(
          "Copie locale indisponible. Gardez cette page ouverte jusqu’à la sauvegarde serveur.",
        );
      }
    if (status === "error") setStatus("ready");
  };
  const retry = async () => {
    const result = await run({
      type: "lock",
      campaignId: c.id,
      adId: ad.id,
      token: token.current,
    });
    const current = (result.campaign as Campaign).ads.find((a) => a.id === ad.id)!;
    const patch = diff(baseline.current, latest.current);
    baseline.current = fields(current);
    latest.current = { ...baseline.current, ...patch };
    setSaved(JSON.stringify(baseline.current));
    setDraft(latest.current);
    await refresh();
    modified.current = Date.now();
    setError("");
    setStatus("ready");
    if (source === "configuration") await save();
  };
  return {
    draft,
    change,
    status,
    error,
    save,
    retry,
    dirty: JSON.stringify(draft) !== saved,
  };
}
