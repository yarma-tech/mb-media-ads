"use client";
import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import Icon from "../Icon";
import c from "./creation.module.css";

export default function CampaignLanding() {
  const { data } = useWorkspace();
  const navigation = useWorkspaceNavigation();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const validator = data!.actor.role === "validator";
  const pendingAds = data!.campaigns
    .flatMap((campaign) => campaign.ads)
    .filter((ad) =>
      validator
        ? ad.status === "pending"
        : ad.createdBy === data!.actor.id &&
          ["draft", "changes_requested"].includes(ad.status),
    );
  const campaigns = data!.campaigns.filter((campaign) =>
    `${campaign.name} ${data!.brands.find((brand) => brand.id === campaign.brandId)?.name ?? ""}`
      .toLocaleLowerCase("fr")
      .includes(search.toLocaleLowerCase("fr")),
  );
  return (
    <section className={c.landing} aria-labelledby="campaigns-title">
      <div className={c.heading}>
        <h1 id="campaigns-title">Vos campagnes</h1>
        {data!.campaigns.length > 0 && (
          <div className={c.search}>
            {searchOpen && (
              <input
                aria-label="Rechercher une campagne"
                placeholder="Rechercher"
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
            <button
              aria-label={
                searchOpen
                  ? "Fermer la recherche de campagne"
                  : "Rechercher une campagne"
              }
              title="Rechercher"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) setSearch("");
              }}
            >
              <Icon name="search" size={22} />
            </button>
          </div>
        )}
      </div>
      <div className={data!.campaigns.length ? c.grid : c.empty}>
        {campaigns.map((campaign) => {
          const brand = data!.brands.find(
            (item) => item.id === campaign.brandId,
          );
          const label =
            campaign.status === "finished"
              ? "Terminée"
              : campaign.ads.some((ad) => ad.status === "on_air")
                ? "En diffusion"
                : campaign.ads.some((ad) => ad.status === "pending")
                  ? "À valider"
                  : "Brouillon";
          return (
            <Link
              className={c.campaignTile}
              key={campaign.id}
              href={navigation.href("/studio/configuration", {
                campagne: campaign.id,
                nouvelle: "",
                etape: "",
                canaux: "",
                canal: "",
              })}
            >
              <span className={c.tileIcon}>
                <Icon name="document" size={24} />
              </span>
              <strong>{campaign.name}</strong>
              <span className={c.brandName}>
                {brand?.name ?? "Marque à compléter"}
              </span>
              <span className={c.badge}>{label}</span>
            </Link>
          );
        })}
        <Link
          className={c.newTile}
          href={navigation.href("/studio/configuration", {
            nouvelle: "1",
            campagne: "",
            etape: "",
            canaux: "",
            canal: "",
          })}
        >
          <span className={c.plus} aria-hidden="true">
            +
          </span>
          <strong>Créer votre campagne</strong>
        </Link>
      </div>
      {search && !campaigns.length && (
        <p className={c.noResults}>
          Aucune campagne ne correspond à votre recherche.
        </p>
      )}
      {pendingAds.length > 0 && (
        <Link
          className={c.pending}
          href={navigation.href(
            validator ? "/studio/validation" : "/studio/configuration",
            { nouvelle: "", campagne: "", etape: "", canaux: "", canal: "" },
          )}
        >
          {pendingAds.length}{" "}
          {validator
            ? "annonces à valider"
            : "annonces à compléter ou corriger"}
          <Icon name="arrow" size={15} />
        </Link>
      )}
    </section>
  );
}
