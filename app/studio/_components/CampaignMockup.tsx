/* eslint-disable @next/next/no-img-element -- Préserver les créations originales et les GIF animés. */
"use client";
import { useEffect, useRef, useState } from "react";
import AdMockup from "@/app/decks/apercu/_components/AdMockup";
import { BRANDS } from "@/lib/campaign-decks/config";
import type { DeckVersion } from "@/lib/campaign-decks/types";
import type { Creative, StudioCampaign } from "@/lib/campaign-studio/types";
import Icon from "./Icon";
import s from "../studio.module.css";

function Youtube({
  campaign,
  creative,
}: {
  campaign: StudioCampaign;
  creative: Creative;
}) {
  const [playback, setPlayback] = useState<"paused" | "playing">("paused");
  const [progress, setProgress] = useState(0);
  const brand = BRANDS[campaign.brandId];
  useEffect(() => {
    if (playback !== "playing") return;
    const timer = setInterval(() => setProgress((p) => (p + 1) % 31), 1000);
    return () => clearInterval(timer);
  }, [playback]);
  return (
    <div className={s.youtubeMockup}>
      <div className={s.youtubeHeader}>
        <span className={s.youtubeLogo}>
          <span>▶</span>YouTube<sup>CA</sup>
        </span>
        <Icon name="search" size={17} />
      </div>
      <div className={s.youtubePlayer} style={{ background: brand.dark }}>
        <div className={s.youtubePoster}>
          <div>
            <span>{brand.name}</span>
            <strong>
              {progress < 15
                ? "Votre avenir commence ici."
                : "Venez découvrir votre collège."}
            </strong>
            <small>PORTES OUVERTES</small>
          </div>
          <div className={s.youtubeArt}>
            <img src={creative.image} alt={creative.name} />
          </div>
        </div>
        <span className={s.videoDemo}>Aperçu vidéo · simulation</span>
        <div className={s.videoControls}>
          <div className={s.videoTrack}>
            <span style={{ width: `${(progress / 30) * 100}%` }} />
          </div>
          <button
            type="button"
            onClick={() =>
              setPlayback(playback === "paused" ? "playing" : "paused")
            }
            aria-label={
              playback === "paused"
                ? "Lire la simulation vidéo"
                : "Mettre la simulation en pause"
            }
          >
            {playback === "paused" ? (
              <span>▶</span>
            ) : (
              <Icon name="pause" size={15} />
            )}
          </button>
          <Icon name="volume" size={14} />
          <span>0:{String(progress).padStart(2, "0")} / 0:30</span>
          <span className={s.videoAd}>Annonce</span>
        </div>
      </div>
      <div className={s.youtubeInfo}>
        <strong>
          {campaign.name} | {brand.pageName}
        </strong>
        <p className={s.youtubeCopy}>{creative.copy}</p>
        <div>
          <img src={brand.avatar} alt="" />
          <span>
            {brand.pageName}
            <small>Sponsorisé · {brand.domain}</small>
          </span>
          <span className={s.youtubeCta}>
            {creative.cta ?? "En savoir plus"}
          </span>
        </div>
      </div>
    </div>
  );
}

function DisplayMockup({ creative }: { creative: Creative }) {
  return (
    <div className={s.displayMockup}>
      <div className={s.browserBar}>
        <span />
        <span />
        <span />
        <small>journal.local / actualités</small>
      </div>
      <div className={s.newsHeader}>
        Le quotidien<span>ACTUALITÉS & CULTURE</span>
      </div>
      <div className={s.newsTabs}>
        À la une <span>Régions</span>
        <span>Éducation</span>
        <span>Culture</span>
      </div>
      <div className={s.displayBanner}>
        <span>PUBLICITÉ</span>
        <img src={creative.image} alt="Bannière publicitaire animée" />
      </div>
      <div className={s.newsArticle}>
        <div>
          <span>ÉDUCATION</span>
          <strong>Des parcours qui ouvrent de nouveaux horizons.</strong>
          <i />
          <i />
          <i />
        </div>
        <div className={s.newsPicture}>
          <Icon name="grid" size={38} />
        </div>
      </div>
    </div>
  );
}

function MetaMockup({
  campaign,
  creative,
  version,
}: {
  campaign: StudioCampaign;
  creative: Creative;
  version: DeckVersion;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ scale: 0.65, height: 510 });
  const format =
    creative.placement === "reel"
      ? "vertical"
      : creative.placement === "feed_portrait"
        ? "portrait"
        : "square";
  const width =
    format === "vertical"
      ? 468
      : format === "square"
        ? 460
        : creative.platform === "instagram"
          ? 420
          : 400;
  useEffect(() => {
    if (!frame.current || !inner.current) return;
    const update = () => {
      if (!frame.current || !inner.current) return;
      const scale = frame.current.clientWidth / width;
      setDimensions({ scale, height: inner.current.offsetHeight * scale });
    };
    const observer = new ResizeObserver(update);
    observer.observe(frame.current);
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div
      ref={frame}
      className={`${s.metaMockup} ${format === "vertical" ? s.verticalMockup : ""}`}
      style={{ height: dimensions.height }}
    >
      <div
        ref={inner}
        className={s.metaInner}
        style={{ width, transform: `scale(${dimensions.scale})` }}
      >
        <AdMockup
          channel={creative.platform === "instagram" ? "instagram" : "facebook"}
          format={format}
          brand={BRANDS[campaign.brandId]}
          version={version}
          defaultCta={creative.cta ?? "S’inscrire"}
          asset={{
            id: creative.id,
            url: creative.image,
            format,
            width: 1080,
            height:
              format === "vertical"
                ? 1920
                : format === "portrait"
                  ? 1350
                  : 1080,
            mime: "image/jpeg",
          }}
          copy={{
            primary: creative.copy,
            headline: "Un avenir à votre image",
            description: "Admissions ouvertes",
          }}
        />
      </div>
    </div>
  );
}

export default function CampaignMockup({
  campaign,
  creative,
  version = "copy",
}: {
  campaign: StudioCampaign;
  creative: Creative;
  version?: DeckVersion;
}) {
  if (creative.platform === "youtube")
    return (
      <Youtube key={creative.id} campaign={campaign} creative={creative} />
    );
  if (creative.platform === "display")
    return <DisplayMockup creative={creative} />;
  return (
    <MetaMockup campaign={campaign} creative={creative} version={version} />
  );
}
