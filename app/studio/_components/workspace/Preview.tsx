/* eslint-disable @next/next/no-img-element -- Private signed URLs and original campaign media. */
"use client";
import { useState } from "react";
import type {
  SharedAd as Ad,
  PreviewCampaign as Campaign,
} from "@/lib/campaign-studio/workspace/share-types";
import { usePreviewData } from "./PreviewDataContext";
import ChannelIcon from "./ChannelIcon";
import PreviewCopy, { previewExcerpt } from "./PreviewCopy";
import Icon from "../Icon";
import s from "./preview.module.css";

export function MediaPreview({
  ad,
  campaign,
  thumbnail = false,
  playback = false,
}: {
  ad: Ad;
  campaign: Campaign;
  thumbnail?: boolean;
  playback?: boolean;
}) {
  const { data } = usePreviewData();
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
        media?.width && media.height
          ? { aspectRatio: `${media.width} / ${media.height}` }
          : undefined
      }
    >
      {src && media ? (
        media.mime.startsWith("video/") ? (
          <VideoPreview
            key={`${src}:${thumbnail}`}
            src={src}
            name={media.name}
            thumbnail={thumbnail}
            poster={data.thumbnailUrls?.[media.id]}
            playback={playback}
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
    </div>
  );
}

export function VideoPreview({
  src,
  poster,
  name,
  thumbnail = false,
  playback = false,
}: {
  src: string;
  poster?: string;
  name: string;
  thumbnail?: boolean;
  playback?: boolean;
}) {
  const [view, setView] = useState<"poster" | "player" | "error">(
    playback ? "player" : "poster",
  );
  if (view === "player")
    return (
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        preload="none"
        autoPlay={!playback}
        aria-label={name}
        onError={() => setView("error")}
      />
    );
  const picture =
    poster && view !== "error" ? (
      <img
        src={poster}
        alt={thumbnail ? "" : name}
        loading="lazy"
        onError={() => setView("error")}
      />
    ) : (
      <span className={`${s.mediaEmpty} ${s.videoMessage}`}>
        Aperçu vidéo indisponible
      </span>
    );
  if (thumbnail)
    return (
      <>
        {picture}
        <span className={s.play} aria-hidden="true">
          ▶
        </span>
      </>
    );
  return (
    <button
      type="button"
      className={s.videoPoster}
      onClick={() => setView("player")}
      aria-label={`Lire ${name}`}
    >
      {picture}
      <span className={s.play} aria-hidden="true">
        ▶
      </span>
    </button>
  );
}

export function SearchSceneHeader({ query }: { query: string }) {
  return (
    <div className={s.searchSceneHeader} aria-hidden="true">
      <div className={s.searchTop}>
        <img
          className={s.googleWord}
          src="/brands/channels/google-wordmark.png"
          width={272}
          height={92}
          alt="Google"
        />
        <span className={s.searchBar}>
          {query}
          <Icon name="close" size={17} />
          <Icon name="search" size={19} />
        </span>
      </div>
      <div className={s.searchTabs}>
        <b>Tout</b>
        <span>Actualités</span>
        <span>Images</span>
        <span>Vidéos</span>
        <span>Maps</span>
        <span>Plus</span>
      </div>
    </div>
  );
}

export function PublisherScene({ items }: { items: { c: Campaign; a: Ad }[] }) {
  const upper = items.find((i) =>
    ["leaderboard", "billboard", "mobile"].includes(i.a.format),
  );
  const side = items.find((i) => i.a.format === "halfpage");
  const rectangle =
    items.find((i) => i.a.format === "rectangle") ??
    items.find((i) => i !== upper && i !== side);
  return (
    <div
      className={s.publisherScene}
      aria-label="Simulation des bannières dans Le Devoir"
    >
      <div className={s.browserChrome}>
        <span aria-hidden="true">● ● ●</span>
        <small>ledevoir.com</small>
        <Icon name="more" size={17} />
      </div>
      {upper && (
        <div className={s.publisherTopAd}>
          <MediaPreview campaign={upper.c} ad={upper.a} />
        </div>
      )}
      <div className={s.publisherUtility}>
        <span>
          <Icon name="menu" size={15} /> Toutes les sections
        </span>
        <span>Infolettres</span>
        <span>Édition numérique</span>
        <b>S’abonner au Devoir</b>
      </div>
      <div className={s.publisherContent}>
        <div className={s.publisherMain}>
          <div className={s.masthead}>
            <span>LE</span>DEVOIR
          </div>
          <div className={s.publisherNav}>
            Opinion　 Actualités　 Politique　 Économie　 Culture　 Monde
          </div>
          <div className={s.editorialLayout}>
            <div className={s.editorial}>
              <small>LA VIE DES QUARTIERS</small>
              <h3>
                Des espaces
                <br />
                qui rapprochent
              </h3>
              <p>
                Parcs, culture et initiatives citoyennes : des milieux de vie
                qui se réinventent au quotidien.
              </p>
              <span className={s.articleRule} />
              <small>7 min.</small>
            </div>
            <div className={s.editorialIllustration} aria-hidden="true">
              <svg viewBox="0 0 300 360" preserveAspectRatio="xMidYMid slice">
                <rect width="300" height="360" fill="#dce5df" />
                <path
                  d="M0 170 80 70l30 45 65-90 125 145v190H0"
                  fill="#a6b7ac"
                />
                <path d="M95 360 160 160l100 200" fill="#e9e8dc" />
                <path
                  d="M18 0v360M45 0l20 360M282 0v360"
                  stroke="#586d59"
                  strokeWidth="13"
                />
                <circle cx="52" cy="90" r="70" fill="#758c62" />
                <circle cx="282" cy="130" r="82" fill="#b0b78d" />
                <circle cx="80" cy="12" r="72" fill="#8fa779" />
                <path
                  d="M140 310v30m12-30 4 30m-22-55 4 28h19l-3-28"
                  stroke="#294136"
                  strokeWidth="8"
                />
                <circle cx="145" cy="272" r="9" fill="#294136" />
              </svg>
            </div>
            <div className={s.publisherAside}>
              {rectangle && (
                <MediaPreview campaign={rectangle.c} ad={rectangle.a} />
              )}
              <div className={s.editorial}>
                <small>À NE PAS MANQUER</small>
                <p>Des initiatives locales pour faire vivre les quartiers.</p>
                <span className={s.articleRule} />
                <p>Le plein air, un vecteur de bien-être en ville.</p>
              </div>
            </div>
          </div>
        </div>
        {side && (
          <div className={s.publisherSideAd}>
            <MediaPreview campaign={side.c} ad={side.a} />
          </div>
        )}
      </div>
      <small className={s.simulation}>
        Aperçu en situation · contenu éditorial illustratif
      </small>
    </div>
  );
}

export default function Preview({
  ad,
  campaign,
  grouped = false,
  playback = false,
}: {
  ad: Ad;
  campaign: Campaign;
  grouped?: boolean;
  playback?: boolean;
}) {
  const { data } = usePreviewData();
  const brand =
    ad.brandSnapshot ?? data?.brands.find((b) => b.id === campaign.brandId);
  const url = ad.url || campaign.defaultUrl;
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {}
  const initials =
    (brand?.name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("") || "·";
  const avatar = brand?.logo ? (
    <img src={brand.logo} alt="" />
  ) : (
    <span className={s.monogram}>{initials}</span>
  );
  const identity = (
    <div className={s.identity}>
      {avatar}
      <span>
        <b>{brand?.name || "Marque non renseignée"}</b>
        <small>
          Sponsorisé <span aria-hidden="true">· ◉</span>
        </small>
      </span>
      <span className={s.more} aria-hidden="true">
        •••
      </span>
    </div>
  );
  const copy = ad.copy && (
    <PreviewCopy
      key={`${ad.id}:${ad.channel}:${ad.format}:${ad.copy}`}
      text={ad.copy}
      maximum={
        ad.channel === "youtube"
          ? 90
          : ad.channel === "tiktok"
            ? 100
            : undefined
      }
      expandable={ad.channel !== "youtube"}
    />
  );
  const destination = (
    <div className={s.destination}>
      <span>
        {ad.headline && (
          <b>
            {ad.channel === "youtube"
              ? previewExcerpt(ad.headline, 40)
              : ad.headline}
          </b>
        )}
        {domain && <small>{domain}</small>}
      </span>
      {ad.cta && <span className={s.cta}>{ad.cta}</span>}
    </div>
  );
  const descriptions = ad.descriptions.filter(Boolean);
  const additional = descriptions.length > 0 && (
    <div className={s.additional}>
      {descriptions.map((text, i) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  );
  const isStory = ["story", "story_video"].includes(ad.format);
  const isReel = ad.format === "reel";
  const short = ad.channel === "youtube" && ad.format === "short";
  if (ad.channel === "google")
    return (
      <div
        className={`${s.preview} ${s.search} ${grouped ? s.groupedSearch : ""}`}
      >
        {!grouped && <SearchSceneHeader query={brand?.name || domain} />}
        <div className={s.searchResult}>
          <b className={s.sponsored}>Sponsorisé</b>
          <div className={s.searchIdentity}>
            {avatar}
            <span>
              <b>{brand?.name || "Marque non renseignée"}</b>
              <small>
                {ad.path1 || ad.path2 ? url.replace(/\/+$/, "") : url}
                {ad.path1 ? "/" + ad.path1.replace(/^\/+|\/+$/g, "") : ""}
                {ad.path2 ? "/" + ad.path2.replace(/^\/+|\/+$/g, "") : ""}
              </small>
            </span>
          </div>
          <h3 className={s.headlines}>
            {ad.headlines
              .filter(Boolean)
              .slice(0, 3)
              .map((text) => previewExcerpt(text, 30))
              .join(" | ") ||
              ad.headline ||
              "Aucun titre renseigné"}
          </h3>
          <div className={s.additional}>
            {descriptions.slice(0, 2).map((text, i) => (
              <p key={i}>{previewExcerpt(text, 90)}</p>
            ))}
          </div>
          {(ad.headlines.filter(Boolean).length > 3 ||
            descriptions.length > 2) && (
            <small className={s.combinationNote}>
              Exemple de combinaison · tous les textes restent disponibles dans
              l’éditeur.
            </small>
          )}
        </div>
      </div>
    );
  if (ad.channel === "display")
    return grouped ? (
      <div className={`${s.preview} ${s.bannerPreview}`}>
        <MediaPreview ad={ad} campaign={campaign} playback={playback} />
      </div>
    ) : (
      <PublisherScene items={[{ a: ad, c: campaign }]} />
    );
  if (ad.channel === "tiktok" || isStory || isReel || short)
    return (
      <div
        className={`${s.preview} ${s.immersive} ${ad.channel === "tiktok" ? s.tiktok : ""} ${isStory ? s.story : ""} ${short ? s.short : ""}`}
      >
        {short && (
          <header className={s.platform}>
            <Icon name="menu" />
            <ChannelIcon channel="youtube" tone="brand" />
            <b>YouTube</b>
            <Icon name="search" />
          </header>
        )}
        <div className={s.immersiveFrame}>
          <MediaPreview ad={ad} campaign={campaign} playback={playback} />
          <div className={s.overlayTop}>
            {ad.channel === "tiktok" ? (
              <div className={s.forYou}>
                <span>Following</span>
                <b>For You</b>
                <Icon name="search" />
              </div>
            ) : (
              <>
                {isStory && (
                  <div className={s.storyProgress} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {identity}
              </>
            )}
          </div>
          {!isStory && (
            <div className={s.reactions} aria-hidden="true">
              <Icon name="heart" size={25} />
              <Icon name="comment" size={24} />
              <Icon name="send" size={24} />
            </div>
          )}
          {(isReel || short) && (
            <span className={s.centerPlay} aria-hidden="true">
              ▶
            </span>
          )}
          <div className={s.overlayCopy}>
            {ad.channel === "tiktok" && (
              <b>
                @{(brand?.name || "marque").toLowerCase().replace(/\s+/g, "")}
              </b>
            )}
            {copy}
            {ad.headline && (
              <strong>
                {ad.channel === "youtube"
                  ? previewExcerpt(ad.headline, 40)
                  : ad.headline}
              </strong>
            )}
            {additional}
            {domain && <small>{domain}</small>}
            {ad.cta && (
              <span className={s.cta}>
                {ad.cta}
                <Icon name="chevron" size={17} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  if (ad.channel === "youtube")
    return (
      <div className={`${s.preview} ${s.youtube}`}>
        <header className={s.platform}>
          <Icon name="menu" />
          <ChannelIcon channel="youtube" tone="brand" />
          <b>YouTube</b>
          <span>
            <Icon name="search" />
          </span>
        </header>
        <MediaPreview ad={ad} campaign={campaign} playback={playback} />
        <div className={s.youtubeBody}>
          {identity}
          {copy}
          {destination}
          {additional}
        </div>
      </div>
    );
  return (
    <div
      className={`${s.preview} ${ad.channel === "instagram" ? s.instagram : s.facebook}`}
    >
      {identity}
      {ad.channel === "facebook" && copy}
      <MediaPreview ad={ad} campaign={campaign} playback={playback} />
      {ad.channel === "instagram" && (
        <>
          <div className={s.socialActions} aria-hidden="true">
            <Icon name="heart" size={24} />
            <Icon name="comment" size={24} />
            <Icon name="send" size={24} />
            <span>
              <Icon name="bookmark" size={23} />
            </span>
          </div>
          {copy}
        </>
      )}
      {destination}
      {additional}
    </div>
  );
}
