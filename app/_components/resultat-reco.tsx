import type { ComponentType } from "react";
import { CIBLE_LABEL, type Plateforme } from "@/lib/enums";
import { eur, kvues, niveauConfiance, pct } from "@/lib/format";
import type { Recommandation } from "@/lib/types";
import { IconAlert, IconFacebook, IconSearch, IconTarget, IconTikTok, IconYouTube } from "./icons";

const PLATFORM_ICON: Record<Plateforme, ComponentType<{ className?: string }>> = {
  Meta: IconFacebook,
  TikTok: IconTikTok,
  "Google Ads": IconSearch,
  "YouTube Ads": IconYouTube,
};

type Prec = { mot: "Précision" | "Confiance"; ratio: number };
type KpiDesc = { key: string; label: string; value: string; prec: Prec };

// KPI épurés : taux → audience → probabilité (conversions retiré).
// Chaque KPI porte sa propre précision : régression → R², classification → AUC.
// Audience n'a pas de modèle (dérivée) → on retombe sur la confiance de l'estimation.
function kpisFor(reco: Recommandation): KpiDesc[] {
  const taux: KpiDesc = {
    key: "taux",
    label: "Taux de conversion",
    value: pct(reco.tauxConversion.value),
    prec: reco.meta
      ? { mot: "Précision", ratio: reco.meta.metrics.taux.r2 }
      : { mot: "Confiance", ratio: reco.tauxConversion.confiance },
  };
  const audience: KpiDesc = {
    key: "aud",
    label: "Audience",
    value: kvues(reco.audienceK.value),
    prec: { mot: "Confiance", ratio: reco.audienceK.confiance },
  };
  const kpis: KpiDesc[] = [taux, audience];
  if (reco.pObjectif) {
    kpis.push({
      key: "proba",
      label: "Probabilité d'atteinte de l'objectif",
      value: pct(reco.pObjectif.value),
      prec: reco.meta
        ? { mot: "Précision", ratio: reco.meta.metrics.objectif.auc }
        : { mot: "Confiance", ratio: reco.pObjectif.confiance },
    });
  }
  return kpis;
}

function precLine(p: Prec): string {
  return `${p.mot} ${pct(p.ratio)}`;
}

// Pilule de précision : 3 paliers sémantiques (faible=rouge, moyen=ambre, élevé=vert),
// fond opaque clair + texte foncé même teinte -> lisible sur héros graphite ET fond clair.
// L'info n'est jamais portée par la couleur seule : le % + le libellé restent dans la pilule.
function precPill(ratio: number): { background: string; color: string } {
  const niveau = niveauConfiance(ratio);
  if (niveau === "faible") return { background: "oklch(0.94 0.045 25)", color: "oklch(0.47 0.16 25)" };
  if (niveau === "moyen") return { background: "oklch(0.94 0.06 75)", color: "oklch(0.46 0.12 75)" };
  return { background: "oklch(0.93 0.06 150)", color: "oklch(0.43 0.13 150)" };
}

// Glyphe de forme distincte par palier (redondance non-colorée, lisible en daltonisme).
function precGlyph(ratio: number): string {
  const niveau = niveauConfiance(ratio);
  if (niveau === "faible") return "▼";
  if (niveau === "moyen") return "◆";
  return "▲";
}

function PrecPill({ mot, ratio }: Prec) {
  return (
    <span className="prec-pill" style={precPill(ratio)}>
      <span className="prec-glyph" aria-hidden>
        {precGlyph(ratio)}
      </span>
      {precLine({ mot, ratio })}
    </span>
  );
}

const BUT: Record<Recommandation["objectifPrincipal"], string> = {
  notoriete: "pour maximiser l'audience",
  conversion: "pour maximiser les conversions",
};

function rationale(reco: Recommandation): string {
  const n = reco.placements.length;
  const plateformes = new Set(reco.placements.map((p) => p.plateforme)).size;
  const but =
    reco.mode === "taux"
      ? "pour atteindre votre taux de conversion au meilleur coût"
      : reco.mode === "goal"
        ? "pour atteindre votre objectif au meilleur coût"
        : BUT[reco.objectifPrincipal];
  return `${n} placement${n > 1 ? "s" : ""} sur ${plateformes} plateforme${plateformes > 1 ? "s" : ""}, ${but}.`;
}

export function ResultatReco({ reco }: { reco: Recommandation }) {
  const hasPlan = reco.placements.length > 0;
  const kpis = kpisFor(reco);

  const cadre =
    reco.mode === "taux"
      ? "Pour atteindre votre taux cible."
      : reco.mode === "goal"
        ? "Pour atteindre votre objectif."
        : "Dans votre budget.";

  return (
    <div className="reco">
      {reco.statut !== "ok" && reco.message ? (
        <div className={`notice ${reco.statut === "infaisable" ? "notice-danger" : "notice-warn"}`}>
          <IconAlert />
          <span>{reco.message}</span>
        </div>
      ) : null}

      {hasPlan ? (
        <>
          {/* Niveau 1 : la réponse — le prix, pilier central */}
          <section className="answer" aria-label="Résultat de la campagne idéale">
            <p className="answer-eyebrow">{cadre}</p>
            <div className="answer-hero">
              <div className="answer-label">Vous payez</div>
              <div className="answer-price">{eur(reco.budgetTotal)}</div>
              {reco.meta ? (
                <div className="answer-precision">
                  <PrecPill mot="Précision" ratio={reco.meta.metrics.prix.r2} />
                </div>
              ) : null}
            </div>
          </section>

          {/* Niveau 2 : KPI épurés — chacun porte sa propre précision */}
          <section className="metrics-sec" aria-label="Indicateurs estimés">
            {kpis.map((k) => (
              <div className="metric-sec" key={k.key}>
                <div className="ms-label">{k.label}</div>
                <div className="ms-value">{k.value}</div>
                <div className="ms-meta">
                  <PrecPill mot={k.prec.mot} ratio={k.prec.ratio} />
                </div>
              </div>
            ))}
          </section>

          <p className="muted reco-disclaimer">
            Taux de conversion et audience estimés à partir de campagnes comparables. Valeurs illustratives.
          </p>

          {/* Niveau 2 : le raisonnement */}
          <section className="panel reasoning">
            <h2>Pourquoi cette campagne</h2>
            <p className="muted reasoning-lead">{rationale(reco)}</p>
            <div className="placements">
              {reco.placements.map((p) => {
                const PlatIcon = PLATFORM_ICON[p.plateforme];
                return (
                  <div className="placement" key={`${p.plateforme}-${p.typePub}-${p.cible}`}>
                    <div>
                      <div className="p-main" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <PlatIcon /> {p.plateforme}
                      </div>
                      <div className="p-tags">
                        <span className="tag">{p.typePub}</span>
                        <span className="tag" aria-label={`Cible : ${CIBLE_LABEL[p.cible]}`}>
                          <IconTarget /> {CIBLE_LABEL[p.cible]}
                        </span>
                      </div>
                    </div>
                    <div className="p-cost">
                      <div className="big">{eur(p.prix)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {pct(p.tauxConversion)} de conversion
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
