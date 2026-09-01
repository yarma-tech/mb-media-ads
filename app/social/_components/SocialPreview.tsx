"use client";

// Mockup fidèle d'une annonce selon sa plateforme et son format.
// Purement présentationnel : réutilisé dans l'éditeur (owner) et la page publique.
import { useState } from "react";
import type { Ad, Media, Plateforme } from "@/lib/social-ads/types";

type PreviewAd = Pick<
  Ad,
  | "plateforme"
  | "format"
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

function MediaView({ medias, vertical }: { medias: Media[]; vertical?: boolean }) {
  const [i, setI] = useState(0);
  if (!medias.length) {
    return (
      <div className={`sap-media sap-media-empty ${vertical ? "sap-media-vertical" : ""}`}>
        <span>Aucun média</span>
      </div>
    );
  }
  const m = medias[Math.min(i, medias.length - 1)];
  return (
    <div className={`sap-media ${vertical ? "sap-media-vertical" : ""}`}>
      {m.type === "video" ? (
        <video src={m.url} controls playsInline />
      ) : (
        <img src={m.url} alt="" />
      )}
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
    </div>
  );
}

function Cta({ label }: { label: string | null }) {
  if (!label) return null;
  return <span className="sap-cta-btn">{label}</span>;
}

const marque = (ad: PreviewAd) => ad.marque_nom || "Votre marque";

// ---- Facebook -------------------------------------------------------------
function Facebook({ ad }: { ad: PreviewAd }) {
  const vertical = ad.format === "story";
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
      {ad.texte_principal ? <p className="sap-body">{ad.texte_principal}</p> : null}
      <MediaView medias={ad.medias} vertical={vertical} />
      {(ad.titre || ad.description || ad.cta) && (
        <div className="sap-linkbar">
          <div className="sap-linkbar-txt">
            {ad.lien_libelle ? <span className="sap-domain">{ad.lien_libelle}</span> : null}
            {ad.titre ? <strong>{ad.titre}</strong> : null}
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
function Instagram({ ad }: { ad: PreviewAd }) {
  const vertical = ad.format === "story" || ad.format === "reel";
  if (vertical) {
    return (
      <div className="sap-card sap-ig-story">
        <MediaView medias={ad.medias} vertical />
        <div className="sap-story-top">
          <Avatar nom={marque(ad)} logo={ad.marque_logo} />
          <span>{ad.marque_handle || marque(ad)}</span>
          <span className="sap-sub">Sponsorisé</span>
        </div>
        {ad.texte_principal ? <p className="sap-story-caption">{ad.texte_principal}</p> : null}
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
      <MediaView medias={ad.medias} />
      {ad.cta ? <div className="sap-ig-ctabar">{ad.cta} ›</div> : null}
      <div className="sap-actions sap-ig-actions">
        <span>♥</span>
        <span>💬</span>
        <span>➤</span>
      </div>
      {ad.texte_principal ? (
        <p className="sap-body">
          <strong>{ad.marque_handle || marque(ad)}</strong> {ad.texte_principal}
        </p>
      ) : null}
    </div>
  );
}

// ---- LinkedIn -------------------------------------------------------------
function Linkedin({ ad }: { ad: PreviewAd }) {
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
      {ad.texte_principal ? <p className="sap-body">{ad.texte_principal}</p> : null}
      <MediaView medias={ad.medias} />
      {(ad.titre || ad.cta) && (
        <div className="sap-linkbar sap-li-linkbar">
          <div className="sap-linkbar-txt">
            {ad.titre ? <strong>{ad.titre}</strong> : null}
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
function Tiktok({ ad }: { ad: PreviewAd }) {
  return (
    <div className="sap-card sap-tt">
      <MediaView medias={ad.medias} vertical />
      <div className="sap-tt-overlay">
        <div className="sap-tt-meta">
          <strong>{ad.marque_handle || marque(ad)}</strong>
          <span className="sap-sub">Sponsorisé</span>
          {ad.texte_principal ? <p>{ad.texte_principal}</p> : null}
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

const RENDERERS: Record<Plateforme, (p: { ad: PreviewAd }) => React.ReactNode> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Tiktok,
};

export default function SocialPreview({ ad }: { ad: PreviewAd }) {
  const Renderer = RENDERERS[ad.plateforme] ?? Facebook;
  return <div className="sap-frame">{Renderer({ ad })}</div>;
}
