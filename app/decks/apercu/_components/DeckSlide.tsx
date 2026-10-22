/* eslint-disable @next/next/no-img-element -- Conserver les créations et GIF sans optimisation. */
import { BRANDS, CHANNEL_LABELS, FORMATS } from "@/lib/campaign-decks/config";
import type {
  DeckCampaign,
  DeckSlide as Slide,
  DeckVersion,
  DisplayFormat,
} from "@/lib/campaign-decks/types";
import AdMockup, { cleanText } from "./AdMockup";
import styles from "../deck.module.css";
import type { CSSProperties } from "react";

const BANNER_POSITIONS: Record<DisplayFormat, { left: number; top: number }> = {
  billboard: { left: 0, top: 0 },
  leaderboard: { left: 0, top: 298 },
  rectangle: { left: 0, top: 436 },
  mobile: { left: 348, top: 436 },
  skyscraper: { left: 1034, top: 0 },
};

export default function DeckSlide({
  slide,
  campaign,
  version,
}: {
  slide: Slide;
  campaign: DeckCampaign;
  version: DeckVersion;
}) {
  const brand = BRANDS[campaign.brandId];
  const palette = {
    "--deck-dark": brand.dark,
    "--deck-accent": brand.accent,
    "--deck-on-accent": brand.onAccent,
  } as CSSProperties;
  if (slide.kind === "cover")
    return (
      <section
        className={`${styles.slide} ${styles.cover}`}
        style={palette}
        aria-label="Couverture"
        data-slide-kind="cover"
      >
        <img
          src={brand.logo}
          alt={brand.pageName}
          className={styles.coverLogo}
          width={300}
          height={150}
        />
        <h1>{cleanText(campaign.title)}</h1>
        <p>{cleanText(campaign.subtitle)}</p>
      </section>
    );
  if (slide.kind === "divider")
    return (
      <section
        className={`${styles.slide} ${styles.divider}`}
        style={palette}
        aria-label={CHANNEL_LABELS[slide.channel]}
        data-slide-kind="divider"
      >
        <h2>{CHANNEL_LABELS[slide.channel]}</h2>
      </section>
    );

  return (
    <section
      className={`${styles.slide} ${styles.content}`}
      style={palette}
      aria-label={`${CHANNEL_LABELS[slide.channel]} ${cleanText(slide.theme.name)}`}
      data-slide-kind="content"
    >
      <h2 className={styles.slideTitle}>
        <span>{CHANNEL_LABELS[slide.channel]}</span>
        {"  "}
        {cleanText(slide.theme.name)}
      </h2>
      {slide.channel === "display" ? (
        <div className={styles.bannerArea}>
          <div className={styles.bannerLayout}>
            {FORMATS.filter((f) => f.channel === "display").map((f) => {
              const asset = slide.theme.assets.find((a) => a.format === f.id);
              return (
                <div
                  key={f.id}
                  className={styles.banner}
                  style={{
                    ...BANNER_POSITIONS[f.id],
                    width: f.width,
                    height: f.height,
                  }}
                  data-banner={f.id}
                >
                  {asset ? (
                    <img
                      src={asset.url}
                      alt={`Bannière ${f.label}`}
                      width={f.width}
                      height={f.height}
                    />
                  ) : (
                    <span>Visuel {f.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.metaLayout}>
          {(["square", "portrait", "vertical"] as const).map((format) => (
            <AdMockup
              key={format}
              channel={slide.channel as "facebook" | "instagram"}
              format={format}
              brand={brand}
              version={version}
              defaultCta={campaign.cta}
              asset={slide.theme.assets.find((a) => a.format === format)}
              copy={
                slide.theme.copy[
                  `${slide.channel as "facebook" | "instagram"}:${format}`
                ]
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
