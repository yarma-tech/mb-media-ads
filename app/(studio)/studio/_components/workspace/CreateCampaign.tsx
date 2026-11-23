"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import CampaignInfoForm from "./CampaignInfoForm";
import Icon from "../Icon";
import c from "./creation.module.css";

export default function CreateCampaign() {
  const navigation = useWorkspaceNavigation();
  const router = useRouter();
  return (
    <section className={c.create} aria-labelledby="new-campaign-title">
      <div className={c.createTop}>
        <Link
          className={c.back}
          href={navigation.href("/studio", {
            nouvelle: "",
            campagne: "",
            etape: "",
            canaux: "",
            canal: "",
          })}
        >
          <span className={c.backArrow}>
            <Icon name="arrow" />
          </span>
          Campagnes
        </Link>
        <ol className={c.steps} aria-label="Étapes de création">
          <li aria-current="step">
            <b>1</b>
            <span>Campagne</span>
          </li>
          <li>
            <b>2</b>
            <span>Canaux</span>
          </li>
          <li>
            <b>3</b>
            <span>Annonces</span>
          </li>
        </ol>
      </div>
      <div className={c.createBody}>
        <h1 id="new-campaign-title">Nouvelle campagne</h1>
        <CampaignInfoForm
          onContinue={(campaignId) =>
            router.push(
              navigation.href("/studio/configuration", {
                campagne: campaignId!,
                nouvelle: "",
                canal: "",
                canaux: "",
                etape: "channels",
              }),
            )
          }
        />
      </div>
    </section>
  );
}
