import { describe, expect, it } from "vitest";
import { characterBudget, guidanceLength, textGuidance } from "./text-guidance";

describe("repères de longueur dans le tableau", () => {
  it("utilise la borne haute Feed et distingue les recommandations des limites", () => {
    expect(
      textGuidance({ channel: "facebook", format: "square" }, "copy"),
    ).toMatchObject({ limit: 150, kind: "recommendation" });
    expect(
      textGuidance({ channel: "facebook", format: "reel" }, "copy"),
    ).toMatchObject({ limit: 40, kind: "recommendation" });
    expect(
      textGuidance({ channel: "instagram", format: "reel" }, "copy"),
    ).toMatchObject({ limit: 44, kind: "recommendation" });
    expect(
      textGuidance({ channel: "instagram", format: "story_video" }, "copy"),
    ).toMatchObject({ limit: 125, kind: "recommendation" });
    expect(
      textGuidance({ channel: "youtube", format: "short" }, "copy"),
    ).toMatchObject({ limit: 90, kind: "field_limit" });
    expect(
      textGuidance({ channel: "youtube", format: "instream" }, "headline"),
    ).toMatchObject({
      limit: 40,
      kind: "recommendation",
      context: expect.stringContaining("Demand Gen"),
    });
  });

  it("n’invente pas un budget aux champs internes ou non documentés", () => {
    for (const field of ["theme", "url", "cta", "name"] as const)
      expect(
        textGuidance({ channel: "facebook", format: "square" }, field),
      ).toBeNull();
    expect(
      textGuidance({ channel: "tiktok", format: "vertical" }, "copy"),
    ).toBeNull();
    expect(
      textGuidance({ channel: "display", format: "rectangle" }, "headline"),
    ).toBeNull();
    expect(
      textGuidance({ channel: "instagram", format: "reel" }, "headline"),
    ).toBeNull();
    expect(
      textGuidance({ channel: "facebook", format: "unknown" }, "copy"),
    ).toBeNull();
  });

  it("compte les graphèmes Meta et autorise zéro puis les valeurs négatives", () => {
    const guidance = textGuidance(
      { channel: "facebook", format: "square" },
      "copy",
    )!;
    expect(guidanceLength("e\u0301👨‍👩‍👧‍👦", "graphemes")).toBe(2);
    expect(characterBudget("", guidance)).toMatchObject({
      remaining: 150,
      progress: 0,
    });
    expect(characterBudget("a".repeat(149), guidance)).toMatchObject({
      remaining: 1,
    });
    expect(characterBudget("a".repeat(150), guidance)).toMatchObject({
      remaining: 0,
      progress: 1,
    });
    expect(characterBudget("a".repeat(151), guidance)).toMatchObject({
      remaining: -1,
      progress: 1,
    });
    expect(characterBudget("a".repeat(2000), guidance).remaining).toBe(-1850);
  });

  it("prend le texte Google le plus long sans cumuler les variantes", () => {
    const guidance = textGuidance(
      { channel: "google", format: "search" },
      "headlines",
    )!;
    expect(
      characterBudget(["A".repeat(20), "B".repeat(31), "Titre"], guidance),
    ).toMatchObject({ remaining: -1, used: 31, variant: 2 });
    expect(characterBudget([], guidance)).toMatchObject({
      remaining: 30,
      variant: null,
    });
    expect(guidanceLength("é🎉", "google")).toBe(2);
    expect(
      textGuidance({ channel: "google", format: "search" }, "path2"),
    ).toMatchObject({ limit: 15, kind: "field_limit" });
  });
});
