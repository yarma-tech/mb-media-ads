"use client";
import Select from "@/app/_components/Select";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addAdAction,
  createShareAction,
  deleteAdAction,
  resolveCommentAction,
  updateAdAction,
  updateTextAction,
  createUploadUrlAction,
} from "../actions";
import {
  PLATEFORMES,
  PLATEFORME_LABEL,
  PLAN_STATUT_LABEL,
  type Ad,
  type Plan,
  type Approval,
  type Comment,
  type Plateforme,
} from "@/lib/social-ads/types";
import {
  PLACEMENTS,
  allowedRatios,
  getVariantSpec,
  legacyFormat,
  legacyVariant,
  parseVariant,
  variantOf,
  type AdVariant,
  type Placement,
  type VariantChoice,
} from "@/lib/social-ads/specs";
import type { EditableAdText } from "@/lib/social-ads/review";
import SocialPreview from "./SocialPreview";
import AdTextEditor from "./AdTextEditor";
import MediaManifest from "./MediaManifest";
import CopyAssistant from "./CopyAssistant";
import { getBrowserClient } from "@/lib/supabase";
export default function PlanEditor({
  plan,
  initialAds,
  initialToken,
  comments,
  approvals,
  baseUrl,
}: {
  plan: Plan;
  initialAds: Ad[];
  initialToken: string | null;
  comments: Comment[];
  approvals: Approval[];
  baseUrl: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [platform, setPlatform] = useState<Plateforme>("facebook");
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState("");
  const shareUrl = token ? `${baseUrl}/preview/${token}` : "";
  return (
    <div className="sap-editor">
      <div className="sap-toolbar">
        <div className="sap-add">
          <Select
            aria-label="Plateforme nouvelle annonce"
            value={platform}
            onValueChange={(selectedValue) =>
              setPlatform(selectedValue as Plateforme)
            }
          >
            {PLATEFORMES.map((p) => (
              <option key={p} value={p}>
                {PLATEFORME_LABEL[p]}
              </option>
            ))}
          </Select>
          <button
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const ad = await addAdAction(
                  plan.id,
                  platform,
                  platform === "youtube"
                    ? "feed_video"
                    : platform === "tiktok"
                      ? "reel"
                      : "feed_image",
                );
                if (!ad) setMessage("Création refusée.");
                else router.refresh();
              })
            }
          >
            + Ajouter une annonce
          </button>
        </div>
        <span className={`sap-statut sap-statut-${plan.statut}`}>
          {PLAN_STATUT_LABEL[plan.statut]}
        </span>
        <a className="btn btn-ghost" href={`/api/social/export/${plan.id}`}>
          Exporter les textes (.txt)
        </a>
      </div>
      <div className="sap-sharebox">
        {shareUrl ? (
          <>
            <input
              aria-label="Lien de validation"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              className="btn btn-ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setMessage("Lien copié.");
                } catch {
                  setMessage("Sélectionnez puis copiez le lien.");
                }
              }}
            >
              Copier
            </button>
            <a href={shareUrl} target="_blank" rel="noreferrer">
              Ouvrir
            </a>
          </>
        ) : (
          <button
            className="btn btn-ghost"
            disabled={pending || !initialAds.length}
            onClick={() =>
              start(async () => {
                const r = await createShareAction(plan.id);
                if ("token" in r) {
                  setToken(r.token);
                  router.refresh();
                } else setMessage(r.error);
              })
            }
          >
            Générer le lien de validation
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      <MediaManifest planId={plan.id} ads={initialAds} />
      <div className="sap-ads">
        {initialAds.map((ad) => (
          <EditorCard
            key={ad.id}
            ad={ad}
            planId={plan.id}
            comments={comments.filter((c) => c.ad_id === ad.id)}
            approvals={approvals.filter((a) => a.ad_id === ad.id)}
          />
        ))}
      </div>
    </div>
  );
}
function EditorCard({
  ad,
  planId,
  comments,
  approvals,
}: {
  ad: Ad;
  planId: string;
  comments: Comment[];
  approvals: Approval[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<EditableAdText>({});
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const effective = { ...ad, ...draft };
  let v: AdVariant;
  try {
    v = variantOf(ad);
  } catch {
    v = legacyVariant(ad.plateforme, ad.format);
  }
  const [selection, setSelection] = useState<AdVariant>(v);
  async function save(patch: Parameters<typeof updateAdAction>[2]) {
    const ok = await updateAdAction(planId, ad.id, patch);
    if (ok) {
      setDraft({});
      router.refresh();
    } else setMessage("Enregistrement refusé: vérifiez les champs.");
    return ok;
  }
  function change(choice: VariantChoice) {
    const ratios = allowedRatios(choice);
    if (ratios.length)
      setSelection({
        ...choice,
        ratio: ratios.includes(selection.ratio) ? selection.ratio : ratios[0],
      } as AdVariant);
  }
  const placements = PLACEMENTS.filter((p) =>
    ["image", "video", "carrousel"].some(
      (m) =>
        allowedRatios({
          plateforme: selection.plateforme,
          placement: p,
          type_media: m,
        } as VariantChoice).length,
    ),
  );
  return (
    <article className="sap-adcard">
      <div className="sap-adcard-form">
        <div className="sap-adcard-head">
          <h2>Annonce {ad.ordre + 1}</h2>
          <button
            className="sap-remove"
            aria-label="Supprimer annonce"
            onClick={() =>
              start(async () => {
                if (await deleteAdAction(planId, ad.id)) router.refresh();
                else setMessage("Suppression refusée.");
              })
            }
            disabled={pending}
          >
            ×
          </button>
        </div>
        {ad.variant_status === "needs_review" && (
          <p role="alert">
            Annonce historique: confirmer le placement, le média et le ratio
            avant de modifier ses textes.
          </p>
        )}
        <div className="sap-field-row">
          <label className="sap-field">
            <span>Plateforme</span>
            <Select
              value={selection.plateforme}
              onValueChange={(selectedValue) => {
                const p = selectedValue as Plateforme;
                setSelection(
                  legacyVariant(
                    p,
                    p === "youtube"
                      ? "feed_video"
                      : p === "tiktok"
                        ? "reel"
                        : "feed_image",
                  ),
                );
              }}
            >
              {PLATEFORMES.map((p) => (
                <option key={p} value={p}>
                  {PLATEFORME_LABEL[p]}
                </option>
              ))}
            </Select>
          </label>
          <label className="sap-field">
            <span>Placement</span>
            <Select
              value={selection.placement}
              onValueChange={(selectedValue) => {
                const placement = selectedValue as Placement;
                const type_media = [
                  selection.type_media,
                  "video",
                  "image",
                  "carrousel",
                ].find(
                  (m) =>
                    allowedRatios({
                      plateforme: selection.plateforme,
                      placement,
                      type_media: m,
                    } as VariantChoice).length,
                )!;
                change({
                  plateforme: selection.plateforme,
                  placement,
                  type_media,
                } as VariantChoice);
              }}
            >
              {placements.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </label>
          <label className="sap-field">
            <span>Média</span>
            <Select
              value={selection.type_media}
              onValueChange={(selectedValue) =>
                change({
                  ...selection,
                  type_media: selectedValue as AdVariant["type_media"],
                })
              }
            >
              {(["image", "video", "carrousel"] as const)
                .filter(
                  (m) => allowedRatios({ ...selection, type_media: m }).length,
                )
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </Select>
          </label>
          <label className="sap-field">
            <span>Ratio</span>
            <Select
              value={selection.ratio}
              onValueChange={(selectedValue) =>
                setSelection({
                  ...selection,
                  ratio: selectedValue,
                } as AdVariant)
              }
            >
              {allowedRatios(selection).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </label>
        </div>
        <button
          className="btn btn-ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (parseVariant(selection).status === "valid")
                await save({
                  ...selection,
                  format: legacyFormat(selection),
                  ...(selection.type_media === "carrousel" &&
                  ad.medias.length < 2
                    ? {
                        medias: [
                          { type: "image", url: "", creative_ref: "Carte 1" },
                          { type: "image", url: "", creative_ref: "Carte 2" },
                        ],
                      }
                    : {}),
                });
            })
          }
        >
          Appliquer le format
        </button>
        <div className="sap-field-row">
          {(["marque_nom", "marque_handle"] as const).map((k) => (
            <label key={`${k}-${ad.updated_at}`} className="sap-field">
              <span>
                {k === "marque_nom" ? "Nom de marque" : "Identifiant"}
              </span>
              <input
                defaultValue={ad[k] || ""}
                onBlur={(e) => void save({ [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <label className="sap-field">
          <span>Référence créa</span>
          <input
            key={ad.updated_at}
            defaultValue={ad.creative_ref || ""}
            onBlur={(e) => void save({ creative_ref: e.target.value })}
          />
        </label>
        <label className="sap-field">
          <span>Logo propre à cette annonce</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const signed = await createUploadUrlAction(
                  planId,
                  file.name,
                  file.type,
                  file.size,
                );
                if ("error" in signed) throw new Error(signed.error);
                const sb = getBrowserClient();
                if (!sb) throw new Error("Stockage indisponible.");
                const { error } = await sb.storage
                  .from("social-ads")
                  .uploadToSignedUrl(signed.path, signed.token, file);
                if (error) throw error;
                await save({ marque_logo: signed.publicUrl });
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Upload impossible.",
                );
              }
            }}
          />
        </label>
        {ad.type_media === "carrousel" && (
          <div>
            {ad.medias.map((m, i) => (
              <fieldset className="sa-panel" key={`${i}-${ad.updated_at}`}>
                <legend>Carte {i + 1}</legend>
                {(["creative_ref", "titre", "description"] as const).map(
                  (k) => (
                    <label className="sap-field" key={k}>
                      <span>
                        {k === "creative_ref"
                          ? "Référence image"
                          : k === "titre"
                            ? "Titre"
                            : "Description"}
                      </span>
                      <input
                        defaultValue={m[k] || ""}
                        onBlur={(e) => {
                          const medias = ad.medias.map((x, n) =>
                            n === i ? { ...x, [k]: e.target.value } : x,
                          );
                          void save({ medias });
                        }}
                      />
                    </label>
                  ),
                )}
                <button
                  className="navlink"
                  disabled={ad.medias.length <= 2}
                  onClick={() =>
                    void save({ medias: ad.medias.filter((_, n) => n !== i) })
                  }
                >
                  Retirer carte
                </button>
              </fieldset>
            ))}
            <button
              className="btn btn-ghost"
              disabled={ad.medias.length >= 10}
              onClick={() =>
                void save({
                  medias: [
                    ...ad.medias,
                    {
                      type: "image",
                      url: "",
                      creative_ref: `Carte ${ad.medias.length + 1}`,
                    },
                  ],
                })
              }
            >
              Ajouter une carte
            </button>
          </div>
        )}
        {ad.variant_status !== "needs_review" && (
          <AdTextEditor
            key={ad.updated_at}
            ad={effective}
            onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
            onSave={async (patch) => {
              const updated = await updateTextAction(planId, ad.id, patch);
              if (updated) {
                setDraft({});
                router.refresh();
              }
              return updated;
            }}
          />
        )}
        <CopyAssistant
          plateforme={ad.plateforme}
          format={ad.format}
          variant={v}
          marque={ad.marque_nom || ""}
          onApply={(copy) => {
            const spec = getVariantSpec(v);
            const patch = {
              texte_principal: copy.texte_principal,
              titre: copy.titre.slice(0, spec.titreMax),
              description: copy.description.slice(
                0,
                spec.descriptionMax ?? Infinity,
              ),
              cta: copy.cta,
            };
            setDraft(patch);
            void save(patch);
          }}
        />
        <p role="status">{message}</p>
        <p className="sap-sub">
          Dernière modification:{" "}
          {new Date(ad.updated_at).toLocaleString("fr-CA")}
        </p>
        {approvals.map((a) => (
          <p className={`sap-badge sap-badge-${a.decision}`} key={a.id}>
            {a.relecteur}:{" "}
            {a.decision === "revision" ? "À réviser" : "Approuvée"}
          </p>
        ))}
        {comments.map((c) => (
          <div className="sap-comment" key={c.id}>
            <strong>{c.auteur}</strong> {c.corps}
            <button
              className="navlink"
              onClick={async () => {
                if (await resolveCommentAction(planId, c.id, !c.resolu))
                  router.refresh();
                else setMessage("Action refusée.");
              }}
            >
              {c.resolu ? "Rouvrir" : "Résoudre"}
            </button>
          </div>
        ))}
      </div>
      <div className="sap-adcard-preview">
        <SocialPreview ad={effective} />
      </div>
    </article>
  );
}
