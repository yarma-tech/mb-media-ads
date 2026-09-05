"use client";

// Panneau « Rédaction assistée » : appelle /api/social/copy et propose des
// variations que l'on applique à l'annonce en un clic.
import { useState } from "react";
import type { CopyVariation } from "@/lib/social-ads/copy";
import type { Format, Plateforme } from "@/lib/social-ads/types";
import { PLATEFORME_LABEL } from "@/lib/social-ads/types";

const OBJECTIFS = ["Notoriété", "Trafic", "Conversion", "Génération de leads", "Engagement"];

export default function CopyAssistant({
  plateforme,
  format,
  marque,
  onApply,
}: {
  plateforme: Plateforme;
  format: Format;
  marque: string;
  onApply: (v: CopyVariation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [objectif, setObjectif] = useState(OBJECTIFS[0]);
  const [ton, setTon] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [variations, setVariations] = useState<CopyVariation[]>([]);

  async function generer() {
    setLoading(true);
    setErreur(null);
    setVariations([]);
    try {
      const res = await fetch("/api/social/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plateforme, format, objectif, ton, marque, brief, nbVariations: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération.");
      setVariations(data.variations ?? []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost sap-ai-toggle" onClick={() => setOpen(true)}>
        ✨ Rédiger avec l’IA
      </button>
    );
  }

  return (
    <div className="sap-ai">
      <div className="sap-ai-head">
        <strong>✨ Rédaction assistée — {PLATEFORME_LABEL[plateforme]}</strong>
        <button type="button" className="navlink" onClick={() => setOpen(false)}>
          Fermer
        </button>
      </div>
      <div className="sap-field-row">
        <label className="sap-field">
          <span>Objectif</span>
          <select value={objectif} onChange={(e) => setObjectif(e.target.value)}>
            {OBJECTIFS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label className="sap-field">
          <span>Ton (optionnel)</span>
          <input value={ton} onChange={(e) => setTon(e.target.value)} placeholder="dynamique, premium…" />
        </label>
      </div>
      <label className="sap-field">
        <span>Brief — produit, offre, message clé</span>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder="Ex. Lancement d'une nouvelle gamme de baskets éco-conçues, -20% la première semaine, cible 18-30 ans."
        />
      </label>
      <button type="button" className="btn btn-primary" disabled={loading || !brief.trim()} onClick={generer}>
        {loading ? "Génération…" : "Générer 3 variations"}
      </button>
      {erreur ? <p className="sap-error">{erreur}</p> : null}

      {variations.length > 0 ? (
        <div className="sap-variations">
          {variations.map((v, i) => (
            <div key={i} className="sap-variation">
              <div className="sap-variation-txt">
                <p className="sap-variation-main">{v.texte_principal}</p>
                {v.titre ? <p className="sap-variation-title">{v.titre}</p> : null}
                {v.hashtags.length ? <p className="sap-variation-tags">{v.hashtags.join(" ")}</p> : null}
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => onApply(v)}>
                Appliquer
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
