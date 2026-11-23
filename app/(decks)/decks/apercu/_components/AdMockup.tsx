/* eslint-disable @next/next/no-img-element -- Les GIF et les créations doivent rester servis tels quels. */
import type {
  AdCopy,
  Brand,
  DeckAsset,
  DeckVersion,
  MetaFormat,
} from "@/lib/campaign-decks/types";
import styles from "../deck.module.css";

export const cleanText = (text: string) => text.replace(/\u2014/g, "-");

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <span
      className={styles.skeleton}
      data-skeleton="true"
      aria-label="Texte à venir"
    >
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} style={{ width: ["100%", "92%", "60%"][i % 3] }} />
      ))}
    </span>
  );
}

function Copy({
  text,
  version,
  lines = 3,
}: {
  text?: string;
  version: DeckVersion;
  lines?: number;
}) {
  return version === "copy" && text?.trim() ? (
    cleanText(text)
  ) : (
    <Skeleton lines={lines} />
  );
}

function Profile({ brand }: { brand: Brand }) {
  return (
    <div className={styles.profile}>
      <img
        className={styles.avatar}
        src={brand.avatar}
        alt=""
        width={48}
        height={48}
      />
      <div>
        <strong>{cleanText(brand.pageName)}</strong>
        <span>Sponsorisé</span>
      </div>
    </div>
  );
}

function Creative({
  asset,
  format,
}: {
  asset?: DeckAsset;
  format: MetaFormat;
}) {
  const label = { square: "1:1", portrait: "4:5", vertical: "9:16" }[format];
  return (
    <div
      className={styles.creative}
      style={{
        aspectRatio: { square: "1", portrait: "4 / 5", vertical: "9 / 16" }[
          format
        ],
      }}
    >
      {asset ? (
        <img
          src={asset.url}
          alt={`Création ${label}`}
          width={asset.width}
          height={asset.height}
        />
      ) : (
        <span>Visuel {label}</span>
      )}
    </div>
  );
}

interface Props {
  channel: "facebook" | "instagram";
  format: MetaFormat;
  brand: Brand;
  asset?: DeckAsset;
  copy?: AdCopy;
  version: DeckVersion;
  defaultCta: string;
}

export default function AdMockup({
  channel,
  format,
  brand,
  asset,
  copy = {},
  version,
  defaultCta,
}: Props) {
  const cta = cleanText(copy.cta?.trim() || defaultCta);
  const instagram = channel === "instagram";
  const width =
    format === "vertical"
      ? 468
      : format === "square"
        ? 460
        : instagram
          ? 420
          : 400;
  if (format === "vertical")
    return (
      <article
        className={`${styles.reel} ${instagram ? styles.instagram : styles.facebook}`}
        data-mockup={`${channel}:${format}`}
        style={{ width }}
      >
        <Creative asset={asset} format={format} />
        <div className={styles.reelShade} />
        <Profile brand={brand} />
        <div className={styles.reelBottom}>
          <div className={styles.reelCopy}>
            <Copy text={copy.primary} version={version} />
          </div>
          <div className={styles.reelCta}>
            {cta}
            {instagram && <span aria-hidden="true">›</span>}
          </div>
        </div>
      </article>
    );

  return (
    <article
      className={`${styles.feed} ${instagram ? styles.instagram : styles.facebook}`}
      data-mockup={`${channel}:${format}`}
      style={{ width }}
    >
      <Profile brand={brand} />
      {!instagram && (
        <div className={styles.primaryCopy}>
          <div className={styles.copyLines}>
            <Copy text={copy.primary} version={version} />
          </div>
        </div>
      )}
      <Creative asset={asset} format={format} />
      {instagram ? (
        <>
          <div className={styles.instagramCta}>
            {cta}
            <span aria-hidden="true">›</span>
          </div>
          <div className={styles.caption}>
            <div className={styles.copyLines}>
              {version === "copy" && copy.primary?.trim() ? (
                <>
                  <strong>{cleanText(brand.pageName)}</strong>{" "}
                  {cleanText(copy.primary)}
                </>
              ) : (
                <Skeleton />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.linkBar}>
          <div className={styles.linkCopy}>
            <span className={styles.domain}>{brand.domain}</span>
            <div className={styles.headline}>
              <Copy text={copy.headline} version={version} lines={1} />
            </div>
            <div className={styles.description}>
              <Copy text={copy.description} version={version} lines={1} />
            </div>
          </div>
          <span className={styles.feedCta}>{cta}</span>
        </div>
      )}
    </article>
  );
}
