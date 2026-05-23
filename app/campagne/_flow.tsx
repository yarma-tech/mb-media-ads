"use client";

import { useState } from "react";
import type { Catalogue } from "@/lib/types";
import { Formulaire } from "../_components/formulaire";
import { FormulaireManuel } from "../_components/formulaire-manuel";
import { IconArrowLeft, IconTarget, IconWallet } from "../_components/icons";

type Mode = "manuel" | "auto";

export function CampagneFlow({ catalogue, nomEntreprise }: { catalogue: Catalogue; nomEntreprise: string }) {
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode === null) {
    return (
      <div className="panel form-card">
        <p className="fieldset-legend">Comment composer votre campagne ?</p>
        <div className="segmented">
          <button type="button" onClick={() => setMode("manuel")}>
            <span className="seg-title">
              <IconTarget /> Définir ma campagne
            </span>
            <span className="seg-desc">
              Vous choisissez média, programme, réseau, format et cible. On vous donne le tarif.
            </span>
          </button>
          <button type="button" onClick={() => setMode("auto")}>
            <span className="seg-title">
              <IconWallet /> Campagne auto
            </span>
            <span className="seg-desc">
              Vous donnez budget, objectif et dates. On compose la campagne idéale pour vous.
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => setMode(null)}>
        <IconArrowLeft /> Changer de mode
      </button>
      {mode === "manuel" ? <FormulaireManuel catalogue={catalogue} /> : <Formulaire nomEntreprise={nomEntreprise} />}
    </>
  );
}
