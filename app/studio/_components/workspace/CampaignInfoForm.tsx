"use client";
import Select from "@/app/_components/Select";
import { useId, useRef, useState, type FormEvent } from "react";
import type { Brand, Campaign } from "@/lib/campaign-studio/workspace/types";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import { useWorkspace } from "./WorkspaceProvider";
import Icon from "../Icon";
import w from "./workspace.module.css";
import c from "./creation.module.css";

type Information = Pick<
  Campaign,
  "name" | "brandId" | "defaultUrl" | "startDate" | "endDate"
>;
const information = (campaign?: Campaign): Information => ({
  name: campaign?.name ?? "",
  brandId: campaign?.brandId ?? null,
  defaultUrl: campaign?.defaultUrl ?? "",
  startDate: campaign?.startDate ?? null,
  endDate: campaign?.endDate ?? null,
});

export default function CampaignInfoForm({
  campaign,
  onContinue,
}: {
  campaign?: Campaign;
  onContinue: (campaignId?: string) => void;
}) {
  const { data, run, pending } = useWorkspace();
  const [baseline] = useState(() => information(campaign));
  const [draft, setDraft] = useState(() => information(campaign));
  const [brandForm, setBrandForm] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(
    () => !!(campaign?.defaultUrl || campaign?.startDate || campaign?.endDate),
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const saving = useRef(false);
  const creatingBrand = useRef(false);
  const formId = useId();
  const busy =
    status === "saving" ||
    pending("create_campaign") ||
    (campaign ? pending("campaign", campaign.id) : false) ||
    pending("create_brand");
  function change<K extends keyof Information>(key: K, value: Information[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving.current || brandForm) return;
    if (!draft.name.trim()) {
      setError("Donnez un nom à votre campagne.");
      return;
    }
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      setDetailsOpen(true);
      setError("La date de fin doit suivre la date de début.");
      return;
    }
    if (draft.defaultUrl.trim()) {
      try {
        const url = new URL(draft.defaultUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setDetailsOpen(true);
        setError("Indiquez un lien valide commençant par https:// ou http://.");
        return;
      }
    }
    saving.current = true;
    setStatus("saving");
    setError("");
    try {
      const values = {
        ...draft,
        name: draft.name.trim(),
        defaultUrl: draft.defaultUrl.trim(),
      };
      if (campaign) {
        // A refresh must not overwrite another person's untouched information.
        const fields = Object.fromEntries(
          Object.entries(values).filter(
            ([key, value]) =>
              value !== baseline[key as keyof Information] &&
              value !== campaign[key as keyof Information],
          ),
        );
        if (Object.keys(fields).length)
          await run({ type: "campaign", campaignId: campaign.id, fields });
        onContinue(campaign.id);
      } else {
        const { name, ...fields } = values;
        const result = await run({ type: "create_campaign", name, fields });
        onContinue((result.campaign as Campaign).id);
      }
    } catch (e) {
      setError(workspaceErrorMessage(e, "command"));
    } finally {
      saving.current = false;
      setStatus("idle");
    }
  }
  async function createBrand(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (creatingBrand.current) return;
    creatingBrand.current = true;
    const fields = new FormData(e.currentTarget);
    setError("");
    try {
      const result = await run({
        type: "create_brand",
        name: fields.get("name"),
        logo: fields.get("logo"),
        website: fields.get("website"),
      });
      change("brandId", (result.brand as Brand).id);
      setBrandForm(false);
    } catch (e) {
      setError(workspaceErrorMessage(e, "command"));
    } finally {
      creatingBrand.current = false;
    }
  }
  return (
    <div className={c.information}>
      <form
        id={formId}
        aria-label="Informations de campagne"
        onSubmit={(e) => void save(e)}
      >
        <fieldset className={c.fields} disabled={busy}>
          <label>
            Nom de campagne
            <input
              required
              maxLength={200}
              placeholder="Ex. Admissions automne 2027"
              value={draft.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </label>
          <div className={c.brandChoice}>
            <label>
              Marque
              <Select
                value={draft.brandId ?? ""}
                onValueChange={(selectedValue) =>
                  change("brandId", selectedValue || null)
                }
              >
                <option value="">À choisir (optionnel)</option>
                {data!.brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </label>
            <button
              className={c.addBrand}
              type="button"
              aria-label="Créer une marque"
              aria-expanded={brandForm}
              onClick={() => setBrandForm((value) => !value)}
            >
              +
            </button>
          </div>
          <details
            className={c.optional}
            open={detailsOpen}
            onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
          >
            <summary>
              <Icon name="calendar" />
              <span>
                Dates et lien <small>(optionnel)</small>
              </span>
              <Icon name="down" size={16} />
            </summary>
            <div className={c.optionalFields}>
              <label className={c.url}>
                URL commune
                <input
                  type="url"
                  placeholder="https://…"
                  maxLength={2048}
                  value={draft.defaultUrl}
                  onInvalid={() => setDetailsOpen(true)}
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
                  min={draft.startDate ?? undefined}
                  onInvalid={() => setDetailsOpen(true)}
                  onChange={(e) => change("endDate", e.target.value || null)}
                />
              </label>
            </div>
          </details>
        </fieldset>
      </form>
      {brandForm && (
        <form
          className={c.brandCreator}
          aria-label="Nouvelle marque"
          onSubmit={(e) => void createBrand(e)}
        >
          <h3>Nouvelle marque</h3>
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
              {pending("create_brand") ? "Création…" : "Créer la marque"}
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
      <div className={c.actions}>
        <button
          form={formId}
          className={w.primary}
          disabled={busy || brandForm}
          aria-busy={busy}
        >
          {status === "saving" ? "Enregistrement…" : "Continuer"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
