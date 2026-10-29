"use client";
import { useRef, useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import Icon from "../Icon";
import s from "./share.module.css";
export default function ShareCampaign({
  campaignId,
  name,
}: {
  campaignId: string;
  name: string;
}) {
  const { data, run } = useWorkspace();
  const [open, setOpen] = useState(false),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false),
    [confirm, setConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const active =
    data?.shareLinks?.some(
      (link) => link.campaign_id === campaignId && link.status === "active",
    ) ?? false;
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  if (data?.actor.kind !== "human" || data.actor.role !== "validator")
    return null;
  async function act(action: "create" | "revoke") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await run({
        type: action === "create" ? "create_share_link" : "revoke_share_link",
        campaignId,
      });
      setUrl(
        action === "create"
          ? new URL(String(result.sharePath), window.location.origin).href
          : "",
      );
      setConfirm(false);
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className={s.trigger}
        title="Partager la campagne"
        aria-label={`Partager la campagne ${name}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="external" size={18} />
      </button>
      <dialog
        ref={dialog}
        className={s.dialog}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        aria-labelledby={`share-${campaignId}`}
      >
        <div className={s.heading}>
          <h2 id={`share-${campaignId}`}>Partager la campagne</h2>
          <button aria-label="Fermer" onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p>{name}</p>
        <p className={s.help}>
          Toute personne disposant du lien peut consulter les annonces, sans
          pouvoir les modifier.
        </p>
        {url ? (
          <>
            <label className={s.label}>
              Lien public
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
              />
            </label>
            <button
              className={s.primary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  setError("Sélectionnez le lien pour le copier.");
                }
              }}
            >
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            className={s.primary}
            onClick={() => (active ? setConfirm(true) : void act("create"))}
          >
            {active ? "Créer un nouveau lien" : "Créer le lien public"}
          </button>
        )}
        {active && !url && (
          <p className={s.help}>
            Un lien est actif. Un nouveau lien remplacera l’ancien.
          </p>
        )}
        {(active || url) && (
          <button
            disabled={busy}
            className={s.revoke}
            onClick={() => setConfirm(true)}
          >
            Révoquer le lien
          </button>
        )}
        {confirm && (
          <div className={s.confirm}>
            <p>
              Le lien actuel cessera de fonctionner, y compris pour les médias.
            </p>
            <button disabled={busy} onClick={() => void act("revoke")}>
              Confirmer la révocation
            </button>
            {!url && (
              <button disabled={busy} onClick={() => void act("create")}>
                Remplacer par un nouveau lien
              </button>
            )}
            <button disabled={busy} onClick={() => setConfirm(false)}>
              Annuler
            </button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </dialog>
    </>
  );
}
