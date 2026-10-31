"use client";
import Select from "@/app/_components/Select";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type KeyboardEvent,
} from "react";
import type {
  Ad,
  AdFields,
  Campaign,
} from "@/lib/campaign-studio/workspace/types";
import { createPortal } from "react-dom";
import {
  CATALOG,
  compatibleFormats,
  mediaChannels,
} from "@/lib/campaign-studio/workspace/catalog";
import { isComplete } from "@/lib/campaign-studio/workspace/workflow";
import { textGuidance } from "@/lib/campaign-studio/workspace/text-guidance";
import { useWorkspace } from "./WorkspaceProvider";
import { useAdEditor } from "./useAdEditor";
import { uploadFile } from "./upload";
import Preview from "./Preview";
import History from "./History";
import DeleteAds from "./DeleteAds";
import CharacterCountdown from "./CharacterCountdown";
import Icon from "../Icon";
import w from "./workspace.module.css";
import t from "./table.module.css";
export type CellTarget = { ad: string; field: string };
type Props = {
  c: Campaign;
  active: Ad;
  rows: Ad[];
  enabled: boolean;
  unlocked: boolean;
  selected: string[];
  setSelected: (ids: string[]) => void;
  setActive: (id: string) => void;
  onUnlock: (id: string) => void;
  onSubmit: (ids: string[]) => Promise<void>;
  submitting: boolean;
  flushRef: MutableRefObject<null | (() => Promise<unknown>)>;
  previewOpen: boolean;
  onPreview: (open: boolean) => void;
  focusTarget: MutableRefObject<CellTarget | null>;
  readRowsRef: MutableRefObject<null | (() => Ad[])>;
};
const names: Record<string, string> = {
  theme: "Thématique",
  copy: "Texte",
  headline: "Titre",
  cta: "CTA",
  url: "Lien",
  headlines: "Titres · 30 caractères",
  descriptions: "Descriptions · 90 caractères",
  path1: "Chemin 1",
  path2: "Chemin 2",
};
const labels = {
  draft: "Brouillon",
  pending: "À valider",
  approved: "Validée",
  changes_requested: "À modifier",
  on_air: "On air",
  stopped: "Arrêtée",
};
export default function TableSession(p: Props) {
  const [drafts, setDrafts] = useState<Record<string, Ad>>({});
  const { readRowsRef } = p;
  const preview = drafts[p.active.id] ?? p.active;
  const [dragging, setDragging] = useState("");
  const [toolsHost, setToolsHost] = useState<HTMLDivElement | null>(null);
  const { run, notify } = useWorkspace();
  const table = useRef<HTMLTableElement>(null);
  const previewPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (p.previewOpen && window.matchMedia("(max-width: 1100px)").matches)
      previewPanel.current?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
  }, [p.previewOpen, p.active.id]);
  const columns = (
    p.active.channel === "google"
      ? ["theme", "headlines", "descriptions", "url", "path1", "path2"]
      : p.active.channel === "display"
        ? ["theme", "url"]
        : ["theme", "copy", "headline", "cta", "url"]
  ) as (keyof AdFields)[];
  const [widths, setWidths] = useState<Record<string, number>>({});
  const resize = useRef<{ key: string; x: number; width: number } | null>(null);
  function width(key: string) {
    return (
      widths[key] ??
      (key === "format"
        ? 120
        : key === "theme"
          ? 100
          : key === "copy" || key === "headlines" || key === "descriptions"
            ? 210
            : key === "url"
              ? 190
              : key === "cta"
                ? 120
                : 140)
    );
  }
  function setWidth(key: string, value: number) {
    setWidths((old) => ({
      ...old,
      [key]: Math.round(Math.max(80, Math.min(1200, value))),
    }));
  }
  function resizer(key: string, label: string) {
    return (
      <span
        className={t.columnResize}
        role="separator"
        aria-label={`Ajuster la largeur de ${label}`}
        aria-orientation="vertical"
        aria-valuemin={80}
        aria-valuemax={1200}
        aria-valuenow={width(key)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          resize.current = { key, x: e.clientX, width: width(key) };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const current = resize.current;
          if (current?.key === key)
            setWidth(key, current.width + e.clientX - current.x);
        }}
        onPointerUp={() => {
          resize.current = null;
        }}
        onPointerCancel={() => {
          resize.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            e.stopPropagation();
            setWidth(
              key,
              width(key) +
                (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 100 : 20),
            );
          }
        }}
        onDoubleClick={() =>
          setWidths((old) => {
            const next = { ...old };
            delete next[key];
            return next;
          })
        }
      />
    );
  }
  useEffect(() => {
    readRowsRef.current = () => p.rows.map((a) => drafts[a.id] ?? a);
    return () => {
      readRowsRef.current = null;
    };
  }, [p.rows, readRowsRef, drafts]);
  async function move(id: string, beforeId: string | null) {
    try {
      await p.flushRef.current?.();
      await run({ type: "move_ad", campaignId: p.c.id, adId: id, beforeId });
      notify("Ordre des annonces enregistré.");
    } catch {}
  }
  async function key(e: KeyboardEvent<HTMLTableElement>) {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell) return;
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const i = p.rows.findIndex((a) => a.id === cell.dataset.ad);
      const next =
        e.key === "ArrowUp" ? p.rows[i - 1]?.id : (p.rows[i + 2]?.id ?? null);
      if (
        (e.key === "ArrowUp" && i > 0) ||
        (e.key === "ArrowDown" && i < p.rows.length - 1)
      )
        await move(cell.dataset.ad!, next);
      return;
    }
    if (e.key !== "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
    const fields = Array.from(
      table.current!.querySelectorAll<HTMLElement>("[data-cell]"),
    ).filter(
      (el) => !el.hasAttribute("disabled") && el.dataset.protected !== "true",
    );
    const next = fields[fields.indexOf(cell) + (e.shiftKey ? -1 : 1)];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  }
  const effective = p.rows.map((a) => drafts[a.id] ?? a);
  const ready = effective.filter(
    (a) =>
      ["draft", "changes_requested"].includes(a.status) &&
      !isComplete(a, p.c).length,
  );
  const readyIds = new Set(ready.map((ad) => ad.id));
  const counts = {
    ready: 0,
    draft: 0,
    changes_requested: 0,
    pending: 0,
    approved: 0,
    on_air: 0,
    stopped: 0,
  };
  for (const ad of effective)
    counts[readyIds.has(ad.id) ? "ready" : ad.status]++;
  const statusSummary = [
    counts.ready &&
      `${counts.ready} prête${counts.ready > 1 ? "s" : ""} à envoyer`,
    counts.draft && `${counts.draft} à compléter`,
    counts.changes_requested && `${counts.changes_requested} à modifier`,
    counts.pending && `${counts.pending} à valider`,
    counts.approved &&
      `${counts.approved} validée${counts.approved > 1 ? "s" : ""}`,
    counts.on_air && `${counts.on_air} en ligne`,
    counts.stopped &&
      `${counts.stopped} arrêtée${counts.stopped > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      className={`${t.layout} ${p.previewOpen ? t.withPreview : ""}`}
      data-preview-open={p.previewOpen}
    >
      <div className={t.pane}>
        <div
          className={w.tableScroll}
          onFocusCapture={(e) => {
            const container = e.currentTarget;
            const target = e.target as HTMLElement;
            requestAnimationFrame(() => {
              if (!target.isConnected) return;
              const bounds = container.getBoundingClientRect();
              const field = (
                target.closest(`td.${t.countedCell}`) ?? target
              ).getBoundingClientRect();
              if (field.left < bounds.left + 6)
                container.scrollLeft += field.left - bounds.left - 6;
              else if (field.right > bounds.right - 6)
                container.scrollLeft += field.right - bounds.right + 6;
            });
          }}
        >
          <table
            ref={table}
            className={t.table}
            style={{
              width:
                32 +
                36 +
                112 +
                144 +
                width("format") +
                columns.reduce((sum, key) => sum + width(key), 0),
              minWidth:
                32 +
                36 +
                112 +
                144 +
                width("format") +
                columns.reduce((sum, key) => sum + width(key), 0),
            }}
            aria-label="Tableau des annonces"
            onKeyDown={(e) => void key(e)}
          >
            <colgroup>
              <col className={t.handleColumn} />
              <col className={t.selectColumn} />
              <col
                className={t.formatColumn}
                style={{ width: width("format") }}
              />
              {columns.map((column) => (
                <col
                  key={column}
                  style={{ width: width(column) }}
                  className={
                    column === "theme"
                      ? t.themeColumn
                      : column === "copy" ||
                          column === "headlines" ||
                          column === "descriptions"
                        ? t.copyColumn
                        : column === "url"
                          ? t.linkColumn
                          : column === "path1" || column === "path2"
                            ? t.pathColumn
                            : t.fieldColumn
                  }
                />
              ))}
              <col className={t.statusColumn} />
              <col className={t.actionsColumn} />
            </colgroup>
            <thead>
              <tr>
                <th aria-label="Ordre" />
                <th>
                  <input
                    type="checkbox"
                    aria-label="Sélectionner toutes les annonces du canal"
                    checked={
                      !!p.rows.length &&
                      p.rows.every((a) => p.selected.includes(a.id))
                    }
                    onChange={(e) =>
                      p.setSelected(
                        e.target.checked ? p.rows.map((a) => a.id) : [],
                      )
                    }
                  />
                </th>
                <th aria-label="Format">Format{resizer("format", "Format")}</th>
                {columns.map((k) => (
                  <th key={k} aria-label={names[k]}>
                    {names[k]}
                    {resizer(k, names[k])}
                  </th>
                ))}
                <th>Statut</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {p.rows.map((a) => (
                <AdRow
                  key={a.id}
                  {...p}
                  a={a}
                  toolsHost={toolsHost}
                  columns={columns}
                  dragging={dragging}
                  setDragging={setDragging}
                  onMove={move}
                  onDraft={(ad) =>
                    setDrafts((old) =>
                      JSON.stringify(old[ad.id]) === JSON.stringify(ad)
                        ? old
                        : { ...old, [ad.id]: ad },
                    )
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className={t.footer}>
          <span aria-live="polite" aria-atomic="true">
            {p.rows.length} annonce{p.rows.length > 1 ? "s" : ""}
            {statusSummary && ` · ${statusSummary}`}
          </span>
          <button
            className={w.primary}
            disabled={p.submitting || p.c.status === "finished"}
            data-unavailable={!ready.length || undefined}
            onClick={() => {
              if (!ready.length) {
                if (!effective.length)
                  return notify(
                    "Ajoutez une annonce avant de l’envoyer en validation.",
                  );
                if (counts.pending === effective.length)
                  return notify(
                    "Ces annonces sont déjà envoyées en validation.",
                  );
                if (!counts.draft && !counts.changes_requested)
                  return notify(
                    "Aucune annonce à envoyer : les annonces de ce canal sont déjà soumises, validées ou arrêtées.",
                  );
                return notify(
                  "Complétez au moins une annonce avant de l’envoyer en validation. Les champs manquants sont indiqués dans son statut.",
                );
              }
              void p.onSubmit(ready.map((a) => a.id)).catch(() => {});
            }}
          >
            {p.submitting ? "Envoi…" : "Envoyer les annonces prêtes"}
            <Icon name="arrow" />
          </button>
        </div>
      </div>
      {p.previewOpen && (
        <aside
          ref={previewPanel}
          className={t.preview}
          aria-label="Aperçu de l’annonce"
        >
          <div className={w.heading}>
            <h2>Aperçu</h2>
            <button
              aria-label="Fermer l’aperçu"
              onClick={() => p.onPreview(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className={t.previewPager}>
            <button
              aria-label="Annonce précédente"
              disabled={p.rows.indexOf(p.active) === 0}
              onClick={() =>
                p.setActive(p.rows[p.rows.indexOf(p.active) - 1].id)
              }
            >
              <Icon name="chevron" style={{ transform: "rotate(180deg)" }} />
            </button>
            <span>Annonce {p.rows.indexOf(p.active) + 1}</span>
            <button
              aria-label="Annonce suivante"
              disabled={p.rows.indexOf(p.active) === p.rows.length - 1}
              onClick={() =>
                p.setActive(p.rows[p.rows.indexOf(p.active) + 1].id)
              }
            >
              <Icon name="chevron" />
            </button>
          </div>
          <Preview
            ad={preview.id === p.active.id ? preview : p.active}
            campaign={p.c}
          />
          <details className={t.previewDetails}>
            <summary>Détails de l’annonce</summary>
            <div ref={setToolsHost} />
            <History ad={p.active} campaign={p.c} />
          </details>
        </aside>
      )}
    </div>
  );
}
function AdRow(
  p: Props & {
    toolsHost: HTMLDivElement | null;
    a: Ad;
    columns: (keyof AdFields)[];
    dragging: string;
    setDragging: (id: string) => void;
    onMove: (id: string, before: string | null) => Promise<void>;
    onDraft: (a: Ad) => void;
  },
) {
  const { a, c, flushRef } = p;
  const { run, notify, pending } = useWorkspace();
  const isActive = a.id === p.active.id;
  const frozen =
    c.status === "finished" || ["on_air", "stopped"].includes(a.status);
  const protectedRow =
    frozen || (a.status === "approved" && !(isActive && p.unlocked));
  const editor = useAdEditor(
    c,
    a,
    isActive && !protectedRow,
    "configuration",
    isActive && p.unlocked,
  );
  const [uploading, setUploading] = useState(false);
  const reorder = useRef<HTMLDivElement>(null);
  const editable = !protectedRow && editor.status !== "locked";
  const current = { ...a, ...editor.draft } as Ad;
  useEffect(() => {
    p.onDraft(current);
  }, [editor.draft, a.revision, isActive]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = editor.save;
  useEffect(() => {
    if (!isActive) return;
    const flush = () => save();
    flushRef.current = protectedRow ? null : flush;
    return () => {
      if (flushRef.current === flush) flushRef.current = null;
    };
  }, [isActive, protectedRow, save, flushRef]);
  async function duplicate() {
    try {
      await p.flushRef.current?.();
      await run({ type: "duplicate", campaignId: c.id, adId: a.id });
      notify("Annonce dupliquée sous la ligne d’origine.");
    } catch {}
  }
  async function attach(file: File) {
    setUploading(true);
    try {
      const media = await uploadFile(file, c, a.channel, run, () => {});
      if (
        media.state !== "ready" ||
        !compatibleFormats(media, a.channel).some((f) => f.id === a.format)
      )
        throw new Error("Média non conforme au format.");
      editor.change({ mediaId: media.id });
      await editor.save();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  const missing = isComplete(current, c);
  const name = (field: string) => names[field] + " de " + a.name;
  return (
    <Fragment>
      <tr
        data-ad-row={a.id}
        data-active={isActive}
        onFocusCapture={() => p.setActive(a.id)}
        onClick={() => p.setActive(a.id)}
        onDragOver={(e) => {
          if (p.dragging || e.dataTransfer.types.includes("Files"))
            e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (p.dragging) {
            const bounds = e.currentTarget.getBoundingClientRect();
            const after = e.clientY >= bounds.top + bounds.height / 2;
            const target = after
              ? (p.rows[p.rows.indexOf(a) + 1]?.id ?? null)
              : a.id;
            if (p.dragging !== a.id && target !== p.dragging)
              void p.onMove(p.dragging, target);
            p.setDragging("");
          } else if (e.dataTransfer.files[0]) {
            if (!isActive || !editable)
              notify(
                "Sélectionnez une ligne modifiable avant de déposer un média.",
              );
            else void attach(e.dataTransfer.files[0]);
          }
        }}
      >
        <td className={t.iconCell}>
          <button
            aria-label={"Déplacer " + a.name}
            title="Déplacer la ligne"
            aria-haspopup="dialog"
            onClick={() => reorder.current?.togglePopover()}
            draggable={c.status !== "finished"}
            disabled={c.status === "finished"}
            onDragStart={(e) => {
              reorder.current?.hidePopover();
              p.setDragging(a.id);
              e.dataTransfer.setData("text/plain", a.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => p.setDragging("")}
            onKeyDown={(e) => {
              if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                e.preventDefault();
                const i = p.rows.findIndex((x) => x.id === a.id);
                if (e.key === "ArrowUp" && i > 0)
                  void p.onMove(a.id, p.rows[i - 1].id);
                if (e.key === "ArrowDown" && i < p.rows.length - 1)
                  void p.onMove(a.id, p.rows[i + 2]?.id ?? null);
              }
            }}
          >
            <Icon name="grip" size={15} />
          </button>
          <div
            ref={reorder}
            popover="auto"
            role="dialog"
            aria-label={"Déplacer " + a.name}
            className={t.reorder}
          >
            <strong>Déplacer cette annonce</strong>
            <button
              disabled={p.rows.indexOf(a) === 0}
              onClick={() => {
                const i = p.rows.indexOf(a);
                if (i > 0) void p.onMove(a.id, p.rows[i - 1].id);
                reorder.current?.hidePopover();
              }}
            >
              <Icon name="arrow" style={{ transform: "rotate(-90deg)" }} />
              Monter
            </button>
            <button
              disabled={p.rows.indexOf(a) === p.rows.length - 1}
              onClick={() => {
                const i = p.rows.indexOf(a);
                if (i < p.rows.length - 1)
                  void p.onMove(a.id, p.rows[i + 2]?.id ?? null);
                reorder.current?.hidePopover();
              }}
            >
              <Icon name="arrow" style={{ transform: "rotate(90deg)" }} />
              Descendre
            </button>
          </div>
        </td>
        <td className={t.iconCell}>
          <input
            type="checkbox"
            aria-label={"Sélectionner " + a.name}
            checked={p.selected.includes(a.id)}
            onChange={(e) =>
              p.setSelected(
                e.target.checked
                  ? [...p.selected, a.id]
                  : p.selected.filter((id) => id !== a.id),
              )
            }
          />
        </td>
        <td>
          <Select
            data-cell="format"
            data-ad={a.id}
            aria-label={"Format de " + a.name}
            aria-readonly={protectedRow}
            disabled={protectedRow || (isActive && editor.status === "locked")}
            value={current.format}
            onValueChange={(selectedValue) =>
              editor.change({ format: selectedValue })
            }
          >
            {CATALOG[a.channel].map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </td>
        {p.columns.map((k) => {
          const guidance = textGuidance(current, k);
          const countId = `character-count-${a.id}-${k}`;
          const value = Array.isArray(current[k])
            ? (current[k] as string[])
            : String(current[k] ?? "");
          return (
            <td
              key={k}
              className={guidance ? t.countedCell : undefined}
              data-empty={
                !current[k] ||
                (Array.isArray(current[k]) && !current[k]?.length)
              }
            >
              <textarea
                data-cell={k}
                data-ad={a.id}
                data-protected={protectedRow ? "true" : undefined}
                aria-label={name(k)}
                aria-describedby={guidance ? countId : undefined}
                readOnly={isActive ? !editable : protectedRow}
                value={
                  Array.isArray(current[k])
                    ? (current[k] as string[]).join("\n")
                    : String(current[k] ?? "")
                }
                rows={1}
                onChange={(e) =>
                  editor.change({
                    [k]:
                      k === "headlines" || k === "descriptions"
                        ? e.target.value.split("\n")
                        : e.target.value,
                  })
                }
              />
              {guidance && (
                <CharacterCountdown
                  id={countId}
                  value={value}
                  guidance={guidance}
                />
              )}
            </td>
          );
        })}
        <td className={t.status} title={missing.join(" · ")}>
          <span
            className={t.statusPill}
            data-status={
              a.status === "draft" && !missing.length ? "ready" : a.status
            }
          >
            {a.status === "draft"
              ? !missing.length
                ? "Prête"
                : "À compléter"
              : labels[a.status]}
          </span>
        </td>
        <td>
          <div className={t.actions}>
            {a.status === "approved" && (
              <button
                title="Déverrouiller"
                aria-label={"Déverrouiller " + a.name}
                disabled={frozen}
                onClick={() => p.onUnlock(a.id)}
              >
                <Icon name="lock" size={16} />
              </button>
            )}
            {frozen && c.status !== "finished" ? (
              <button
                title="Ajouter une ligne vierge"
                aria-label={"Ajouter une ligne vierge après " + a.name}
                disabled={pending("add_blank", c.id)}
                onClick={async () => {
                  try {
                    await p.flushRef.current?.();
                    const result = await run({
                      type: "add_blank",
                      campaignId: c.id,
                      channel: a.channel,
                      format: a.format,
                      afterId: a.id,
                    });
                    const fresh = (result.campaign as Campaign).ads.find(
                      (ad) => !c.ads.some((old) => old.id === ad.id),
                    );
                    if (fresh) p.setActive(fresh.id);
                    notify("Ligne vierge ajoutée.");
                  } catch {
                    /* Preserve the source row; the provider announces failures. */
                  }
                }}
              >
                <Icon name="plus" size={16} />
              </button>
            ) : (
              <button
                title={
                  missing.length
                    ? "À compléter : " + missing.join(" · ")
                    : "Envoyer"
                }
                aria-label={"Envoyer " + a.name}
                disabled={p.submitting || c.status === "finished"}
                data-unavailable={
                  !editable ||
                  !!missing.length ||
                  !["draft", "changes_requested"].includes(a.status) ||
                  undefined
                }
                onClick={() => {
                  if (!editable)
                    return notify(
                      a.status === "approved"
                        ? "Cette annonce est déjà validée. Déverrouillez-la pour la modifier."
                        : "Cette annonce est ouverte dans un autre éditeur. Votre saisie reste conservée.",
                    );
                  if (missing.length)
                    return notify("À compléter : " + missing.join(" · "));
                  if (!["draft", "changes_requested"].includes(a.status))
                    return notify(
                      "Cette annonce a déjà été envoyée en validation.",
                    );
                  void p.onSubmit([a.id]).catch(() => {});
                }}
              >
                <Icon name="send" size={16} />
              </button>
            )}
            <button
              aria-label={"Aperçu de " + a.name}
              title="Aperçu"
              onClick={() => {
                p.setActive(a.id);
                p.onPreview(true);
              }}
            >
              <Icon name="eye" size={16} />
            </button>
            <button
              aria-label={"Dupliquer " + a.name}
              title="Dupliquer"
              disabled={
                c.status === "finished" || pending("duplicate", c.id, a.id)
              }
              onClick={() => void duplicate()}
            >
              <Icon name="copy" size={16} />
            </button>
            <DeleteAds
              campaign={c}
              ids={[a.id]}
              label={"Supprimer " + a.name}
              flush={() => p.flushRef.current?.()}
              onDeleted={() =>
                p.setSelected(p.selected.filter((id) => id !== a.id))
              }
            />
          </div>
        </td>
      </tr>
      {isActive &&
        !protectedRow &&
        (editor.status === "locked" || editor.status === "error") && (
          <tr className={t.recovery}>
            <td colSpan={p.columns.length + 5}>
              <div role="alert">
                {editor.error || "Cette annonce est verrouillée."}
                <button onClick={() => void editor.retry().catch(() => {})}>
                  Reprendre l’édition
                </button>
              </div>
            </td>
          </tr>
        )}
      {isActive &&
        p.toolsHost &&
        createPortal(
          <div className={t.details}>
            <label>
              Nom de l’annonce
              <input
                aria-label="Nom de l’annonce active"
                readOnly={!editable}
                value={editor.draft.name}
                onChange={(e) => editor.change({ name: e.target.value })}
              />
            </label>
            {a.channel !== "google" && (
              <label>
                Média
                <Select
                  aria-label={"Média de " + a.name}
                  disabled={!editable}
                  value={editor.draft.mediaId ?? ""}
                  onValueChange={(selectedValue) =>
                    editor.change({ mediaId: selectedValue || null })
                  }
                >
                  <option value="">À associer</option>
                  {c.media
                    .filter(
                      (m) =>
                        m.state === "ready" &&
                        mediaChannels(m).includes(a.channel) &&
                        compatibleFormats(m, a.channel).some(
                          (f) => f.id === current.format,
                        ),
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </Select>
              </label>
            )}
            {a.channel !== "google" && (
              <label className={t.attach}>
                Joindre un média
                <input
                  type="file"
                  disabled={!editable || uploading}
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void attach(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <span role="status">
              {uploading
                ? "Transfert…"
                : editor.status === "saving"
                  ? "Enregistrement…"
                  : editor.status === "error"
                    ? editor.error
                    : editor.status === "loading"
                      ? "Ouverture…"
                      : protectedRow
                        ? "Annonce protégée"
                        : "Enregistré"}
            </span>
            {(editor.status === "locked" || editor.status === "error") &&
              !protectedRow && (
                <button onClick={() => void editor.retry().catch(() => {})}>
                  Réessayer
                </button>
              )}
          </div>,
          p.toolsHost,
        )}
      {a.comments.map((comment, index) => (
        <tr
          key={index}
          className={`${t.comment} ${comment.resolution === "handled" ? t.handled : ""}`}
        >
          <td colSpan={p.columns.length + 5}>
            <div>
              <Icon name="comment" size={17} />
              <span>
                <b>{comment.author}</b> · {comment.text}
              </span>
              <button
                aria-label={
                  comment.resolution === "handled"
                    ? "Commentaire pris en compte"
                    : "Marquer le commentaire comme pris en compte"
                }
                title={
                  comment.resolution === "handled"
                    ? "Pris en compte"
                    : "Marquer comme pris en compte"
                }
                disabled={
                  comment.resolution === "handled" ||
                  c.status === "finished" ||
                  pending("handle_comment", c.id, a.id)
                }
                onClick={() =>
                  void run({
                    type: "handle_comment",
                    campaignId: c.id,
                    adId: a.id,
                    commentIndex: index,
                  }).catch(() => {})
                }
              >
                <Icon name="check" size={17} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </Fragment>
  );
}
