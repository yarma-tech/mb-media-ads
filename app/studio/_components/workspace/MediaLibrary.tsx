/* eslint-disable @next/next/no-img-element -- Private signed originals. */
"use client";
import { useState, useRef, type DragEvent } from "react";
import { Upload } from "tus-js-client";
import type {
  Campaign,
  Channel,
  Media,
} from "@/lib/campaign-studio/workspace/types";
import { compatibleFormats } from "@/lib/campaign-studio/workspace/catalog";
import { useWorkspace } from "./WorkspaceProvider";
import w from "./workspace.module.css";
import { MEDIA_LIMIT_MB } from "@/lib/campaign-studio/workspace/upload-limits";
import { uploadFile } from "./upload";
export default function MediaLibrary({
  campaign,
  channel,
  onCreate,
  onAssign,
}: {
  campaign: Campaign;
  channel: Channel;
  onCreate: (media: Media, formats: string[]) => Promise<void>;
  onAssign?: (id: string) => void;
}) {
  const { data, run, notify } = useWorkspace();
  const [progress, setProgress] = useState<number | null>(null),
    [error, setError] = useState("");
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef<Upload | null>(null);
  const [transfer, setTransfer] = useState<"idle" | "uploading" | "paused">(
    "idle",
  );
  async function upload(file: File) {
    setProgress(0);
    setTransfer("uploading");
    setError("");
    try {
      const media = await uploadFile(
        file,
        campaign,
        channel,
        run,
        setProgress,
        (transfer) => {
          pending.current = transfer;
        },
      );
      if (media.state === "ready")
        notify("Média vérifié. Choisissez les placements à créer.");
      else setError(media.errors.join(" "));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = null;
      setProgress(null);
      setTransfer("idle");
    }
  }

  async function files(files: FileList | null) {
    if (!files) return;
    for (const file of files) await upload(file);
  }
  function drop(e: DragEvent) {
    e.preventDefault();
    if (transfer === "idle") void files(e.dataTransfer.files);
  }
  return (
    <section className={w.library}>
      <div className={w.heading}>
        <h2>Bibliothèque du canal</h2>
        <span>Images et vidéos finales · {MEDIA_LIMIT_MB} Mo max.</span>
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
        hidden
        onChange={(e) => void files(e.target.files)}
      />
      <div
        className={w.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={drop}
      >
        <button
          disabled={transfer !== "idle"}
          onClick={() => input.current?.click()}
        >
          Déposer des médias
        </button>
        <span>ou glissez vos fichiers ici</span>
      </div>
      {progress !== null && (
        <div role="status" className={w.inline}>
          <progress max={100} value={progress} />
          <span>{progress} %</span>
          <button
            onClick={() => {
              if (transfer === "uploading") {
                void pending.current?.abort();
                setTransfer("paused");
              } else {
                pending.current?.start();
                setTransfer("uploading");
              }
            }}
          >
            {transfer === "paused" ? "Reprendre" : "Pause"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={w.error}>
          {error}
        </p>
      )}
      <div className={w.mediaList}>
        {campaign.media
          .filter((m) => m.channel === channel)
          .map((m) => {
            const formats = compatibleFormats(m, channel);
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
                      {m.state === "uploading"
                        ? "Transfert à terminer"
                        : "Non conforme"}
                    </span>
                  )}
                </div>
                <b>{m.name}</b>
                <small>
                  {m.width && m.height ? `${m.width} × ${m.height}` : ""} ·{" "}
                  {(m.bytes / 1000000).toFixed(1)} Mo
                </small>
                {m.state === "invalid" && (
                  <p className={w.error}>{m.errors.join(" ")}</p>
                )}
                {m.state === "uploading" && (
                  <button
                    onClick={() =>
                      void run({
                        type: "verify_media",
                        campaignId: campaign.id,
                        mediaId: m.id,
                      }).catch(() => {})
                    }
                  >
                    Vérifier le transfert
                  </button>
                )}
                {m.state === "ready" && (
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
                      disabled={!(choices[m.id] ?? []).length}
                      onClick={() => void onCreate(m, choices[m.id] ?? [])}
                    >
                      Créer les annonces choisies
                    </button>
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
