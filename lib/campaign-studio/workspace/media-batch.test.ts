import { describe, expect, it } from "vitest";
import { createMediaAds, mediaAdPlan } from "./media-batch";
import { createCampaign, isComplete } from "./workflow";
import { compatibleFormats, mediaChannels } from "./catalog";
import { CommandSchema } from "./commands";
import type { Actor, Media } from "./types";
const actor: Actor = {
  kind: "human",
  id: "preparer",
  name: "Préparateur",
  role: "preparer",
};
const now = "2026-10-27T15:00:00Z";
const media = (id: string, width = 1080, height = 1080): Media => ({
  id,
  name: id + ".png",
  path: id,
  mime: "image/png",
  bytes: 10000,
  width,
  height,
  duration: null,
  channel: "facebook",
  channels: ["facebook", "instagram"],
  state: "ready",
  errors: [],
});
const campaign = () => ({
  ...createCampaign("Lot", actor, now),
  brandId: "brand",
  defaultUrl: "https://example.test",
  media: [media("square"), media("portrait", 1080, 1350)],
});

describe("création groupée depuis les médias", () => {
  it("crée quatre annonces pour deux fichiers et deux canaux, avec un seul média physique par fichier", () => {
    const c = campaign();
    const result = createMediaAds(
      c,
      ["square", "portrait"],
      ["facebook", "instagram"],
      actor,
      now,
    );
    expect(result.created).toBe(4);
    expect(
      result.campaign.ads.map((a) => [a.channel, a.format, a.mediaId]),
    ).toEqual([
      ["facebook", "square", "square"],
      ["instagram", "square", "square"],
      ["facebook", "portrait", "portrait"],
      ["instagram", "portrait", "portrait"],
    ]);
    expect(result.campaign.media).toEqual(c.media);
    expect(c.ads).toHaveLength(0);
  });
  it("une reprise ou des identifiants répétés ne créent aucun doublon", () => {
    const first = createMediaAds(
      campaign(),
      ["square", "square"],
      ["facebook", "facebook", "instagram"],
      actor,
      now,
    );
    const second = createMediaAds(
      first.campaign,
      ["square"],
      ["facebook", "instagram"],
      actor,
      now,
    );
    expect(first.created).toBe(2);
    expect(second.created).toBe(0);
    expect(second.campaign).toBe(first.campaign);
  });
  it("ignore les canaux non affectés, fichiers incomplets et formats incompatibles", () => {
    const c = campaign();
    c.media.push(
      { ...media("pending"), state: "uploading" },
      { ...media("bad", 123, 456), state: "invalid" },
    );
    expect(
      mediaAdPlan(
        c,
        ["facebook", "youtube", "display"],
        ["square", "pending", "bad"],
      ),
    ).toHaveLength(1);
    expect(mediaAdPlan(c, ["youtube"], ["square"])).toEqual([]);
  });
  it("refuse un média absent et ne modifie jamais une campagne terminée", () => {
    const c = campaign();
    expect(() =>
      createMediaAds(c, ["other"], ["facebook"], actor, now),
    ).toThrow(/introuvable/i);
    expect(() =>
      createMediaAds(
        { ...c, status: "finished" },
        ["square"],
        ["facebook"],
        actor,
        now,
      ),
    ).toThrow(/terminée/i);
  });
  it("un média partagé reste conforme pour ses canaux, jamais pour un canal ajouté arbitrairement", () => {
    const c = createMediaAds(
      campaign(),
      ["square"],
      ["instagram"],
      actor,
      now,
    ).campaign;
    c.ads[0].copy = "Texte";
    expect(isComplete(c.ads[0], c)).toEqual([]);
    c.media[0].channels = ["facebook"];
    expect(isComplete(c.ads[0], c)).toContain("Média conforme au canal requis");
  });
  it("conserve la compatibilité des anciens médias à un seul canal", () => {
    const m = media("legacy");
    delete m.channels;
    expect(mediaChannels(m)).toEqual(["facebook"]);
    expect(
      mediaAdPlan({ ...campaign(), media: [m] }, ["facebook", "instagram"]),
    ).toHaveLength(1);
  });
  it("les contraintes GIF Display ne rendent pas un média partagé inutilisable sur les autres canaux", () => {
    const m = {
      ...media("gif", 300, 250),
      mime: "image/gif",
      duration: 40,
      frameRate: 10,
      channels: ["display", "facebook"] as Media["channels"],
    };
    expect(compatibleFormats(m, "display")).toEqual([]);
    expect(
      compatibleFormats({ ...m, width: 1080, height: 1080 }, "facebook"),
    ).toHaveLength(1);
  });
  it("valide une commande de lot bornée et une affectation multiple à l’upload", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      CommandSchema.safeParse({
        type: "add_media_batch",
        campaignId: id,
        revision: 0,
        mediaIds: [id],
        channels: ["facebook", "instagram"],
      }).success,
    ).toBe(true);
    expect(
      CommandSchema.safeParse({
        type: "add_media_batch",
        campaignId: id,
        revision: 0,
        mediaIds: [],
        channels: ["facebook"],
      }).success,
    ).toBe(false);
    expect(
      CommandSchema.safeParse({
        type: "upload",
        campaignId: id,
        revision: 0,
        name: "test.png",
        mime: "image/png",
        bytes: 100,
        channel: "facebook",
        channels: ["facebook", "instagram"],
      }).success,
    ).toBe(true);
  });
});
