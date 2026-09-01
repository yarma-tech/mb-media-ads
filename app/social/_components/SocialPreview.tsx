"use client";

// Mockup fidèle d'une annonce selon plateforme × format × ratio.
// Applique les specs officielles : ratio d'image exact, troncature « Voir plus »
// au bon seuil, coupe dure et overlay « safe zone » sur les formats verticaux.
import { useState } from "react";
import {
  getSpec,
  RATIO_VALUE,
  tronquer,
  type Ad,
  type FormatSpec,
  type Media,
  type Plateforme,
} from "@/lib/social-ads/types";

type PreviewAd = Pick<
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
>;

function Avatar({ nom, logo }: { nom: string; logo: string | null }) {
  if (logo) return <img className="sap-avatar" src={logo} alt="" />;
  const initiale = (nom || "?").trim().charAt(0).toUpperCase();
  return <div className="sap-avatar sap-avatar-fallback">{initiale}</div>;
}

// Corps de texte avec troncature réaliste selon la spec.
function Body({
  texte,
  spec,
  className,
  prefix,
}: {
  texte: string | null;
  spec: FormatSpec;
  className?: string;
  prefix?: React.ReactNode;
}) {
  if (!texte) return null;
  if (spec.texteHard) {
    const coupe = texte.length > spec.texteMax;
    return (
      <p className={className}>
        {prefix}
        {texte.slice(0, spec.texteMax)}
        {coupe ? "…" : ""}
      </p>
    );
  }
  const { visible, coupe } = tronquer(texte, spec.texteShown);
  return (
    <p className={className}>
      {prefix}
      {visible}
      {coupe ? (
        <>
          … <span className="sap-voirplus">Voir plus</span>
        </>
      ) : null}
    </p>
  );
}

