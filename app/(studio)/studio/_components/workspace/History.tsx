"use client";
import type { Ad, Campaign } from "@/lib/campaign-studio/workspace/types";
import { CHANNELS } from "@/lib/campaign-studio/workspace/catalog";
import w from "./workspace.module.css";
const actions: Record<string, string> = {
  created: "Création",
  edited: "Modification",
  edited_and_approved: "Correction et approbation",
  submitted: "Envoi en validation",
  approved: "Approbation",
  changes_requested: "Modification demandée",
  on_air: "Passage On air",
  stopped: "Arrêt",
  version_created: "Nouvelle version",
  unapproved: "Approbation annulée",
  media_matched: "Média associé",
  campaign: "Configuration de campagne",
};
const labels: Record<string, string> = {
  name: "Nom",
  copy: "Texte",
  headline: "Titre",
  headlines: "Titres",
  descriptions: "Descriptions",
  cta: "CTA",
  url: "Destination",
  mediaId: "Média",
  path1: "Chemin 1",
  path2: "Chemin 2",
  status: "Statut",
  reason: "Motif",
  comment: "Commentaire",
  version: "Version",
  channel: "Canal",
  format: "Format",
};
const statuses: Record<string, string> = {
  draft: "Brouillon",
  pending: "À valider",
  approved: "Approuvée",
  changes_requested: "Modification demandée",
  on_air: "On air",
  stopped: "Arrêtée",
  replaced: "Version remplacée",
  manual: "Arrêt manuel",
  campaign_finished: "Campagne terminée",
};
export default function History({
  ad,
  campaign,
}: {
  ad: Ad;
  campaign: Campaign;
}) {
  const display = (key: string, value: unknown): string => {
    if (value === null || value === undefined || value === "") return "Vide";
    if (Array.isArray(value)) return value.join(" / ");
    if (key === "mediaId")
      return campaign.media.find((m) => m.id === value)?.name ?? "Média";
    if (key === "channel")
      return CHANNELS[value as keyof typeof CHANNELS] ?? String(value);
    if (key === "status" || key === "reason")
      return statuses[String(value)] ?? String(value);
    return String(value);
  };
  return (
    <details className={w.history}>
      <summary>Historique · V{ad.version}</summary>
      {ad.history
        .slice()
        .reverse()
        .map((h) => (
          <div key={h.id}>
            <b>
              {h.actorName} · {actions[h.action] ?? "Mise à jour"}
            </b>
            <small>
              {new Date(h.at).toLocaleString("fr-CA", {
                timeZone: "America/Toronto",
              })}{" "}
              · Montréal
            </small>
            {Object.keys(h.after)
              .filter((k) => labels[k])
              .map((k) => (
                <p key={k}>
                  <strong>{labels[k]} : </strong>
                  {k in h.before ? (
                    <>
                      <span>{display(k, h.before[k])}</span> →{" "}
                    </>
                  ) : null}
                  <span>{display(k, h.after[k])}</span>
                </p>
              ))}
          </div>
        ))}
    </details>
  );
}
