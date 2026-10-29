"use client";
import { useEffect, useState } from "react";
import type { PublicPresentation } from "@/lib/campaign-studio/workspace/share-types";
import { CHANNELS } from "@/lib/campaign-studio/workspace/catalog";
import Preview from "@/app/studio/_components/workspace/Preview";
import ChannelIcon, {
  CHANNEL_ORDER,
} from "@/app/studio/_components/workspace/ChannelIcon";
import { PreviewDataProvider } from "@/app/studio/_components/workspace/PreviewDataContext";
import s from "./public.module.css";
export default function PublicCampaign({ token }: { token: string }) {
  const [data, setData] = useState<PublicPresentation | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let disposed = false,
      pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(
          `/api/studio/public/${encodeURIComponent(token)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            "Cette présentation est indisponible. Le lien a peut-être été révoqué.",
          );
        const next = await response.json();
        if (!disposed) {
          setData(next);
          setError("");
        }
      } catch (e) {
        if (!disposed) {
          setData(null);
          setError(
            e instanceof Error ? e.message : "Présentation indisponible.",
          );
        }
      } finally {
        pending = false;
      }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    function visible() {
      if (document.visibilityState === "visible") void refresh();
    }
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [token]);
  return (
    <div className={s.publicPresentation}>
      <header className={s.header}>
        <span>MB Média Studio · Présentation</span>
        <span>Lecture seule</span>
      </header>
      {error ? (
        <div className={s.empty} role="alert">
          <h1>Présentation indisponible</h1>
          <p>{error}</p>
        </div>
      ) : !data ? (
        <p className={s.empty} role="status">
          Chargement de la présentation…
        </p>
      ) : (
        <PreviewDataProvider data={data}>
          <h1>{data.campaign.name}</h1>
          {!data.campaign.ads.length && <p>Aucune annonce pour le moment.</p>}
          {CHANNEL_ORDER.map((channel) => {
            const ads = data.campaign.ads.filter(
              (ad) => ad.channel === channel,
            );
            return ads.length ? (
              <section key={channel} className={s.channel}>
                <h2>
                  <ChannelIcon channel={channel} />
                  {CHANNELS[channel]}
                  <span>{ads.length}</span>
                </h2>
                <div className={s.grid}>
                  {ads.map((ad) => (
                    <article key={ad.id}>
                      <Preview ad={ad} campaign={data.campaign} />
                    </article>
                  ))}
                </div>
              </section>
            ) : null;
          })}
        </PreviewDataProvider>
      )}
    </div>
  );
}
