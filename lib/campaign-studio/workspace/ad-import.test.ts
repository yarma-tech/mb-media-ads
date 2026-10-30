import { describe, expect, it } from "vitest";
import {
  importHeaders,
  parseCsv,
  parseImportRows,
  templateCsv,
} from "./ad-import";
import { addAd, createCampaign, deleteAds, importAds } from "./workflow";
import { CommandSchema } from "./commands";
import type { Actor } from "./types";
const actor: Actor = {
  kind: "human",
  id: crypto.randomUUID(),
  name: "Préparation",
  role: "preparer",
};
const now = "2026-10-30T12:00:00Z";
const campaign = () =>
  addAd(createCampaign("Recette", actor, now), "google", "search", actor, now);
describe("import déterministe", () => {
  it("accepte BOM, point-virgule, accents, virgule et texte multiligne échappé", () => {
    const matrix = parseCsv(
      '\uFEFFFormat;Nom;Thématique;Texte;Titre;CTA;URL\r\nsquare;Essai;Notoriété;"Texte, avec\nune \\"citation\\"";Titre;Découvrir;https://leyon.pro/\r\n'.replaceAll(
        '\\"',
        '""',
      ),
    );
    const rows = parseImportRows("facebook", matrix);
    expect(rows[0].copy).toBe('Texte, avec\nune "citation"');
    expect(parseCsv('Format,Nom\nsearch,"Annonce, Montréal"')[1][1]).toBe(
      "Annonce, Montréal",
    );
  });
  it("rejette tout fichier entier sur en-têtes, format, URL, ligne vide ou taille invalide", () => {
    expect(() => parseImportRows("facebook", [["Nom", "Format"]])).toThrow(
      "Colonnes",
    );
    expect(() =>
      parseImportRows("facebook", [
        importHeaders("facebook"),
        ["search", "Test"],
      ]),
    ).toThrow("Ligne 2");
    expect(() =>
      parseImportRows("facebook", [
        importHeaders("facebook"),
        ["square", "Test", "", "", "", "", "javascript:alert(1)"],
      ]),
    ).toThrow("URL");
    expect(() => parseCsv('"inachevé')).toThrow("guillemets");
    expect(() =>
      parseImportRows("google", parseCsv(templateCsv("google"))),
    ).toThrow("Aucune annonce");
    expect(() =>
      parseImportRows("facebook", [
        importHeaders("facebook"),
        ...Array.from({ length: 201 }, () => ["square", "Test"]),
      ]),
    ).toThrow("200");
  });
  it("importe des annonces SEM en brouillons et conserve les annonces antérieures", () => {
    const c = campaign(),
      previous = structuredClone(c.ads);
    const row = Array(importHeaders("google").length).fill("");
    row[0] = "search";
    row[1] = "Annonce importée";
    row[3] = "Titre 1";
    row[4] = "Titre 2";
    row[5] = "Titre 3";
    row[18] = "Description 1";
    row[19] = "Description 2";
    const imported = parseImportRows("google", [importHeaders("google"), row]);
    const next = importAds(c, "google", imported, actor, now);
    expect(next.ads[0]).toEqual(previous[0]);
    expect(next.ads[1].headlines).toHaveLength(3);
    expect(next.ads[1].status).toBe("draft");
    expect(
      CommandSchema.safeParse({
        type: "import_ads",
        campaignId: c.id,
        revision: c.revision,
        channel: "google",
        rows: imported,
      }).success,
    ).toBe(true);
    expect(
      CommandSchema.safeParse({
        type: "import_ads",
        campaignId: c.id,
        revision: c.revision,
        channel: "google",
        rows: [{ ...imported[0], mediaId: crypto.randomUUID() }],
      }).success,
    ).toBe(false);
    expect(() =>
      importAds(
        c,
        "google",
        [...imported, { ...imported[0], format: "unknown" }],
        actor,
        now,
      ),
    ).toThrow();
    expect(c.ads).toEqual(previous);
  });
});
describe("suppression des annonces", () => {
  it("supprime la sélection, garde les médias et trace l’action", () => {
    const c = campaign();
    c.ads[0].status = "pending";
    const next = deleteAds(c, [c.ads[0].id], actor, now);
    expect(next.ads).toHaveLength(0);
    expect(next.media).toEqual(c.media);
    expect(next.history.at(-1)?.action).toBe("ads_deleted");
    expect(c.ads).toHaveLength(1);
  });
  it("refuse intégralement une sélection mixte contenant une annonce diffusée", () => {
    const c = addAd(campaign(), "google", "search", actor, now);
    c.ads[1].status = "on_air";
    expect(() =>
      deleteAds(
        c,
        c.ads.map((a) => a.id),
        actor,
        now,
      ),
    ).toThrow("historique");
    expect(c.ads).toHaveLength(2);
    expect(() => deleteAds(c, ["absent"], actor, now)).toThrow("introuvable");
  });
});
