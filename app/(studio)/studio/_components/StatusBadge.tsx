import type { CreativeStatus } from "@/lib/campaign-studio/types";
import Icon from "./Icon";
import s from "../studio.module.css";

export default function StatusBadge({ status }: { status: CreativeStatus }) {
  const labels = {
    pending: "À valider",
    approved: "Approuvée",
    changes_requested: "À modifier",
    on_air: "On air",
  } as const;
  return (
    <span className={`${s.badge} ${s[status]}`}>
      <Icon
        name={
          status === "on_air"
            ? "live"
            : status === "approved"
              ? "check"
              : status === "changes_requested"
                ? "comment"
                : "clock"
        }
        size={13}
      />
      {labels[status]}
    </span>
  );
}
