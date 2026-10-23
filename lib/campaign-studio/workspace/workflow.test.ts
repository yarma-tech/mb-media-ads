import { describe, expect, it } from "vitest";
import {
  createCampaign,
  addAd,
  editAd,
  submitAds,
  decideAd,
  publishAd,
  newVersion,
  finishCampaign,
  reopenCampaign,
  isComplete,
} from "./workflow";
import type { Actor, Campaign, Ad } from "./types";
const preparer: Actor = {
  kind: "human",
  id: "p",
  name: "Préparateur",
  role: "preparer",
};
const validator: Actor = {
  kind: "human",
  id: "v",
  name: "Validateur",
  role: "validator",
};
const agent: Actor = {
  kind: "agent",
  id: "a",
  name: "Agent",
  role: "preparer",
};
const now = "2026-10-23T14:00:00Z";
function ready() {
  let c = createCampaign("Admissions", preparer, now);
  c = { ...c, brandId: "marque", defaultUrl: "https://example.com" };
  c = addAd(c, "google", "search", preparer, now);
  return editAd(
    c,
    c.ads[0].id,
    {
      headlines: ["Titre un", "Titre deux", "Titre trois"],
      descriptions: ["Description un", "Description deux"],
    },
    preparer,
    "configuration",
    now,
  );
}
const ad = (c: Campaign): Ad => c.ads[c.ads.length - 1];
describe("workflow partagé de préparation et validation", () => {
  it("crée une campagne avec son seul nom et refuse le nom vide", () => {
    expect(createCampaign("Test", agent, now).brandId).toBeNull();
    expect(() => createCampaign(" ", preparer, now)).toThrow();
  });
  it("soumet seulement les annonces complètes et signale les brouillons", () => {
    let c = ready();
    c = addAd(c, "google", "search", preparer, now);
    const r = submitAds(
      c,
      c.ads.map((a) => a.id),
      agent,
      now,
    );
    expect(r.campaign.ads.map((a) => a.status)).toEqual(["pending", "draft"]);
    expect(r.skipped).toHaveLength(1);
  });
  it("réserve approbation et On air au Validateur humain", () => {
    const initial = ready();
    const c = submitAds(
      initial,
      initial.ads.map((a) => a.id),
      preparer,
      now,
    ).campaign;
    for (const actor of [preparer, agent]) {
      expect(() => decideAd(c, c.ads[0].id, "approved", actor, now)).toThrow();
      expect(() => publishAd(c, c.ads[0].id, actor, now)).toThrow();
    }
  });
  it("la pop-up corrige et approuve, le tableau ne peut pas auto-approuver", () => {
    let c = ready();
    c = submitAds(c, [ad(c).id], preparer, now).campaign;
    c = editAd(
      c,
      ad(c).id,
      { headlines: ["Corrigé", "Titre deux", "Titre trois"] },
      validator,
      "validation",
      now,
    );
    expect(ad(c).status).toBe("approved");
    expect(() =>
      editAd(
        c,
        ad(c).id,
        { url: "https://other.test" },
        preparer,
        "configuration",
        now,
      ),
    ).toThrow(/déverrouill/i);
    c = editAd(
      c,
      ad(c).id,
      { url: "https://other.test" },
      preparer,
      "configuration",
      now,
      true,
    );
    expect(ad(c).status).toBe("pending");
    expect(ad(c).history.at(-1)?.before.url).toBe("");
  });
  it("ne dévalide pas une sauvegarde sans changement effectif", () => {
    let c = ready();
    c = submitAds(c, [ad(c).id], preparer, now).campaign;
    c = decideAd(c, ad(c).id, "approved", validator, now);
    expect(
      editAd(c, ad(c).id, { url: "" }, preparer, "configuration", now, true),
    ).toBe(c);
  });
  it("une demande de modification quitte les annonces pending", () => {
    let c = ready();
    c = submitAds(c, [ad(c).id], preparer, now).campaign;
    expect(() =>
      decideAd(c, ad(c).id, "changes_requested", validator, now),
    ).toThrow();
    c = decideAd(
      c,
      ad(c).id,
      "changes_requested",
      validator,
      now,
      "Corriger le titre",
    );
    expect(ad(c).status).toBe("changes_requested");
  });
  it("fige On air et remplace atomiquement sa version par V2", () => {
    let c = ready();
    c = submitAds(c, [ad(c).id], preparer, now).campaign;
    c = decideAd(c, ad(c).id, "approved", validator, now);
    c = publishAd(c, ad(c).id, validator, now);
    const v1 = ad(c).id;
    expect(() =>
      editAd(c, v1, { url: "https://new.test" }, validator, "validation", now),
    ).toThrow();
    c = newVersion(c, v1, preparer, now);
    const v2 = ad(c).id;
    expect(ad(c).version).toBe(2);
    expect(ad(c).status).toBe("draft");
    c = submitAds(c, [v2], preparer, now).campaign;
    c = decideAd(c, v2, "approved", validator, now);
    c = publishAd(c, v2, validator, now);
    expect(c.ads.find((a) => a.id === v1)?.status).toBe("stopped");
    expect(c.ads.filter((a) => a.status === "on_air")).toHaveLength(1);
  });
  it("respecte 23h59 Montréal en hiver et été, sans remettre On air à la réouverture", () => {
    for (const [date, before, after] of [
      ["2026-01-20", "2026-01-21T04:58:59Z", "2026-01-21T04:59:00Z"],
      ["2026-07-20", "2026-07-21T03:58:59Z", "2026-07-21T03:59:00Z"],
    ]) {
      const c = { ...ready(), endDate: date };
      expect(finishCampaign(c, before).status).toBe("active");
      const ended = finishCampaign(c, after);
      expect(ended.status).toBe("finished");
      expect(() =>
        reopenCampaign(ended, "2027-01-01", preparer, after),
      ).toThrow();
      expect(
        reopenCampaign(ended, "2027-01-01", validator, after).ads.some(
          (a) => a.status === "on_air",
        ),
      ).toBe(false);
    }
  });
  it("interdit un SEM incomplet, les URL dangereuses et les dépassements", () => {
    const c = ready();
    expect(isComplete(ad(c), c)).toEqual([]);
    expect(
      isComplete({ ...ad(c), url: "javascript:alert(1)" }, c).length,
    ).toBeGreaterThan(0);
    expect(
      isComplete({ ...ad(c), headlines: ["x".repeat(31), "b", "c"] }, c).length,
    ).toBeGreaterThan(0);
  });
});
