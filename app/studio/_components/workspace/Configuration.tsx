"use client";
import { useState, useRef, useEffect } from "react";
import CreateCampaign from "./CreateCampaign";
import CampaignInfoForm from "./CampaignInfoForm";
import CampaignLanding from "./CampaignLanding";
import TableSession, { type CellTarget } from "./AdTable";
import ChannelIcon from "./ChannelIcon";
import ShareCampaign from "./ShareCampaign";
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
  const { params } = useWorkspaceNavigation();
  const id = params.get("campagne");
  const campaign =
    !id || id === "all"
      ? data!.campaigns[0]
      : data!.campaigns.find((c) => c.id === id);
  if (params.get("nouvelle") === "1") return <CreateCampaign />;
  if (!campaign) return <CampaignLanding />;
  return <CampaignEditor key={campaign.id} campaign={campaign} />;
}
type ConfigurationStage = "details" | "channels" | "media" | "editor";
function CampaignEditor({ campaign: c }: { campaign: Campaign }) {
  const { params, update } = useWorkspaceNavigation();
  const { run } = useWorkspace();
  const allChannels: Channel[] = [
    "facebook",
    "instagram",
    "youtube",
    "tiktok",
    "google",
    "display",
  ];
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
      : (fromUrl[0] ?? chosen[0] ?? "facebook")
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
                <ChannelIcon
                  channel={id}
                  size={64}
                  variant={id === "google" ? "ads" : "default"}
                />
                <b>{CHANNELS[id]}</b>
                <span className={w.channelCheck} aria-hidden="true">
                  {chosen.includes(id) ? <Icon name="check" /> : ""}
                </span>
              </button>
            ))}
          </div>
          <p className={w.channelCount}>
            {chosen.length} {chosen.length > 1 ? "canaux" : "canal"} sélectionné
            {chosen.length > 1 ? "s" : ""}
          </p>
          <div className={w.channelFooter}>
            <button
              aria-label="Retour aux informations de campagne"
              title="Retour"
              onClick={() => setStage("details")}
            >
              <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              className={w.primary}
              disabled={!chosen.length}
              onClick={() => void continueToMedia()}
            >
              Continuer <Icon name="arrow" />
            </button>
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
          <h2 tabIndex={-1} className={w.editorTitle}>
            Ajouter vos visuels
          </h2>
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
            <button
              aria-label="Modifier les canaux"
              title="Modifier les canaux"
              disabled={importing}
              onClick={() => setStage("channels")}
            >
              <Icon name="edit" />
            </button>
          </div>
          {mediaTargets.length > 0 && (
            <MediaLibrary
              campaign={c}
              channel={mediaTargets[0]}
              channels={mediaTargets}
              batchMode
              onTextStart={() => setStage("editor")}
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
        </section>
      </>
    );
  }
  const visible = fromUrl.length
    ? fromUrl
    : allChannels.filter(
        (id) =>
          chosen.includes(id) ||
          c.ads.some((ad) => ad.channel === id) ||
          c.media.some((media) => mediaChannels(media).includes(id)),
      );
  if (!visible.includes(channel)) visible.unshift(channel);
  return (
    <>
      {steps}
      <div className={w.editorHeading}>
        <h2 className={w.editorTitle}>Compléter les annonces</h2>
        <ShareCampaign campaignId={c.id} name={c.name} />
      </div>
      <ChannelEditor
        key={channel}
        campaign={c}
        channel={channel}
        visibleChannels={visible}
        setChannel={(canal) => update({ canal })}
        onAddMedia={() =>
          setStage(
            chosen.length && chosen.some((id) => id !== "google")
              ? "media"
              : "channels",
          )
        }
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
  onAddMedia,
}: {
  campaign: Campaign;
  channel: Channel;
  setChannel: (channel: Channel) => void;
  visibleChannels: Channel[];
  onAddMedia: () => void;
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
  const formatPicker = useRef<HTMLDetailsElement>(null);
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
  const [field, setField] = useState(
      channel === "google" ? "headlines" : "copy",
    ),
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
      <div className={w.editorToolbar}>
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
                  setBatch(false);
                  setField(id === "google" ? "headlines" : "copy");
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
        <div className={w.editorTools}>
          <span className={w.srOnly}>
            {rows.length} annonce{rows.length > 1 ? "s" : ""} ·{" "}
            {selected.length} sélectionnée{selected.length > 1 ? "s" : ""}
          </span>
          <div className={w.inline}>
            <button
              aria-label="Copier tout"
              title="Copier tout"
              onClick={() => {
                if (!rows.length)
                  return notify("Aucune annonce à copier dans ce canal.");
                void navigator.clipboard
                  .writeText(copyAdsText(c, readRowsRef.current?.() ?? rows))
                  .then(() => notify("Tableau copié."))
                  .catch(() =>
                    notify(
                      "Copie indisponible. Autorisez le presse-papiers de ce navigateur.",
                    ),
                  );
              }}
            >
              <Icon name="copy" />
            </button>
            <button
              aria-label="Appliquer un champ en batch"
              title="Appliquer à la sélection"
              disabled={c.status === "finished" || submission === "sending"}
              aria-expanded={batch}
              onClick={() => {
                if (!selected.length)
                  notify(
                    "Sélectionnez les lignes auxquelles appliquer ce texte.",
                  );
                setBatch((v) => !v);
              }}
            >
              <Icon name="batch" />
            </button>
            <button
              aria-label="Ajouter des annonces"
              title="Ajouter des annonces"
              disabled={c.status === "finished"}
              onClick={() => {
                if (!formatPicker.current) return;
                formatPicker.current.open = true;
                formatPicker.current.scrollIntoView({
                  block: "nearest",
                  behavior: "smooth",
                });
              }}
            >
              <Icon name="plus" />
            </button>
            <button
              aria-label="Aperçu"
              title="Aperçu"
              aria-pressed={previewOpen}
              onClick={() => {
                if (!active)
                  return notify(
                    "Ajoutez une annonce pour afficher son aperçu.",
                  );
                setPreviewOpen((v) => !v);
              }}
            >
              <Icon name="eye" />
            </button>
            {selected.length > 0 && (
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
            )}
          </div>
        </div>
      </div>
      {c.status === "finished" ? (
        <p className={w.error}>
          Campagne terminée. Sa réouverture est réservée au Validateur dans
          Terminées.
        </p>
      ) : (
        <details
          ref={formatPicker}
          open={!rows.length}
          className={w.formatPicker}
        >
          <summary>Choisir des formats ou ajouter des annonces</summary>
          <button
            type="button"
            aria-label="Ajouter des médias en lot"
            onClick={onAddMedia}
          >
            <Icon name="upload" /> Ajouter des médias
          </button>
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
              try {
                await command({ type: "add", channel, formats });
                setFormats([]);
              } catch {
                /* The provider displays the error and preserves the selection. */
              }
            }}
          >
            {pending("add", c.id)
              ? "Création…"
              : "Confirmer et compléter les annonces"}
          </button>
        </details>
      )}

      {batch && (
        <form
          className={w.batch}
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selected.length)
              return notify("Sélectionnez au moins une ligne.");
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
            try {
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
            } catch {
              /* Preserve the batch form so it can be retried. */
            }
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
          <button
            className={w.primary}
            disabled={!selected.length || pending("batch", c.id)}
          >
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
          onUnlock={(id) => {
            if (
              confirm(
                "Modifier cette annonce annulera son approbation. Elle devra être validée à nouveau.",
              )
            ) {
              setActiveId(id);
              setUnlocked([...unlocked, id]);
            }
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
