"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./WorkspaceProvider";
import { useWorkspaceNavigation } from "./WorkspaceNavigation";
import w from "./workspace.module.css";

export default function CreateCampaign() {
  const { run, pending } = useWorkspace();
  const navigation = useWorkspaceNavigation();
  const router = useRouter();
  const [name, setName] = useState("");
  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      const result = await run({ type: "create_campaign", name });
      router.push(
        navigation.href("/studio/configuration", {
          campagne: (result.campaign as { id: string }).id,
          canal: "",
          canaux: "",
          etape: "details",
        }),
      );
    } catch {
      /* WorkspaceProvider displays the error and permits retry. */
    }
  }
  return (
    <form onSubmit={create} className={w.inline}>
      <input
        aria-label="Nom de la nouvelle campagne"
        placeholder="Nom de campagne"
        required
        maxLength={200}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className={w.primary}
        disabled={pending("create_campaign")}
        aria-busy={pending("create_campaign")}
      >
        {pending("create_campaign") ? "Création…" : "Créer une campagne"}
      </button>
    </form>
  );
}
