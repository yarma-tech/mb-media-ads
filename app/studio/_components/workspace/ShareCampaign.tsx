"use client";
import { useRef, useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import Icon from "../Icon";
import s from "./share.module.css";
export default function ShareCampaign({
  campaignId,
  name,
  labeled = false,
}: {
  campaignId: string;
  name: string;
  labeled?: boolean;
}) {
  const { data, run } = useWorkspace();
  const [open, setOpen] = useState(false),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false),
    [confirm, setConfirm] = useState(false);
  const [mode, setMode] = useState<"validation" | "presentation">("validation");
  const [scope, setScope] = useState<"video" | "all">("all");
  const campaign = data?.campaigns.find((item) => item.id === campaignId);
  const count =
    campaign?.status === "active"
      ? campaign.ads.filter(
          (ad) =>
            ad.status === "pending" &&
            (scope === "all" ||
              campaign.media.some(
                (media) =>
                  media.id === ad.mediaId && media.mime.startsWith("video/"),
              )),
        ).length
      : 0;
  const params = new URLSearchParams({
    campagne: campaignId,
    statut: "pending",
  });
  if (scope === "video") params.set("media", "video");
  const validationUrl =
    (typeof window === "undefined" ? "" : window.location.origin) +
    "/studio/validation?" +
    params;
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setError("Sélectionnez le lien pour le copier.");
    }
  }
  const dialog = useRef<HTMLDialogElement>(null);
  const active =
    data?.shareLinks?.some(
      (link) => link.campaign_id === campaignId && link.status === "active",
    ) ?? false;
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  if (data?.actor.kind !== "human") return null;
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
        className={`${s.trigger} ${labeled ? s.labeled : ""}`}
        title="Partager la campagne"
        aria-label={`Partager la campagne ${name}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="link" size={18} />
        {labeled && <span>Demander une validation</span>}
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
        {data.actor.role === "validator" && (
          <label className={s.label}>
            Type de lien
            <select
              aria-label="Type de lien"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as "validation" | "presentation");
                setCopied(false);
                setError("");
              }}
            >
              <option value="validation">Validation avec connexion</option>
              <option value="presentation">Présentation publique</option>
            </select>
          </label>
        )}
        {mode === "validation" || data.actor.role !== "validator" ? (
          <>
            <label className={s.label}>
              Annonces à partager
              <select
                aria-label="Annonces à partager"
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value as "video" | "all");
                  setCopied(false);
                }}
              >
                <option value="video">Vidéos uniquement</option>
                <option value="all">Toutes les annonces</option>
              </select>
            </label>
            <p className={s.help}>
              Connexion requise avec un compte Validateur pour approuver,
              commenter ou modifier.
            </p>
            <p role="status">
              {count
                ? `${count} annonce${count > 1 ? "s" : ""} à valider`
                : "Aucune annonce à valider dans cette sélection."}
            </p>
            <label className={s.label}>
              Lien de validation
              <input
                readOnly
                value={validationUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
            <button
              className={s.primary}
              disabled={!count}
              onClick={() => void copy(validationUrl)}
            >
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </>
        ) : (
          <>
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
                  Le lien actuel cessera de fonctionner, y compris pour les
                  médias.
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
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </dialog>
    </>
  );
}
