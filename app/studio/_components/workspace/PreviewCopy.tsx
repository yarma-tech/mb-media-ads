"use client";
import { useEffect, useId, useRef, useState } from "react";
import s from "./preview.module.css";

const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });
export const textCharacters = (text: string) =>
  Array.from(segmenter.segment(text), (part) => part.segment);

/** Display-only clipping. The original ad fields remain untouched. */
export function previewExcerpt(text: string, maximum: number) {
  const characters = textCharacters(text);
  return characters.length > maximum
    ? characters
        .slice(0, maximum - 1)
        .join("")
        .trimEnd() + "…"
    : text;
}

export default function PreviewCopy({
  text,
  maximum,
  expandable = true,
}: {
  text: string;
  maximum?: number;
  expandable?: boolean;
}) {
  const content = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const [excerpt, setExcerpt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  useEffect(() => {
    const element = content.current,
      probe = measure.current;
    if (!element || !probe) return;
    let frame = 0,
      active = true;
    const update = () => {
      if (!active) return;
      const style = getComputedStyle(element);
      const lines = Number(style.getPropertyValue("--copy-lines")) || 3;
      const height = parseFloat(style.lineHeight) * lines;
      const chars = textCharacters(text);
      const limit = Math.min(
        chars.length,
        maximum !== undefined && chars.length > maximum
          ? maximum - 1
          : (maximum ?? chars.length),
      );
      const fits = (length: number) => {
        const cut = length < chars.length;
        probe.replaceChildren(
          document.createTextNode(
            chars.slice(0, length).join("").trimEnd() + (cut ? "…" : ""),
          ),
        );
        if (cut && expandable) {
          const suffix = document.createElement("b");
          suffix.textContent = " Voir plus";
          suffix.style.whiteSpace = "nowrap";
          probe.append(suffix);
        }
        return probe.getBoundingClientRect().height <= height + 0.5;
      };
      let low = 0,
        high = limit;
      if (limit === chars.length && fits(limit)) low = limit;
      else {
        // Measure the text AND the link in the actual font and available width.
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          if (fits(mid)) low = mid;
          else high = mid - 1;
        }
      }
      const next = chars.slice(0, low).join("").trimEnd();
      probe.replaceChildren();
      setExcerpt(next);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    const media = matchMedia("(max-width: 700px)");
    media.addEventListener("change", schedule);
    void document.fonts.ready.then(schedule);
    schedule();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", schedule);
    };
  }, [text, maximum, expandable]);
  const clipped = excerpt !== null && excerpt.length < text.trimEnd().length;
  return (
    <p className={s.copy}>
      <span
        ref={content}
        className={`${s.copyContent} ${excerpt === null ? s.copyPending : ""} ${expanded ? s.copyExpanded : ""}`}
        data-preview-copy
      >
        <span id={id}>
          {expanded ? text : (excerpt ?? text)}
          {clipped && !expanded ? "…" : ""}
        </span>
        {clipped && expandable && (
          <>
            {" "}
            <button
              type="button"
              className={s.copyToggle}
              aria-expanded={expanded}
              aria-controls={id}
              onClick={(event) => {
                event.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          </>
        )}
        <span ref={measure} className={s.copyMeasure} aria-hidden="true" />
      </span>
    </p>
  );
}
