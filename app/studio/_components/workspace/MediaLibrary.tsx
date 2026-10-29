/* eslint-disable @next/next/no-img-element -- Private signed originals. */
"use client";
import { useState, useRef, useEffect, type DragEvent } from "react";
import { Upload } from "tus-js-client";
import type {
  Campaign,
  Channel,
  Media,
} from "@/lib/campaign-studio/workspace/types";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import {
  compatibleFormats,
  mediaChannels,
  CHANNELS,
} from "@/lib/campaign-studio/workspace/catalog";
import { useWorkspace } from "./WorkspaceProvider";
import w from "./workspace.module.css";
import mstyles from "./media.module.css";
import Icon from "../Icon";
import ChannelIcon from "./ChannelIcon";
import { MEDIA_LIMIT_MB } from "@/lib/campaign-studio/workspace/upload-limits";
import { mediaAdPlan } from "@/lib/campaign-studio/workspace/media-batch";
import { uploadFile } from "./upload";
export default function MediaLibrary({
  campaign,
  channel,
  onCreate,
  onAssign,
  channels,
  batchMode = false,
  onAllCreated,
  onBusyChange,
  onTextStart,
}: {
  campaign: Campaign;
  channel: Channel;
  onCreate: (media: Media, formats: string[]) => Promise<void>;
  onAssign?: (id: string) => void;
  channels?: Channel[];
  batchMode?: boolean;
  onAllCreated?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onTextStart?: () => void;
}) {
  const {
    data,
    run,
    refresh,
    notify,
    pending: commandPending,
  } = useWorkspace();
  const [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState<{
      kind: "transfer" | "verification" | "preview";
      mediaId: string | null;
      message: string;
    } | null>(null);
  const [fileErrors, setFileErrors] = useState<
    { name: string; mediaId: string | null; message: string }[]
  >([]);
  const targets = channels ?? [channel];
  const placements = mediaAdPlan(campaign, targets);
  type Activity =
    | { type: "idle" }
    | { type: "creating" }
    | { type: "uploading"; current: number; total: number; name: string };
  const [activity, setActivityState] = useState<Activity>({ type: "idle" });
  const activityRef = useRef<Activity>({ type: "idle" });
  function setActivity(next: Activity) {
    activityRef.current = next;
    setActivityState(next);
  }
  const creating = activity.type === "creating";
  const queue = activity.type === "uploading" ? activity : null;
  useEffect(() => {
    onBusyChange?.(activity.type !== "idle");
  }, [activity.type, onBusyChange]);
  async function createAll() {
    if (activityRef.current.type !== "idle" || !placements.length) return;
    setActivity({ type: "creating" });
    try {
      const result = await run({
        type: "add_media_batch",
        campaignId: campaign.id,
        channels: targets,
        mediaIds: [...new Set(placements.map((p) => p.mediaId))],
      });
      notify(
        `${result.created} ${result.created === 1 ? "annonce créée" : "annonces créées"}.`,
      );
      onAllCreated?.();
    } catch {
      /* The provider announces the error; an explicit retry is safe and deduplicated on the server. */
    } finally {
      setActivity({ type: "idle" });
    }
  }
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<Upload | null>(null);
  const [transfer, setTransfer] = useState<
    | { stage: "idle" | "preparing" | "uploading" | "paused" }
    | { stage: "verifying"; mediaId: string }
  >({ stage: "idle" });
  async function upload(file: File) {
    setProgress(0);
    setTransfer({ stage: "preparing" });
    setError(null);
    let mediaId: string | null = null;
    let phase: "transfer" | "verification" = "transfer";
    try {
      const media = await uploadFile(
        file,
        campaign,
        channel,
        run,
        setProgress,
        (transfer, media) => {
          mediaId = media.id;
          pending.current = transfer;
          setTransfer({ stage: "uploading" });
        },
        (media) => {
          mediaId = media.id;
          phase = "verification";
          setTransfer({ stage: "verifying", mediaId: media.id });
        },
        channels,
      );
      if (media.state === "ready") {
        if (!batchMode)
          notify("Média vérifié. Choisissez les placements à créer.");
      } else
        setError({
          kind: "verification",
          mediaId: media.id,
          message: media.errors.join(" ") || "Le fichier n’est pas conforme.",
        });
    } catch (e) {
      return {
        name: file.name,
        mediaId,
        message: workspaceErrorMessage(e, phase),
      };
    } finally {
      pending.current = null;
      setProgress(null);
      setTransfer({ stage: "idle" });
    }
  }

  async function verify(media: Media) {
    try {
      const result = await run({
        type: "verify_media",
        campaignId: campaign.id,
        mediaId: media.id,
      });
      const verified = (result.campaign as Campaign).media.find(
        (m) => m.id === media.id,
      );
      if (verified?.state === "ready") {
        setError((current) =>
          current?.mediaId === media.id && current.kind !== "preview"
            ? null
            : current,
        );
        setFileErrors((current) =>
          current.filter((failure) => failure.mediaId !== media.id),
        );
        if (!batchMode)
          notify("Média vérifié. Choisissez les placements à créer.");
      } else {
        setError({
          kind: "verification",
          mediaId: media.id,
          message:
            verified?.errors.join(" ") || "Le fichier n’a pas pu être vérifié.",
        });
      }
    } catch (e) {
      setError({
        kind: "verification",
        mediaId: media.id,
        message: workspaceErrorMessage(e, "verification"),
      });
    }
  }
  async function reloadPreview(media: Media) {
    try {
      await refresh();
      setError((current) =>
        current?.kind === "preview" && current.mediaId === media.id
          ? null
          : current,
      );
    } catch (e) {
      setError({
        kind: "preview",
        mediaId: media.id,
        message: workspaceErrorMessage(e, "preview"),
      });
    }
  }

  async function files(incoming: File[]) {
    if (!incoming.length || activityRef.current.type !== "idle") return;
    setFileErrors((current) =>
      current.filter(
        (failure) => !incoming.some((file) => file.name === failure.name),
      ),
    );
    try {
      for (const [index, file] of incoming.entries()) {
        setActivity({
          type: "uploading",
          current: index + 1,
          total: incoming.length,
          name: file.name,
        });
        const failure = await upload(file);
        if (failure) setFileErrors((current) => [...current, failure]);
      }
    } finally {
      setActivity({ type: "idle" });
    }
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    if (transfer.stage === "idle") void files(Array.from(e.dataTransfer.files));
  }
  return (
    <section
      className={`${w.library} ${batchMode ? `${w.batchLibrary} ${mstyles.batch}` : ""}`}
      aria-label={
        batchMode
          ? "Bibliothèque des canaux sélectionnés"
          : "Bibliothèque du canal"
      }
    >
      <div className={batchMode ? w.srOnly : w.heading}>
        <h2 tabIndex={batchMode ? -1 : undefined}>
          {batchMode ? "Ajouter vos visuels" : "Bibliothèque du canal"}
        </h2>
        <span>Images et vidéos finales · {MEDIA_LIMIT_MB} Mo max.</span>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
        hidden
        onChange={(e) => {
          const incoming = Array.from(e.target.files ?? []);
          e.target.value = "";
          void files(incoming);
        }}
      />
      <div
        className={w.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={drop}
      >
        {batchMode && (
          <span className={mstyles.uploadIcon} aria-hidden="true">
            <Icon
              name="download"
              size={42}
              style={{ transform: "rotate(180deg)" }}
            />
          </span>
        )}
        <button
          aria-label="Déposer des médias"
          disabled={!!queue || creating || transfer.stage !== "idle"}
          onClick={() => input.current?.click()}
        >
          {batchMode ? "Déposer vos fichiers" : "Déposer des médias"}
        </button>
        {batchMode ? (
          <>
            <span>
              ou{" "}
              <button
                className={mstyles.browse}
                disabled={!!queue || creating || transfer.stage !== "idle"}
                onClick={() => input.current?.click()}
              >
                parcourir
              </button>
            </span>
            <small>Images et vidéos · {MEDIA_LIMIT_MB} Mo max.</small>
          </>
        ) : (
          <span>ou glissez vos fichiers ici</span>
        )}
      </div>
      {queue && (
        <p role="status" className={w.uploadQueue}>
          Fichier {queue.current} sur {queue.total} · {queue.name}
        </p>
      )}
      {progress !== null && (
        <div role="status" className={w.inline}>
          <progress
            aria-label={
              transfer.stage === "preparing"
                ? "Préparation du transfert"
                : transfer.stage === "verifying"
                  ? "Vérification du fichier"
                  : "Transfert du fichier"
            }
            max={100}
            value={
              transfer.stage === "verifying" || transfer.stage === "preparing"
                ? undefined
                : progress
            }
          />
          <span>
            {transfer.stage === "preparing"
              ? "Préparation du transfert…"
              : transfer.stage === "verifying"
                ? "Vérification du fichier…"
                : `${progress} %`}
          </span>
          {(transfer.stage === "uploading" || transfer.stage === "paused") && (
            <button
              onClick={() => {
                if (transfer.stage === "uploading") {
                  void pending.current?.abort();
                  setTransfer({ stage: "paused" });
                } else {
                  pending.current?.start();
                  setTransfer({ stage: "uploading" });
                }
              }}
            >
              {transfer.stage === "paused" ? "Reprendre" : "Pause"}
            </button>
          )}
        </div>
      )}
      {(error || fileErrors.length > 0) && (
        <div role="alert" className={w.error}>
          {fileErrors.map((failure) => (
            <p key={failure.name}>
              <b>{failure.name}</b> : <span>{failure.message}</span>
            </p>
          ))}
          {error &&
            !fileErrors.some(
              (failure) =>
                failure.mediaId === error.mediaId &&
                failure.message === error.message,
            ) && <p>{error.message}</p>}
        </div>
      )}
      <div className={`${w.importActions} ${batchMode ? mstyles.footer : ""}`}>
        {batchMode && onTextStart && (
          <button
            className={mstyles.textStart}
            aria-label="Saisir les textes sans médias"
            disabled={!!queue || creating}
            onClick={onTextStart}
          >
            <span aria-hidden="true">Tт</span> Commencer par les textes
          </button>
        )}
        {batchMode && (
          <span className={mstyles.count}>
            {
              campaign.media.filter((m) =>
                targets.some((t) => mediaChannels(m).includes(t)),
              ).length
            }{" "}
            fichiers · {placements.length} annonces
          </span>
        )}
        <button
          className={w.primary}
          disabled={
            !placements.length ||
            !!queue ||
            creating ||
            commandPending("add_media_batch", campaign.id)
          }
          onClick={() => void createAll()}
        >
          {creating
            ? "Création…"
            : placements.length
              ? placements.length === 1
                ? "Créer l’annonce"
                : `Créer les ${placements.length} annonces`
              : "Créer toutes les annonces"}
          {batchMode && <Icon name="arrow" size={24} />}
        </button>
        <span className={batchMode ? w.srOnly : undefined}>
          {placements.length
            ? "Tous les formats compatibles, sans sélection fichier par fichier."
            : campaign.media.some(
                  (m) =>
                    m.state === "ready" &&
                    targets.some((t) => mediaChannels(m).includes(t)),
                )
              ? "Aucune nouvelle annonce compatible à créer."
              : "Les formats compatibles seront reconnus après le dépôt."}
        </span>
      </div>
      <div className={w.mediaList}>
        {campaign.media
          .filter((m) =>
            targets.some((target) => mediaChannels(m).includes(target)),
          )
          .map((m) => {
            const formats = compatibleFormats(m, channel);
            const verifying =
              m.state === "uploading" &&
              ((transfer.stage === "verifying" && transfer.mediaId === m.id) ||
                commandPending("verify_media", campaign.id, m.id));
            return (
              <article key={m.id}>
                <div className={w.mediaThumb}>
                  {data?.mediaUrls[m.id] ? (
                    m.mime.startsWith("video/") ? (
                      <video
                        src={data.mediaUrls[m.id]}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img src={data.mediaUrls[m.id]} alt={m.name} />
                    )
                  ) : (
                    <span>
                      {verifying
                        ? "Vérification en cours…"
                        : m.state === "uploading"
                          ? "Transfert à terminer"
                          : m.state === "ready"
                            ? "Préparation de l’aperçu…"
                            : "Non conforme"}
                    </span>
                  )}
                </div>
                {m.state === "ready" && !data?.mediaUrls[m.id] && (
                  <button onClick={() => void reloadPreview(m)}>
                    Recharger l’aperçu
                  </button>
                )}
                <b>{m.name}</b>
                <small>
                  {m.width && m.height ? `${m.width} × ${m.height} px` : ""}
                  {!batchMode && ` · ${(m.bytes / 1000000).toFixed(1)} Mo`}
                </small>
                {m.state === "invalid" && (
                  <p className={w.error}>{m.errors.join(" ")}</p>
                )}
                {m.state === "uploading" && !verifying && (
                  <button onClick={() => void verify(m)}>
                    Vérifier le transfert
                  </button>
                )}
                {m.state === "ready" && (
                  <>
                    {batchMode ? (
                      <div className={mstyles.recognized}>
                        <span>
                          <Icon name="check" size={15} /> Format reconnu
                        </span>
                        <span className={mstyles.mediaChannels}>
                          {targets
                            .filter((target) =>
                              mediaChannels(m).includes(target),
                            )
                            .map((target) => (
                              <span key={target} title={CHANNELS[target]}>
                                <ChannelIcon channel={target} size={24} />
                              </span>
                            ))}
                        </span>
                        <details className={mstyles.formats}>
                          <summary
                            aria-label={`Formats reconnus pour ${m.name}`}
                            title="Formats reconnus"
                          >
                            <Icon name="more" />
                          </summary>
                          <div>
                            {targets
                              .filter((target) =>
                                mediaChannels(m).includes(target),
                              )
                              .map((target) => {
                                const detected = compatibleFormats(m, target);
                                if (!detected.length) return null;
                                return (
                                  <p key={target}>
                                    <b>{CHANNELS[target]}</b>
                                    <span>
                                      {detected.map((f) => f.label).join(" · ")}
                                    </span>
                                  </p>
                                );
                              })}
                          </div>
                        </details>
                        {targets
                          .filter(
                            (target) =>
                              mediaChannels(m).includes(target) &&
                              !compatibleFormats(m, target).length,
                          )
                          .map((target) => (
                            <p className={mstyles.incompatible} key={target}>
                              {CHANNELS[target]} ·{" "}
                              <span>Non compatible avec ce canal</span>
                            </p>
                          ))}
                      </div>
                    ) : (
                      <>
                        <fieldset>
                          <legend>Placements compatibles</legend>
                          {formats.map((f) => (
                            <label key={f.id}>
                              <input
                                type="checkbox"
                                checked={(choices[m.id] ?? []).includes(f.id)}
                                onChange={(e) =>
                                  setChoices({
                                    ...choices,
                                    [m.id]: e.target.checked
                                      ? [...(choices[m.id] ?? []), f.id]
                                      : (choices[m.id] ?? []).filter(
                                          (id) => id !== f.id,
                                        ),
                                  })
                                }
                              />
                              {f.label}
                            </label>
                          ))}
                        </fieldset>
                        <button
                          disabled={
                            !(choices[m.id] ?? []).length ||
                            commandPending("add", campaign.id)
                          }
                          onClick={() =>
                            void onCreate(m, choices[m.id] ?? []).catch(
                              () => {},
                            )
                          }
                        >
                          {commandPending("add", campaign.id)
                            ? "Création…"
                            : "Créer les annonces choisies"}
                        </button>
                      </>
                    )}
                    {onAssign && (
                      <button onClick={() => onAssign(m.id)}>
                        Associer à la ligne active
                      </button>
                    )}
                  </>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
