import type { ComponentType } from "react";
import { CIBLE_LABEL, type Plateforme } from "@/lib/enums";
import { eur, kvues, niveauConfiance, num, pct } from "@/lib/format";
import type { Estimation, Recommandation } from "@/lib/types";
import { IconAlert, IconFacebook, IconSearch, IconTarget, IconTikTok, IconYouTube } from "./icons";

const PLATFORM_ICON: Record<Plateforme, ComponentType<{ className?: string }>> = {
  Meta: IconFacebook,
  TikTok: IconTikTok,
  "Google Ads": IconSearch,
  "YouTube Ads": IconYouTube,
};

type MetricDesc = { key: string; label: string; est: Estimation; fmt: (v: number) => string };

function metricsFor(reco: Recommandation): MetricDesc[] {
  const A: MetricDesc = { key: "aud", label: "Audience", est: reco.audienceK, fmt: kvues };
  const T: MetricDesc = { key: "taux", label: "Taux de conversion", est: reco.tauxConversion, fmt: pct };
  const C: MetricDesc = { key: "conv", label: "Conversions", est: reco.conversions, fmt: (v) => num(v) };
  if (reco.objectifPrincipal === "notoriete") return [A, T, C];
  return [T, C, A];
}

const BUT: Record<Recommandation["objectifPrincipal"], string> = {
  notoriete: "pour maximiser l'audience",
  conversion: "pour maximiser les conversions",
};

function rationale(reco: Recommandation): string {
  const n = reco.placements.length;
  const plateformes = new Set(reco.placements.map((p) => p.plateforme)).size;
  const but = reco.mode === "goal" ? "pour atteindre votre objectif au meilleur coût" : BUT[reco.objectifPrincipal];
  return `${n} placement${n > 1 ? "s" : ""} sur ${plateformes} plateforme${plateformes > 1 ? "s" : ""}, ${but}.`;
}

function ConfBar({ c }: { c: number }) {
  return (
    <div className="conf">
      <div className="conf-head">
        <span className="conf-label">Confiance : {niveauConfiance(c)}</span>
        <span className="mono">{pct(c)}</span>
      </div>
      <div className="conf-bar" role="img" aria-label={`Confiance ${pct(c)} (${niveauConfiance(c)})`}>
        <span style={{ width: pct(c) }} />
      </div>
    </div>
  );
}

export function ResultatReco({ reco }: { reco: Recommandation }) {
  const metrics = metricsFor(reco);
  const hasPlan = reco.placements.length > 0;
  const primary = metrics[0];
  const secondary = metrics.slice(1);

  const cadre = reco.mode === "goal" ? "Pour atteindre votre objectif." : "Dans votre budget.";

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
          {/* Niveau 1 : la réponse (vous obtenez / vous payez) */}
          <section className="answer" aria-label="Résultat de la campagne idéale">
            <p className="answer-eyebrow">{cadre}</p>
            <div className="answer-grid">
              <div className="answer-side">
                <div className="answer-label">Vous obtenez</div>
                <div className="answer-value">{primary.fmt(primary.est.value)}</div>
                <div className="answer-sub">
                  {primary.label.toLowerCase()} · fourchette {primary.fmt(primary.est.lo)} à {primary.fmt(primary.est.hi)}
                </div>
                <ConfBar c={primary.est.confiance} />
              </div>
              <div className="answer-side">
                <div className="answer-label">Vous payez</div>
                <div className="answer-value">{eur(reco.budgetTotal)}</div>
                <div className="answer-sub">budget total, commission incluse</div>
                <p className="answer-note">
                  Commission {pct(reco.tauxCommission)} ({eur(reco.commission)}) incluse. Rien en plus.
                </p>
              </div>
            </div>
            <div className="answer-breakdown mono">
              <span>Coût média net {eur(reco.coutMediaNet)}</span>
              <span aria-hidden>+</span>
              <span>Commission {eur(reco.commission)}</span>
              <span aria-hidden>=</span>
              <span>Total {eur(reco.budgetTotal)}</span>
            </div>
          </section>

          {/* Niveau 2 : indicateurs secondaires (subordonnés) */}
          <section className="metrics-sec" aria-label="Autres indicateurs estimés">
            {secondary.map((m) => (
              <div className="metric-sec" key={m.key}>
                <div className="ms-label">{m.label}</div>
                <div className="ms-value">{m.fmt(m.est.value)}</div>
                <div className="ms-meta">
                  fourchette {m.fmt(m.est.lo)} à {m.fmt(m.est.hi)} · confiance {niveauConfiance(m.est.confiance)} (
                  {pct(m.est.confiance)})
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
