import type { ComponentType } from "react";
import { CIBLE_LABEL, type Plateforme } from "@/lib/enums";
import { eur, kvues, niveauConfiance, num, pct } from "@/lib/format";
import type { Estimation, Recommandation } from "@/lib/types";
import {
  IconAlert,
  IconFacebook,
  IconInstagram,
  IconSpotify,
  IconTarget,
  IconTikTok,
  IconYouTube,
} from "./icons";

const PLATFORM_ICON: Record<Plateforme, ComponentType<{ className?: string }>> = {
  YouTube: IconYouTube,
  Facebook: IconFacebook,
  TikTok: IconTikTok,
  Instagram: IconInstagram,
  Spotify: IconSpotify,
};

type MetricDesc = { key: string; label: string; est: Estimation; fmt: (v: number) => string };

function metricsFor(reco: Recommandation): MetricDesc[] {
  const A: MetricDesc = { key: "aud", label: "Audience", est: reco.audienceK, fmt: kvues };
  const C: MetricDesc = { key: "couv", label: "Couverture efficace", est: reco.couvertureEfficaceK, fmt: kvues };
  const L: MetricDesc = { key: "lead", label: "Leads (inscriptions)", est: reco.leads, fmt: (v) => num(v) };
  const V: MetricDesc = { key: "vente", label: "Ventes", est: reco.ventes, fmt: (v) => num(v) };
  if (reco.objectifPrincipal === "notoriete") return [C, A, L];
  if (reco.objectifPrincipal === "lead") return [L, A, C];
  return [V, A, C];
}

const BUT: Record<Recommandation["objectifPrincipal"], string> = {
  notoriete: "pour maximiser la couverture efficace",
  lead: "pour maximiser les leads",
  vente: "pour maximiser les ventes",
};

function rationale(reco: Recommandation): string {
  const n = reco.placements.length;
  const medias = new Set(reco.placements.map((p) => p.mediaId)).size;
  const but = reco.mode === "goal" ? "pour atteindre votre objectif au meilleur coût" : BUT[reco.objectifPrincipal];
  return `${n} placement${n > 1 ? "s" : ""} sur ${medias} média${medias > 1 ? "s" : ""}, ${but}.`;
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
            Couverture efficace = personnes vues 3 fois ou plus. Valeurs illustratives.
          </p>

          {/* Niveau 2 : le raisonnement */}
          <section className="panel reasoning">
            <h2>Pourquoi cette campagne</h2>
            <p className="muted reasoning-lead">{rationale(reco)}</p>
            <div className="placements">
              {reco.placements.map((p) => {
                const PlatIcon = PLATFORM_ICON[p.plateforme];
                return (
                  <div className="placement" key={`${p.programmeId}-${p.plateforme}-${p.typePub}-${p.cible}`}>
                    <div>
                      <div className="p-main">
                        {p.mediaNom} · {p.programmeNom}
                      </div>
                      <div className="p-tags">
                        <span className="tag">
                          <PlatIcon /> {p.plateforme}
                        </span>
                        <span className="tag">{p.typePub}</span>
                        <span className="tag" aria-label={`Cible : ${CIBLE_LABEL[p.cible]}`}>
                          <IconTarget /> {CIBLE_LABEL[p.cible]}
                        </span>
                        <span className="tag">
                          {p.insertions} insertion{p.insertions > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="p-cost">
                      <div className="big">{eur(p.coutMediaNet)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {p.insertions} × {eur(p.prixUnitaire)}
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
