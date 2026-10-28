"use client";
import { useState, useRef, useEffect, type MutableRefObject } from "react";
import Link from "next/link";
import CreateCampaign from "./CreateCampaign";
import CampaignInfoForm from "./CampaignInfoForm";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import type {
  Ad,
  AdFields,
  Campaign,
  Channel,
  Media,
} from "@/lib/campaign-studio/workspace/types";
import {
  CATALOG,
  CHANNELS,
  compatibleFormats,
  mediaChannels,
} from "@/lib/campaign-studio/workspace/catalog";
import { isComplete } from "@/lib/campaign-studio/workspace/workflow";
import { useWorkspace } from "./WorkspaceProvider";
import { useAdEditor } from "./useAdEditor";
import Preview from "./Preview";
import History from "./History";
import MediaLibrary from "./MediaLibrary";
import { uploadFile } from "./upload";
import w from "./workspace.module.css";
export const STATUS = {
  draft: "Brouillon",
  pending: "À valider",
  approved: "Approuvée",
  changes_requested: "Modification demandée",
  on_air: "On air",
  stopped: "Arrêtée",
};
export default function Configuration() {
  const { data } = useWorkspace();
  const { params, update, href } = useWorkspaceNavigation();
  const id = params.get("campagne");
  const campaign =
    !id || id === "all"
      ? data!.campaigns[0]
      : data!.campaigns.find((c) => c.id === id);
  if (!campaign)
    return (
      <div className={w.empty}>
        <p>
          {data!.campaigns.length
            ? "Sélectionnez une campagne disponible depuis la Home."
            : "Créez votre première campagne pour commencer."}
        </p>
        {data!.campaigns.length ? (
          <Link href={href("/studio", { campagne: "" })}>
            Voir les campagnes
          </Link>
        ) : (
          <CreateCampaign />
        )}
      </div>
    );
  return (
    <>
      <div className={w.toolbar}>
        <select
          aria-label="Campagne à configurer"
          value={campaign.id}
          onChange={(e) =>
            update({ campagne: e.target.value, etape: "", canaux: "" })
          }
        >
          {data!.campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span>Configuration</span>
      </div>
      <CampaignEditor key={campaign.id} campaign={campaign} />
    </>
  );
}
type ConfigurationStage = "details" | "channels" | "media" | "editor";
function CampaignEditor({ campaign: c }: { campaign: Campaign }) {
  const { params, update } = useWorkspaceNavigation();
  const { run } = useWorkspace();
  const allChannels = Object.keys(CHANNELS) as Channel[];
  const fromUrl = (params.get("canaux") ?? "")
    .split(",")
    .filter((id): id is Channel => allChannels.includes(id as Channel));
  const [chosen, setChosen] = useState<Channel[]>(() =>
    fromUrl.length
      ? [...new Set(fromUrl)]
      : [
          ...new Set([
            ...c.ads.map((a) => a.channel),
            ...c.media.flatMap(mediaChannels),
          ]),
        ],
  );
  const requestedStage = params.get("etape");
  const stage =
    c.status === "finished"
      ? "editor"
      : requestedStage === "details" ||
          requestedStage === "channels" ||
          requestedStage === "media" ||
          requestedStage === "editor"
        ? requestedStage
        : c.ads.length
          ? "editor"
          : c.media.length
            ? "media"
            : "details";
  function setStage(etape: ConfigurationStage) {
    update({ etape });
  }
  const [importing, setImporting] = useState(false);
  const step = useRef<HTMLElement>(null);
  useEffect(() => {
    step.current?.querySelector<HTMLHeadingElement>("h2")?.focus();
  }, [stage]);
  const channel = (
    allChannels.includes(params.get("canal") as Channel)
      ? params.get("canal")
      : (fromUrl[0] ?? "facebook")
  ) as Channel;
  function continueToMedia() {
    update({
      canaux: chosen.join(","),
      canal: chosen[0],
      etape:
        !c.ads.length && chosen.some((id) => id !== "google")
          ? "media"
          : "editor",
    });
  }
  const steps = (
    <CampaignSteps
      stage={stage}
      onChange={setStage}
      disabled={importing || c.status === "finished"}
    />
  );
  if (stage === "details")
    return (
      <>
        {steps}
        <section
          ref={step}
          className={w.campaignStart}
          aria-label="Informations de la campagne"
        >
          <h2 tabIndex={-1}>Marque et campagne</h2>
          <CampaignInfoForm
            campaign={c}
            onContinue={() => setStage("channels")}
          />
        </section>
      </>
    );
  if (stage === "channels")
    return (
      <>
        {steps}
        <section
          ref={step}
          className={w.channelStart}
          aria-label="Choisir les canaux de la campagne"
        >
          <div>
            <h2 tabIndex={-1}>Sur quels canaux ?</h2>
            <p>Choisissez un ou plusieurs canaux.</p>
          </div>
          <div
            role="group"
            aria-label="Choisir les canaux"
            className={w.channelChoices}
          >
            {allChannels.map((id) => (
              <button
                key={id}
                aria-pressed={chosen.includes(id)}
                onClick={() =>
                  setChosen(
                    allChannels.filter((candidate) =>
                      candidate === id
                        ? !chosen.includes(id)
                        : chosen.includes(candidate),
                    ),
                  )
                }
              >
                {CHANNELS[id]}
                <span aria-hidden="true">
                  {chosen.includes(id) ? "✓" : "+"}
                </span>
              </button>
            ))}
          </div>
          <div className={w.inline}>
            <button
              className={w.primary}
              disabled={!chosen.length}
              onClick={continueToMedia}
            >
              Continuer
            </button>
            {(c.ads.length > 0 || c.media.length > 0) && (
              <button
                onClick={() => setStage(c.ads.length ? "editor" : "media")}
              >
                Annuler
              </button>
            )}
          </div>
        </section>
      </>
    );
  if (stage === "media") {
    const mediaTargets = chosen.filter((id) => id !== "google");
    return (
      <>
        {steps}
        <section
          ref={step}
          className={w.mediaStart}
          aria-label="Préparer les annonces depuis les médias"
        >
          <div className={w.heading}>
            <span>{chosen.map((id) => CHANNELS[id]).join(" · ")}</span>
            <button disabled={importing} onClick={() => setStage("channels")}>
              Modifier les canaux
            </button>
          </div>
          {mediaTargets.length > 0 && (
            <MediaLibrary
              campaign={c}
              channel={mediaTargets[0]}
              channels={mediaTargets}
              batchMode
              onBusyChange={setImporting}
              onAllCreated={() =>
                update({ etape: "editor", canal: mediaTargets[0] })
              }
              onCreate={async (media, formats) => {
                await run({
                  type: "add",
                  campaignId: c.id,
                  channel: mediaTargets[0],
                  mediaId: media.id,
                  formats,
                });
              }}
            />
          )}
          {chosen.includes("google") && (
            <p>
              Google SEM : les annonces texte se complètent dans le tableau.
            </p>
          )}
          <button
            className={w.textOnly}
            disabled={importing}
            onClick={() => setStage("editor")}
          >
            Saisir les textes sans médias
          </button>
        </section>
      </>
    );
  }
  const visible = fromUrl.length ? fromUrl : allChannels;
  return (
    <>
      {steps}
      {c.status === "active" && (
        <div className={w.setupActions}>
          <button
            onClick={() => {
              if (!chosen.length) setStage("channels");
              else
                setStage(
                  chosen.some((id) => id !== "google") ? "media" : "channels",
                );
            }}
          >
            Ajouter des médias en lot
          </button>
        </div>
      )}
      <ChannelEditor
        key={channel}
        campaign={c}
        channel={channel}
        visibleChannels={visible}
        setChannel={(canal) => update({ canal })}
      />
    </>
  );
}
function CampaignSteps({
  stage,
  onChange,
  disabled,
}: {
  stage: ConfigurationStage;
  onChange: (stage: ConfigurationStage) => void;
  disabled: boolean;
}) {
  const current = stage === "details" ? 1 : stage === "channels" ? 2 : 3;
  const steps = [
    { label: "Campagne", stage: "details" },
    { label: "Canaux", stage: "channels" },
    { label: "Annonces", stage: "editor" },
  ] as const;
  return (
    <nav aria-label="Étapes de configuration" className={w.campaignSteps}>
      <ol>
        {steps.map((item, index) => (
          <li key={item.stage}>
            <button
              disabled={disabled || index + 1 > current}
              aria-current={index + 1 === current ? "step" : undefined}
              onClick={() => {
                if (index + 1 !== current) onChange(item.stage);
              }}
            >
              {index + 1} {item.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ChannelEditor({
  campaign: c,
  channel,
  setChannel,
  visibleChannels,
}: {
  campaign: Campaign;
  channel: Channel;
  setChannel: (channel: Channel) => void;
  visibleChannels: Channel[];
}) {
  const { run, notify, pending } = useWorkspace();
  const [formats, setFormats] = useState<string[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [activeId, setActiveId] = useState(""),
    [unlocked, setUnlocked] = useState<string[]>([]),
    [batch, setBatch] = useState(false);
  const channelTabs = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = channelTabs.current;
    const active = nav?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    if (!nav || !active) return;
    const reveal = () => {
      const bounds = nav.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.left < bounds.left || tab.right > bounds.right) {
        nav.scrollLeft +=
          tab.left < bounds.left
            ? tab.left - bounds.left - 4
            : tab.right - bounds.right + 4;
      }
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(nav);
    observer.observe(active);
    return () => observer.disconnect();
  }, [channel]);
  const rows = c.ads.filter((a) => a.channel === channel);
  const active = rows.find((a) => a.id === activeId) ?? rows[0];
  const activeReady =
    active &&
    !["on_air", "stopped"].includes(active.status) &&
    (active.status !== "approved" || unlocked.includes(active.id)) &&
    c.status === "active";
  const [field, setField] = useState("copy"),
    [batchValue, setBatchValue] = useState(""),
    [replace, setReplace] = useState(false);
  const command = (values: Record<string, unknown>) =>
    run({ campaignId: c.id, ...values });
  const flushRef = useRef<null | (() => Promise<unknown>)>(null);
  const submitting = useRef(false);
  const [submission, setSubmission] = useState<"idle" | "sending">("idle");
  async function submit(ids: string[]) {
    if (submitting.current) return;
    submitting.current = true;
    setSubmission("sending");
    try {
      await flushRef.current?.();
      const r = await command({ type: "submit", adIds: ids });
      const skipped = r.skipped as unknown[];
      notify(
        `${ids.length - skipped.length} annonce(s) envoyée(s). ${skipped.length ? skipped.length + " annonce(s) à compléter ou déjà soumise(s)." : ""}`,
      );
    } finally {
      submitting.current = false;
      setSubmission("idle");
    }
  }
  return (
    <>
      <nav
        ref={channelTabs}
        className={w.channelTabs}
        aria-label="Canal de configuration"
      >
        {Object.entries(CHANNELS)
          .filter(([id]) => visibleChannels.includes(id as Channel))
          .map(([id, label]) => (
            <button
              key={id}
              aria-pressed={channel === id}
              onClick={() => {
                setChannel(id as Channel);
                setFormats([]);
                setSelected([]);
                setActiveId("");
              }}
            >
              {label}
              <small>
                {c.ads.filter((a) => a.channel === id).length || ""}
              </small>
            </button>
          ))}
      </nav>
      {c.status === "finished" ? (
        <p className={w.error}>
          Campagne terminée. Sa réouverture est réservée au Validateur dans
          Terminées.
        </p>
      ) : (
        <details open={!rows.length} className={w.formatPicker}>
          <summary>Choisir des formats ou ajouter des annonces</summary>
          <div className={w.formats}>
            {CATALOG[channel].map((f) => (
              <label key={f.id} data-selected={formats.includes(f.id)}>
                <input
                  type="checkbox"
                  checked={formats.includes(f.id)}
                  onChange={(e) =>
                    setFormats(
                      e.target.checked
                        ? [...formats, f.id]
                        : formats.filter((x) => x !== f.id),
                    )
                  }
                />
                <span
                  className={w.formatShape}
                  style={{
                    aspectRatio: f.width ? `${f.width}/${f.height}` : "2/1",
                    maxHeight: 58,
                  }}
                >
                  {f.kind === "video" ? "▶" : f.kind === "text" ? "Aa" : ""}
                </span>
                <b>{f.label}</b>
                <small>
                  {f.width
                    ? `${f.width} × ${f.height}`
                    : "Titres et descriptions"}
                </small>
              </label>
            ))}
          </div>
          <button
            className={w.primary}
            disabled={!formats.length || pending("add", c.id)}
            onClick={async () => {
              await command({ type: "add", channel, formats });
              setFormats([]);
            }}
          >
            {pending("add", c.id)
              ? "Création…"
              : "Confirmer et compléter les annonces"}
          </button>
        </details>
      )}
      <div className={w.heading}>
        <span>
          {rows.length} annonce(s) · {selected.length} sélectionnée(s)
        </span>
        <div className={w.inline}>
          <button
            disabled={
              !selected.length ||
              c.status === "finished" ||
              submission === "sending"
            }
            onClick={() => setBatch((v) => !v)}
          >
            Appliquer un champ en batch
          </button>
          <button
            className={w.primary}
            disabled={
              !selected.length ||
              c.status === "finished" ||
              submission === "sending"
            }
            onClick={() => void submit(selected).catch(() => {})}
          >
            {submission === "sending" ? "Envoi…" : "Envoyer la sélection"}
          </button>
        </div>
      </div>
      {batch && (
        <form
          className={w.batch}
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              replace &&
              !confirm(
                `Remplacer les valeurs existantes de ${selected.length} annonce(s) ? Les annonces approuvées, verrouillées ou figées seront ignorées.`,
              )
            )
              return;
            const fields: Partial<AdFields> =
              field === "headlines" || field === "descriptions"
                ? { [field]: batchValue.split("\n").filter(Boolean) }
                : { [field]: batchValue };
            await flushRef.current?.();
            const result = await command({
              type: "batch",
              adIds: selected,
              fields,
              replace,
            });
            notify(
              "Batch enregistré. " +
                ((result.skipped as unknown[])?.length ?? 0) +
                " ligne(s) protégée(s) ignorée(s).",
            );
            setBatch(false);
          }}
        >
          <label>
            Champ
            <select value={field} onChange={(e) => setField(e.target.value)}>
              {(channel === "google"
                ? ["headlines", "descriptions", "url"]
                : ["copy", "headline", "cta", "url"]
              ).map((f) => (
                <option key={f} value={f}>
                  {
                    {
                      copy: "Texte",
                      headline: "Titre",
                      cta: "CTA",
                      url: "URL",
                      headlines: "Titres (un par ligne)",
                      descriptions: "Descriptions (une par ligne)",
                    }[f]
                  }
                </option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Valeur à appliquer"
            value={batchValue}
            onChange={(e) => setBatchValue(e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
            />
            Remplacer les valeurs existantes (sinon champs vides uniquement)
          </label>
          <button className={w.primary} disabled={pending("batch", c.id)}>
            {pending("batch", c.id)
              ? "Enregistrement…"
              : `Appliquer à ${selected.length} ligne(s)`}
          </button>
        </form>
      )}
      {active ? (
        <TableSession
          key={active.id + ":" + activeReady}
          c={c}
          active={active}
          rows={rows}
          enabled={!!activeReady}
          unlocked={unlocked.includes(active.id)}
          selected={selected}
          setSelected={setSelected}
          setActive={setActiveId}
          onUnlock={() => {
            if (
              confirm(
                "Modifier cette annonce annulera son approbation. Elle devra être validée à nouveau.",
              )
            )
              setUnlocked([...unlocked, active.id]);
          }}
          onSubmit={submit}
          submitting={submission === "sending"}
          flushRef={flushRef}
        />
      ) : (
        <p className={w.empty}>
          Choisissez vos formats ou déposez des médias. Les annonces
          apparaîtront ici.
        </p>
      )}
      {channel !== "google" && c.status === "active" && (
        <MediaLibrary
          campaign={c}
          channel={channel}
          onCreate={async (media: Media, formats: string[]) => {
            await command({ type: "add", channel, formats, mediaId: media.id });
          }}
        />
      )}
    </>
  );
}
function TableSession({
  c,
  active,
  rows,
  enabled,
  unlocked,
  selected,
  setSelected,
  setActive,
  onUnlock,
  onSubmit,
  submitting,
  flushRef,
}: {
  c: Campaign;
  active: Ad;
  rows: Ad[];
  enabled: boolean;
  unlocked: boolean;
  selected: string[];
  setSelected: (ids: string[]) => void;
  setActive: (id: string) => void;
  onUnlock: () => void;
  onSubmit: (ids: string[]) => Promise<void>;
  submitting: boolean;
  flushRef: MutableRefObject<null | (() => Promise<unknown>)>;
}) {
  const { data, run, notify, pending } = useWorkspace();
  const editor = useAdEditor(c, active, enabled, "configuration", unlocked);
  const [upload, setUpload] = useState<
    | { stage: "idle" }
    | { stage: "uploading"; progress: number }
    | { stage: "verifying" }
  >({ stage: "idle" });
  async function attach(file: File) {
    setUpload({ stage: "uploading", progress: 0 });
    try {
      const m = await uploadFile(
        file,
        c,
        active.channel,
        run,
        (progress) => setUpload({ stage: "uploading", progress }),
        undefined,
        () => setUpload({ stage: "verifying" }),
      );
      if (
        m.state !== "ready" ||
        !compatibleFormats(m, active.channel).some(
          (f) => f.id === active.format,
        )
      )
        throw new Error(
          m.errors.join(" ") ||
            "Ce média ne correspond pas au format de cette annonce.",
        );
      editor.change({ mediaId: m.id });
      await editor.save();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setUpload({ stage: "idle" });
    }
  }
  const editable =
    enabled && ["ready", "saving", "error"].includes(editor.status);
  const saveActive = editor.save;
  useEffect(() => {
    flushRef.current = enabled ? () => saveActive() : null;
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, enabled, saveActive]);
  const columns =
    active.channel === "google"
      ? (["headlines", "descriptions", "url", "path1", "path2"] as const)
      : (["copy", "headline", "cta", "url", "mediaId"] as const);
  const labels: Record<string, string> = {
    headlines: "Titres · 30 caractères",
    descriptions: "Descriptions · 90 caractères",
    url: "Destination",
    path1: "Chemin 1",
    path2: "Chemin 2",
    copy: "Texte",
    headline: "Titre",
    cta: "CTA",
    mediaId: "Média",
  };
  const changeActive = async (id: string) => {
    try {
      if (editor.dirty && editable) await editor.save();
      setActive(id);
    } catch {
      notify(
        "Corrigez ou enregistrez la ligne active avant de changer d’annonce.",
      );
    }
  };
  return (
    <div className={w.configSplit}>
      <div className={w.tablePane}>
        {editor.status === "locked" && enabled && (
          <button onClick={() => void editor.retry().catch(() => {})}>
            Reprendre l’édition
          </button>
        )}
        {upload.stage !== "idle" && (
          <p role="status">
            {upload.stage === "verifying"
              ? "Vérification du fichier…"
              : `Transfert vers la ligne active : ${upload.progress} %`}
          </p>
        )}
        <div role="status" className={w.saveState}>
          {enabled
            ? editor.status === "saving"
              ? "Enregistrement…"
              : editor.status === "error"
                ? "Erreur de sauvegarde"
                : editor.status === "locked"
                  ? "Verrou expiré ou annonce en cours de modification"
                  : editor.status === "loading"
                    ? "Ouverture de la ligne…"
                    : "Enregistré"
            : active.status === "approved"
              ? "Annonce approuvée · verrouillée"
              : "Version figée"}
          {editor.error && (
            <span>
              {editor.error}{" "}
              <button onClick={() => void editor.retry().catch(() => {})}>
                Réessayer
              </button>
            </span>
          )}
        </div>
        <div
          className={w.tableScroll}
          onFocusCapture={(e) => {
            const container = e.currentTarget;
            const target = e.target as HTMLElement;
            requestAnimationFrame(() => {
              if (!container.isConnected || !target.isConnected) return;
              const bounds = container.getBoundingClientRect();
              const field = target.getBoundingClientRect();
              if (field.left < bounds.left + 6)
                container.scrollLeft += field.left - bounds.left - 6;
              else if (field.right > bounds.right - 6)
                container.scrollLeft += field.right - bounds.right + 6;
            });
          }}
        >
          <table className={w.editTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Sélectionner toutes les annonces du canal"
                    checked={
                      rows.length > 0 &&
                      rows.every((a) => selected.includes(a.id))
                    }
                    onChange={(e) =>
                      setSelected(e.target.checked ? rows.map((a) => a.id) : [])
                    }
                  />
                </th>
                <th>Annonce / Format</th>
                {columns.map((k) => (
                  <th key={k}>{labels[k]}</th>
                ))}
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const isActive = a.id === active.id;
                const value = isActive ? editor.draft : a;
                return (
                  <tr
                    key={a.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!isActive || !editable) {
                        notify(
                          "Sélectionnez une ligne modifiable avant de déposer un média.",
                        );
                        return;
                      }
                      const file = e.dataTransfer.files[0];
                      if (file) void attach(file);
                    }}
                    data-active={isActive}
                    onClick={() => {
                      if (!isActive) void changeActive(a.id);
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Sélectionner " + a.name}
                        checked={selected.includes(a.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, a.id]
                              : selected.filter((id) => id !== a.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className={w.rowTitle}
                        onClick={() => void changeActive(a.id)}
                      >
                        {a.name}
                      </button>
                      <small>
                        {
                          CATALOG[a.channel].find((f) => f.id === a.format)
                            ?.label
                        }{" "}
                        · V{a.version}
                      </small>
                    </td>
                    {columns.map((k) => (
                      <td key={k}>
                        {k === "mediaId" ? (
                          <>
                            {" "}
                            <select
                              aria-label={"Média de " + a.name}
                              disabled={!isActive || !editable}
                              value={value.mediaId ?? ""}
                              onChange={(e) =>
                                editor.change({
                                  mediaId: e.target.value || null,
                                })
                              }
                            >
                              <option value="">À associer</option>
                              {c.media
                                .filter(
                                  (m) =>
                                    m.state === "ready" &&
                                    mediaChannels(m).includes(a.channel) &&
                                    compatibleFormats(m, a.channel).some(
                                      (f) => f.id === a.format,
                                    ),
                                )
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                            </select>
                            <label className={w.rowUpload}>
                              Déposer sur cette annonce
                              <input
                                type="file"
                                disabled={
                                  !isActive ||
                                  !editable ||
                                  upload.stage !== "idle"
                                }
                                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                                onChange={(e) => {
                                  if (e.target.files?.[0])
                                    void attach(e.target.files[0]);
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <textarea
                            aria-label={labels[k] + " de " + a.name}
                            readOnly={!isActive || !editable}
                            value={
                              Array.isArray(value[k])
                                ? (value[k] as string[]).join("\n")
                                : String(value[k])
                            }
                            rows={
                              k === "headlines"
                                ? 4
                                : k === "descriptions"
                                  ? 4
                                  : 3
                            }
                            onFocus={() => {
                              if (!isActive) void changeActive(a.id);
                            }}
                            onChange={(e) =>
                              editor.change({
                                [k]:
                                  k === "headlines" || k === "descriptions"
                                    ? e.target.value.split("\n")
                                    : e.target.value,
                              })
                            }
                          />
                        )}
                      </td>
                    ))}
                    <td>
                      <span className={w.status}>{STATUS[a.status]}</span>
                      {["draft", "changes_requested"].includes(a.status) &&
                        (() => {
                          const errors = isComplete(
                            isActive ? { ...a, ...editor.draft } : a,
                            c,
                          );
                          return errors.length ? (
                            <details className={w.missing}>
                              <summary>
                                {errors.length} champ(s) à compléter
                              </summary>
                              <ul>
                                {errors.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            </details>
                          ) : (
                            <small>Prête à envoyer</small>
                          );
                        })()}
                      {a.comments.at(-1) && (
                        <small>{a.comments.at(-1)?.text}</small>
                      )}
                    </td>
                    <td>
                      <div className={w.rowActions}>
                        {a.status === "approved" ? (
                          <button disabled={!isActive} onClick={onUnlock}>
                            Déverrouiller
                          </button>
                        ) : ["on_air", "stopped"].includes(a.status) ? (
                          <button
                            disabled={pending("version", c.id, a.id)}
                            onClick={() =>
                              void run({
                                type: "version",
                                campaignId: c.id,
                                adId: a.id,
                              }).catch(() => {})
                            }
                          >
                            Créer V
                            {Math.max(
                              ...c.ads
                                .filter((x) => x.familyId === a.familyId)
                                .map((x) => x.version),
                            ) + 1}
                          </button>
                        ) : (
                          <button
                            disabled={!isActive || !editable || submitting}
                            onClick={async () => {
                              try {
                                await onSubmit([a.id]);
                              } catch {}
                            }}
                          >
                            {submitting ? "Envoi…" : "Envoyer"}
                          </button>
                        )}
                        <button
                          disabled={pending("duplicate", c.id, a.id)}
                          onClick={() =>
                            void run({
                              type: "duplicate",
                              campaignId: c.id,
                              adId: a.id,
                            }).catch(() => {})
                          }
                        >
                          Dupliquer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <aside className={w.previewPane} aria-label="Aperçu de l’annonce">
        <label className={w.adName}>
          Nom de l’annonce
          <input
            aria-label="Nom de l’annonce active"
            disabled={!editable}
            value={editor.draft.name}
            onChange={(e) => editor.change({ name: e.target.value })}
          />
        </label>
        <div className={w.heading}>
          <h2>Aperçu</h2>
          <span>{data?.channels[active.channel]}</span>
        </div>
        <Preview campaign={c} ad={{ ...active, ...editor.draft }} />
        <History ad={active} campaign={c} />
      </aside>
    </div>
  );
}
