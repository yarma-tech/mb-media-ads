"use client";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type {
  Ad,
  Campaign,
  Channel,
} from "@/lib/campaign-studio/workspace/types";
import {
  currentAds,
  intendedChannels,
} from "@/lib/campaign-studio/workspace/presentation";
import { CHANNELS, CATALOG } from "@/lib/campaign-studio/workspace/catalog";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import { useWorkspace } from "./WorkspaceProvider";
import { useAdEditor } from "./useAdEditor";
import Preview, {
  MediaPreview,
  SearchSceneHeader,
  PublisherScene,
} from "./Preview";
import ChannelIcon, { CHANNEL_ORDER } from "./ChannelIcon";
import r from "./review.module.css";
import History from "./History";
import { STATUS } from "./Configuration";
import Icon from "../Icon";
import w from "./workspace.module.css";
export default function Review({
  view,
}: {
  view: "validation" | "live" | "finished";
}) {
  const { data, run, notify, pending } = useWorkspace();
  const navigation = useWorkspaceNavigation();
  const status =
    navigation.params.get("statut") === "approved" ? "approved" : "pending";
  const mode =
    navigation.params.get("vue") === "carousel" ? "carousel" : "deck";
  const channel = navigation.params.get("canal") || "all";
  const theme = navigation.params.get("theme") || "all";
  const videosOnly =
    view === "validation" && navigation.params.get("media") === "video";
  const [detail, setDetail] = useState<{ c: Campaign; a: Ad } | null>(null);
  const campaignId = navigation.params.get("campagne") || "all";
  const query = navigation.params.get("q") || "";
  const searchRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const resumeFocus = useRef(false);
  const actions = useRef(new Set<string>());
  const [acting, setActing] = useState<string[]>([]);
  const [editing, setEditing] = useState<{
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
    .filter(
      ({ c, a }) =>
        !videosOnly ||
        c.media.some(
          (media) => media.id === a.mediaId && media.mime.startsWith("video/"),
        ),
    )
    .filter(({ c, a }) =>
      (c.name + " " + (a.theme || "") + " " + a.name + " " + a.copy)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const scopedItems = items.filter(
    ({ a }) =>
      (channel === "all" || a.channel === channel) &&
      (theme === "all" || (a.theme?.trim() || "Sans thème") === theme),
  );
  const themes = [
    ...new Set(items.map(({ a }) => a.theme?.trim() || "Sans thème")),
  ];
  const groups = [
    ...new Set(
      scopedItems.map(({ a }) =>
        JSON.stringify([a.theme?.trim() || "Sans thème", a.channel]),
      ),
    ),
  ]
    .map((key) => {
      const [groupTheme, groupChannel] = JSON.parse(key) as [string, Channel];
      return {
        key,
        theme: groupTheme,
        channel: groupChannel,
        items: scopedItems.filter(
          ({ a }) =>
            (a.theme?.trim() || "Sans thème") === groupTheme &&
            a.channel === groupChannel,
        ),
      };
    })
    .sort(
      (a, b) =>
        themes.indexOf(a.theme) - themes.indexOf(b.theme) ||
        CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
    );
  const requestedSlide = navigation.params.get("groupe");
  const slideIndex = Math.max(
    0,
    groups.findIndex((g) => g.key === requestedSlide),
  );
  const slide = groups[slideIndex];
  function moveSlide(delta: number) {
    const next = groups[slideIndex + delta];
    if (next) navigation.update({ groupe: next.key });
  }
  const editor = editing
    ? data!.campaigns
        .flatMap((c) => c.ads.map((a) => ({ c, a })))
        .find(({ c, a }) => c.id === editing.campaign && a.id === editing.ad)
    : null;
  const remaining = scopedItems.filter((i) => !visited.includes(i.a.id));
  useEffect(() => {
    if (resumeFocus.current && remaining.length) {
      carouselRef.current?.focus();
      resumeFocus.current = false;
    }
  }, [remaining.length]);
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
    if (actions.current.has(a.id)) return;
    actions.current.add(a.id);
    setActing((ids) => [...ids, a.id]);
    try {
      if (type === "approve") await animate(a.id, 1);
      await run({
        type: type === "approve" ? "decide" : type,
        campaignId: c.id,
        adId: a.id,
        ...(type === "approve" ? { status: "approved" } : {}),
      });
      if (type === "stop") setDetail(null);
      notify(
        type === "approve"
          ? "Annonce validée."
          : type === "publish"
            ? "Annonce marquée On air."
            : "Annonce arrêtée.",
      );
    } catch {
    } finally {
      actions.current.delete(a.id);
      setActing((ids) => ids.filter((id) => id !== a.id));
    }
  }
  function card(
    { c, a }: { c: Campaign; a: Ad },
    grouped = false,
    playback = false,
  ) {
    return (
      <article
        className={r.reviewCard}
        key={a.id}
        data-channel={a.channel}
        data-format={a.format}
      >
        {grouped && ["instagram", "youtube", "display"].includes(a.channel) && (
          <div className={r.formatLabel}>
            {CATALOG[a.channel].find((f) => f.id === a.format)?.label}
          </div>
        )}
        <div data-workspace-ad={a.id}>
          <Preview ad={a} campaign={c} grouped={grouped} playback={playback} />
        </div>
        <div className={view === "validation" ? w.srOnly : w.cardCaption}>
          <b>{c.name}</b>
          <span>
            V{a.version} · {STATUS[a.status]}
          </span>
        </div>
        {view === "validation" && validator && (
          <fieldset
            className={`${w.validationActions} ${r.actions}`}
            disabled={acting.includes(a.id) || pending("undo", c.id, a.id)}
            aria-label="Actions de validation"
            aria-busy={acting.includes(a.id)}
          >
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
          </fieldset>
        )}
        {view === "live" && (
          <div className={w.inline}>
            {validator && (
              <button
                disabled={acting.includes(a.id)}
                onClick={() => void action(c, a, "stop")}
              >
                Arrêter
              </button>
            )}
            {!validator && (
              <button
                disabled={pending("version", c.id, a.id)}
                onClick={async () => {
                  try {
                    await run({
                      type: "version",
                      campaignId: c.id,
                      adId: a.id,
                    });
                    notify("Nouvelle version créée dans Configuration.");
                  } catch {}
                }}
              >
                Créer une nouvelle version
              </button>
            )}
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
        <details className={r.cardHistory}>
          <summary
            aria-label="Détails et historique"
            title="Détails et historique"
          >
            <Icon name="more" />
          </summary>
          {!validator && (
            <Link
              href={navigation.href("/studio/configuration", {
                campagne: c.id,
                canal: a.channel,
              })}
            >
              Ouvrir la configuration →
            </Link>
          )}
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
  const controls = (
    <div className={r.toolbar}>
      {view === "validation" && (
        <div className={r.segment} data-second={status === "approved"}>
          <button
            aria-pressed={status === "pending"}
            onClick={() => {
              navigation.update({ statut: "pending" });
              setVisited([]);
            }}
          >
            À valider
          </button>
          <button
            aria-pressed={status === "approved"}
            onClick={() => {
              navigation.update({ statut: "approved" });
              setVisited([]);
            }}
          >
            Validées
          </button>
        </div>
      )}
      {videosOnly && (
        <button
          type="button"
          title="Afficher toutes les annonces"
          onClick={() => navigation.update({ media: "", groupe: "" })}
        >
          Vidéos uniquement ×
        </button>
      )}
      <select
        aria-label="Filtrer par campagne"
        value={campaignId}
        onChange={(e) => {
          navigation.update({ campagne: e.target.value });
          setVisited([]);
        }}
      >
        <option value="all">Toutes les campagnes</option>
        {data!.campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className={r.tools}>
        {view === "validation" && (
          <details className={r.viewOptions}>
            <summary
              aria-label="Options d’affichage"
              title="Options d’affichage"
            >
              <Icon name="more" size={22} />
            </summary>
            <div className={r.optionsPanel}>
              <div className={r.modeOptions}>
                <button
                  aria-pressed={mode === "deck"}
                  onClick={() => navigation.update({ vue: "", groupe: "" })}
                >
                  <Icon name="grid" /> Diaporama
                </button>
                <button
                  aria-pressed={mode === "carousel"}
                  onClick={() => navigation.update({ vue: "carousel" })}
                >
                  <Icon name="heart" /> Carrousel
                </button>
              </div>
              <label>
                Canal
                <select
                  aria-label="Filtrer par canal"
                  value={channel}
                  onChange={(e) => {
                    navigation.update({ canal: e.target.value, groupe: "" });
                    setVisited([]);
                  }}
                >
                  <option value="all">Tous les canaux</option>
                  {Object.entries(CHANNELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {themes.length > 1 && (
                <label>
                  Thématique
                  <select
                    aria-label="Filtrer par thème"
                    value={theme}
                    onChange={(e) => {
                      navigation.update({ theme: e.target.value, groupe: "" });
                      setVisited([]);
                    }}
                  >
                    <option value="all">Tous les thèmes</option>
                    {themes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </details>
        )}
        <label className={r.search} data-expanded={!!query}>
          <Icon name="search" size={21} />
          <input
            ref={searchRef}
            type="search"
            aria-label="Rechercher une annonce"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => {
              navigation.update({ q: e.target.value }, true);
              setVisited([]);
            }}
          />
        </label>
      </div>
    </div>
  );
  return (
    <div className={r.surface}>
      {view !== "live" && controls}
      {view === "live" && (
        <LiveBoards
          campaigns={data!.campaigns.filter(
            (c) => campaignId === "all" || c.id === campaignId,
          )}
          query={query}
          onDetail={setDetail}
          controls={controls}
        />
      )}
      {view === "finished" &&
        data!.campaigns
          .filter(
            (c) =>
              c.status === "finished" &&
              (campaignId === "all" || c.id === campaignId),
          )
          .map((c) => <FinishedCampaign key={c.id} c={c} />)}
      {view === "validation" && mode === "deck" && slide && (
        <section
          className={r.deck}
          aria-label="Groupe de validation"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              moveSlide(e.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          <header
            className={r.slideHeading}
            role="group"
            aria-label={`${themes.length > 1 ? slide.theme + " · " : ""}${CHANNELS[slide.channel]}`}
          >
            <span
              className={r.channelLogo}
              role="img"
              aria-label={CHANNELS[slide.channel]}
              title={CHANNELS[slide.channel]}
            >
              <ChannelIcon
                channel={slide.channel}
                size={48}
                tone={
                  ["youtube", "google"].includes(slide.channel)
                    ? "brand"
                    : "mono"
                }
              />
            </span>
            <h2>
              {slide.theme !== "Sans thème"
                ? slide.theme
                : CHANNELS[slide.channel]}
            </h2>
            <span>
              {slide.items.length} annonce{slide.items.length > 1 ? "s" : ""}
            </span>
          </header>
          {slide.channel === "display" && (
            <PublisherScene items={slide.items} />
          )}
          <div
            className={`${r.deckGrid} ${slide.channel === "google" ? r.googleDeck : ""} ${slide.channel === "display" ? r.displayDeck : ""} ${["tiktok", "instagram", "youtube"].includes(slide.channel) ? r.mixedDeck : ""}`}
          >
            {slide.channel === "google" && (
              <SearchSceneHeader query={slide.items[0].c.name} />
            )}
            {slide.items.map((item) => card(item, true))}
          </div>
          <nav className={r.pagination} aria-label="Navigation des groupes">
            <button
              aria-label="Groupe précédent"
              disabled={slideIndex === 0}
              onClick={() => moveSlide(-1)}
            >
              ‹
            </button>
            <span aria-live="polite">
              {slideIndex + 1} / {groups.length}
            </span>
            <button
              aria-label="Groupe suivant"
              disabled={slideIndex === groups.length - 1}
              onClick={() => moveSlide(1)}
            >
              ›
            </button>
            {groups[slideIndex + 1] && (
              <small>
                Suivant :{" "}
                {themes.length > 1 ? groups[slideIndex + 1].theme + " · " : ""}
                {CHANNELS[groups[slideIndex + 1].channel]}
              </small>
            )}
          </nav>
        </section>
      )}
      {view !== "live" &&
        (view !== "validation" || mode === "carousel") &&
        scopedItems.length > 0 &&
        (view === "validation" && mode === "carousel" ? (
          remaining[0] ? (
            <div
              className={w.carousel}
              ref={carouselRef}
              tabIndex={-1}
              role="group"
              aria-label="Annonce courante"
            >
              <div className={w.heading}>
                <h2 className={w.carouselHeading}>
                  {CHANNELS[remaining[0].a.channel]} · {remaining.length} à
                  parcourir
                </h2>
                <button
                  onClick={() => setVisited([...visited, remaining[0].a.id])}
                >
                  Suivante →
                </button>
              </div>
              {card(remaining[0])}
            </div>
          ) : (
            <div className={w.empty}>
              <p>Toutes les annonces de cette sélection ont été parcourues.</p>
              <button
                onClick={() => {
                  resumeFocus.current = true;
                  setVisited([]);
                }}
              >
                Revoir les annonces parcourues
              </button>
            </div>
          )
        ) : (
          Object.entries(CHANNELS).map(([channel, label]) => {
            const list = scopedItems.filter(
              (i) => i.a.channel === (channel as Channel),
            );
            return list.length ? (
              <section className={w.channelGroup} key={channel}>
                <h2>
                  {label} <small>{list.length}</small>
                </h2>
                <div className={w.reviewGrid}>
                  {list.map((item) => card(item))}
                </div>
              </section>
            ) : null;
          })
        ))}
      {view !== "live" && !scopedItems.length && (
        <div className={w.empty}>
          <p>
            {query
              ? "Aucune annonce pour cette recherche."
              : view === "validation"
                ? status === "pending"
                  ? "Aucune annonce à valider."
                  : "Aucune annonce validée."
                : "Aucune annonce arrêtée."}
          </p>
          {query ? (
            <button
              onClick={() => {
                navigation.update({ q: "" }, true);
                searchRef.current?.focus();
              }}
            >
              Effacer la recherche
            </button>
          ) : campaignId !== "all" ? (
            <button onClick={() => navigation.update({ campagne: "all" })}>
              Voir toutes les campagnes
            </button>
          ) : null}
        </div>
      )}
      {detail && (
        <DetailModal onClose={() => setDetail(null)}>
          {card(
            data!.campaigns
              .flatMap((c) => c.ads.map((a) => ({ c, a })))
              .find(({ a }) => a.id === detail.a.id) || detail,
            false,
            true,
          )}
        </DetailModal>
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
    </div>
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
function useDialog(onClose: () => void, initialFocus?: string) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    if (initialFocus) dialog?.querySelector<HTMLElement>(initialFocus)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      dialog?.close();
      previous?.focus({ preventScroll: true });
    };
  }, [initialFocus]);
  return {
    ref,
    onCancel: (e: React.SyntheticEvent<HTMLDialogElement>) => {
      e.preventDefault();
      onClose();
    },
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
  const editor = useAdEditor(c, ad, true, "validation", true);
  const close = () => {
    if (editor.status !== "saving" && editor.canClose()) onClose();
  };
  const dialog = useDialog(close);
  return (
    <dialog
      {...dialog}
      className={`${w.dialog} ${r.editDialog}`}
      aria-labelledby="edit-ad-title"
    >
      <button
        className={w.close}
        aria-label="Fermer"
        disabled={editor.status === "saving"}
        onClick={close}
      >
        ×
      </button>
      <header className={r.dialogHeader}>
        <h2 id="edit-ad-title">Modifier l’annonce</h2>
        <p>{ad.theme || c.name}</p>
      </header>
      <div className={r.dialogSplit}>
        <form
          id="edit-ad-form"
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
              <button
                type="button"
                onClick={() => void editor.retry().catch(() => {})}
              >
                Reprendre l’édition
              </button>
            </div>
          )}
          <p className={w.srOnly} role="status">
            {editor.status === "loading"
              ? "Ouverture de l’annonce…"
              : editor.status === "saving"
                ? "Enregistrement en cours…"
                : ""}
          </p>
          <fieldset
            className={w.editFields}
            disabled={["loading", "locked", "saving"].includes(editor.status)}
          >
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
            {editor.error && (
              <p className={w.error} role="alert">
                {editor.error}
              </p>
            )}
            <p className={r.saveState}>
              <span aria-hidden="true">○</span>{" "}
              {editor.dirty
                ? "Modifications non enregistrées"
                : "Aucune modification"}
            </p>
          </fieldset>
        </form>
        <div className={r.editPreview}>
          <h3>Aperçu</h3>
          <Preview campaign={c} ad={{ ...ad, ...editor.draft }} playback />
        </div>
      </div>
      <footer className={r.dialogFooter}>
        <button
          type="button"
          disabled={editor.status === "saving"}
          onClick={close}
        >
          Annuler
        </button>
        <button
          type="submit"
          form="edit-ad-form"
          className={w.primary}
          disabled={!["ready", "error"].includes(editor.status)}
        >
          <Icon name="check" />
          {editor.status === "saving"
            ? "Enregistrement…"
            : "Enregistrer et valider"}
        </button>
      </footer>
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
  const { run } = useWorkspace();
  const sendingRef = useRef(false);
  const [text, setText] = useState(""),
    [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const close = () => {
    if (
      !sendingRef.current &&
      (!text.trim() || confirm("Abandonner ce commentaire ?"))
    )
      onClose();
  };
  const dialog = useDialog(close, "textarea");
  return (
    <dialog
      {...dialog}
      className={`${w.commentDialog} ${r.editDialog}`}
      aria-labelledby="comment-title"
    >
      <button
        className={w.close}
        aria-label="Fermer"
        disabled={sending}
        onClick={close}
      >
        ×
      </button>
      <h2 id="comment-title">Demander une modification</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (sendingRef.current) return;
          sendingRef.current = true;
          setSending(true);
          setError("");
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
          } catch (e) {
            setError(workspaceErrorMessage(e, "command"));
          } finally {
            sendingRef.current = false;
            setSending(false);
          }
        }}
      >
        <label>
          Votre commentaire
          <textarea
            required
            disabled={sending}
            rows={5}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
          />
        </label>
        <p className={w.srOnly} role="status">
          {sending ? "Envoi de la demande en cours…" : ""}
        </p>
        {error && (
          <p className={w.error} role="alert">
            {error}
          </p>
        )}
        <button className={w.primary} disabled={sending || !text.trim()}>
          {sending ? "Envoi…" : "Envoyer la demande"}
        </button>
      </form>
    </dialog>
  );
}

function DetailModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useDialog(onClose);
  return (
    <dialog
      {...dialog}
      className={`${r.detailDialog} ${r.editDialog}`}
      aria-label="Détail de l’annonce"
    >
      <button className={w.close} aria-label="Fermer" onClick={onClose}>
        ×
      </button>
      {children}
    </dialog>
  );
}
function LiveBoards({
  campaigns,
  query,
  onDetail,
  controls,
}: {
  controls: React.ReactNode;
  campaigns: Campaign[];
  query: string;
  onDetail: (item: { c: Campaign; a: Ad }) => void;
}) {
  const channels = CHANNEL_ORDER.filter((channel) =>
    campaigns.some((c) => intendedChannels(c).includes(channel)),
  );
  const families = campaigns
    .flatMap((c) =>
      currentAds(c).map((a) => {
        const live = c.ads.find(
          (candidate) =>
            candidate.familyId === a.familyId && candidate.status === "on_air",
        );
        return { c, a, live };
      }),
    )
    .filter(({ c, a, live }) =>
      [c.name, a.name, a.theme, a.copy, live?.copy]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const liveCount = families.filter((f) => f.live).length;
  const liveChannels = channels.filter((channel) =>
    families.some((f) => f.live?.channel === channel),
  ).length;
  return (
    <section className={r.overview} aria-label="Vue d’ensemble On air">
      <h2 className={r.overviewTitle}>Vue d’ensemble</h2>
      <div className={r.liveToolbar}>
        {controls}
        <p className={r.totals}>
          <b>
            {liveChannels} / {channels.length}
          </b>{" "}
          canaux en ligne{" "}
          <span>
            <b>
              {liveCount} / {families.length}
            </b>{" "}
            annonces en ligne
          </span>
        </p>
      </div>
      <div className={r.artboards}>
        {channels.map((channel) => {
          const entries = families.filter((f) => f.a.channel === channel);
          const live = entries.filter((f) => f.live).length;
          return (
            <section
              className={r.artboard}
              data-channel={channel}
              key={channel}
              aria-label={CHANNELS[channel]}
            >
              <header>
                <ChannelIcon channel={channel} size={46} tone="brand" />
                <h3>{CHANNELS[channel]}</h3>
                <span>
                  <b>
                    {live} / {entries.length}
                  </b>{" "}
                  en ligne
                </span>
                <i
                  className={
                    live && live === entries.length ? r.complete : r.incomplete
                  }
                  aria-label={
                    live === entries.length && live > 0
                      ? "Toutes les annonces en ligne"
                      : "Annonces à mettre en ligne"
                  }
                >
                  {live && live === entries.length ? (
                    <Icon name="check" size={17} />
                  ) : !live && entries.length ? (
                    <span aria-hidden="true">△</span>
                  ) : (
                    "○"
                  )}
                </i>
              </header>
              <div
                className={`${r.thumbnails} ${["instagram", "tiktok"].includes(channel) ? r.verticalTiles : ""}`}
                style={
                  channel === "instagram"
                    ? {
                        gridTemplateColumns: `repeat(${Math.min(3, Math.max(entries.length, 1))}, minmax(0, 1fr))`,
                      }
                    : undefined
                }
              >
                {entries.map(({ c, a, live }) => {
                  const media = c.media.find((m) => m.id === live?.mediaId);
                  return live ? (
                    <button
                      key={a.id}
                      className={r.liveTile}
                      data-format={a.format}
                      aria-label={"Ouvrir " + live.name + " · " + c.name}
                      onClick={() => onDetail({ c, a: live })}
                    >
                      {channel === "google" ? (
                        <Preview campaign={c} ad={live} grouped />
                      ) : (
                        <MediaPreview campaign={c} ad={live} thumbnail />
                      )}
                      {channel === "display" &&
                        media &&
                        media.width > 0 &&
                        media.height > 0 && (
                          <small className={r.mediaDimensions}>
                            {media.width} X {media.height}
                          </small>
                        )}
                    </button>
                  ) : (
                    <div
                      key={a.id}
                      className={r.waitingTile}
                      data-format={a.format}
                      aria-label={a.name + " : pas en ligne"}
                    >
                      {channel === "google" ? (
                        <span className={r.googleGhost} aria-hidden="true">
                          <i />
                          <ChannelIcon channel="google" size={28} />
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        <Icon
                          name={channel === "display" ? "grid" : "clock"}
                          size={32}
                        />
                      )}
                    </div>
                  );
                })}
                {!entries.length && (
                  <div className={r.noAds}>Aucune annonce créée</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {!channels.length && (
        <div className={w.empty}>
          <p>
            Aucun canal prévu. Créez une campagne pour préparer vos annonces.
          </p>
        </div>
      )}
    </section>
  );
}
