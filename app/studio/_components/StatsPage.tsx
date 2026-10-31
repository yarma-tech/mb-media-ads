"use client";
import Select from "@/app/_components/Select";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  STATISTICS_CAMPAIGNS,
  costPerLead,
  prospectConversion,
  statisticsRanking,
  statisticsRows,
  statisticsTotals,
  type StatisticsPeriod,
} from "@/lib/campaign-studio/statistics-demo";
import ChannelIcon from "./workspace/ChannelIcon";
import Icon from "./Icon";
import s from "./statistics.module.css";

const number = (value: number) => new Intl.NumberFormat("fr-CA").format(value);
const money = (value: number | null, decimals = 0) =>
  value === null
    ? "Non disponible"
    : new Intl.NumberFormat("fr-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
const percent = (value: number | null) =>
  value === null
    ? "Non disponible"
    : new Intl.NumberFormat("fr-CA", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
type DialogContent = { title: string; items: [string, string][]; note: string };
type Metric = "admissions" | "leads" | "budget" | "cpl" | "conversion";
type Detail =
  { kind: "metric"; id: Metric } | { kind: "channel"; id: string } | null;

function DetailDialog({
  title,
  items,
  children,
  close,
}: {
  title: string;
  items: [string, string][];
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="statistics-detail-title"
      onClose={() => {
        if (!ref.current?.open) close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const box = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < box.left ||
            e.clientX > box.right ||
            e.clientY < box.top ||
            e.clientY > box.bottom
          )
            close();
        }
      }}
    >
      <div className={s.dialogHead}>
        <h2 id="statistics-detail-title">{title}</h2>
        <button type="button" onClick={close} aria-label="Fermer le détail">
          <Icon name="close" />
        </button>
      </div>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>{children}</p>
    </dialog>
  );
}

