"use client";
import { createBrowserClient } from "@supabase/ssr";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Actor,
  Brand,
  Campaign,
} from "@/lib/campaign-studio/workspace/types";
import type {
  CATALOG,
  CHANNELS,
} from "@/lib/campaign-studio/workspace/catalog";
interface Snapshot {
  members: {
    id: string;
    name: string;
    role: "preparer" | "validator";
    access: "active" | "revoked";
  }[];
  agents: { id: string; name: string; revoked_at: string | null }[];
  actor: Actor;
  campaigns: Campaign[];
  brands: Brand[];
  locks: {
    ad_id: string;
    owner_id: string;
    owner_name: string;
    expires_at: string;
  }[];
  catalog: typeof CATALOG;
  channels: typeof CHANNELS;
  mediaUrls: Record<string, string>;
}
interface Context {
  data: Snapshot | null;
  loading: boolean;
  error: string;
  notice: string;
  run: (command: Record<string, unknown>) => Promise<Record<string, unknown>>;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  notify: (message: string) => void;
}
const ctx = createContext<Context | null>(null);
export const authClient =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
    : null;
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, notify] = useState("");
  const current = useRef<Snapshot | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const busy = useRef(0);
  const headers = useCallback(async () => {
    const {
      data: { session },
    } = await authClient!.auth.getSession();
    if (!session) throw new Error("Connectez-vous pour accéder au studio.");
    return {
      Authorization: "Bearer " + session.access_token,
      "Content-Type": "application/json",
    };
  }, []);
  const refresh = useCallback(async () => {
    const r = await fetch("/api/studio", { headers: await headers() });
    const next = await r.json();
    if (!r.ok) throw new Error(next.error);
    current.current = next;
    setData(next);
    setError("");
  }, [headers]);
  useEffect(() => {
    let alive = true;
    void Promise.resolve()
      .then(refresh)
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const interval = setInterval(() => {
      if (!busy.current) void refresh().catch((e) => setError(e.message));
    }, 15000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => notify(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  const run = useCallback(
    (command: Record<string, unknown>) => {
      busy.current++;
      const task = queue.current
        .catch(() => {})
        .then(async () => {
          const c = current.current?.campaigns.find(
            (c) => c.id === command.campaignId,
          );
          const body = {
            ...command,
            ...(c && !["lock", "release"].includes(String(command.type))
              ? { revision: c.revision }
              : {}),
          };
          const response = await fetch("/api/studio/commands", {
            method: "POST",
            headers: await headers(),
            body: JSON.stringify(body),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error ?? "Échec de l’enregistrement.");
          if (result.campaign && current.current) {
            const old = current.current;
            const campaign = result.campaign as Campaign;
            const campaigns = old.campaigns.some((c) => c.id === campaign.id)
              ? old.campaigns.map((c) => (c.id === campaign.id ? campaign : c))
              : [campaign, ...old.campaigns];
            current.current = { ...old, campaigns };
            setData(current.current);
          }
          if (result.brand && current.current) {
            current.current = {
              ...current.current,
              brands: [...current.current.brands, result.brand],
            };
            setData(current.current);
          }
          if (
            [
              "verify_media",
              "member",
              "invite",
              "revoke_agent",
              "agent",
            ].includes(String(command.type))
          )
            await refresh();
          return result as Record<string, unknown>;
        })
        .catch((e) => {
          notify(e.message);
          throw e;
        })
        .finally(() => {
          busy.current--;
        });
      queue.current = task;
      return task;
    },
    [headers, refresh],
  );
  return (
    <ctx.Provider
      value={{
        data,
        loading,
        error,
        notice,
        run,
        refresh,
        notify,
        login: async (email, password) => {
          const { error } = await authClient!.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          await refresh();
        },
        logout: async () => {
          await authClient!.auth.signOut();
          current.current = null;
          setData(null);
          setError("");
        },
      }}
    >
      {children}
    </ctx.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(ctx);
  if (!value) throw new Error("WorkspaceProvider manquant");
  return value;
}
