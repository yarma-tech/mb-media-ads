import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DeckSlide from "@/app/decks/apercu/_components/DeckSlide";
import { demoCampaign } from "./fixtures";
import { buildSlides } from "./slides";

describe("rendu des maquettes", () => {
  const campaign = demoCampaign("cmsa");
  const slides = buildSlides(campaign);
  it("masque les textes publicitaires en Visuels, conserve profil et CTA", () => {
    const html = renderToStaticMarkup(
      <DeckSlide slide={slides[2]} campaign={campaign} version="visuals" />,
    );
    expect(html).not.toContain("Un milieu pour apprendre");
    expect(html).not.toContain("Un avenir à votre image");
    expect(html).toContain("Sponsorisé");
    expect(html).toContain("inscrire");
    expect(html).toContain('data-skeleton="true"');
  });
  it("affiche les textes en Textes et conserve les champs absents comme squelettes", () => {
    const partial = demoCampaign("cmsa", "missing");
    const html = renderToStaticMarkup(
      <DeckSlide
        slide={buildSlides(partial)[2]}
        campaign={partial}
        version="copy"
      />,
    );
    expect(html).toContain("Un milieu pour apprendre");
    expect(html).toContain("Visuel 4:5");
    expect(html).toContain('data-skeleton="true"');
  });
  it("sert les cinq GIF originaux sans optimiseur ni image statique", () => {
    const html = renderToStaticMarkup(
      <DeckSlide slide={slides[10]} campaign={campaign} version="visuals" />,
    );
    for (const size of ["970x250", "728x90", "300x600", "300x250", "320x100"]) {
      expect(html).toContain(`src="/deck-demo/cmsa-${size}.gif"`);
    }
    expect(html).not.toContain("/_next/image");
  });
  it("normalise les tirets cadratins dans tous les textes affichés", () => {
    const dirty = {
      ...campaign,
      title: "Rentrée\u2014automne",
      subtitle: "Meta\u2014display",
      cta: "En savoir\u2014plus",
    };
    const html = renderToStaticMarkup(
      <DeckSlide slide={slides[0]} campaign={dirty} version="copy" />,
    );
    expect(html).not.toContain("\u2014");
    expect(html).toContain("Rentrée-automne");
  });
});
