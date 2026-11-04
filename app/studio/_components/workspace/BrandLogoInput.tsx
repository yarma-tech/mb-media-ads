"use client";
import { useRef, useState } from "react";
import Icon from "../Icon";
import NextImage from "next/image";
import c from "./creation.module.css";

export default function BrandLogoInput({
  disabled,
  onChange,
  onBusy,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  onBusy: (value: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  async function select(file?: File) {
    if (!file) return;
    setError("");
    if (
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/svg+xml",
      ].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError(
        "Choisissez une image PNG, JPG, WebP, GIF ou SVG de 5 Mo maximum.",
      );
      if (input.current) input.current.value = "";
      return;
    }
    setProcessing(true);
    onBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(
        1,
        512 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const value = canvas.toDataURL("image/png");
      if (value.length > 750000) throw new Error();
      setPreview(value);
      onChange(value);
    } catch {
      setError(
        "Cette image ne peut pas être importée. Essayez un autre fichier.",
      );
      if (input.current) input.current.value = "";
    } finally {
      URL.revokeObjectURL(url);
      setProcessing(false);
      onBusy(false);
    }
  }
  return (
    <div className={c.logoField}>
      <label htmlFor="brand-logo">Logo</label>
      <div className={c.logoImport}>
        {preview ? (
          <NextImage
            src={preview}
            alt="Aperçu du logo"
            width={72}
            height={72}
            unoptimized
          />
        ) : (
          <span className={c.logoPlaceholder}>
            <Icon name="upload" size={24} />
          </span>
        )}
        <div className={c.logoControls}>
          <button
            type="button"
            disabled={disabled || processing}
            onClick={() => input.current?.click()}
          >
            {processing
              ? "Préparation…"
              : preview
                ? "Remplacer le logo"
                : "Importer un logo"}
          </button>
          <small>PNG, JPG, WebP, GIF ou SVG · 5 Mo max.</small>
        </div>
        {preview && (
          <button
            type="button"
            disabled={disabled || processing}
            aria-label="Retirer le logo"
            onClick={() => {
              setPreview("");
              onChange("");
              if (input.current) input.current.value = "";
            }}
          >
            <Icon name="trash" />
          </button>
        )}
      </div>
      <input
        ref={input}
        id="brand-logo"
        className={c.logoFile}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        disabled={disabled || processing}
        onChange={(e) => void select(e.target.files?.[0])}
      />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
