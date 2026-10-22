"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  campaignStatus,
  PLATFORM_LABELS,
  reviewCreative,
  setCampaignOnAir,
} from "@/lib/campaign-studio/model";
import type { Creative, StudioCampaign } from "@/lib/campaign-studio/types";
import { useStudio } from "./StudioProvider";
import CreativeEditor from "./CreativeEditor";
import CampaignMockup from "./CampaignMockup";
import Icon from "./Icon";
import StudioSearch from "./StudioSearch";
import s from "../studio.module.css";

async function depart(id: string, direction: -1 | 1) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = document.querySelector<HTMLElement>(
    `[data-creative-id="${CSS.escape(id)}"] [data-card-preview]`,
  );
  if (!card) return;
  await card
    .animate(
      [
        { transform: getComputedStyle(card).transform, opacity: 1 },
        {
          transform: `translateX(${direction * Math.max(card.clientWidth, 500)}px) rotate(${direction * 12}deg)`,
          opacity: 0,
        },
      ],
      { duration: 340, easing: "cubic-bezier(.4,0,.6,1)" },
    )
    .finished.catch(() => {});
}

function CreativeReview({
  campaign,
  creative,
  onDetails,
  onApproved,
  onRequest,
}: {
  campaign: StudioCampaign;
  creative: Creative;
  onDetails: () => void;
  onApproved?: () => void;
  onRequest: () => void;
}) {
  const { update, notify } = useStudio();
  const busy = useRef(false);
  const [motion, setMotion] = useState<"idle" | "leaving">("idle");
  async function decide(status: "approved" | "pending") {
    if (busy.current || creative.status === status) return;
    busy.current = true;
    setMotion("leaving");
    await depart(creative.id, status === "approved" ? 1 : -1);
    update(reviewCreative(campaign, creative.id, status));
    notify(
      status === "approved"
        ? "Visuel validé."
        : "Validation annulée. Visuel remis dans À valider.",
    );
    onApproved?.();
  }
  function approve() {
    void decide("approved");
  }
  return (
    <article
      className={s.visualCard}
      data-creative-id={creative.id}
      aria-busy={motion === "leaving"}
      aria-label={`${campaign.name} - ${PLATFORM_LABELS[creative.platform]}`}
    >
      <div className={s.completePost} data-card-preview>
        <CampaignMockup campaign={campaign} creative={creative} />
      </div>
      <footer
        className={`${s.visualActions} ${onApproved ? s.focusActions : ""}`}
      >
        <button
          className={s.rejectCircle}
          onClick={() => void decide("pending")}
          disabled={creative.status !== "approved" || motion === "leaving"}
          aria-label="Annuler la validation"
          title="Annuler la validation"
        >
          <Icon name="reset" size={onApproved ? 27 : 20} />
        </button>
        <button
          className={s.modifyAction}
          onClick={onRequest}
          disabled={motion === "leaving"}
          aria-label="Commenter ou demander une modification"
          title="Commenter ou demander une modification"
        >
          <Icon name="comment" size={22} />
        </button>
        <button
          className={s.modifyAction}
          onClick={onDetails}
          disabled={motion === "leaving"}
          aria-label="Modifier le visuel"
          title="Modifier le texte et le CTA"
        >
          <Icon name="edit" size={22} />
        </button>
        <button
          className={s.acceptCircle}
          onClick={approve}
          disabled={creative.status === "approved" || motion === "leaving"}
          aria-label={creative.status === "approved" ? "Validé" : "Approuver"}
          title={creative.status === "approved" ? "Validé" : "Approuver"}
        >
          <Icon name="check" size={onApproved ? 32 : 20} />
        </button>
      </footer>
    </article>
  );
}

