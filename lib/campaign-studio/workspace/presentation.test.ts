import { describe, it, expect } from "vitest";
import {
  addAd,
  createCampaign,
  duplicateAd,
  moveAd,
  handleComment,
} from "./workflow";
import { currentAds, intendedChannels, copyAdsText } from "./presentation";
import type { Actor } from "./types";
const actor: Actor = {
  kind: "human",
  id: "test",
  name: "Préparation",
  role: "preparer",
};
const now = "2026-10-29T12:00:00Z";
function fixture() {
  let c = createCampaign("Admissions", actor, now);
  c = addAd(c, "facebook", "square", actor, now);
  c = addAd(c, "facebook", "story", actor, now);
  c = addAd(c, "instagram", "square", actor, now);
  return c;
}
describe("direction D données de présentation", () => {
  it("duplique après la source, en brouillon, sans partager commentaires ni tableaux", () => {
    const c = fixture();
    const source = c.ads[0];
    source.status = "approved";
    source.theme = "Vie étudiante";
    source.headlines = ["Titre"];
    source.comments = [{ text: "Corriger", author: "V", at: now }];
    const next = duplicateAd(c, source.id, actor, now);
    expect(next.ads.map((a) => a.id)).toEqual([
      source.id,
      next.ads[1].id,
      c.ads[1].id,
      c.ads[2].id,
    ]);
    expect(next.ads[1]).toMatchObject({
      status: "draft",
      theme: "Vie étudiante",
      comments: [],
      format: "square",
    });
    next.ads[1].headlines.push("autre");
    expect(source.headlines).toEqual(["Titre"]);
  });
  it("réordonne uniquement dans le même canal et conserve chaque annonce", () => {
    const c = fixture();
    const next = moveAd(c, c.ads[1].id, c.ads[0].id, actor, now);
    expect(next.ads.map((a) => a.id)).toEqual([
      c.ads[1].id,
      c.ads[0].id,
      c.ads[2].id,
    ]);
    expect(() => moveAd(c, c.ads[0].id, c.ads[2].id, actor, now)).toThrow();
    expect(moveAd(c, c.ads[0].id, c.ads[0].id, actor, now)).toBe(c);
  });
  it("garde le commentaire traité dans l’historique sans approuver l’annonce", () => {
    const c = fixture();
    c.ads[0].status = "changes_requested";
    c.ads[0].comments = [{ text: "Corriger", author: "V", at: now }];
    const next = handleComment(c, c.ads[0].id, 0, actor, now);
    expect(next.ads[0].status).toBe("changes_requested");
    expect(next.ads[0].comments[0]).toMatchObject({
      text: "Corriger",
      resolution: "handled",
      handledBy: "Préparation",
    });
    expect(handleComment(next, c.ads[0].id, 0, actor, now)).toBe(next);
    expect(() => handleComment(c, c.ads[0].id, 9, actor, now)).toThrow();
  });
  it("compte une seule famille et conserve les canaux choisis sans annonces", () => {
    const c = fixture();
    c.channels = ["facebook", "youtube"];
    c.ads.push({ ...c.ads[0], id: "v2", version: 2, status: "draft" });
    expect(currentAds(c)).toHaveLength(3);
    expect(
      currentAds(c).find((a) => a.familyId === c.ads[0].familyId)?.id,
    ).toBe("v2");
    expect(intendedChannels(c)).toEqual(
      expect.arrayContaining(["facebook", "instagram", "youtube"]),
    );
  });
  it("copie le texte entier par blocs, avec média et commentaire traité, sans HTML", () => {
    const c = fixture();
    c.ads[0].copy = "Un texte\ncomplet";
    c.ads[0].theme = "Vie étudiante";
    c.ads[0].comments = [
      { text: "Corriger", author: "V", at: now, resolution: "handled" },
    ];
    const result = copyAdsText(c, c.ads.slice(0, 2));
    expect(result).toContain("Annonce 1\n");
    expect(result).toContain("Texte : Un texte\ncomplet");
    expect(result).toContain("\n\nAnnonce 2\n");
    expect(result).toContain("Commentaire traité : Corriger");
    expect(result).not.toContain("<table");
  });
});
