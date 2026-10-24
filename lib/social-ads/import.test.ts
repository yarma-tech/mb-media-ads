import { expect, it } from "vitest";
import { campaignFixture } from "./__fixtures__/campaign";
import { parseCampaignWorkbook } from "./import";
import ExcelJS from "exceljs";
import { parseExcelFormat } from "./import";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

it("importe douze lignes du nouveau gabarit sans perdre URL et metadata", async () => {
  const result = await parseCampaignWorkbook(
    await campaignFixture(),
    "campagne.xlsx",
  );
  expect(result.ads).toHaveLength(12);
  expect(result.ads[1]).toMatchObject({
    plateforme: "facebook",
    placement: "feed",
    type_media: "video",
    ratio: "4:5",
    destination_url: "https://example.com/formation?ville=0&annonce=2",
    import_meta: { objectif: "Conversion", angle: "Rentrée" },
  });
  expect(result.status).toBe("valid");
});
it("associe Photo n et Fiche n à une seule carte ordonnée", async () => {
  const w = new ExcelJS.Workbook();
  const s = w.addWorksheet("Facebook");
  s.addRow([
    "Plateforme",
    "Format",
    "Texte principal",
    "Photo 1",
    "Fiche 1",
    "Photo 2",
    "Fiche 2",
    "Fiche 4",
  ]);
  s.addRow([
    "Facebook",
    "Carrousel",
    "Découvrez nos formations",
    "CREA-A",
    "Titre A\nDescription A",
    "CREA-B",
    "Titre B\nDescription B",
    "",
  ]);
  const r = await parseCampaignWorkbook(
    new Uint8Array(await w.xlsx.writeBuffer()),
    "cards.xlsx",
  );
  expect(r.ads[0].medias).toEqual([
    {
      type: "image",
      url: "",
      creative_ref: "CREA-A",
      titre: "Titre A",
      description: "Description A",
    },
    {
      type: "image",
      url: "",
      creative_ref: "CREA-B",
      titre: "Titre B",
      description: "Description B",
    },
  ]);
});
it("refuse un classeur corrompu", async () => {
  await expect(
    parseCampaignWorkbook(new Uint8Array([1, 2, 3]), "corrupt.xlsx"),
  ).rejects.toThrow();
});
const realFile = join(
  homedir(),
  "Downloads",
  "Facebook_AEC_Automne2026_CollegeUniversel.xlsx",
);
it.skipIf(!existsSync(realFile))(
  "vérifie les 18 annonces du classeur réel sans publier son contenu",
  async () => {
    const r = await parseCampaignWorkbook(
      new Uint8Array(readFileSync(realFile)),
      "campagne-reelle.xlsx",
    );
    expect(r.ads).toHaveLength(18);
    expect(r.issues).toHaveLength(2);
    expect(r.issues.every((i) => i.code === "compatibility")).toBe(true);
    expect(
      r.ads.every(
        (a) =>
          a.plateforme === "facebook" &&
          !!a.texte_principal &&
          !!a.destination_url &&
          !!a.creative_ref,
      ),
    ).toBe(true);
  },
);
it("importe les feuilles villes univoques avec rapport compatibility", async () => {
  const result = await parseCampaignWorkbook(
    await campaignFixture(true),
    "ancien.xlsx",
  );
  expect(result.ads).toHaveLength(12);
  expect(result.issues.map((i) => i.code)).toEqual([
    "compatibility",
    "compatibility",
  ]);
});
it("rapporte conflits, colonnes manquantes et formats ambigus en conservant les lignes valides", async () => {
  const w = new ExcelJS.Workbook();
  const s = w.addWorksheet("Facebook");
  s.addRow(["Plateforme", "Format", "Texte principal"]);
  s.addRow(["Instagram", "Image", "Conflit"]);
  s.addRow(["Facebook", "Story", "Ambigu"]);
  s.addRow(["Facebook", "Image", "Valide"]);
  w.addWorksheet("Brouillon").addRow(["Titre"]);
  const result = await parseCampaignWorkbook(
    new Uint8Array(await w.xlsx.writeBuffer()),
    "test.xlsx",
  );
  expect(result.ads).toHaveLength(1);
  expect(result.issues).toHaveLength(3);
  expect(parseExcelFormat("Story vidéo 9/16", "instagram")).toMatchObject({
    placement: "stories",
    type_media: "video",
    ratio: "9:16",
  });
  expect(() => parseExcelFormat("Reel", "linkedin")).toThrow();
});