function ReviewCarousel({
  items,
  onDetails,
  onRequest,
  visited,
  setVisited,
}: {
  items: { campaign: StudioCampaign; creative: Creative }[];
  onDetails: (id: string) => void;
  onRequest: (id: string) => void;
  visited: string[];
  setVisited: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const remaining = items.filter((i) => !visited.includes(i.creative.id));
  const item = remaining[0];
  return (
    <div className={s.carouselReview}>
      {item ? (
        <>
          <div className={s.carouselCaption}>
            <span>{PLATFORM_LABELS[item.creative.platform]}</span>
            <span>{remaining.length} visuels</span>
            {remaining.length > 1 && (
              <button
                className={s.detailIcon}
                aria-label="Visuel suivant"
                title="Visuel suivant"
                onClick={() => setVisited((v) => [...v, item.creative.id])}
              >
                <Icon name="chevron" size={16} />
              </button>
            )}
          </div>
          <CreativeReview
            key={item.creative.id}
            {...item}
            onDetails={() => onDetails(item.creative.id)}
            onRequest={() => onRequest(item.creative.id)}
            onApproved={() => setVisited((v) => [...v, item.creative.id])}
          />
        </>
      ) : (
        <div className={s.emptyState}>
          <Icon name="check" size={32} />
          <h2>Revue terminée</h2>
          <p>Les cartes approuvées sont dans « Validés ».</p>
        </div>
      )}
    </div>
  );
}

const CHANNELS = ["facebook", "instagram", "youtube", "display"] as const;

export default function ValidationPage() {
  const { visibleCampaigns, update, notify } = useStudio();
  const [mode, setMode] = useState<"grid" | "carousel">("grid");
  const [editing, setEditing] = useState<{
    id: string;
    mode: "edit" | "request";
  } | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved">("pending");
  const [campaignId, setCampaignId] = useState("all");
  const campaigns = visibleCampaigns.filter(
    (c) => campaignStatus(c) !== "on_air",
  );
  const selected = campaigns.filter(
    (c) => campaignId === "all" || c.id === campaignId,
  );
  const groups = CHANNELS.map((platform) => ({
    platform,
    items: selected.flatMap((campaign) =>
      campaign.creatives
        .filter(
          (creative) =>
            creative.platform === platform &&
            (filter === "approved"
              ? creative.status === "approved"
              : creative.status !== "approved"),
        )
        .map((creative) => ({ campaign, creative })),
    ),
  })).filter((group) => group.items.length);
  const editor = selected
    .flatMap((campaign) =>
      campaign.creatives.map((creative) => ({ campaign, creative })),
    )
    .find((i) => i.creative.id === editing?.id);
  const ready = selected.filter((c) => campaignStatus(c) === "approved");
  return (
    <>
      <h1 className={s.visuallyHidden}>Validation</h1>
      <div className={s.validationToolbar}>
        <div
          className={s.segmentedControl}
          role="group"
          aria-label="Statut des visuels"
          data-active={filter === "approved" ? "second" : "first"}
        >
          {(
            [
              { id: "pending", label: "À valider" },
              { id: "approved", label: "Validés" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              aria-pressed={filter === tab.id}
              onClick={() => {
                setFilter(tab.id);
                setVisited([]);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={s.displayFilters}>
          <div
            className={s.segmentedControl}
            role="group"
            aria-label="Mode d’affichage"
            data-active={mode === "carousel" ? "second" : "first"}
          >
            <button
              type="button"
              aria-pressed={mode === "grid"}
              onClick={() => setMode("grid")}
            >
              <Icon name="grid" size={15} /> Par canal
            </button>
            <button
              type="button"
              aria-pressed={mode === "carousel"}
              onClick={() => setMode("carousel")}
            >
              <Icon name="heart" size={15} /> Carrousel
            </button>
          </div>
          <select
            className={s.campaignFilter}
            aria-label="Filtrer par campagne"
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value);
              setVisited([]);
            }}
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <StudioSearch />
      </div>
      {filter === "approved" && mode === "grid" && ready.length > 0 && (
        <div
          className={s.readyCampaigns}
          aria-label="Campagnes prêtes à diffuser"
        >
          {ready.map((campaign) => (
            <div key={campaign.id}>
              <span>
                <Icon name="check" size={14} />
                {campaign.name}
              </span>
              <button
                className={s.secondaryButton}
                onClick={() => {
                  update(setCampaignOnAir(campaign));
                  if (campaignId === campaign.id) setCampaignId("all");
                  notify(
                    `${campaign.name} figure maintenant dans les campagnes on air.`,
                  );
                }}
              >
                Passer On air
                <Icon name="arrow" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {mode === "carousel" ? (
        <ReviewCarousel
          key={`${campaignId}-${filter}`}
          items={groups.flatMap((g) => g.items)}
          onDetails={(id) => setEditing({ id, mode: "edit" })}
          onRequest={(id) => setEditing({ id, mode: "request" })}
          visited={visited}
          setVisited={setVisited}
        />
      ) : groups.length ? (
        <div className={s.validationBoard}>
          {groups.map(({ platform, items }) => (
            <section
              className={s.channelColumn}
              aria-label={PLATFORM_LABELS[platform]}
              key={platform}
            >
              <header className={s.columnHeading}>
                <h2>{PLATFORM_LABELS[platform]}</h2>
                <span>{items.length}</span>
              </header>
              <div className={s.channelStack}>
                {items.map(({ campaign, creative }) => (
                  <CreativeReview
                    key={creative.id}
                    campaign={campaign}
                    creative={creative}
                    onDetails={() =>
                      setEditing({ id: creative.id, mode: "edit" })
                    }
                    onRequest={() =>
                      setEditing({ id: creative.id, mode: "request" })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={s.emptyState}>
          <Icon name="check" size={32} />
          <h2>Aucun visuel dans cette vue</h2>
          <Link href="/studio/on-air" className={s.secondaryButton}>
            Voir les campagnes on air
          </Link>
        </div>
      )}
      {editor && (
        <CreativeEditor
          key={editor.creative.id}
          {...editor}
          initialMode={editing?.mode}
          onBeforeRequested={() => depart(editor.creative.id, -1)}
          onRequested={() => setVisited((v) => [...v, editor.creative.id])}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
