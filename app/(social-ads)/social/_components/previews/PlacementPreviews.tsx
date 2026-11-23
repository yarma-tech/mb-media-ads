"use client";
import { useEffect, useState } from "react";
import type { PreviewAd } from "../SocialPreview";
import type { AdVariant, VariantSpec } from "@/lib/social-ads/specs";
import { RATIO_VALUE, tronquer } from "@/lib/social-ads/types";
type Props = {
  ad: PreviewAd & AdVariant;
  view: "desktop" | "mobile";
  safe: boolean;
  spec: VariantSpec;
};
const name = (ad: PreviewAd) => ad.marque_nom || "Votre marque";
function NativeIcon({
  kind,
}: {
  kind: "heart" | "comment" | "send" | "bookmark" | "like" | "repeat";
}) {
  const paths = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    comment:
      "M21 11.5a8.4 8.4 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
    send: "m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13",
    bookmark: "M19 21l-7-5-7 5V3h14v18Z",
    like: "M7 10v12H3V10h4Zm0 0 5-8c2 0 3 2 2 4l-1 4h6c2 0 3 1 2 3l-2 7c0 1-1 2-2 2H7",
    repeat:
      "m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3",
  };
  return (
    <svg
      className="sa-native-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind]} />
    </svg>
  );
}
function Avatar({ ad }: { ad: PreviewAd }) {
  return ad.marque_logo ? (
    <img className="sa-avatar" src={ad.marque_logo} alt="" />
  ) : (
    <span className="sa-avatar sa-avatar-initial">{name(ad).slice(0, 1)}</span>
  );
}
function Copy({ ad, spec }: Pick<Props, "ad" | "spec">) {
  const [expanded, setExpanded] = useState(false);
  const t = tronquer(
    ad.texte_principal || "",
    spec.texteHard ? spec.texteMax : spec.texteShown,
  );
  return (
    <p className="sa-copy">
      {expanded ? ad.texte_principal : t.visible}
      {t.coupe &&
        !expanded &&
        (spec.texteHard ? (
          "…"
        ) : (
          <button type="button" onClick={() => setExpanded(true)}>
            … Voir plus
          </button>
        ))}
    </p>
  );
}
function Picture({
  ad,
  safe,
  spec,
  carousel = false,
}: Props & { carousel?: boolean }) {
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, ad.medias.length - 1));
  const media = ad.medias[i];
  return (
    <div className="sa-picture-wrap">
      <div
        className="sa-picture"
        style={{ aspectRatio: RATIO_VALUE[ad.ratio] }}
      >
        {media?.url && media.type !== "video" ? (
          <img src={media.url} alt={media.titre || "Création publicitaire"} />
        ) : (
          <span className="sa-picture-empty">
            {media?.type === "video"
              ? "Ajouter une capture de cette vidéo"
              : "Visuel à fournir"}
          </span>
        )}
        {ad.type_media === "video" && (
          <span className="sa-play" aria-label="Capture vidéo">
            ▶
          </span>
        )}
        {carousel && ad.medias.length > 1 && (
          <>
            <button
              className="sa-carousel-prev"
              type="button"
              aria-label="Carte précédente"
              disabled={i === 0}
              onClick={() => setIndex(i - 1)}
            >
              ‹
            </button>
            <button
              className="sa-carousel-next"
              type="button"
              aria-label="Carte suivante"
              disabled={i === ad.medias.length - 1}
              onClick={() => setIndex(i + 1)}
            >
              ›
            </button>
            <span className="sa-card-count">
              {i + 1}/{ad.medias.length}
            </span>
          </>
        )}
        {safe && spec.safeZone && (
          <div className="sa-safe" aria-label="Zones sûres">
            <div
              style={{
                inset: `${spec.safeZone.top * 100}% ${spec.safeZone.right * 100}% ${spec.safeZone.bottom * 100}% ${spec.safeZone.left * 100}%`,
              }}
            />
          </div>
        )}
      </div>
      {carousel && (
        <div className="sa-card-caption">
          <strong>{media?.titre || ad.titre}</strong>
          <span>{media?.description || ad.description}</span>
          <div className="sa-card-dots">
            {ad.medias.map((_, n) => (
              <button
                type="button"
                aria-label={`Carte ${n + 1}`}
                aria-pressed={i === n}
                key={n}
                onClick={() => setIndex(n)}
              >
                ●
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function domain(ad: PreviewAd) {
  try {
    return (
      ad.lien_libelle ||
      (ad.destination_url ? new URL(ad.destination_url).hostname : "")
    );
  } catch {
    return "";
  }
}
function LinkCard({ ad, spec }: Pick<Props, "ad" | "spec">) {
  return (
    <div className="sa-link">
      <div>
        <small>{domain(ad)}</small>
        <strong>{(ad.titre || "").slice(0, spec.titreShown)}</strong>
        <span>
          {(ad.description || "").slice(0, spec.descriptionMax ?? Infinity)}
        </span>
      </div>
      {ad.cta && <span className="sa-native-cta">{ad.cta}</span>}
    </div>
  );
}
export function FeedPreview(props: Props) {
  const { ad, view, spec } = props;
  const ig = ad.plateforme === "instagram";
  const li = ad.plateforme === "linkedin";
  return (
    <article
      className={`sa-native sa-native-${ad.plateforme} sa-native-${view}`}
    >
      {view === "desktop" && (
        <div className="sa-platform-top">
          {ig ? "Instagram" : li ? "in" : "facebook"}
          <span>⌕ &nbsp; ◉ &nbsp; ☰</span>
        </div>
      )}
      <header className="sa-native-header">
        <Avatar ad={ad} />
        <div>
          <strong>{ig ? ad.marque_handle || name(ad) : name(ad)}</strong>
          <small>
            {li ? "Promu" : "Commandité"}
            {!ig && !li ? " · ◉" : ""}
          </small>
        </div>
        {li && <span className="sa-follow">+ Suivre</span>}
        <span className="sa-more">···</span>
      </header>
      {!ig && <Copy ad={ad} spec={spec} />}
      <Picture {...props} carousel={ad.type_media === "carrousel"} />
      {ig ? (
        <>
          <div className="sa-ig-cta">
            {ad.cta || "En savoir plus"}
            <span>›</span>
          </div>
          <div className="sa-ig-actions">
            <span>
              <NativeIcon kind="heart" />
              <NativeIcon kind="comment" />
              <NativeIcon kind="send" />
            </span>
            <span>
              <NativeIcon kind="bookmark" />
            </span>
          </div>
          <div className="sa-ig-caption">
            <strong>{ad.marque_handle || name(ad)}</strong>
            <Copy ad={ad} spec={spec} />
          </div>
        </>
      ) : (
        <>
          <LinkCard ad={ad} spec={spec} />
          <div className="sa-engagement">
            {li ? "● Vous et d’autres personnes" : "♡ Réactions"}
          </div>
          <div className="sa-native-actions">
            {(li
              ? ["J’aime", "Commenter", "Republier", "Envoyer"]
              : ["J’aime", "Commenter", "Partager"]
            ).map((a, i) => (
              <span key={a}>
                <NativeIcon
                  kind={
                    i === 0
                      ? "like"
                      : i === 1
                        ? "comment"
                        : i === 2 && li
                          ? "repeat"
                          : "send"
                  }
                />
                {a}
              </span>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
export function VerticalPreview(props: Props) {
  const { ad, spec } = props;
  const story = ad.placement === "stories";
  return (
    <article
      className={`sa-phone sa-phone-${ad.plateforme} sa-phone-${ad.placement}`}
    >
      <div className="sa-phone-status">
        <span>9:41</span>
        <span>▥ ▰</span>
      </div>
      <Picture {...props} />
      {story ? (
        <>
          <div className="sa-story-progress">
            <i />
            <i />
            <i />
          </div>
          <header className="sa-vertical-header">
            <Avatar ad={ad} />
            <div>
              <strong>{ad.marque_handle || name(ad)}</strong>
              <small>Commandité</small>
            </div>
            <span>··· ×</span>
          </header>
        </>
      ) : (
        <>
          <div className="sa-vertical-title">
            {ad.plateforme === "tiktok" ? "Abonnements | Pour toi" : "Reels"}
            <span>⌕</span>
          </div>
          <div className="sa-vertical-rail">
            <span>
              <NativeIcon kind="heart" />
            </span>
            <span>
              <NativeIcon kind="comment" />
            </span>
            <span>
              <NativeIcon kind="send" />
            </span>
            <span>···</span>
          </div>
        </>
      )}
      <div className="sa-vertical-caption">
        {!story && (
          <header>
            <Avatar ad={ad} />
            <strong>{ad.marque_handle || name(ad)}</strong>
          </header>
        )}
        <small>Commandité</small>
        <Copy ad={ad} spec={spec} />
        <span className="sa-vertical-cta">
          {ad.cta || "En savoir plus"} &nbsp; ›
        </span>
      </div>
      <div className="sa-phone-home" />
    </article>
  );
}
function YouTubeInStream(props: Props) {
  const [remaining, setRemaining] = useState(5);
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <article className={`sa-native sa-youtube sa-native-${props.view}`}>
      <div className="sa-platform-top">
        ▶ YouTube<span>⌕ &nbsp; ◉</span>
      </div>
      <div className="sa-yt-screen">
        <Picture {...props} />
        <span className="sa-yt-ad">Sponsorisé</span>
        <button type="button" className="sa-yt-skip" disabled={remaining > 0}>
          {remaining === 0
            ? "Passer l’annonce ▸│"
            : `Passer dans ${remaining} s ▸│`}
        </button>
        <div className="sa-yt-controls">
          ▶ &nbsp; ◖ &nbsp; ━━━━━━━━━ &nbsp; ⚙ &nbsp; ⛶
        </div>
      </div>
      <div className="sa-yt-info">
        <Avatar ad={props.ad} />
        <div>
          <strong>{props.ad.titre || name(props.ad)}</strong>
          <small>{name(props.ad)} · Sponsorisé</small>
        </div>
        <span className="sa-native-cta">
          {props.ad.cta || "En savoir plus"}
        </span>
      </div>
      <Copy ad={props.ad} spec={props.spec} />
    </article>
  );
}
function YouTubeInFeed(props: Props) {
  return (
    <article className={`sa-native sa-youtube sa-native-${props.view}`}>
      <div className="sa-platform-top">
        ▶ YouTube<span>⌕ &nbsp; ◉</span>
      </div>
      <Picture {...props} />
      <div className="sa-yt-info">
        <Avatar ad={props.ad} />
        <div>
          <strong>{props.ad.titre?.slice(0, props.spec.titreMax)}</strong>
          <small>Sponsorisé · {name(props.ad)}</small>
          <p>{props.ad.description?.slice(0, 90)}</p>
        </div>
        <span>···</span>
      </div>
      <LinkCard ad={props.ad} spec={props.spec} />
    </article>
  );
}
function YouTubeShorts(props: Props) {
  return (
    <article className="sa-phone sa-phone-youtube">
      <div className="sa-phone-status">
        <span>9:41</span>
        <span>▥ ▰</span>
      </div>
      <Picture {...props} />
      <div className="sa-vertical-title">
        Shorts<span>⌕</span>
      </div>
      <div className="sa-vertical-rail">
        <span>
          <NativeIcon kind="like" />
        </span>
        <span>
          <NativeIcon kind="comment" />
        </span>
        <span>
          <NativeIcon kind="send" />
        </span>
        <span>···</span>
      </div>
      <div className="sa-vertical-caption">
        <header>
          <Avatar ad={props.ad} />
          <strong>{props.ad.marque_handle || name(props.ad)}</strong>
        </header>
        <small>Sponsorisé</small>
        <p>{props.ad.description?.slice(0, 90)}</p>
        <span className="sa-vertical-cta">
          {props.ad.cta || "En savoir plus"} ›
        </span>
      </div>
      <div className="sa-phone-home" />
    </article>
  );
}
export function YouTubePreview(props: Props) {
  return props.ad.placement === "shorts" ? (
    <YouTubeShorts {...props} />
  ) : props.ad.placement === "in_stream" ? (
    <YouTubeInStream {...props} />
  ) : (
    <YouTubeInFeed {...props} />
  );
}
