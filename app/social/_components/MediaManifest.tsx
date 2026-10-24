"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Ad } from "@/lib/social-ads/types";
import { buildMediaManifest, matchMediaFiles } from "@/lib/social-ads/manifest";
import { createUploadUrlAction, attachMediaAction } from "../actions";
import { getBrowserClient } from "@/lib/supabase";
export default function MediaManifest({
  planId,
  ads,
}: {
  planId: string;
  ads: Ad[];
}) {
  const router = useRouter();
  const slots = buildMediaManifest(ads);
  const [manual, setManual] = useState<{ file: File; reason: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function attach(file: File, key: string) {
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
    if (!(await attachMediaAction(planId, key, signed.path)))
      throw new Error("Association refusée.");
  }
  async function files(selected: File[]) {
    setBusy(true);
    setMessage("");
    const matches = matchMediaFiles(
      slots,
      selected.map((f) => f.name),
    );
    try {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (match.status === "matched")
          await attach(selected[i], match.slotKey);
        else
          setManual((m) => [
            ...m,
            {
              file: selected[i],
              reason:
                match.status === "ambiguous"
                  ? "Nom ambigu: choisissez le ratio / la carte."
                  : "Aucune correspondance: choisissez un emplacement.",
            },
          ]);
      }
      setMessage("Dépôt traité.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Dépôt impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="sa-panel" open>
      <summary>
        Visuels · {slots.filter((s) => !s.complete).length} à fournir
      </summary>
      <p>
        Images et captures vidéo, maximum 50 Mo. Les variantes de ratio
        demandent un choix explicite.
      </p>
      <label
        className="sa-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) void files([...e.dataTransfer.files]);
        }}
      >
        <span>Déposer plusieurs images</span>
        <input
          type="file"
          multiple
          disabled={busy}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => e.target.files && void files([...e.target.files])}
        />
      </label>
      <ul className="sa-slot-list">
        {slots.map((s) => (
          <li
            key={s.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              if (busy) return;
              const rawIndex = e.dataTransfer.getData(
                "application/x-sa-manual",
              );
              const index = rawIndex === "" ? -1 : Number(rawIndex);
              const item = manual[index];
              const file = e.dataTransfer.files[0] || item?.file;
              if (!file) return;
              setBusy(true);
              try {
                await attach(file, s.key);
                if (item)
                  setManual((items) => items.filter((_, n) => n !== index));
                router.refresh();
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Association impossible.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <strong>{s.reference}</strong> · {s.ratio} ·{" "}
            {s.complete ? "Fourni" : "Manquant"}
            <br />
            <small>
              {s.destinations
                .map(
                  (d) =>
                    `${d.plateforme} / ${d.placement}${d.cardIndex !== null ? ` / carte ${d.cardIndex + 1}` : ""}`,
                )
                .join(", ")}
            </small>
          </li>
        ))}
      </ul>
      {manual.map((m, i) => (
        <div
          className="sa-manual"
          key={`${m.file.name}-${i}`}
          draggable={!busy}
          onDragStart={(e) =>
            e.dataTransfer.setData("application/x-sa-manual", String(i))
          }
        >
          <strong>{m.file.name}</strong>
          <p>{m.reason}</p>
          <select
            aria-label={`Associer ${m.file.name}`}
            defaultValue=""
            disabled={busy}
            onChange={async (e) => {
              const key = e.target.value;
              if (!key) return;
              setBusy(true);
              try {
                await attach(m.file, key);
                setManual((items) => items.filter((_, n) => n !== i));
                router.refresh();
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Association impossible.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <option value="">Choisir un emplacement</option>
            {slots.map((s) => (
              <option key={s.key} value={s.key}>
                {s.reference} · {s.ratio}
              </option>
            ))}
          </select>
        </div>
      ))}
      <p role="status">{busy ? "Envoi des visuels…" : message}</p>
    </details>
  );
}
