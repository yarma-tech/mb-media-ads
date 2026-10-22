"use client";
import { useEffect, useRef, useState } from "react";
import type { Creative, StudioCampaign } from "@/lib/campaign-studio/types";
import {
  PLATFORM_LABELS,
  PLACEMENT_LABELS,
  reviewCreative,
} from "@/lib/campaign-studio/model";
import { useStudio } from "./StudioProvider";
import CampaignMockup from "./CampaignMockup";
import Icon from "./Icon";
import s from "../studio.module.css";
export default function CreativeEditor({
  campaign,
  creative,
  onClose,
  initialMode = "edit",
  onRequested,
  onBeforeRequested,
}: {
  campaign: StudioCampaign;
  creative: Creative;
  onClose: () => void;
  initialMode?: "edit" | "request";
  onRequested?: () => void;
  onBeforeRequested?: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { update, notify } = useStudio();
  const [copy, setCopy] = useState(creative.copy);
  const [cta, setCta] = useState(
    creative.cta ??
      (creative.platform === "youtube" ? "En savoir plus" : "S’inscrire"),
  );
  const [sending, setSending] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    if (initialMode === "request")
      el?.querySelector<HTMLTextAreaElement>("#creative-comment")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [initialMode]);
  function save() {
    if (!copy.trim()) {
      setError("Le texte ne peut pas être vide.");
      return;
    }
    const changed =
      copy.trim() !== creative.copy ||
      cta !==
        (creative.cta ??
          (creative.platform === "youtube" ? "En savoir plus" : "S’inscrire"));
    update({
      ...campaign,
      creatives: campaign.creatives.map((c) =>
        c.id === creative.id
          ? {
              ...c,
              copy: copy.trim(),
              cta,
              status: changed ? "pending" : c.status,
            }
          : c,
      ),
    });
    notify(
      changed
        ? "Modifications enregistrées. Visuel à valider à nouveau."
        : "Visuel enregistré.",
    );
    onClose();
  }
  return (
    <dialog
      ref={dialog}
      className={s.creativeDialog}
      aria-labelledby="creative-editor-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <button
        className={s.dialogClose}
        onClick={onClose}
        aria-label="Fermer les détails"
      >
        <Icon name="close" />
      </button>
      <div className={s.editorLayout}>
        <div className={s.editorPreview}>
          <CampaignMockup
            campaign={campaign}
            creative={{ ...creative, copy, cta }}
          />
        </div>
        <div className={s.editorFields}>
          <span className={s.eyebrow}>
            {PLATFORM_LABELS[creative.platform]} ·{" "}
            {PLACEMENT_LABELS[creative.placement]}
          </span>
          <h2 id="creative-editor-title">{campaign.name}</h2>
          {initialMode === "edit" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className={s.commentForm}
            >
              <label htmlFor="creative-copy">Texte publicitaire</label>
              <textarea
                id="creative-copy"
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                rows={6}
                maxLength={2200}
              />
              {creative.platform !== "display" ? (
                <>
                  <label htmlFor="creative-cta">Appel à l’action (CTA)</label>
                  <select
                    id="creative-cta"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                  >
                    {[
                      "S’inscrire",
                      "En savoir plus",
                      "Nous contacter",
                      "Réserver",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </>
              ) : (
                <p>
                  Le texte et le CTA intégrés à cette bannière se modifient dans
                  le fichier source.
                </p>
              )}
              {error && (
                <p role="alert" className={s.error}>
                  {error}
                </p>
              )}
              <button className={s.primaryButton}>Enregistrer</button>
            </form>
          )}
          <details
            className={s.reviewComments}
            open={initialMode === "request" ? true : undefined}
          >
            <summary>
              Demander une modification
              {creative.comments.length ? ` (${creative.comments.length})` : ""}
            </summary>
            <form
              className={s.commentForm}
              onSubmit={async (e) => {
                e.preventDefault();
                if (sending) return;
                try {
                  const revised = reviewCreative(
                    campaign,
                    creative.id,
                    "changes_requested",
                    comment,
                  );
                  setSending(true);
                  dialog.current?.close();
                  await onBeforeRequested?.();
                  update(revised);
                  notify("Demande enregistrée.");
                  onRequested?.();
                  onClose();
                } catch (cause) {
                  setSending(false);
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "Action impossible.",
                  );
                }
              }}
            >
              {error && initialMode === "request" && (
                <p role="alert" className={s.error}>
                  {error}
                </p>
              )}
              <label htmlFor="creative-comment">Commentaire</label>
              <textarea
                id="creative-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <button className={s.secondaryButton} disabled={sending}>
                Envoyer la demande
              </button>
            </form>
            {creative.comments.map((c) => (
              <p key={c.id}>{c.text}</p>
            ))}
          </details>
        </div>
      </div>
    </dialog>
  );
}
