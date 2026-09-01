"use client";

import { useRef, useState, useTransition } from "react";
import {
  addAdAction,
  createShareAction,
  deleteAdAction,
  resolveCommentAction,
  updateAdAction,
  uploadMediaAction,
  type AdPatch,
} from "@/app/social/actions";
import type { CopyVariation } from "@/lib/social-ads/copy";
import {
  CTAS,
  FORMAT_LABEL,
  FORMATS_PAR_PLATEFORME,
  LIMITES,
  PLATEFORME_LABEL,
  PLATEFORMES,
  PLAN_STATUT_LABEL,
  type Ad,
  type Approval,
  type Comment,
  type Format,
  type Media,
  type Plan,
  type Plateforme,
} from "@/lib/social-ads/types";
import SocialPreview from "./SocialPreview";
import CopyAssistant from "./CopyAssistant";

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
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [token, setToken] = useState<string | null>(initialToken);
  const [statut, setStatut] = useState(plan.statut);
  const [newPlateforme, setNewPlateforme] = useState<Plateforme>("facebook");
  const [pending, start] = useTransition();

  const shareUrl = token ? `${baseUrl}/preview/${token}` : null;

  function addAd() {
    const format = FORMATS_PAR_PLATEFORME[newPlateforme][0];
    start(async () => {
      const ad = await addAdAction(plan.id, newPlateforme, format);
      if (ad) setAds((a) => [...a, ad]);
    });
  }

  function removeAd(adId: string) {
    setAds((a) => a.filter((x) => x.id !== adId));
    start(() => void deleteAdAction(plan.id, adId));
  }

  function patchAdLocal(adId: string, patch: Partial<Ad>) {
    setAds((a) => a.map((x) => (x.id === adId ? { ...x, ...patch } : x)));
  }

  async function share() {
    start(async () => {
      const res = await createShareAction(plan.id);
      if ("token" in res) {
        setToken(res.token);
        setStatut("en_revue");
      }
    });
  }

  return (
    <div className="sap-editor">
      <div className="sap-toolbar">
        <div className="sap-add">
          <select
            value={newPlateforme}
            onChange={(e) => setNewPlateforme(e.target.value as Plateforme)}
            aria-label="Plateforme de la nouvelle annonce"
          >
            {PLATEFORMES.map((p) => (
              <option key={p} value={p}>
                {PLATEFORME_LABEL[p]}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={addAd} disabled={pending}>
            + Ajouter une annonce
          </button>
        </div>

        <div className="sap-share">
          <span className={`sap-statut sap-statut-${statut}`}>{PLAN_STATUT_LABEL[statut]}</span>
          {shareUrl ? (
            <ShareBox url={shareUrl} />
          ) : (
            <button type="button" className="btn btn-ghost" onClick={share} disabled={pending || ads.length === 0}>
              🔗 Générer le lien de validation
            </button>
          )}
        </div>
      </div>

      {ads.length === 0 ? (
        <p className="sap-empty-hint">
          Ajoutez une première annonce pour composer votre plan, puis partagez le lien de validation.
        </p>
      ) : null}

      <div className="sap-ads">
        {ads.map((ad) => (
          <AdEditorCard
            key={ad.id}
            planId={plan.id}
            ad={ad}
            comments={comments.filter((c) => c.ad_id === ad.id)}
            approvals={approvals.filter((a) => a.ad_id === ad.id)}
            onLocalPatch={(p) => patchAdLocal(ad.id, p)}
            onRemove={() => removeAd(ad.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ShareBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="sap-sharebox">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="btn btn-primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard indisponible */
          }
        }}
      >
        {copied ? "Copié ✓" : "Copier"}
      </button>
      <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer">
        Ouvrir
      </a>
    </div>
  );
}

function AdEditorCard({
  planId,
  ad,
  comments,
  approvals,
  onLocalPatch,
  onRemove,
}: {
  planId: string;
  ad: Ad;
  comments: Comment[];
  approvals: Approval[];
  onLocalPatch: (p: Partial<Ad>) => void;
  onRemove: () => void;
}) {
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const lim = LIMITES[ad.plateforme];

  async function persist(patch: AdPatch) {
    setSaving("saving");
    const ok = await updateAdAction(planId, ad.id, patch);
    setSaving(ok ? "saved" : "idle");
    if (ok) setTimeout(() => setSaving("idle"), 1200);
  }

  // Modifie localement (preview instantané) puis persiste.
  function set(patch: Partial<Ad>, persistPatch: AdPatch = patch as AdPatch) {
    onLocalPatch(patch);
    void persist(persistPatch);
  }

  async function upload(file: File, as: "media" | "logo") {
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadMediaAction(planId, fd);
    if ("error" in res) {
      alert(`Upload : ${res.error}`);
      return;
    }
    if (as === "logo") {
      set({ marque_logo: res.media.url });
    } else {
      const medias = [...ad.medias, res.media];
      set({ medias });
    }
  }

  function removeMedia(idx: number) {
    const medias = ad.medias.filter((_, i) => i !== idx);
    set({ medias });
  }

  function applyCopy(v: CopyVariation) {
    set({
      texte_principal: v.texte_principal || ad.texte_principal,
      titre: v.titre || ad.titre,
      description: v.description || ad.description,
      cta: v.cta || ad.cta,
    });
  }

  const formats = FORMATS_PAR_PLATEFORME[ad.plateforme];

  return (
    <div className="sap-adcard">
      <div className="sap-adcard-form">
        <div className="sap-adcard-head">
          <div className="sap-field-row">
            <label className="sap-field">
              <span>Plateforme</span>
              <select
                value={ad.plateforme}
                onChange={(e) => {
                  const plateforme = e.target.value as Plateforme;
                  const format = FORMATS_PAR_PLATEFORME[plateforme].includes(ad.format)
                    ? ad.format
                    : FORMATS_PAR_PLATEFORME[plateforme][0];
                  set({ plateforme, format });
                }}
              >
                {PLATEFORMES.map((p) => (
                  <option key={p} value={p}>
                    {PLATEFORME_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="sap-field">
              <span>Format</span>
              <select value={ad.format} onChange={(e) => set({ format: e.target.value as Format })}>
                {formats.map((f) => (
                  <option key={f} value={f}>
                    {FORMAT_LABEL[f]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="sap-remove" onClick={onRemove} aria-label="Supprimer">
            ✕
          </button>
        </div>

        <div className="sap-field-row">
          <label className="sap-field">
            <span>Nom de la marque</span>
            <input
              defaultValue={ad.marque_nom ?? ""}
              placeholder="Ma Marque"
              onChange={(e) => onLocalPatch({ marque_nom: e.target.value })}
              onBlur={(e) => persist({ marque_nom: e.target.value })}
            />
          </label>
          <label className="sap-field">
            <span>@handle</span>
            <input
              defaultValue={ad.marque_handle ?? ""}
              placeholder="@mamarque"
              onChange={(e) => onLocalPatch({ marque_handle: e.target.value })}
              onBlur={(e) => persist({ marque_handle: e.target.value })}
            />
          </label>
        </div>

        <div className="sap-media-tools">
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            + Image / Vidéo / GIF
          </button>
          <button type="button" className="navlink" onClick={() => logoRef.current?.click()}>
            Logo de marque
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f, "media");
              e.target.value = "";
            }}
          />
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f, "logo");
              e.target.value = "";
            }}
          />
        </div>
        {ad.medias.length ? (
          <ul className="sap-media-list">
            {ad.medias.map((m: Media, i) => (
              <li key={i}>
                <span className="sap-media-chip">{m.type}</span>
                <span className="sap-media-name">{m.url.split("/").pop()}</span>
                <button type="button" className="navlink" onClick={() => removeMedia(i)}>
                  retirer
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="sap-field">
          <span>
            Texte principal
            <em className="sap-count">
              {(ad.texte_principal ?? "").length}/{lim.texte_principal}
            </em>
          </span>
          <textarea
            rows={3}
            defaultValue={ad.texte_principal ?? ""}
            onChange={(e) => onLocalPatch({ texte_principal: e.target.value })}
            onBlur={(e) => persist({ texte_principal: e.target.value })}
          />
        </label>

        <div className="sap-field-row">
          <label className="sap-field">
            <span>
              Titre <em className="sap-count">{(ad.titre ?? "").length}/{lim.titre}</em>
            </span>
            <input
              defaultValue={ad.titre ?? ""}
              onChange={(e) => onLocalPatch({ titre: e.target.value })}
              onBlur={(e) => persist({ titre: e.target.value })}
            />
          </label>
          <label className="sap-field">
            <span>Bouton (CTA)</span>
            <input
              list={`cta-${ad.id}`}
              defaultValue={ad.cta ?? ""}
              placeholder="En savoir plus"
              onChange={(e) => onLocalPatch({ cta: e.target.value })}
              onBlur={(e) => persist({ cta: e.target.value })}
            />
            <datalist id={`cta-${ad.id}`}>
              {CTAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="sap-field-row">
          <label className="sap-field">
            <span>Description du lien</span>
            <input
              defaultValue={ad.description ?? ""}
              onChange={(e) => onLocalPatch({ description: e.target.value })}
              onBlur={(e) => persist({ description: e.target.value })}
            />
          </label>
          <label className="sap-field">
            <span>Domaine affiché</span>
            <input
              defaultValue={ad.lien_libelle ?? ""}
              placeholder="karata.fr"
              onChange={(e) => onLocalPatch({ lien_libelle: e.target.value })}
              onBlur={(e) => persist({ lien_libelle: e.target.value })}
            />
          </label>
        </div>

        <CopyAssistant
          plateforme={ad.plateforme}
          format={ad.format}
          marque={ad.marque_nom ?? ""}
          onApply={applyCopy}
        />

        <div className="sap-savehint">
          {saving === "saving" ? "Enregistrement…" : saving === "saved" ? "Enregistré ✓" : ""}
        </div>

        {(approvals.length > 0 || comments.length > 0) && (
          <div className="sap-feedback">
            {approvals.map((a) => (
              <span key={a.id} className={`sap-badge sap-badge-${a.decision}`}>
                {a.relecteur} : {a.decision === "approuve" ? "Approuvé" : "Révision demandée"}
              </span>
            ))}
            {comments.map((c) => (
              <div key={c.id} className={`sap-comment ${c.resolu ? "resolu" : ""}`}>
                <div>
                  <strong>{c.auteur}</strong> {c.corps}
                </div>
                <button
                  type="button"
                  className="navlink"
                  onClick={() => void resolveCommentAction(planId, c.id, !c.resolu)}
                >
                  {c.resolu ? "rouvrir" : "résoudre"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sap-adcard-preview">
        <SocialPreview ad={ad} />
      </div>
    </div>
  );
}
