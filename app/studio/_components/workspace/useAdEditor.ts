"use client";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Ad,
  AdFields,
  Campaign,
} from "@/lib/campaign-studio/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";
// A normal navigation or another tab always starts a distinct editor session.
// A reload may resume this tab's existing lease; server owner/token checks stay unchanged.
const resumedLocks = new Set<string>();
function rememberLock(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}
function editorLockToken(key: string) {
  let previous = "";
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  if (navigation?.type === "reload" && !resumedLocks.has(key)) {
    try {
      previous = sessionStorage.getItem(key) ?? "";
    } catch {}
  }
  resumedLocks.add(key);
  const value = previous || crypto.randomUUID();
  rememberLock(key, value);
  return value;
}
const fields = (a: Ad): AdFields => ({
  theme: a.theme ?? "",
  format: a.format,
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
      "inactive" | "loading" | "ready" | "saving" | "error" | "locked"
    >("loading"),
    [error, setError] = useState("");
  const token = useRef(""),
    latest = useRef(draft),
    baseline = useRef(draft),
    renewedAt = useRef(0),
    baselineRevision = useRef(ad.revision),
    saving = useRef<Promise<unknown>>(Promise.resolve()),
    alive = useRef(true);
  const cached = useRef(false);
  const finalSave = useRef<Promise<unknown> | null>(null);
  const lockKey = `studio:edit-lock:${data?.actor.id}:${ad.id}`;
  const cacheKey = `studio:${source === "validation" ? "validation-draft" : "draft"}:${data?.actor.id}:${ad.id}`;
  const renewLease = useCallback(async () => {
    const result = await run({
      type: "lock",
      campaignId: c.id,
      adId: ad.id,
      token: token.current,
    });
    const current = (result.campaign as Campaign).ads.find(
      (item) => item.id === ad.id,
    )!;
    if (
      current.revision !== baselineRevision.current &&
      Object.keys(diff(baseline.current, latest.current)).length
    )
      throw new Error(
        "Cette annonce a changé pendant votre absence. Votre saisie est conservée. Vérifiez-la avant de reprendre l’édition.",
      );
    renewedAt.current = Date.now();
    return result;
  }, [run, c.id, ad.id]);
  const save = useCallback(
    async (final = false) => {
      if (final && finalSave.current) return finalSave.current;
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
          // Mobile browsers may suspend renewal timers. Reclaim the same lease
          // before sending a stale editor's changes; a competing owner still wins.
          if (Date.now() - renewedAt.current > 25000) await renewLease();
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
          baselineRevision.current = updated.revision;
          latest.current = { ...server, ...newer };
          try {
            if (!Object.keys(newer).length) localStorage.removeItem(cacheKey);
            else
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ revision: updated.revision, patch: newer }),
              );
          } catch {}
          cached.current = !Object.keys(newer).length;
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
            setError(workspaceErrorMessage(e, "command"));
          }
          throw e;
        });
      saving.current = promise;
      if (final) {
        finalSave.current = promise;
        void promise
          .finally(() => {
            finalSave.current = null;
          })
          .catch(() => {});
      }
      return promise;
    },
    [ad.id, c.id, run, source, unlocked, cacheKey, renewLease],
  );
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    alive.current = true;
    if (!enabled) {
      queueMicrotask(() => setStatus("inactive"));
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setStatus("loading");
        setError("");
      }
    });
    const lockToken = editorLockToken(lockKey);
    const release = async () => {
      const result = await run({
        type: "release",
        campaignId: c.id,
        adId: ad.id,
        token: lockToken,
      });
      try {
        if (sessionStorage.getItem(lockKey) === lockToken)
          sessionStorage.removeItem(lockKey);
      } catch {}
      return result;
    };
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
        cached.current = Object.keys(restored).length > 0;
        baseline.current = value;
        baselineRevision.current = current.revision;
        renewedAt.current = Date.now();
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
          setError(workspaceErrorMessage(e, "command"));
        }
      });
    const renew = () => {
      void renewLease().catch((e) => {
        if (active) {
          setStatus("locked");
          setError(workspaceErrorMessage(e, "command"));
        }
      });
    };
    // Reading an open editor is not a conflict. Keep its lease alive until
    // navigation; the server still expires leases from closed/suspended tabs.
    const interval = setInterval(renew, 30000);
    const visibility = () => {
      renewedAt.current = 0;
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      active = false;
      alive.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
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
  }, [c.id, ad.id, enabled, run, cacheKey, lockKey, source, renewLease]);
  useEffect(() => {
    if (!Object.keys(diff(baseline.current, latest.current)).length) {
      const value = fields(ad);
      baseline.current = value;
      baselineRevision.current = ad.revision;
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
      if (
        Object.keys(diff(baseline.current, latest.current)).length &&
        !(source === "validation" && cached.current)
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [source]);
  const change = (patch: Partial<AdFields>) => {
    latest.current = { ...latest.current, ...patch };
    setDraft(latest.current);
    cached.current = false;
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          revision: ad.revision,
          patch: diff(baseline.current, latest.current),
        }),
      );
      cached.current = true;
    } catch {
      setError(
        "Copie locale indisponible. Gardez cette page ouverte jusqu’à la sauvegarde serveur.",
      );
    }
    if (status === "error") setStatus("ready");
  };
  const retry = async () => {
    rememberLock(lockKey, token.current);
    const result = await run({
      type: "lock",
      campaignId: c.id,
      adId: ad.id,
      token: token.current,
    });
    const current = (result.campaign as Campaign).ads.find(
      (a) => a.id === ad.id,
    )!;
    const patch = diff(baseline.current, latest.current);
    baseline.current = fields(current);
    baselineRevision.current = current.revision;
    renewedAt.current = Date.now();
    latest.current = { ...baseline.current, ...patch };
    setSaved(JSON.stringify(baseline.current));
    setDraft(latest.current);
    await refresh();
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
    canClose: () =>
      !Object.keys(diff(baseline.current, latest.current)).length ||
      cached.current ||
      window.confirm(
        "La copie locale est indisponible. Fermer et abandonner vos corrections ?",
      ),
  };
}
