/* eslint-disable @next/next/no-img-element -- Private signed URLs and original campaign media. */
"use client";
import type { Ad, Campaign } from "@/lib/campaign-studio/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";
import ChannelIcon from "./ChannelIcon";
import s from "./preview.module.css";

export function MediaPreview({
  ad,
  campaign,
  thumbnail = false,
}: {
  ad: Ad;
  campaign: Campaign;
  thumbnail?: boolean;
}) {
  const { data } = useWorkspace();
  const media = campaign.media.find((m) => m.id === ad.mediaId);
  const src = media ? data?.mediaUrls[media.id] : undefined;
  const vertical = [
    "reel",
    "story",
    "story_video",
    "vertical",
    "short",
    "halfpage",
  ].includes(ad.format);
  return (
    <div
      className={`${s.media} ${vertical ? s.vertical : ""} ${thumbnail ? s.thumbnail : ""}`}
      style={
        !thumbnail && media?.width && media.height
          ? { aspectRatio: `${media.width} / ${media.height}` }
          : undefined
      }
    >
      {src && media ? (
        media.mime.startsWith("video/") ? (
          <video
            src={src}
            controls={!thumbnail}
            muted={thumbnail}
            preload="metadata"
            aria-label={media.name}
          />
        ) : (
          <img src={src} alt={thumbnail ? "" : media.name} />
        )
      ) : (
        <span className={s.mediaEmpty}>
          {ad.channel === "google" ? (
            <ChannelIcon channel="google" size={32} />
          ) : !media ? (
            "Média à associer"
          ) : media.state === "ready" ? (
            "Préparation de l’aperçu…"
          ) : media.state === "invalid" ? (
            "Non conforme"
          ) : (
            "Transfert à terminer"
          )}
        </span>
      )}
      {thumbnail && media?.mime.startsWith("video/") && (
        <span className={s.play} aria-hidden="true">
          ▶
        </span>
      )}
    </div>
  );
}

export default function Preview({
  ad,
  campaign,
}: {
  ad: Ad;
  campaign: Campaign;
}) {
  const { data } = useWorkspace();
  const brand =
    ad.brandSnapshot ?? data?.brands.find((b) => b.id === campaign.brandId);
  const url = ad.url || campaign.defaultUrl;
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {}
  const identity = (
    <div className={s.identity}>
      {brand?.logo ? (
        <img src={brand.logo} alt="" />
      ) : (
        <span className={s.monogram}>{brand?.name.charAt(0) || "·"}</span>
      )}
      <span>
        <b>{brand?.name || "Marque non renseignée"}</b>
        <small>Sponsorisé</small>
      </span>
      <span className={s.more} aria-hidden="true">
        •••
      </span>
    </div>
  );
  const copy = ad.copy && <p className={s.copy}>{ad.copy}</p>;
  const destination = (
    <div className={s.destination}>
      <span>
        {ad.headline && <b>{ad.headline}</b>}
        {domain && <small>{domain}</small>}
      </span>
      {ad.cta && <span className={s.cta}>{ad.cta}</span>}
    </div>
  );
  const additionalCopy = ad.descriptions.filter(Boolean).length > 0 && (
    <div className={s.additional}>
      {ad.descriptions.filter(Boolean).map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
  if (ad.channel === "google")
    return (
      <div className={`${s.preview} ${s.search}`}>
        <div className={s.searchBar}>
          <ChannelIcon channel="google" size={25} />
          <span>{domain || "Destination non renseignée"}</span>
          <span aria-hidden="true">⌕</span>
        </div>
        <small className={s.tag}>
          Aperçu Google SEM · Tous les textes fournis
        </small>
        {identity}
        <small>
          {domain}
          {ad.path1 ? "/" + ad.path1 : ""}
          {ad.path2 ? "/" + ad.path2 : ""}
        </small>
        <div className={s.headlines}>
          {ad.headlines.filter(Boolean).map((text, i) => (
            <h3 key={i}>{text}</h3>
          ))}
        </div>
        {!ad.headlines.some(Boolean) && (
          <p className={s.empty}>Aucun titre renseigné</p>
        )}
        {ad.headline && <h3>{ad.headline}</h3>}
        {copy}
        {additionalCopy}
        {ad.cta && <span className={s.cta}>{ad.cta}</span>}
        <small className={s.tag}>
          L’affichage et les combinaisons réels varient selon Google et
          l’appareil.
        </small>
      </div>
    );
  if (ad.channel === "display")
    return (
      <div className={`${s.preview} ${s.publisher}`}>
        <div className={s.masthead}>Le Devoir</div>
        <div className={s.publisherNav}>
          Actualités · Politique · Société · Culture
        </div>
        <small className={s.simulation}>
          Simulation locale d’un emplacement publicitaire. Aucun partenariat ni
          placement confirmé avec Le Devoir.
        </small>
        <div className={s.editorial} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={s.displayAd}>
          <small>PUBLICITÉ · APERÇU</small>
          <MediaPreview ad={ad} campaign={campaign} />
          {copy}
          {destination}
          {additionalCopy}
        </div>
        <div className={s.editorial} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  if (ad.channel === "tiktok")
    return (
      <div className={`${s.preview} ${s.tiktok}`}>
        <header className={s.platform}>
          <ChannelIcon channel="tiktok" size={22} />
          <b>TikTok</b>
          <span>Pour toi</span>
        </header>
        <MediaPreview ad={ad} campaign={campaign} />
        <div className={s.socialBody}>
          {identity}
          {copy}
          {destination}
          {additionalCopy}
        </div>
      </div>
    );
  if (ad.channel === "youtube")
    return (
      <div className={`${s.preview} ${s.youtube}`}>
        <header className={s.platform}>
          <ChannelIcon channel="youtube" size={25} />
          <b>YouTube</b>
          <span>⋮</span>
        </header>
        <MediaPreview ad={ad} campaign={campaign} />
        <div className={s.socialBody}>
          {identity}
          {copy}
          {destination}
          {additionalCopy}
        </div>
      </div>
    );
  return (
    <div
      className={`${s.preview} ${ad.channel === "instagram" ? s.instagram : s.facebook}`}
    >
      {identity}
      {ad.channel === "facebook" && copy}
      <MediaPreview ad={ad} campaign={campaign} />
      {ad.channel === "instagram" && (
        <>
          <div className={s.socialActions} aria-hidden="true">
            ♡ &nbsp; ◯ &nbsp; ↗ <span>♧</span>
          </div>
          {copy}
        </>
      )}
      {destination}
      {additionalCopy}
    </div>
  );
}
