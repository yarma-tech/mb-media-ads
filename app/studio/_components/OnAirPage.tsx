"use client";
import Link from "next/link";
import { useState } from "react";
import { BRANDS } from "@/lib/campaign-decks/config";
import {
  campaignStatus,
  PLATFORM_LABELS,
  returnToReview,
} from "@/lib/campaign-studio/model";
import type {
  Creative,
  PlatformFilter,
  StudioCampaign,
} from "@/lib/campaign-studio/types";
import { useStudio } from "./StudioProvider";
import Icon from "./Icon";
import StudioSearch from "./StudioSearch";
import CampaignMockup from "./CampaignMockup";
import s from "../studio.module.css";

function LiveCampaign({
  campaign,
  creative,
}: {
  campaign: StudioCampaign;
  creative: Creative;
}) {
  const { update, notify } = useStudio();
  return (
    <article
      className={s.visualCard}
      aria-label={`${campaign.name} - ${PLATFORM_LABELS[creative.platform]}`}
    >
      <div className={s.completePost} data-card-preview>
        <CampaignMockup campaign={campaign} creative={creative} />
      </div>
      <div className={s.onairCaption}>
        <h3>{campaign.name}</h3>
        <span>{BRANDS[campaign.brandId].pageName}</span>
      </div>
      <details className={s.liveDetails}>
        <summary>Détails de la campagne</summary>
        <p>{campaign.dates}</p>
        <button
          type="button"
          className={s.textButton}
          onClick={() => {
            update(returnToReview(campaign));
            notify(`${campaign.name} est de retour en validation.`);
          }}
        >
          <Icon name="reset" size={13} />
          Revenir en validation
        </button>
      </details>
    </article>
  );
}

export default function OnAirPage() {
  const { visibleCampaigns } = useStudio();
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const live = visibleCampaigns.filter((c) => campaignStatus(c) === "on_air");
  const groups = (["facebook", "instagram", "youtube", "display"] as const)
    .filter((p) => platform === "all" || p === platform)
    .map((p) => ({
      platform: p,
      items: live.flatMap((campaign) =>
        campaign.creatives
          .filter((c) => c.platform === p)
          .map((creative) => ({ campaign, creative })),
      ),
    }))
    .filter((g) => g.items.length);
  return (
    <>
      <h1 className={s.visuallyHidden}>Campagnes on air</h1>
      <div className={s.workspaceToolbar}>
        <div className={s.displayFilters}>
          <select
            className={s.campaignFilter}
            aria-label="Canal des campagnes on air"
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value as PlatformFilter)
            }
          >
            <option value="all">Tous les canaux</option>
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className={s.liveIndicator}>
            <span />
            {live.length} actives
          </span>
          <Link className={s.textButton} href="/studio/statistiques">
            <Icon name="chart" size={16} />
            Statistiques
          </Link>
        </div>
        <StudioSearch />
      </div>
      {groups.length ? (
        <div className={s.validationBoard}>
          {groups.map((group) => (
            <section
              className={s.channelColumn}
              aria-label={PLATFORM_LABELS[group.platform]}
              key={group.platform}
            >
              <header className={s.columnHeading}>
                <h2>{PLATFORM_LABELS[group.platform]}</h2>
                <span>{group.items.length}</span>
              </header>
              <div className={s.channelStack}>
                {group.items.map((item) => (
                  <LiveCampaign key={item.creative.id} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={s.emptyState}>
          <Icon name="live" size={32} />
          <h2>Aucune campagne on air dans cette vue</h2>
          <p>
            Une campagne approuvée apparaît ici dès que vous la passez On air.
          </p>
          <Link href="/studio/validation" className={s.primaryButton}>
            Ouvrir la validation
            <Icon name="arrow" size={15} />
          </Link>
        </div>
      )}
    </>
  );
}
