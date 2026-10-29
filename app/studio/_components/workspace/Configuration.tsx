"use client";
import { useState, useRef, useEffect } from "react";
import CreateCampaign from "./CreateCampaign";
import CampaignInfoForm from "./CampaignInfoForm";
import CampaignLanding from "./CampaignLanding";
import TableSession, { type CellTarget } from "./AdTable";
import ChannelIcon from "./ChannelIcon";
import Icon from "../Icon";
import { copyAdsText } from "@/lib/campaign-studio/workspace/presentation";
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
  mediaChannels,
} from "@/lib/campaign-studio/workspace/catalog";
import { useWorkspace } from "./WorkspaceProvider";
import MediaLibrary from "./MediaLibrary";
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
  const { params, update } = useWorkspaceNavigation();
  const id = params.get("campagne");
  const campaign =
    !id || id === "all"
      ? data!.campaigns[0]
      : data!.campaigns.find((c) => c.id === id);
  if (params.get("nouvelle") === "1") return <CreateCampaign />;
  if (!campaign) return <CampaignLanding />;
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
            ...(c.channels ?? []),
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
  async function continueToMedia() {
    try {
      if (JSON.stringify(c.channels ?? []) !== JSON.stringify(chosen))
        await run({
          type: "campaign",
          campaignId: c.id,
          fields: { channels: chosen },
        });
      update({
        canaux: chosen.join(","),
        canal: chosen[0],
        etape:
          !c.ads.length && chosen.some((id) => id !== "google")
            ? "media"
            : "editor",
      });
    } catch {
      /* Keep the chosen channels on a failed save. */
    }
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
            <h2 tabIndex={-1}>Choisir les canaux</h2>
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
                <ChannelIcon channel={id} size={42} />
                <b>{CHANNELS[id]}</b>
                <span className={w.channelCheck} aria-hidden="true">
                  {chosen.includes(id) ? <Icon name="check" /> : ""}
                </span>
              </button>
            ))}
          </div>
          <div className={w.inline}>
            <button
              className={w.primary}
              disabled={!chosen.length}
              onClick={() => void continueToMedia()}
            >
              Continuer <Icon name="arrow" />
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
            <span>
              {chosen.map((id) => (
                <span className={w.channelPill} key={id}>
                  <ChannelIcon channel={id} />
                  {CHANNELS[id]}
                  <Icon name="check" size={14} />
                </span>
              ))}
            </span>
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
      <h2 className={w.editorTitle}>Compléter les annonces</h2>
      {c.status === "active" && (
        <div className={w.setupActions}>
          <button
            aria-label="Ajouter des médias en lot"
            title="Ajouter des médias en lot"
            onClick={() => {
              if (!chosen.length) setStage("channels");
              else
                setStage(
                  chosen.some((id) => id !== "google") ? "media" : "channels",
                );
            }}
          >
            <Icon name="plus" />
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
              aria-label={`${index + 1} ${item.label}`}
              disabled={disabled || index + 1 > current}
              aria-current={index + 1 === current ? "step" : undefined}
              onClick={() => {
                if (index + 1 !== current) onChange(item.stage);
              }}
            >
              <span className={w.stepNumber}>
                {index + 1 < current ? (
                  <Icon name="check" size={14} />
                ) : (
                  index + 1
                )}
              </span>{" "}
              <span>{item.label}</span>
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const focusTarget = useRef<CellTarget | null>(null);
  const readRowsRef = useRef<null | (() => Ad[])>(null);
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
              <ChannelIcon channel={id as Channel} />
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
          {rows.length} annonce{rows.length > 1 ? "s" : ""} · {selected.length}{" "}
          sélectionnée{selected.length > 1 ? "s" : ""}
        </span>
        <div className={w.inline}>
          <button
            aria-label="Copier tout"
            title="Copier tout"
            onClick={() =>
              void navigator.clipboard
                .writeText(copyAdsText(c, readRowsRef.current?.() ?? rows))
                .then(() => notify("Tableau copié."))
                .catch(() =>
                  notify(
                    "Copie indisponible. Autorisez le presse-papiers de ce navigateur.",
                  ),
                )
            }
          >
            <Icon name="copy" />
          </button>
          <button
            aria-label="Appliquer un champ en batch"
            title="Appliquer à la sélection"
            disabled={
              !selected.length ||
              c.status === "finished" ||
              submission === "sending"
            }
            onClick={() => setBatch((v) => !v)}
          >
            <Icon name="batch" />
          </button>
          <button
            aria-label="Ajouter des annonces"
            title="Ajouter des annonces"
            onClick={() =>
              document
                .querySelector<HTMLDetailsElement>(`.${w.formatPicker}`)
                ?.setAttribute("open", "")
            }
          >
            <Icon name="plus" />
          </button>
          <button
            aria-label="Aperçu"
            title="Aperçu"
            aria-pressed={previewOpen}
            onClick={() => setPreviewOpen((v) => !v)}
          >
            <Icon name="eye" />
          </button>
          <button
            aria-label={
              submission === "sending" ? "Envoi…" : "Envoyer la sélection"
            }
            title="Envoyer la sélection"
            className={w.primary}
            disabled={
              !selected.length ||
              c.status === "finished" ||
              submission === "sending"
            }
            onClick={() => void submit(selected).catch(() => {})}
          >
            <Icon name="send" />
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
          previewOpen={previewOpen}
          onPreview={setPreviewOpen}
          focusTarget={focusTarget}
          readRowsRef={readRowsRef}
        />
      ) : (
        <p className={w.empty}>
          Choisissez vos formats ou déposez des médias. Les annonces
          apparaîtront ici.
        </p>
      )}
      {channel !== "google" && c.status === "active" && (
        <details className={w.libraryDisclosure}>
          <summary>Bibliothèque des médias</summary>
          <MediaLibrary
            campaign={c}
            channel={channel}
            onCreate={async (media: Media, formats: string[]) => {
              await command({
                type: "add",
                channel,
                formats,
                mediaId: media.id,
              });
            }}
          />
        </details>
      )}
    </>
  );
}
