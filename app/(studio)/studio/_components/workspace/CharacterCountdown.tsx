import {
  characterBudget,
  type TextGuidance,
} from "@/lib/campaign-studio/workspace/text-guidance";
import t from "./table.module.css";

export default function CharacterCountdown({
  id,
  value,
  guidance,
}: {
  id: string;
  value: string | string[];
  guidance: TextGuidance;
}) {
  const budget = characterBudget(value, guidance);
  const hue = 145 - budget.progress * 115;
  const threshold =
    guidance.kind === "recommendation"
      ? "longueur recommandée"
      : "limite du champ";
  const detail = `${budget.variant ? `Texte ${budget.variant}, le plus long : ` : ""}${
    budget.remaining < 0
      ? `${-budget.remaining} caractères au-delà de la ${threshold}`
      : `${budget.remaining} caractères avant la ${threshold}`
  } de ${guidance.limit} (${guidance.context}). ${
    guidance.kind === "recommendation"
      ? "Repère indicatif : la coupure réelle dépend du placement et de l’appareil."
      : "La saisie reste libre. Ce seuil ne garantit pas que tout le texte sera visible."
  }`;
  return (
    <span
      id={id}
      className={t.countdown}
      title={detail}
      data-character-countdown
      data-remaining={budget.remaining}
      data-limit={guidance.limit}
      style={{
        color: `hsl(${hue} 65% 25%)`,
        backgroundColor: `hsl(${hue} 55% 94%)`,
        fontSize: `${Math.min(10, 22 / (String(budget.remaining).length * 0.62))}px`,
      }}
    >
      <span aria-hidden="true">{budget.remaining}</span>
      <span className={t.countdownDescription}>{detail}</span>
    </span>
  );
}
