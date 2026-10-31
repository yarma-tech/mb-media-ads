"use client";
import type { Campaign } from "@/lib/campaign-studio/workspace/types";
import { useWorkspace } from "./WorkspaceProvider";
import Icon from "../Icon";
import { useConfirmation } from "./Confirmation";
export default function DeleteAds({
  campaign,
  ids,
  label,
  flush,
  onDeleted,
}: {
  campaign: Campaign;
  ids: string[];
  label: string;
  flush: () => Promise<unknown> | undefined;
  onDeleted?: () => void;
}) {
  const { run, pending, notify } = useWorkspace();
  const confirm = useConfirmation();
  const frozen =
    campaign.status !== "active" ||
    ids.some((id) =>
      campaign.ads.some(
        (ad) => ad.id === id && ["on_air", "stopped"].includes(ad.status),
      ),
    );
  return (
    <button
      type="button"
      aria-label={label}
      title={
        frozen
          ? "Les annonces déjà diffusées restent dans l’historique."
          : label
      }
      disabled={!ids.length || frozen || pending("delete_ads", campaign.id)}
      onClick={async (e) => {
        e.stopPropagation();
        if (
          !(await confirm({
            title:
              ids.length === 1
                ? "Supprimer l’annonce ?"
                : `Supprimer ces ${ids.length} annonces ?`,
            description:
              "Cette suppression est définitive. Les médias seront conservés dans la bibliothèque.",
            confirmLabel: "Supprimer",
            intent: "danger",
          }))
        )
          return;
        try {
          await flush();
          await run({
            type: "delete_ads",
            campaignId: campaign.id,
            adIds: ids,
          });
          onDeleted?.();
          notify(`${ids.length} annonce(s) supprimée(s).`);
        } catch {}
      }}
    >
      <Icon name="trash" size={17} />
    </button>
  );
}
