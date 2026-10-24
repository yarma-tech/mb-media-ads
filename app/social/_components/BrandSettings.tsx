"use client";
import { useState } from "react";
import type { BrandSettings } from "@/lib/social-ads/db";
import { PLATEFORMES, PLATEFORME_LABEL } from "@/lib/social-ads/types";
import { saveBrandAction, createBrandUploadAction } from "../actions";
import { getBrowserClient } from "@/lib/supabase";
export default function BrandSettingsForm({
  initial,
}: {
  initial: BrandSettings | null;
}) {
  const [settings, setSettings] = useState<BrandSettings>(
    initial || { logo_url: null, accounts: {} },
  );
  const [state, setState] = useState<"idle" | "saving" | "uploading">("idle");
  const [message, setMessage] = useState("");
  async function upload(file: File) {
    setState("uploading");
    setMessage("");
    try {
      const res = await createBrandUploadAction(
        file.name,
        file.type,
        file.size,
      );
      if ("error" in res) throw new Error(res.error);
      const sb = getBrowserClient();
      if (!sb) throw new Error("Stockage indisponible.");
      const { error } = await sb.storage
        .from("social-ads")
        .uploadToSignedUrl(res.path, res.token, file);
      if (error) throw error;
      setSettings((s) => ({ ...s, logo_url: res.publicUrl }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setState("idle");
    }
  }
  return (
    <form
      className="sa-panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("saving");
        const ok = await saveBrandAction(settings);
        setMessage(ok ? "Paramétrage enregistré." : "Enregistrement refusé.");
        setState("idle");
      }}
    >
      <label className="sap-field">
        <span>Logo de la marque</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={state !== "idle"}
          onChange={(e) =>
            e.target.files?.[0] && void upload(e.target.files[0])
          }
        />
      </label>
      {settings.logo_url && (
        <img
          src={settings.logo_url}
          alt="Logo de la marque"
          width={72}
          height={72}
          style={{ objectFit: "contain" }}
        />
      )}
      {PLATEFORMES.map((p) => (
        <fieldset className="sa-brand-account" key={p}>
          <legend>{PLATEFORME_LABEL[p]}</legend>
          {(["nom", "handle"] as const).map((k) => (
            <label className="sap-field" key={k}>
              <span>
                {k === "nom" ? "Nom affiché" : "Identifiant / chaîne"}
              </span>
              <input
                maxLength={120}
                value={settings.accounts[p]?.[k] || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    accounts: {
                      ...s.accounts,
                      [p]: {
                        nom: s.accounts[p]?.nom || "",
                        handle: s.accounts[p]?.handle || "",
                        [k]: e.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
          ))}
        </fieldset>
      ))}
      <button className="btn btn-primary" disabled={state !== "idle"}>
        Enregistrer
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
