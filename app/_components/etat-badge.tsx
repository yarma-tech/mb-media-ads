import type { ComponentType } from "react";
import { ETAT_LABEL, type EtatDemande } from "@/lib/enums";
import { IconCheck, IconClock, IconCross, IconDoc } from "./icons";

const MAP: Record<EtatDemande, { cls: string; Icon: ComponentType<{ className?: string }> }> = {
  soumise: { cls: "badge-neutral", Icon: IconClock },
  acceptee: { cls: "badge-success", Icon: IconCheck },
  refusee: { cls: "badge-danger", Icon: IconCross },
  convention_envoyee: { cls: "badge-warn", Icon: IconDoc },
  payee: { cls: "badge-success", Icon: IconCheck },
};

export function EtatBadge({ etat }: { etat: EtatDemande }) {
  const { cls, Icon } = MAP[etat];
  return (
    <span className={`badge ${cls}`}>
      <Icon />
      {ETAT_LABEL[etat]}
    </span>
  );
}