export default function StatsPage() {
  const [campaignId, setCampaignId] = useState("admissions");
  const [period, setPeriod] = useState<StatisticsPeriod>("all");
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(false);
  const [detail, setDetail] = useState<Detail>(null);
  const campaign = STATISTICS_CAMPAIGNS.find((c) => c.id === campaignId);
  const channels = campaign ? statisticsRows(campaign, period) : [];
  const totals = statisticsTotals(channels);
  const search = query.trim().toLocaleLowerCase("fr");
  const visibleChannels = channels
    .filter((c) =>
      `${c.name} ${c.subtitle}`.toLocaleLowerCase("fr").includes(search),
    )
    .sort((a, b) => (ascending ? a.leads - b.leads : b.leads - a.leads));
  const ranking = statisticsRanking(STATISTICS_CAMPAIGNS, period).filter(
    (r) => campaign || r.campaign.name.toLocaleLowerCase("fr").includes(search),
  );
  function chooseCampaign(id: string) {
    setCampaignId(id);
    setQuery("");
    setDetail(null);
  }
  const cards: { id: Metric; label: string; value: string; caption: string }[] =
    campaign
      ? [
          {
            id: "admissions",
            label: "Admissions",
            value: number(totals.admissions),
            caption: "Confirmées · simulation Zoho",
          },
          {
            id: "leads",
            label: "Prospects générés",
            value: number(totals.leads),
            caption: "Prospects uniques · simulation Zoho",
          },
          {
            id: "budget",
            label: "Budget dépensé",
            value: money(totals.spend),
            caption: `sur ${money(campaign.budget)} alloués`,
          },
          {
            id: "cpl",
            label: "Coût par prospect",
            value: money(costPerLead(totals), 2),
            caption: "Dépenses ÷ prospects",
          },
          {
            id: "conversion",
            label: "Conversion en prospects",
            value: percent(prospectConversion(totals)),
            caption: `sur ${number(totals.impressions)} impressions`,
          },
        ]
      : [];
  function metricValue(id: Metric, row: typeof totals) {
    switch (id) {
      case "admissions":
        return number(row.admissions);
      case "leads":
        return number(row.leads);
      case "budget":
        return money(row.spend);
      case "cpl":
        return money(costPerLead(row), 2);
      case "conversion":
        return percent(prospectConversion(row));
    }
  }
  let dialog: DialogContent | null = null;
  if (detail?.kind === "channel" && campaign) {
    const row = channels.find((c) => c.id === detail.id);
    if (row)
      dialog = {
        title: row.name,
        items: [
          ["Prospects attribués", number(row.leads)],
          ["Admissions attribuées", number(row.admissions)],
          ["Impressions", number(row.impressions)],
          ["Dépensé", money(row.spend, 2)],
          ["Coût par prospect", money(costPerLead(row), 2)],
          ["Prospects / impressions", percent(prospectConversion(row))],
        ],
        note: "Données fictives. Prospects et admissions sont rattachés à une campagne et à un canal dans cet exemple. Le statut d’admission et la règle d’attribution Zoho restent à confirmer.",
      };
  }
  return (
    <div className={s.dashboard} data-statistics-demo>
      <div className={s.top}>
        <h1>Statistiques</h1>
        <span className={s.demo}>
          <i aria-hidden="true" />
          Données fictives
        </span>
      </div>
      <div className={s.toolbar}>
        <label className={s.select}>
          <Icon name="campaign" size={17} />
          <Select
            indicator={false}
            aria-label="Campagne"
            value={campaignId}
            onValueChange={(selectedValue) => chooseCampaign(selectedValue)}
          >
            <option value="all">Toutes les campagnes</option>
            {STATISTICS_CAMPAIGNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Icon name="down" size={14} />
        </label>
        <label className={s.select}>
          <Icon name="calendar" size={17} />
          <Select
            indicator={false}
            aria-label="Période"
            value={period}
            onValueChange={(selectedValue) => {
              setPeriod(selectedValue as StatisticsPeriod);
              setDetail(null);
            }}
          >
            <option value="all">Toute la campagne</option>
            <option value="day">Aujourd’hui</option>
          </Select>
          <Icon name="down" size={14} />
        </label>
        <label className={s.search}>
          <Icon name="search" size={21} />
          <input
            type="search"
            aria-label={
              campaign ? "Rechercher un canal" : "Rechercher une campagne"
            }
            placeholder={
              campaign ? "Rechercher un canal…" : "Rechercher une campagne…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {campaign && (
        <>
          <div className={s.context}>
            <h2>{campaign.name}</h2>
            <p>
              <Icon name="calendar" size={14} />
              {campaign.dates} · {campaign.days} jours
            </p>
          </div>
          <section className={s.kpis} aria-label="Chiffres essentiels">
            {cards.map((card) => {
              const expanded =
                detail?.kind === "metric" && detail.id === card.id;
              return (
                <div
                  key={card.id}
                  className={`${s.kpi} ${card.id === "admissions" ? s.admissionKpi : ""}`}
                >
                  <button
                    type="button"
                    className={s.kpiToggle}
                    onClick={() =>
                      setDetail(
                        expanded ? null : { kind: "metric", id: card.id },
                      )
                    }
                    aria-expanded={expanded}
                    aria-controls={`statistics-breakdown-${card.id}`}
                  >
                    <span className={s.cardLabel}>
                      {card.label}
                      <Icon
                        name="down"
                        size={15}
                        style={{
                          transform: expanded ? "rotate(180deg)" : undefined,
                        }}
                      />
                    </span>
                    <b>{card.value}</b>
                    <small>{card.caption}</small>
                    {card.id === "budget" && (
                      <span className={s.track} aria-hidden="true">
                        <i
                          style={{
                            width: `${Math.min(100, (totals.spend / campaign.budget) * 100)}%`,
                          }}
                        />
                      </span>
                    )}
                  </button>
                  <div
                    id={`statistics-breakdown-${card.id}`}
                    className={s.breakdown}
                    data-expanded={expanded}
                    aria-hidden={!expanded}
                    role="region"
                    aria-label={`Détail par canal · ${card.label}`}
                  >
                    <div className={s.breakdownInner}>
                      <div className={s.breakdownContent}>
                        <span className={s.breakdownHeading}>Par canal</span>
                        <dl>
                          {channels.map((row) => (
                            <div key={row.id}>
                              <dt>{row.name}</dt>
                              <dd>{metricValue(card.id, row)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
          <section aria-labelledby="statistics-channels-title">
            <header className={s.tableHeading}>
              <h2 id="statistics-channels-title">Comparaison des canaux</h2>
              <span>Cliquez sur un canal pour le détail</span>
            </header>
            <div className={s.tablewrap}>
              <table aria-label="Performance par canal">
                <thead>
                  <tr>
                    <th scope="col">Canal</th>
                    <th
                      scope="col"
                      aria-sort={ascending ? "ascending" : "descending"}
                    >
                      <button
                        type="button"
                        onClick={() => setAscending((v) => !v)}
                        aria-label={`Trier les prospects par ordre ${ascending ? "décroissant" : "croissant"}`}
                      >
                        Prospects
                        <Icon
                          name="down"
                          size={12}
                          style={{
                            transform: ascending ? "rotate(180deg)" : undefined,
                          }}
                        />
                      </button>
                    </th>
                    <th scope="col">Admissions</th>
                    <th scope="col">Dépensé</th>
                    <th scope="col">Coût / prospect</th>
                    <th scope="col" title="Prospects ÷ impressions">
                      Conversion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleChannels.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setDetail({ kind: "channel", id: row.id })}
                    >
                      <td>
                        <button
                          type="button"
                          className={s.channel}
                          aria-label={`Détail ${row.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetail({ kind: "channel", id: row.id });
                          }}
                        >
                          {row.logo ? (
                            <ChannelIcon
                              channel={row.logo}
                              size={26}
                              tone="brand"
                              variant="ads"
                            />
                          ) : (
                            <span className={s.mark} aria-hidden="true">
                              <Icon name="campaign" size={22} />
                            </span>
                          )}
                          <span>
                            <strong>{row.name}</strong>
                            <small>{row.subtitle}</small>
                          </span>
                        </button>
                      </td>
                      <td className={s.emphasis}>{number(row.leads)}</td>
                      <td className={s.emphasis}>{number(row.admissions)}</td>
                      <td>{money(row.spend)}</td>
                      <td>{money(costPerLead(row), 2)}</td>
                      <td className={s.ratio}>
                        {percent(prospectConversion(row))}
                      </td>
                    </tr>
                  ))}
                  {!visibleChannels.length && (
                    <tr>
                      <td colSpan={6} className={s.empty}>
                        Aucun canal ne correspond à cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total campagne</td>
                    <td>{number(totals.leads)}</td>
                    <td>{number(totals.admissions)}</td>
                    <td>{money(totals.spend)}</td>
                    <td>{money(costPerLead(totals), 2)}</td>
                    <td>{percent(prospectConversion(totals))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
      <section className={s.ranking} aria-labelledby="statistics-ranking-title">
        <header className={s.tableHeading}>
          <h2 id="statistics-ranking-title">Campagnes les plus performantes</h2>
          <span>Top 5 · en cours</span>
        </header>
        <div className={s.tablewrap}>
          <table aria-label="Classement des campagnes">
            <thead>
              <tr>
                <th scope="col">Campagne</th>
                <th scope="col">Admissions</th>
                <th scope="col">Prospects</th>
                <th scope="col">Coût / prospect</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ campaign: c, metrics }, i) => (
                <tr key={c.id} onClick={() => chooseCampaign(c.id)}>
                  <td>
                    <button
                      type="button"
                      className={s.campaignButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        chooseCampaign(c.id);
                      }}
                      aria-label={`Ouvrir ${c.name}`}
                    >
                      <span className={s.rank}>{i + 1}</span>
                      <strong>{c.name}</strong>
                    </button>
                  </td>
                  <td>{number(metrics.admissions)}</td>
                  <td>{number(metrics.leads)}</td>
                  <td>{money(costPerLead(metrics), 2)}</td>
                </tr>
              ))}
              {!ranking.length && (
                <tr>
                  <td colSpan={4} className={s.empty}>
                    Aucune campagne ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className={s.note}>
        Démonstration. Tous les chiffres sont fictifs ; aucune régie ni aucun
        CRM n’est connecté ici.
      </p>
      {dialog && (
        <DetailDialog
          title={dialog.title}
          items={dialog.items}
          close={() => setDetail(null)}
        >
          {dialog.note}
        </DetailDialog>
      )}
    </div>
  );
}
