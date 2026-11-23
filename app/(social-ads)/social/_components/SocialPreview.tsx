"use client";
import { useState } from "react";
import type { Ad } from "@/lib/social-ads/types";
import { PLATEFORME_LABEL } from "@/lib/social-ads/types";
import { getVariantSpec, variantOf } from "@/lib/social-ads/specs";
import {
  FeedPreview,
  VerticalPreview,
  YouTubePreview,
} from "./previews/PlacementPreviews";
export type PreviewAd = Pick<
  Ad,
  | "plateforme"
  | "format"
  | "ratio"
  | "marque_nom"
  | "marque_handle"
  | "marque_logo"
  | "texte_principal"
  | "titre"
  | "description"
  | "cta"
  | "lien_libelle"
  | "medias"
> &
  Partial<
    Pick<Ad, "placement" | "type_media" | "destination_url" | "variant_status">
  >;
export default function SocialPreview({
  ad,
  view: forcedView,
}: {
  ad: PreviewAd;
  view?: "desktop" | "mobile";
}) {
  const [view, setView] = useState<"desktop" | "mobile">("mobile");
  const [safe, setSafe] = useState(false);
  let variant;
  try {
    variant = variantOf(ad);
  } catch {
    return <p role="alert">Variante historique à vérifier dans l’éditeur.</p>;
  }
  const spec = getVariantSpec(variant);
  const effective = spec.views.includes(forcedView || view)
    ? forcedView || view
    : "mobile";
  const props = { ad: { ...ad, ...variant }, view: effective, safe, spec };
  const Renderer =
    variant.plateforme === "youtube"
      ? YouTubePreview
      : variant.placement === "feed"
        ? FeedPreview
        : VerticalPreview;
  return (
    <div className="sa-preview">
      <div className="sa-preview-controls">
        {!forcedView && spec.views.length > 1 ? (
          <div role="group" aria-label="Vue du mockup">
            {spec.views.map((v) => (
              <button
                type="button"
                aria-pressed={effective === v}
                key={v}
                onClick={() => setView(v)}
              >
                {v === "desktop" ? "Bureau" : "Mobile"}
              </button>
            ))}
          </div>
        ) : (
          <span>
            {spec.views.length === 1
              ? "Mobile uniquement"
              : forcedView === "desktop"
                ? "Bureau"
                : "Mobile"}
          </span>
        )}
        {spec.safeZone && (
          <label>
            <input
              type="checkbox"
              checked={safe}
              onChange={(e) => setSafe(e.target.checked)}
            />{" "}
            Zones sûres
          </label>
        )}
      </div>
      <div className={`sa-stage sa-stage-${effective}`}>
        <Renderer {...props} />
      </div>
      <p className="sap-spec-note">
        {PLATEFORME_LABEL[ad.plateforme]} ·{" "}
        {variant.placement.replace(/_/g, " ")} · {variant.type_media} ·{" "}
        {ad.ratio} · {spec.resolution}
      </p>
    </div>
  );
}
