"use client";
import { useState, useRef, useEffect, type MutableRefObject } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const params = useSearchParams(),
    router = useRouter();
  const id = params.get("campagne");
  const campaign =
    data!.campaigns.find((c) => c.id === id) ?? data!.campaigns[0];
  if (!campaign)
    return <p>Créez une campagne depuis la Home pour commencer.</p>;
  return (
    <>
      <div className={w.toolbar}>
        <select
          aria-label="Campagne à configurer"
          value={campaign.id}
          onChange={(e) =>
            router.push("/studio/configuration?campagne=" + e.target.value)
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
function CampaignEditor({ campaign: c }: { campaign: Campaign }) {
  const { data, run, notify } = useWorkspace();
  const [channel, setChannel] = useState<Channel>("facebook"),
    [formats, setFormats] = useState<string[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [activeId, setActiveId] = useState(""),
    [unlocked, setUnlocked] = useState<string[]>([]),
    [batch, setBatch] = useState(false),
    [brandForm, setBrandForm] = useState(false);
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
  async function submit(ids: string[]) {
    await flushRef.current?.();
    const r = await command({ type: "submit", adIds: ids });
    const skipped = r.skipped as unknown[];
    notify(
      `${ids.length - skipped.length} annonce(s) envoyée(s). ${skipped.length ? skipped.length + " annonce(s) à compléter ou déjà soumise(s)." : ""}`,
    );
  }
  return (
    <>
      <details className={w.campaignSettings}>
        <summary>{c.name} · Marque, URL et dates</summary>
        <div className={w.settingsGrid}>
          <label>
            Marque
            <select
              value={c.brandId ?? ""}
              onChange={(e) =>
                void command({
                  type: "campaign",
                  fields: { brandId: e.target.value || null },
                }).catch(() => {})
              }
            >
              <option value="">À choisir</option>
              {data!.brands.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => setBrandForm((v) => !v)}>
            Créer une marque
          </button>
          <label>
            URL commune
            <input
              key={c.defaultUrl}
              defaultValue={c.defaultUrl}
              placeholder="https://…"
              onBlur={(e) => {
                if (e.target.value !== c.defaultUrl)
                  void command({
                    type: "campaign",
                    fields: { defaultUrl: e.target.value },
                  }).catch(() => {});
              }}
            />
          </label>
          <label>
            Début
            <input
              type="date"
              value={c.startDate ?? ""}
              onChange={(e) =>
                void command({
                  type: "campaign",
                  fields: { startDate: e.target.value || null },
                }).catch(() => {})
              }
            />
          </label>
          <label>
            Fin · 23 h 59 Montréal
            <input
              type="date"
              value={c.endDate ?? ""}
              onChange={(e) =>
                void command({
                  type: "campaign",
                  fields: { endDate: e.target.value || null },
                }).catch(() => {})
              }
            />
          </label>
        </div>
        {brandForm && (
          <form
            className={w.settingsGrid}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await run({
                type: "create_brand",
                name: f.get("name"),
                logo: f.get("logo"),
                website: f.get("website"),
              });
              setBrandForm(false);
            }}
          >
            <label>
              Nom
              <input name="name" required />
            </label>
            <label>
              Logo · URL
              <input name="logo" type="url" />
            </label>
            <label>
              Site web
              <input name="website" type="url" />
            </label>
            <button className={w.primary}>Créer</button>
          </form>
        )}
      </details>
      <nav className={w.channelTabs} aria-label="Canal de configuration">
        {Object.entries(CHANNELS).map(([id, label]) => (
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
            <small>{c.ads.filter((a) => a.channel === id).length || ""}</small>
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
            disabled={!formats.length}
            onClick={async () => {
              await command({ type: "add", channel, formats });
              setFormats([]);
            }}
          >
            Confirmer et compléter les annonces
          </button>
        </details>
      )}
      <div className={w.heading}>
        <span>
          {rows.length} annonce(s) · {selected.length} sélectionnée(s)
        </span>
        <div className={w.inline}>
          <button
            disabled={!selected.length || c.status === "finished"}
            onClick={() => setBatch((v) => !v)}
          >
            Appliquer un champ en batch
          </button>
          <button
            className={w.primary}
            disabled={!selected.length || c.status === "finished"}
            onClick={() => void submit(selected).catch(() => {})}
          >
            Envoyer la sélection
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
          <button className={w.primary}>
            Appliquer à {selected.length} ligne(s)
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
  flushRef: MutableRefObject<null | (() => Promise<unknown>)>;
}) {
  const { data, run, notify } = useWorkspace();
  const editor = useAdEditor(c, active, enabled, "configuration", unlocked);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  async function attach(file: File) {
    setUploadProgress(0);
    try {
      const m = await uploadFile(
        file,
        c,
        active.channel,
        run,
        setUploadProgress,
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
      setUploadProgress(null);
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
        {uploadProgress !== null && (
          <p role="status">
            Transfert vers la ligne active : {uploadProgress} %
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
        <div className={w.tableScroll}>
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
                                    m.channel === a.channel &&
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
                                  uploadProgress !== null
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
                            disabled={!isActive || !editable}
                            onClick={async () => {
                              try {
                                await editor.save();
                                await onSubmit([a.id]);
                              } catch {}
                            }}
                          >
                            Envoyer
                          </button>
                        )}
                        <button
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
      <aside className={w.previewPane}>
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
