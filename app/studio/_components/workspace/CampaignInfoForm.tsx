"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import type { Brand, Campaign } from "@/lib/campaign-studio/workspace/types";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import { useWorkspace } from "./WorkspaceProvider";
import w from "./workspace.module.css";

type Information = Pick<
  Campaign,
  "name" | "brandId" | "defaultUrl" | "startDate" | "endDate"
>;
const information = (c: Campaign): Information => ({
  name: c.name,
  brandId: c.brandId,
  defaultUrl: c.defaultUrl,
  startDate: c.startDate,
  endDate: c.endDate,
});

export default function CampaignInfoForm({
  campaign,
  onContinue,
}: {
  campaign: Campaign;
  onContinue: () => void;
}) {
  const { data, run, pending } = useWorkspace();
  const [baseline] = useState(() => information(campaign));
  const [draft, setDraft] = useState(() => information(campaign));
  const [brandForm, setBrandForm] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const saving = useRef(false);
  const formId = useId();
  const busy =
    status === "saving" ||
    pending("campaign", campaign.id) ||
    pending("create_brand");
  function change<K extends keyof Information>(key: K, value: Information[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving.current || brandForm) return;
    saving.current = true;
    setStatus("saving");
    setError("");
    try {
      const values = { ...draft, name: draft.name.trim() };
      // Only intentionally edited fields: a refresh cannot make this form
      // overwrite another person's untouched campaign information.
      const fields = Object.fromEntries(
        Object.entries(values).filter(
          ([key, value]) =>
            value !== baseline[key as keyof Information] &&
            value !== campaign[key as keyof Information],
        ),
      );
      if (Object.keys(fields).length)
        await run({ type: "campaign", campaignId: campaign.id, fields });
      onContinue();
    } catch (e) {
      setError(workspaceErrorMessage(e, "command"));
    } finally {
      saving.current = false;
      setStatus("idle");
    }
  }
  async function createBrand(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = new FormData(e.currentTarget);
    setError("");
    try {
      const result = await run({
        type: "create_brand",
        name: fields.get("name"),
        logo: fields.get("logo"),
        website: fields.get("website"),
      });
      const brand = result.brand as Brand;
      change("brandId", brand.id);
      setBrandForm(false);
      // Keep the new brand available even if assignment must be retried.
      await run({
        type: "campaign",
        campaignId: campaign.id,
        fields: { brandId: brand.id },
      });
    } catch (e) {
      setError(workspaceErrorMessage(e, "command"));
    }
  }
  return (
    <>
      <form
        id={formId}
        aria-label="Informations de campagne"
        onSubmit={(e) => void save(e)}
      >
        <fieldset className={w.campaignFields} disabled={busy}>
          <label>
            Nom de campagne
            <input
              required
              maxLength={200}
              value={draft.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </label>
          <div className={w.brandChoice}>
            <label>
              Marque
              <select
                value={draft.brandId ?? ""}
                onChange={(e) => change("brandId", e.target.value || null)}
              >
                <option value="">À choisir</option>
                {data!.brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setBrandForm((value) => !value)}
            >
              Créer une marque
            </button>
          </div>
          <label className={w.campaignUrl}>
            URL commune
            <input
              type="url"
              placeholder="https://…"
              maxLength={2048}
              value={draft.defaultUrl}
              onChange={(e) => change("defaultUrl", e.target.value)}
            />
          </label>
          <label>
            Début
            <input
              type="date"
              value={draft.startDate ?? ""}
              onChange={(e) => change("startDate", e.target.value || null)}
            />
          </label>
          <label>
            Fin · 23 h 59 Montréal
            <input
              type="date"
              value={draft.endDate ?? ""}
              onChange={(e) => change("endDate", e.target.value || null)}
            />
          </label>
        </fieldset>
      </form>
      {brandForm && (
        <form
          className={w.brandCreator}
          aria-label="Nouvelle marque"
          onSubmit={(e) => void createBrand(e)}
        >
          <label>
            Nom
            <input name="name" required maxLength={200} disabled={busy} />
          </label>
          <label>
            Logo · URL
            <input name="logo" type="url" maxLength={2048} disabled={busy} />
          </label>
          <label>
            Site web
            <input name="website" type="url" maxLength={2048} disabled={busy} />
          </label>
          <div className={w.inline}>
            <button className={w.primary} disabled={busy}>
              {pending("create_brand") ? "Création…" : "Créer"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setBrandForm(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className={w.error} role="alert">
          {error}
        </p>
      )}
      <p className={w.srOnly} role="status">
        {busy ? "Enregistrement des informations de campagne…" : ""}
      </p>
      <button form={formId} className={w.primary} disabled={busy || brandForm}>
        {status === "saving" ? "Enregistrement…" : "Continuer"}
      </button>
    </>
  );
}
