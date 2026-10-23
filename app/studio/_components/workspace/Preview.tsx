/* eslint-disable @next/next/no-img-element -- Private signed URLs and original campaign media. */
"use client";
import { useState } from "react";
import type { Ad, Campaign } from "@/lib/campaign-studio/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";
import w from "./workspace.module.css";
export default function Preview({
  ad,
  campaign,
}: {
  ad: Ad;
  campaign: Campaign;
}) {
  const { data } = useWorkspace();
  const [combination, setCombination] = useState(0);
  const brand =
    ad.brandSnapshot ?? data?.brands.find((b) => b.id === campaign.brandId);
  const media = campaign.media.find((m) => m.id === ad.mediaId);
  const src = media ? data?.mediaUrls[media.id] : undefined;
  const url = ad.url || campaign.defaultUrl;
  let domain = "votre-site.ca";
  try {
    domain = new URL(url).hostname;
  } catch {}
  if (ad.channel === "google") {
    const rotate = (xs: string[], max: number) =>
      Array.from(
        { length: Math.min(max, xs.length) },
        (_, i) => xs[(i + combination) % xs.length],
      );
    return (
      <div className={w.searchPreview}>
        <span className={w.previewTag}>Aperçu Google Search</span>
        <p>
          <b>Sponsorisé</b>
        </p>
        <div className={w.identity}>
          {brand?.logo ? (
            <img src={brand.logo} alt="" />
          ) : (
            <span className={w.monogram}>{brand?.name.charAt(0) || "M"}</span>
          )}
          <span>
            {brand?.name || "Nom de marque"}
            <small>
              {domain}
              {ad.path1 ? "/" + ad.path1 : ""}
              {ad.path2 ? "/" + ad.path2 : ""}
            </small>
          </span>
        </div>
        <h3>
          {rotate(ad.headlines.filter(Boolean), 3).join(" | ") ||
            "Votre premier titre | Votre deuxième titre"}
        </h3>
        <p>
          {rotate(ad.descriptions.filter(Boolean), 2).join(" ") ||
            "Les descriptions de votre annonce apparaîtront ici."}
        </p>
        <footer>
          <button
            onClick={() => setCombination((v) => Math.max(0, v - 1))}
            disabled={!combination}
            aria-label="Combinaison précédente"
          >
            ←
          </button>
          <span>Combinaison {combination + 1}</span>
          <button
            onClick={() => setCombination((v) => v + 1)}
            aria-label="Combinaison suivante"
          >
            →
          </button>
        </footer>
        <small>L’affichage réel peut varier selon Google et l’appareil.</small>
      </div>
    );
  }
  return (
    <div className={w.adPreview}>
      {ad.channel === "youtube" && (
        <div className={w.youtubeBrand}>▶ YouTube</div>
      )}
      {ad.channel !== "display" && ad.channel !== "youtube" && (
        <div className={w.identity}>
          {brand?.logo ? (
            <img src={brand.logo} alt="" />
          ) : (
            <span className={w.monogram}>{brand?.name.charAt(0) || "M"}</span>
          )}
          <span>
            <b>{brand?.name || "Nom de marque"}</b>
            <small>Sponsorisé</small>
          </span>
        </div>
      )}
      {ad.channel !== "display" && ad.channel !== "youtube" && (
        <p>{ad.copy || "Votre texte publicitaire"}</p>
      )}
      <div
        className={`${w.previewMedia} ${["reel", "story", "story_video", "vertical", "short"].includes(ad.format) ? w.vertical : ""}`}
      >
        {src && media ? (
          media.mime.startsWith("video/") ? (
            <video src={src} controls preload="metadata" />
          ) : (
            <img src={src} alt={media.name} />
          )
        ) : (
          <span>Média à associer</span>
        )}
      </div>
      {ad.channel === "youtube" && (
        <p>{ad.copy || "Votre texte publicitaire"}</p>
      )}
      <div className={w.previewDestination}>
        <span>
          <small>{domain}</small>
          <b>{ad.headline || ad.name}</b>
        </span>
        <span>{ad.cta}</span>
      </div>
    </div>
  );
}
