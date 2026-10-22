"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BRANDS, CHANNEL_LABELS } from "@/lib/campaign-decks/config";
import { demoCampaign, type DemoScenario } from "@/lib/campaign-decks/fixtures";
import { buildSlides } from "@/lib/campaign-decks/slides";
import type { BrandId, DeckVersion } from "@/lib/campaign-decks/types";
import DeckSlide from "./DeckSlide";
import styles from "../deck.module.css";

type ViewMode = "workspace" | "presentation";

function Icon({
  kind,
}: {
  kind: "previous" | "next" | "fullscreen" | "print" | "close";
}) {
  const paths = {
    previous: "m14 6-6 6 6 6",
    next: "m10 6 6 6-6 6",
    close: "m6 6 12 12M18 6 6 18",
    fullscreen: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    print: "M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6zM17 12h1",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

export default function DeckPreview() {
  const [brandId, setBrandId] = useState<BrandId>("cmsa");
  const [version, setVersion] = useState<DeckVersion>("visuals");
  const [scenario, setScenario] = useState<DemoScenario>("complete");
  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("workspace");
  const [message, setMessage] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0, mobile: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const campaign = useMemo(
    () => demoCampaign(brandId, scenario),
    [brandId, scenario],
  );
  const slides = useMemo(() => buildSlides(campaign), [campaign]);
  const current = Math.min(index, slides.length - 1);
  const isPresenting = viewMode === "presentation";
  const scale = size.width
    ? Math.min(size.width / 1920, size.mobile ? Infinity : size.height / 1080)
    : 0;
  const navigate = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(next, slides.length - 1));
      setIndex(bounded);
      if (size.mobile)
        document
          .getElementById(`deck-slide-${bounded}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides.length, size.mobile],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
        mobile: window.innerWidth < 900,
      });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onFullscreen = () =>
      setViewMode(document.fullscreenElement ? "presentation" : "workspace");
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    const scroller = rootRef.current;
    if (!size.mobile || !scroller) return;
    let frame = 0;
    const update = () => {
      const toolbarHeight =
        scroller.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const anchor = scroller.getBoundingClientRect().top + toolbarHeight + 20;
      const frames = Array.from(
        scroller.querySelectorAll<HTMLElement>("[data-slide-index]"),
      );
      const atEnd =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      const nearest = frames.reduce(
        (best, element) =>
          Math.abs(element.getBoundingClientRect().top - anchor) <
          Math.abs(best.getBoundingClientRect().top - anchor)
            ? element
            : best,
        frames[0],
      );
      if (nearest)
        setIndex(
          atEnd ? slides.length - 1 : Number(nearest.dataset.slideIndex),
        );
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [size.mobile, slides, isPresenting]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select, [contenteditable=true]"))
        return;
      if (event.key === "Escape") setViewMode("workspace");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        void document.fonts.ready.then(() => window.print());
      }
      if (
        [
          "ArrowRight",
          "ArrowDown",
          "PageDown",
          "ArrowLeft",
          "ArrowUp",
          "PageUp",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        event.preventDefault();
        navigate(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? slides.length - 1
              : current +
                (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key)
                  ? 1
                  : -1),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, navigate, slides.length]);

  async function present() {
    setMessage("");
    setViewMode("presentation");
    try {
      await rootRef.current?.requestFullscreen();
    } catch {
      setMessage(
        "Présentation ouverte. Le plein écran natif est indisponible dans ce navigateur.",
      );
    }
  }

  async function print() {
    setMessage("");
    await document.fonts.ready;
    const images = Array.from(rootRef.current?.querySelectorAll("img") ?? []);
    await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
    window.print();
  }

  const frameStyle = {
    "--deck-scale": scale,
    "--deck-frame-width": `${1920 * scale}px`,
    "--deck-frame-height": `${1080 * scale}px`,
  } as CSSProperties;

  return (
    <div
      className={`${styles.workbench} ${isPresenting ? styles.presenting : ""}`}
      ref={rootRef}
    >
      <header className={styles.toolbar}>
        <div className={styles.identity}>
          <span className={styles.monogram}>m.</span>
          <div>
            <strong>Deck de campagne</strong>
            <span>Aperçu du rendu · données de test</span>
          </div>
        </div>
        <div className={styles.controls}>
          <label className={styles.selectLabel}>
            <span className={styles.srOnly}>Marque</span>
            <select
              aria-label="Marque"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value as BrandId)}
            >
              {Object.values(BRANDS).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.segment} aria-label="Version du deck">
            <button
              type="button"
              aria-pressed={version === "visuals"}
              onClick={() => setVersion("visuals")}
            >
              Visuels
            </button>
            <button
              type="button"
              aria-pressed={version === "copy"}
              onClick={() => setVersion("copy")}
            >
              Textes
            </button>
          </div>
          <button
            type="button"
            aria-label="Imprimer"
            className={styles.toolButton}
            onClick={print}
          >
            <Icon kind="print" />
            <span>Imprimer</span>
          </button>
          <button
            type="button"
            aria-label="Présenter"
            className={`${styles.toolButton} ${styles.primaryButton}`}
            onClick={present}
          >
            <Icon kind="fullscreen" />
            <span>Présenter</span>
          </button>
        </div>
      </header>
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.slides} style={frameStyle}>
          {slides.map((slide, n) => (
            <div
              key={slide.id}
              id={`deck-slide-${n}`}
              className={`${styles.slideFrame} ${n === current ? styles.active : ""}`}
              data-active={n === current}
              data-slide-index={n}
            >
              <div className={styles.scaledSlide}>
                <DeckSlide
                  slide={slide}
                  campaign={campaign}
                  version={version}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className={styles.navigation}>
        <label className={styles.scenario}>
          <span className={styles.srOnly}>Exemple</span>
          <select
            aria-label="Exemple"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as DemoScenario);
              setIndex(0);
            }}
          >
            <option value="complete">Campagne complète</option>
            <option value="missing">Formats et textes manquants</option>
            <option value="empty">Campagne vide</option>
          </select>
        </label>
        <nav
          className={styles.slideNav}
          aria-label="Navigation des diapositives"
        >
          <button
            className={styles.arrow}
            type="button"
            aria-label="Diapositive précédente"
            disabled={current === 0}
            onClick={() => navigate(current - 1)}
          >
            <Icon kind="previous" />
          </button>
          <div className={styles.dots}>
            {slides.map((slide, n) => {
              const label =
                slide.kind === "cover"
                  ? "Couverture"
                  : `${CHANNEL_LABELS[slide.channel]}${slide.kind === "content" ? ` · ${slide.theme.name}` : ""}`;
              return (
                <button
                  type="button"
                  key={slide.id}
                  aria-label={label}
                  aria-current={n === current ? "step" : undefined}
                  title={label}
                  onClick={() => navigate(n)}
                >
                  <span
                    className={
                      slide.kind === "divider" ? styles.dividerDot : ""
                    }
                  />
                </button>
              );
            })}
          </div>
          <button
            className={styles.arrow}
            type="button"
            aria-label="Diapositive suivante"
            disabled={current === slides.length - 1}
            onClick={() => navigate(current + 1)}
          >
            <Icon kind="next" />
          </button>
        </nav>
        <span className={styles.keyboardHint}>← → pour parcourir</span>
      </footer>
      {isPresenting && (
        <button
          type="button"
          className={styles.exitPresentation}
          aria-label="Quitter la présentation"
          onClick={async () => {
            if (document.fullscreenElement) await document.exitFullscreen();
            setViewMode("workspace");
          }}
        >
          <Icon kind="close" />
        </button>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}
      <span className={styles.srOnly} aria-live="polite">
        Diapositive {current + 1} sur {slides.length}
      </span>
    </div>
  );
}
