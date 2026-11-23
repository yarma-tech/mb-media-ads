"use client";
import { useState } from "react";
import type { Ad } from "@/lib/social-ads/types";
import { getVariantSpec, variantOf } from "@/lib/social-ads/specs";
import { TEXT_FIELDS, type EditableAdText } from "@/lib/social-ads/review";
const labels = {
  texte_principal: "Texte principal",
  titre: "Titre",
  description: "Description",
  cta: "CTA",
  destination_url: "URL de destination",
};
export default function AdTextEditor({
  ad,
  onSave,
  onChange,
}: {
  ad: Ad;
  onSave: (patch: EditableAdText) => Promise<Ad | null>;
  onChange?: (patch: EditableAdText) => void;
}) {
  const [values, setValues] = useState<EditableAdText>(() =>
    Object.fromEntries(TEXT_FIELDS.map((k) => [k, ad[k] || ""])),
  );
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState("");
  const spec = getVariantSpec(variantOf(ad));
  const maximum = (k: (typeof TEXT_FIELDS)[number]) =>
    k === "texte_principal"
      ? spec.hardLimits.text
      : k === "titre"
        ? spec.hardLimits.title
        : k === "description"
          ? spec.hardLimits.description
          : k === "cta"
            ? 80
            : 2048;
  const invalid = TEXT_FIELDS.some(
    (k) => maximum(k) !== null && (values[k] || "").length > maximum(k)!,
  );
  return (
    <form
      className="sa-text-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        setMessage("");
        try {
          const updated = await onSave(values);
          setMessage(
            updated
              ? `Enregistré le ${new Date(updated.updated_at).toLocaleString("fr-CA")}`
              : "Enregistrement refusé. Vérifiez les champs et le lien.",
          );
        } catch {
          setMessage("Enregistrement impossible. Votre saisie est conservée.");
        } finally {
          setState("idle");
        }
      }}
    >
      {TEXT_FIELDS.map((k) => (
        <label className="sap-field" key={k}>
          <span>
            {labels[k]}{" "}
            <small
              className={
                (values[k] || "").length > (maximum(k) ?? Infinity)
                  ? "sa-error"
                  : ""
              }
            >
              {(values[k] || "").length}
              {maximum(k) !== null
                ? ` / ${maximum(k)}`
                : " · plafond non documenté"}
            </small>
          </span>
          {k === "texte_principal" ? (
            <textarea
              rows={3}
              value={values[k] || ""}
              onChange={(e) => {
                const patch = { [k]: e.target.value };
                setValues((v) => ({ ...v, ...patch }));
                onChange?.(patch);
              }}
            />
          ) : (
            <input
              type={k === "destination_url" ? "url" : "text"}
              value={values[k] || ""}
              onChange={(e) => {
                const patch = { [k]: e.target.value };
                setValues((v) => ({ ...v, ...patch }));
                onChange?.(patch);
              }}
            />
          )}
        </label>
      ))}
      <button
        className="btn btn-primary"
        disabled={invalid || state === "saving"}
      >
        {state === "saving" ? "Enregistrement…" : "Enregistrer les textes"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
