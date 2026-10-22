"use client";
import { useMemo, useState } from "react";
import { BRANDS } from "@/lib/campaign-decks/config";
import {
  campaignStatus,
  DEMO_DATE,
  money,
  number,
  percent,
  periodMetrics,
  PLATFORM_LABELS,
  summarizeMetrics,
} from "@/lib/campaign-studio/model";
import type {
  MetricDay,
  Period,
  PlatformFilter,
} from "@/lib/campaign-studio/types";
import { useStudio } from "./StudioProvider";
import Icon from "./Icon";
import StudioSearch from "./StudioSearch";
import s from "../studio.module.css";

type ChartMetric = "impressions" | "clicks" | "conversions";
const chartLabels = {
  impressions: "Impressions",
  clicks: "Clics",
  conversions: "Conversions",
} as const;

function PerformanceChart({
  days,
  period,
  metric,
}: {
  days: MetricDay[];
  period: Period;
  metric: ChartMetric;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const series = useMemo(
    () =>
      Array.from({ length: period === "7d" ? 7 : 30 }, (_, i) => {
        const date = new Date(`${DEMO_DATE}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() - (period === "7d" ? 6 : 29) + i);
        const key = date.toISOString().slice(0, 10);
        return {
          date: key,
          value: days
            .filter((d) => d.date === key)
            .reduce((sum, d) => sum + d[metric], 0),
        };
      }),
    [days, period, metric],
  );
  const maximum = Math.max(4, ...series.map((d) => d.value)) * 1.18;
  const points = series.map((d, i) => ({
    ...d,
    x: 56 + (i * 684) / (series.length - 1),
    y: 200 - (d.value / maximum) * 170,
  }));
  const active = hover === null ? null : points[hover];
  const formatDate = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return (
    <div className={s.chartContainer}>
      <svg
        viewBox="0 0 760 240"
        aria-label={`Évolution des ${chartLabels[metric].toLowerCase()} sur ${series.length} jours. Données fictives.`}
        role="group"
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="56"
              x2="740"
              y1={30 + (i * 170) / 3}
              y2={30 + (i * 170) / 3}
              stroke="currentColor"
              className={s.chartGrid}
              strokeDasharray={i === 3 ? undefined : "3 5"}
            />
            <text
              x="43"
              y={34 + (i * 170) / 3}
              textAnchor="end"
              className={s.chartLabel}
            >
              {new Intl.NumberFormat("fr-CA", {
                notation: "compact",
                maximumFractionDigits: 0,
              }).format(maximum * (1 - i / 3))}
            </text>
          </g>
        ))}
        <path
          d={`M56,200 ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L740,200 Z`}
          className={s.chartArea}
        />
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className={s.chartLine}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g
            key={p.date}
            tabIndex={0}
            role="img"
            aria-label={`${formatDate(p.date)} : ${number(p.value)} ${chartLabels[metric]}`}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 4 : 0}
              className={s.chartPoint}
            />
          </g>
        ))}
        {[
          0,
          Math.floor((points.length - 1) / 3),
          Math.floor(((points.length - 1) * 2) / 3),
          points.length - 1,
        ].map((i) => (
          <text
            key={i}
            x={points[i].x}
            y="229"
            textAnchor={
              i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
            }
            className={s.chartLabel}
          >
            {formatDate(points[i].date)}
          </text>
        ))}
        {active && (
          <g
            transform={`translate(${Math.max(60, Math.min(584, active.x - 76))}, 0)`}
            className={s.chartTooltip}
          >
            <rect width="150" height="47" rx="6" />
            <text x="12" y="18">
              {formatDate(active.date)}
            </text>
            <text x="12" y="35">
              {number(active.value)} {chartLabels[metric].toLowerCase()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function StatsPage() {
  const { visibleCampaigns, notify } = useStudio();
  const [period, setPeriod] = useState<Period>("30d");
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [campaignId, setCampaignId] = useState("all");
  const [metric, setMetric] = useState<ChartMetric | null>(null);
  const availableCampaigns = visibleCampaigns.filter(
    (c) => campaignStatus(c) === "on_air",
  );
  const selectedCampaign = availableCampaigns.some((c) => c.id === campaignId)
    ? campaignId
    : "all";
  const live = availableCampaigns.filter(
    (c) =>
      (selectedCampaign === "all" || c.id === selectedCampaign) &&
      (platform === "all" || c.creatives.some((a) => a.platform === platform)),
  );
  const days = periodMetrics(live, period, platform);
  const totals = summarizeMetrics(days);
  const channels = (["facebook", "instagram", "youtube", "display"] as const)
    .map((channel) => ({
      channel,
      ...summarizeMetrics(days.filter((d) => d.platform === channel)),
    }))
    .sort((a, b) => b.impressions - a.impressions);
  function exportCsv() {
    const rows = [
      [
        "Campagne",
        "Marque",
        "Période",
        "Canal",
        "Impressions",
        "Clics",
        "CTR (%)",
        "Conversions",
        "Dépenses (CAD)",
      ],
    ];
    for (const c of live) {
      const m = summarizeMetrics(periodMetrics([c], period, platform));
      rows.push([
        c.name,
        BRANDS[c.brandId].name,
        period,
        platform === "all" ? "Tous" : PLATFORM_LABELS[platform],
        String(m.impressions),
        String(m.clicks),
        m.ctr.toFixed(2),
        String(m.conversions),
        m.spend.toFixed(2),
      ]);
    }
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row.map((value) => `"${value.replace(/"/g, '""')}"`).join(";"),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `statistiques-demo-${period}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Rapport CSV exporté avec les filtres actifs.");
  }
  return (
    <>
      <h1 className={s.visuallyHidden}>Statistiques</h1>
      <div className={`${s.statsFilters} ${s.workspaceToolbar}`}>
        <div>
          <label>
            <Icon name="bookmark" size={15} />
            <select
              aria-label="Campagne des statistiques"
              value={selectedCampaign}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="all">Toutes les campagnes</option>
              {availableCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} · {BRANDS[campaign.brandId].name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <Icon name="calendar" size={15} />
            <select
              aria-label="Période des statistiques"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              <option value="30d">30 derniers jours</option>
              <option value="7d">7 derniers jours</option>
            </select>
          </label>
          <label>
            <Icon name="grid" size={15} />
            <select
              aria-label="Canal des statistiques"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
            >
              <option value="all">Tous les canaux</option>
              {Object.entries(PLATFORM_LABELS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className={s.exportIcon}
          onClick={exportCsv}
          aria-label="Exporter CSV"
          title="Exporter CSV"
        >
          <Icon name="download" size={17} />
        </button>
        <StudioSearch />
      </div>
      <div className={s.essentialMetrics} aria-label="Chiffres essentiels">
        {[
          {
            id: "impressions" as const,
            label: "Impressions",
            value: number(totals.impressions),
            caption: "Affichages de vos annonces",
          },
          {
            id: "clicks" as const,
            label: "Clics",
            value: number(totals.clicks),
            caption: "Visites vers vos destinations",
          },
          {
            id: "conversions" as const,
            label: "Conversions",
            value: number(totals.conversions),
            caption: "Actions réalisées",
          },
        ].map((m) => (
          <button
            key={m.id}
            className={s.metricButton}
            aria-expanded={metric === m.id}
            aria-controls={metric === m.id ? "metric-detail" : undefined}
            onClick={() => setMetric(metric === m.id ? null : m.id)}
          >
            <span>
              {m.label}
              <Icon name={metric === m.id ? "close" : "arrow"} size={16} />
            </span>
            <strong>{m.value}</strong>
            <small>
              {metric === m.id ? "Masquer l’évolution" : "Voir l’évolution"}
            </small>
          </button>
        ))}
      </div>
      {metric && (
        <div className={s.chartOverview} id="metric-detail">
          <section
            className={s.chartPanel}
            aria-label={`Détail des ${chartLabels[metric].toLowerCase()}`}
          >
            <div className={s.panelHeading}>
              <div>
                <h2>{chartLabels[metric]} · évolution</h2>
              </div>
              <button
                className={s.detailIcon}
                aria-label="Fermer l’évolution"
                onClick={() => setMetric(null)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <PerformanceChart
              key={`${metric}-${period}`}
              days={days}
              period={period}
              metric={metric}
            />
          </section>
        </div>
      )}
      <details className={s.statsDetails}>
        <summary>Campagnes, canaux et coûts</summary>
        <div className={s.secondaryMetrics}>
          <span>
            Taux de clic <strong>{percent(totals.ctr)}</strong>
          </span>
          <span>
            Dépenses <strong>{money(totals.spend)}</strong>
          </span>
          <span>
            CPC moyen <strong>{money(totals.cpc)}</strong>
          </span>
        </div>
        <section className={s.tablePanel}>
          <div className={s.panelHeading}>
            <div>
              <h2>Performance des campagnes</h2>
            </div>
            <span className={s.countPill}>{live.length}</span>
          </div>
          <div className={s.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Campagne</th>
                  <th>Impressions</th>
                  <th>Clics</th>
                  <th>CTR</th>
                  <th>Conversions</th>
                  <th>Dépenses</th>
                </tr>
              </thead>
              <tbody>
                {live.map((c) => {
                  const m = summarizeMetrics(
                    periodMetrics([c], period, platform),
                  );
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className={s.tableCampaign}>
                          <span
                            className={`${s.brandMonogram} ${c.brandId === "cu" ? s.cuBrand : s.cmsaBrand}`}
                          >
                            {c.brandId === "cu" ? "U" : "M"}
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>{BRANDS[c.brandId].name}</small>
                          </span>
                        </div>
                      </td>
                      <td>{number(m.impressions)}</td>
                      <td>{number(m.clicks)}</td>
                      <td>{percent(m.ctr)}</td>
                      <td>{number(m.conversions)}</td>
                      <td>{money(m.spend)}</td>
                    </tr>
                  );
                })}
                {!live.length && (
                  <tr>
                    <td colSpan={6} className={s.emptyTable}>
                      Aucune campagne on air ne correspond à ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
              {live.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{number(totals.impressions)}</td>
                    <td>{number(totals.clicks)}</td>
                    <td>{percent(totals.ctr)}</td>
                    <td>{number(totals.conversions)}</td>
                    <td>{money(totals.spend)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
        <section className={s.channelPanel}>
          <div className={s.panelHeading}>
            <div>
              <h2>Répartition par canal</h2>
              <p>Part des impressions</p>
            </div>
            <Icon name="grid" size={17} />
          </div>
          <div className={s.channelRows}>
            {channels.map((c) => (
              <div key={c.channel}>
                <div>
                  <span>
                    <i className={s[c.channel]} />
                    {PLATFORM_LABELS[c.channel]}
                  </span>
                  <strong>
                    {percent(
                      totals.impressions
                        ? (c.impressions / totals.impressions) * 100
                        : 0,
                    )}
                  </strong>
                </div>
                <span className={s.channelTrack}>
                  <span
                    className={s[c.channel]}
                    style={{
                      width: `${totals.impressions ? (c.impressions / totals.impressions) * 100 : 0}%`,
                    }}
                  />
                </span>
                <small>{number(c.impressions)} impressions</small>
              </div>
            ))}
          </div>
        </section>
      </details>
    </>
  );
}
