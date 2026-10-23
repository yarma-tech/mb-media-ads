"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  Ad,
  Campaign,
  Channel,
} from "@/lib/campaign-studio/workspace/types";
import { CHANNELS } from "@/lib/campaign-studio/workspace/catalog";
import { useWorkspace } from "./WorkspaceProvider";
import { useAdEditor } from "./useAdEditor";
import Preview from "./Preview";
import History from "./History";
import { STATUS } from "./Configuration";
import Icon from "../Icon";
import w from "./workspace.module.css";
export default function Review({
  view,
}: {
  view: "validation" | "live" | "finished";
}) {
  const { data, run, notify } = useWorkspace();
  const [status, setStatus] = useState<"pending" | "approved">("pending"),
    [mode, setMode] = useState<"grid" | "carousel">("grid"),
    [campaignId, setCampaignId] = useState("all"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<{
      campaign: string;
      ad: string;
      mode: "edit" | "comment";
    } | null>(null),
    [visited, setVisited] = useState<string[]>([]);
  const validator =
    data!.actor.kind === "human" && data!.actor.role === "validator";
  const items = data!.campaigns
    .filter((c) => campaignId === "all" || c.id === campaignId)
    .flatMap((c) =>
      c.ads
        .filter((a) =>
          view === "validation"
            ? c.status === "active" && a.status === status
            : view === "live"
              ? a.status === "on_air"
              : a.status === "stopped",
        )
        .map((a) => ({ c, a })),
    )
    .filter(({ c, a }) =>
      (c.name + " " + a.name + " " + a.copy)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const editor = editing
    ? data!.campaigns
        .flatMap((c) => c.ads.map((a) => ({ c, a })))
        .find(({ c, a }) => c.id === editing.campaign && a.id === editing.ad)
    : null;
  const remaining = items.filter((i) => !visited.includes(i.a.id));
  async function animate(id: string, direction: number) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = document.querySelector(`[data-workspace-ad="${id}"]`);
    await el
      ?.animate(
        [
          { transform: "translateX(0)", opacity: 1 },
          {
            transform: `translateX(${direction * 400}px) rotate(${direction * 8}deg)`,
            opacity: 0,
          },
        ],
        { duration: 300, easing: "ease-in" },
      )
      .finished.catch(() => {});
  }
  async function action(
    c: Campaign,
    a: Ad,
    type: "approve" | "publish" | "stop",
  ) {
    try {
      if (type === "approve") await animate(a.id, 1);
      await run({
        type: type === "approve" ? "decide" : type,
        campaignId: c.id,
        adId: a.id,
        ...(type === "approve" ? { status: "approved" } : {}),
      });
      notify(
        type === "approve"
          ? "Annonce validée."
          : type === "publish"
            ? "Annonce marquée On air."
            : "Annonce arrêtée.",
      );
    } catch {}
  }
  function card({ c, a }: { c: Campaign; a: Ad }) {
    return (
      <article className={w.reviewCard} key={a.id}>
        <div data-workspace-ad={a.id}>
          <Preview ad={a} campaign={c} />
        </div>
        <div className={w.cardCaption}>
          <b>{c.name}</b>
          <span>
            V{a.version} · {STATUS[a.status]}
          </span>
        </div>
        {view === "validation" && validator && (
          <div className={w.validationActions}>
            {a.status === "approved" && (
              <button
                aria-label="Annuler la validation"
                title="Annuler la validation"
                onClick={() =>
                  void run({
                    type: "undo",
                    campaignId: c.id,
                    adId: a.id,
                  }).catch(() => {})
                }
              >
                <Icon name="reset" size={21} />
              </button>
            )}
            <button
              title="Demander une modification"
              aria-label="Demander une modification"
              onClick={() =>
                setEditing({ campaign: c.id, ad: a.id, mode: "comment" })
              }
            >
              <Icon name="comment" size={21} />
            </button>
            <button
              title="Modifier et valider"
              aria-label="Modifier et valider"
              onClick={() =>
                setEditing({ campaign: c.id, ad: a.id, mode: "edit" })
              }
            >
              <Icon name="edit" size={21} />
            </button>
            {a.status === "pending" ? (
              <button
                className={w.approve}
                aria-label="Approuver"
                onClick={() => void action(c, a, "approve")}
              >
                <Icon name="check" size={24} />
              </button>
            ) : (
              <button
                className={w.primary}
                onClick={() => void action(c, a, "publish")}
              >
                Passer On air
              </button>
            )}
          </div>
        )}
        {view === "live" && (
          <div className={w.inline}>
            {validator && (
              <button onClick={() => void action(c, a, "stop")}>Arrêter</button>
            )}
            <button
              onClick={async () => {
                await run({ type: "version", campaignId: c.id, adId: a.id });
                notify("Nouvelle version créée dans Configuration.");
              }}
            >
              Créer une nouvelle version
            </button>
          </div>
        )}
        {view === "finished" &&
          c.status === "active" &&
          validator &&
          a.stopReason !== "replaced" && (
            <button
              className={w.primary}
              onClick={() => void action(c, a, "publish")}
            >
              Remettre On air
            </button>
          )}
        <details className={w.history}>
          <summary>Détails et historique</summary>
          <Link href={"/studio/configuration?campagne=" + c.id}>
            Ouvrir la configuration →
          </Link>
          {a.stopReason && (
            <p>
              {
                {
                  replaced: "Version remplacée",
                  manual: "Arrêt manuel",
                  campaign_finished: "Campagne terminée",
                }[a.stopReason]
              }
            </p>
          )}
          <History ad={a} campaign={c} />
        </details>
      </article>
    );
  }
  return (
    <>
      <div className={w.toolbar}>
        {view === "validation" && (
          <>
            <div className={w.segment} data-second={status === "approved"}>
              <button
                aria-pressed={status === "pending"}
                onClick={() => {
                  setStatus("pending");
                  setVisited([]);
                }}
              >
                À valider
              </button>
              <button
                aria-pressed={status === "approved"}
                onClick={() => {
                  setStatus("approved");
                  setVisited([]);
                }}
              >
                Validées
              </button>
            </div>
            <div className={w.segment} data-second={mode === "carousel"}>
              <button
                aria-pressed={mode === "grid"}
                onClick={() => setMode("grid")}
              >
                Par canal
              </button>
              <button
                aria-pressed={mode === "carousel"}
                onClick={() => setMode("carousel")}
              >
                Carrousel
              </button>
            </div>
          </>
        )}
        <select
          aria-label="Filtrer par campagne"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
        >
          <option value="all">Toutes les campagnes</option>
          {data!.campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className={w.search}>
          <Icon name="search" size={16} />
          <input
            type="search"
            aria-label="Rechercher une annonce"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {view === "finished" &&
        data!.campaigns
          .filter(
            (c) =>
              c.status === "finished" &&
              (campaignId === "all" || c.id === campaignId),
          )
          .map((c) => <FinishedCampaign key={c.id} c={c} />)}
      {view === "validation" && mode === "carousel" ? (
        remaining[0] ? (
          <div className={w.carousel}>
            <div className={w.heading}>
              <span>
                {CHANNELS[remaining[0].a.channel]} · {remaining.length}{" "}
                annonce(s)
              </span>
              <button
                onClick={() => setVisited([...visited, remaining[0].a.id])}
              >
                Suivante →
              </button>
            </div>
            {card(remaining[0])}
          </div>
        ) : (
          <p className={w.empty}>
            Toutes les annonces de cette sélection ont été parcourues.
          </p>
        )
      ) : (
        Object.entries(CHANNELS).map(([channel, label]) => {
          const list = items.filter(
            (i) => i.a.channel === (channel as Channel),
          );
          return list.length ? (
            <section className={w.channelGroup} key={channel}>
              <h2>
                {label} <small>{list.length}</small>
              </h2>
              <div className={w.reviewGrid}>{list.map(card)}</div>
            </section>
          ) : null;
        })
      )}
      {!items.length && (
        <p className={w.empty}>Aucune annonce dans cette vue.</p>
      )}
      {editor &&
        editing &&
        (editing.mode === "edit" ? (
          <EditModal
            key={editor.a.id}
            c={editor.c}
            ad={editor.a}
            onClose={() => setEditing(null)}
          />
        ) : (
          <CommentModal
            c={editor.c}
            ad={editor.a}
            onClose={() => setEditing(null)}
            beforeRequest={() => animate(editor.a.id, -1)}
          />
        ))}
    </>
  );
}
function FinishedCampaign({ c }: { c: Campaign }) {
  const { data, run } = useWorkspace();
  const [date, setDate] = useState("");
  return (
    <div className={w.finishedCampaign}>
      <span>
        <b>{c.name}</b>
        <small>Campagne terminée · {c.endDate} · Montréal</small>
      </span>
      {data!.actor.role === "validator" && (
        <form
          className={w.inline}
          onSubmit={async (e) => {
            e.preventDefault();
            await run({ type: "reopen", campaignId: c.id, endDate: date });
          }}
        >
          <input
            type="date"
            aria-label={"Nouvelle fin de " + c.name}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button>Rouvrir</button>
        </form>
      )}
    </div>
  );
}
function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return {
    ref,
    onCancel: onClose,
    onClick: (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          onClose();
      }
    },
  };
}
function EditModal({
  c,
  ad,
  onClose,
}: {
  c: Campaign;
  ad: Ad;
  onClose: () => void;
}) {
  const dialog = useDialog(onClose);
  const editor = useAdEditor(c, ad, true, "validation", true);
  return (
    <dialog {...dialog} className={w.dialog} aria-labelledby="edit-ad-title">
      <button className={w.close} aria-label="Fermer" onClick={onClose}>
        ×
      </button>
      <div className={w.dialogSplit}>
        <Preview campaign={c} ad={{ ...ad, ...editor.draft }} />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await editor.save(true);
              onClose();
            } catch {}
          }}
        >
          {editor.status === "locked" && (
            <div role="status">
              <p>Édition en pause. Vos changements sont conservés.</p>
              <button type="button" onClick={() => void editor.retry().catch(() => {})}>
                Reprendre l’édition
              </button>
            </div>
          )}
          <fieldset
            className={w.editFields}
            disabled={["loading", "locked"].includes(editor.status)}
          >
            <h2 id="edit-ad-title">Modifier et valider</h2>
            <p>
              {c.name} · V{ad.version}
            </p>
            {ad.channel === "google" ? (
              <>
                <label>
                  Titres · un par ligne
                  <textarea
                    rows={6}
                    value={editor.draft.headlines.join("\n")}
                    onChange={(e) =>
                      editor.change({ headlines: e.target.value.split("\n") })
                    }
                  />
                </label>
                <label>
                  Descriptions · une par ligne
                  <textarea
                    rows={5}
                    value={editor.draft.descriptions.join("\n")}
                    onChange={(e) =>
                      editor.change({
                        descriptions: e.target.value.split("\n"),
                      })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Texte
                  <textarea
                    rows={6}
                    value={editor.draft.copy}
                    onChange={(e) => editor.change({ copy: e.target.value })}
                  />
                </label>
                <label>
                  Titre
                  <input
                    value={editor.draft.headline}
                    onChange={(e) =>
                      editor.change({ headline: e.target.value })
                    }
                  />
                </label>
                <label>
                  CTA
                  <input
                    value={editor.draft.cta}
                    onChange={(e) => editor.change({ cta: e.target.value })}
                  />
                </label>
              </>
            )}
            <label>
              Destination
              <input
                type="url"
                placeholder={c.defaultUrl}
                value={editor.draft.url}
                onChange={(e) => editor.change({ url: e.target.value })}
              />
            </label>
            {editor.error && <p className={w.error}>{editor.error}</p>}
            <button
              className={w.primary}
              disabled={!["ready", "error"].includes(editor.status)}
            >
              Enregistrer et valider
            </button>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}
function CommentModal({
  c,
  ad,
  onClose,
  beforeRequest,
}: {
  c: Campaign;
  ad: Ad;
  onClose: () => void;
  beforeRequest: () => Promise<void>;
}) {
  const dialog = useDialog(onClose);
  const { run } = useWorkspace();
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false);
  return (
    <dialog
      {...dialog}
      className={w.commentDialog}
      aria-labelledby="comment-title"
    >
      <button className={w.close} aria-label="Fermer" onClick={onClose}>
        ×
      </button>
      <h2 id="comment-title">Demander une modification</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSending(true);
          try {
            await beforeRequest();
            await run({
              type: "decide",
              campaignId: c.id,
              adId: ad.id,
              status: "changes_requested",
              comment: text,
            });
            onClose();
          } finally {
            setSending(false);
          }
        }}
      >
        <label>
          Votre commentaire
          <textarea
            required
            autoFocus
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button className={w.primary} disabled={sending || !text.trim()}>
          Envoyer la demande
        </button>
      </form>
    </dialog>
  );
}