function MediaView({
  medias,
  ratioValue,
  safeZone,
  showSafe,
}: {
  medias: Media[];
  ratioValue: number;
  safeZone?: FormatSpec["safeZone"];
  showSafe?: boolean;
}) {
  const [i, setI] = useState(0);
  const style = { aspectRatio: String(ratioValue) };
  const overlay =
    showSafe && safeZone ? (
      <div className="sap-safe">
        <div className="sap-safe-band" style={{ top: 0, height: `${safeZone.top * 100}%` }} />
        <div className="sap-safe-band" style={{ bottom: 0, height: `${safeZone.bottom * 100}%` }} />
        {safeZone.right ? (
          <div
            className="sap-safe-band"
            style={{ top: 0, bottom: 0, right: 0, width: `${safeZone.right * 100}%`, height: "auto" }}
          />
        ) : null}
        <span className="sap-safe-tag">Zone sûre</span>
      </div>
    ) : null;

  if (!medias.length) {
    return (
      <div className="sap-media sap-media-empty" style={style}>
        <span>Aucun média</span>
        {overlay}
      </div>
    );
  }
  const m = medias[Math.min(i, medias.length - 1)];
  return (
    <div className="sap-media" style={style}>
      {m.type === "video" ? <video src={m.url} controls playsInline /> : <img src={m.url} alt="" />}
      {medias.length > 1 ? (
        <>
          <div className="sap-carousel-dots">
            {medias.map((_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Visuel ${k + 1}`}
                className={k === i ? "on" : ""}
                onClick={() => setI(k)}
              />
            ))}
          </div>
          <span className="sap-carousel-count">
            {Math.min(i, medias.length - 1) + 1}/{medias.length}
          </span>
        </>
      ) : null}
      {overlay}
    </div>
  );
}

function Cta({ label }: { label: string | null }) {
  if (!label) return null;
  return <span className="sap-cta-btn">{label}</span>;
}

function Titre({ texte, spec }: { texte: string | null; spec: FormatSpec }) {
  if (!texte) return null;
  const coupe = spec.titreHard && texte.length > spec.titreMax;
  return <strong>{coupe ? texte.slice(0, spec.titreMax) + "…" : texte}</strong>;
}

const marque = (ad: PreviewAd) => ad.marque_nom || "Votre marque";

type RenderCtx = { ad: PreviewAd; spec: FormatSpec; ratioValue: number; showSafe: boolean };

// ---- Facebook -------------------------------------------------------------
function Facebook({ ad, spec, ratioValue, showSafe }: RenderCtx) {
  return (
    <div className="sap-card sap-fb">
      <div className="sap-head">
        <Avatar nom={marque(ad)} logo={ad.marque_logo} />
        <div className="sap-head-txt">
          <strong>{marque(ad)}</strong>
          <span className="sap-sub">Sponsorisé · 🌐</span>
        </div>
        <span className="sap-dots">···</span>
      </div>
      <Body texte={ad.texte_principal} spec={spec} className="sap-body" />
      <MediaView medias={ad.medias} ratioValue={ratioValue} safeZone={spec.safeZone} showSafe={showSafe} />
      {(ad.titre || ad.description || ad.cta) && (
        <div className="sap-linkbar">
          <div className="sap-linkbar-txt">
            {ad.lien_libelle ? <span className="sap-domain">{ad.lien_libelle}</span> : null}
            <Titre texte={ad.titre} spec={spec} />
            {ad.description ? <span className="sap-desc">{ad.description}</span> : null}
          </div>
          <Cta label={ad.cta} />
        </div>
      )}
      <div className="sap-actions">
        <span>👍 J’aime</span>
        <span>💬 Commenter</span>
        <span>↗ Partager</span>
      </div>
    </div>
  );
}

// ---- Instagram ------------------------------------------------------------
function Instagram({ ad, spec, ratioValue, showSafe }: RenderCtx) {
  const vertical = ad.format === "story" || ad.format === "reel";
  if (vertical) {
    return (
      <div className="sap-card sap-ig-story">
        <MediaView medias={ad.medias} ratioValue={ratioValue} safeZone={spec.safeZone} showSafe={showSafe} />
        <div className="sap-story-top">
          <Avatar nom={marque(ad)} logo={ad.marque_logo} />
          <span>{ad.marque_handle || marque(ad)}</span>
          <span className="sap-sub">Sponsorisé</span>
        </div>
        <Body texte={ad.texte_principal} spec={spec} className="sap-story-caption" />
        {ad.cta ? <div className="sap-story-cta">⌃ {ad.cta}</div> : null}
      </div>
    );
  }
  return (
    <div className="sap-card sap-ig">
      <div className="sap-head">
        <Avatar nom={marque(ad)} logo={ad.marque_logo} />
        <div className="sap-head-txt">
          <strong>{ad.marque_handle || marque(ad)}</strong>
          <span className="sap-sub">Sponsorisé</span>
        </div>
        <span className="sap-dots">···</span>
      </div>
      <MediaView medias={ad.medias} ratioValue={ratioValue} safeZone={spec.safeZone} showSafe={showSafe} />
      {ad.cta ? <div className="sap-ig-ctabar">{ad.cta} ›</div> : null}
      <div className="sap-actions sap-ig-actions">
        <span>♥</span>
        <span>💬</span>
        <span>➤</span>
      </div>
      <Body
        texte={ad.texte_principal}
        spec={spec}
        className="sap-body"
        prefix={<strong>{ad.marque_handle || marque(ad)} </strong>}
      />
    </div>
  );
}

// ---- LinkedIn -------------------------------------------------------------
function Linkedin({ ad, spec, ratioValue, showSafe }: RenderCtx) {
  return (
    <div className="sap-card sap-li">
      <div className="sap-head">
        <Avatar nom={marque(ad)} logo={ad.marque_logo} />
        <div className="sap-head-txt">
          <strong>{marque(ad)}</strong>
          <span className="sap-sub">Sponsorisé</span>
        </div>
        <span className="sap-dots">···</span>
      </div>
      <Body texte={ad.texte_principal} spec={spec} className="sap-body" />
      <MediaView medias={ad.medias} ratioValue={ratioValue} safeZone={spec.safeZone} showSafe={showSafe} />
      {(ad.titre || ad.cta) && (
        <div className="sap-linkbar sap-li-linkbar">
          <div className="sap-linkbar-txt">
            <Titre texte={ad.titre} spec={spec} />
            {ad.lien_libelle ? <span className="sap-domain">{ad.lien_libelle}</span> : null}
          </div>
          <Cta label={ad.cta} />
        </div>
      )}
      <div className="sap-actions">
        <span>👍 J’aime</span>
        <span>💬 Commenter</span>
        <span>🔁 Republier</span>
      </div>
    </div>
  );
}

// ---- TikTok ---------------------------------------------------------------
function Tiktok({ ad, spec, ratioValue, showSafe }: RenderCtx) {
  return (
    <div className="sap-card sap-tt">
      <MediaView medias={ad.medias} ratioValue={ratioValue} safeZone={spec.safeZone} showSafe={showSafe} />
      <div className="sap-tt-overlay">
        <div className="sap-tt-meta">
          <strong>{ad.marque_handle || marque(ad)}</strong>
          <span className="sap-sub">Sponsorisé</span>
          <Body texte={ad.texte_principal} spec={spec} />
        </div>
        {ad.cta ? <div className="sap-tt-cta">{ad.cta}</div> : null}
      </div>
      <div className="sap-tt-rail">
        <span>♥</span>
        <span>💬</span>
        <span>➤</span>
      </div>
    </div>
  );
}

const RENDERERS: Record<Plateforme, (c: RenderCtx) => React.ReactNode> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Tiktok,
};

export default function SocialPreview({ ad }: { ad: PreviewAd }) {
  const [showSafe, setShowSafe] = useState(false);
  const spec = getSpec(ad.plateforme, ad.format);
  const ratioValue = RATIO_VALUE[ad.ratio] ?? 1;
  const Renderer = RENDERERS[ad.plateforme] ?? Facebook;
  return (
    <div className="sap-previewwrap">
      {spec.safeZone ? (
        <label className="sap-safe-toggle">
          <input type="checkbox" checked={showSafe} onChange={(e) => setShowSafe(e.target.checked)} />
          Afficher la zone sûre
        </label>
      ) : null}
      <div className="sap-frame">{Renderer({ ad, spec, ratioValue, showSafe })}</div>
      <p className="sap-spec-note">
        {ad.ratio} · {spec.resolution}
      </p>
    </div>
  );
}
