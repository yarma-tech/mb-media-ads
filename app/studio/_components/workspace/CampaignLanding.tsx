"use client";
import Link from "next/link";
import ShareCampaign from "./ShareCampaign";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Campaign } from "@/lib/campaign-studio/workspace/types";
import { workspaceErrorMessage } from "@/lib/campaign-studio/workspace/messages";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import Icon from "../Icon";
import c from "./creation.module.css";

export default function CampaignLanding() {
  const { data, notify } = useWorkspace();
  const navigation = useWorkspaceNavigation();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  function closeDelete(deleted = false) {
    setDeleting(null);
    requestAnimationFrame(() => {
      if (!deleted && deleteTrigger.current?.isConnected)
        deleteTrigger.current.focus();
      else document.getElementById("campaigns-title")?.focus();
    });
  }
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
        <h1 id="campaigns-title" tabIndex={-1}>
          Vos campagnes
        </h1>
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
            <div className={c.campaignCard} key={campaign.id}>
              <Link
                className={c.campaignTile}
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
              <div style={{ position: "absolute", top: 16, right: 60 }}>
                <ShareCampaign campaignId={campaign.id} name={campaign.name} />
              </div>
              {data!.actor.kind === "human" &&
                (validator || campaign.createdBy === data!.actor.id) && (
                  <button
                    type="button"
                    className={c.deleteCampaign}
                    aria-label={`Supprimer la campagne ${campaign.name}`}
                    title="Supprimer la campagne"
                    onClick={(event) => {
                      deleteTrigger.current = event.currentTarget;
                      // Keep the exact confirmation snapshot even if polling changes the campaign.
                      setDeleting(structuredClone(campaign));
                    }}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                )}
            </div>
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
      {deleting && (
        <DeleteCampaignDialog
          campaign={deleting}
          onClose={() => closeDelete()}
          onDeleted={(warning) => {
            if (navigation.params.get("campagne") === deleting.id)
              navigation.update(
                { campagne: "", canal: "", canaux: "", etape: "", groupe: "" },
                true,
              );
            notify(warning || "Campagne supprimée.");
            closeDelete(true);
          }}
        />
      )}
    </section>
  );
}

function DeleteCampaignDialog({
  campaign,
  onClose,
  onDeleted,
}: {
  campaign: Campaign;
  onClose: () => void;
  onDeleted: (warning?: string) => void;
}) {
  const { run } = useWorkspace();
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ready" | "deleting">("ready");
  const [error, setError] = useState("");
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || name !== campaign.name) return;
    inFlight.current = true;
    setStatus("deleting");
    setError("");
    try {
      const result = await run({
        type: "delete_campaign",
        campaignId: campaign.id,
        revision: campaign.revision,
        confirmationName: name,
      });
      onDeleted(
        typeof result.warning === "string" ? result.warning : undefined,
      );
    } catch (cause) {
      setError(workspaceErrorMessage(cause, "command"));
      setStatus("ready");
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <dialog
      ref={dialog}
      className={c.deleteDialog}
      aria-labelledby="delete-campaign-title"
      aria-describedby="delete-campaign-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!inFlight.current) onClose();
      }}
    >
      <form onSubmit={submit}>
        <span className={c.deleteSymbol}>
          <Icon name="trash" size={24} />
        </span>
        <h2 id="delete-campaign-title">Supprimer la campagne</h2>
        <p id="delete-campaign-description">
          <strong>{campaign.name}</strong> sera supprimée définitivement, avec{" "}
          {campaign.ads.length} annonce{campaign.ads.length > 1 ? "s" : ""} et{" "}
          {campaign.media.length} média{campaign.media.length > 1 ? "s" : ""}.
        </p>
        <label>
          Nom de campagne à confirmer
          <input
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={status === "deleting"}
            aria-describedby="delete-name-hint"
          />
        </label>
        <p id="delete-name-hint" className={c.deleteHint}>
          Recopiez le nom exact pour confirmer.
        </p>
        {error && (
          <p role="alert" className={c.deleteError}>
            {error}
          </p>
        )}
        <div className={c.deleteActions}>
          <button
            type="button"
            disabled={status === "deleting"}
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={c.deleteConfirm}
            disabled={name !== campaign.name || status === "deleting"}
            aria-busy={status === "deleting"}
          >
            {status === "deleting"
              ? "Suppression…"
              : "Supprimer définitivement"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
