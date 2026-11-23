"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportResult } from "@/lib/social-ads/import";
export default function ImportCampaign() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [state, setState] = useState<"idle" | "previewing" | "creating">(
    "idle",
  );
  const [error, setError] = useState("");
  async function send(selected: File, create = false) {
    setError("");
    setState(create ? "creating" : "previewing");
    try {
      const body = new FormData();
      body.set("file", selected);
      body.set("mode", create ? "create" : "preview");
      const response = await fetch("/api/social/import", {
        method: "POST",
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (create) router.push(`/social/${data.planId}`);
      else setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import indisponible.");
    } finally {
      setState("idle");
    }
  }
  function select(selected: File) {
    setFile(selected);
    setResult(null);
    void send(selected);
  }
  return (
    <section className="sa-panel" aria-labelledby="import-title">
      <h2 id="import-title">Une campagne, un classeur</h2>
      <p>Déposez votre Excel, vérifiez le rapport puis créez le plan.</p>
      <label
        className="sa-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f && state === "idle") select(f);
        }}
      >
        <span>
          {file?.name || "Déposer un fichier .xlsx ou le sélectionner"}
        </span>
        <input
          aria-label="Classeur de campagne"
          type="file"
          accept=".xlsx"
          disabled={state !== "idle"}
          onChange={(e) => {
            if (e.target.files?.[0]) select(e.target.files[0]);
          }}
        />
      </label>
      {state !== "idle" && (
        <p role="status">
          {state === "previewing"
            ? "Lecture du classeur…"
            : "Création du plan…"}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {result && (
        <div>
          <h3>{result.nom}</h3>
          <p>
            {result.ads.length} annonces valides · {result.issues.length}{" "}
            éléments au rapport
          </p>
          <ul>
            {result.issues.map((i, n) => (
              <li key={n}>
                {i.feuille}, ligne {i.ligne}: {i.message}
              </li>
            ))}
          </ul>
          <div className="sa-import-preview">
            {result.ads.map((a, i) => (
              <p key={i}>
                <strong>
                  {i + 1}. {a.plateforme} · {a.placement} · {a.type_media} ·{" "}
                  {a.ratio}
                </strong>
                <br />
                {a.texte_principal}
              </p>
            ))}
          </div>
          <button
            className="btn btn-primary"
            disabled={!result.ads.length || state !== "idle"}
            onClick={() => file && void send(file, true)}
          >
            Créer le plan avec {result.ads.length} annonces
          </button>
        </div>
      )}
    </section>
  );
}
