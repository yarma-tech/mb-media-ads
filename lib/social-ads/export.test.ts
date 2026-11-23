import { expect, it } from "vitest";
import { exportPlanText } from "./export";
import type { Ad, Approval, Plan } from "./types";
it("exporte textes finaux, cartes et révision prioritaire en UTF-8", () => {
  const ad = {
    id: "1",
    ordre: 0,
    plateforme: "facebook",
    format: "feed_carrousel",
    type_media: "carrousel",
    placement: "feed",
    ratio: "1:1",
    texte_principal: "Étudiez",
    titre: "Titre modifié",
    destination_url: "https://example.com?a=é",
    medias: [{ titre: "Carte é", description: "Détail", creative_ref: "C1" }],
  } as Ad;
  const out = exportPlanText(
    { nom: "Campagne", created_at: "2026-10-06" } as Plan,
    [ad],
    [
      { ad_id: "1", decision: "approuve" },
      { ad_id: "1", decision: "revision" },
    ] as Approval[],
    new Date("2026-10-06"),
  );
  expect(out).toContain("Titre : Titre modifié");
  expect(out).toContain("Décision : À réviser");
  expect(out).toContain("Carte 1");
  expect(out).toContain("https://example.com?a=é");
});
it("groupe douze blocs selon première plateforme et garde quatre cartes", () => {
  const ads = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    ordre: i,
    plateforme: i < 6 ? "instagram" : "facebook",
    placement: "feed",
    type_media: i === 0 ? "carrousel" : "image",
    ratio: "1:1",
    texte_principal: `Texte ${i}`,
    medias:
      i === 0
        ? [1, 2, 3, 4].map((n) => ({
            titre: `Carte ${n}`,
            description: "Été",
            creative_ref: `C${n}`,
          }))
        : [],
  })) as Ad[];
  const out = exportPlanText(
    { nom: "Plan" } as Plan,
    ads,
    [],
    new Date("2026-10-06"),
  );
  expect(out.match(/Annonce \d+ - ordre/g)).toHaveLength(12);
  expect(out.indexOf("Instagram")).toBeLessThan(out.indexOf("Facebook"));
  expect(out).toContain("Carte 4");
  expect(out).not.toContain("\u2014");
  expect(
    exportPlanText({ nom: "Vide" } as Plan, [], [], new Date("2026-10-06")),
  ).toContain("Plan : Vide");
});
