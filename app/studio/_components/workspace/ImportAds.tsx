"use client";
import { useRef, useState } from "react";
import type { Campaign, Channel } from "@/lib/campaign-studio/workspace/types";
import { CATALOG, CHANNELS } from "@/lib/campaign-studio/workspace/catalog";
import {
  importHeaders,
  parseCsv,
  parseImportRows,
  templateCsv,
  type ImportedAd,
} from "@/lib/campaign-studio/workspace/ad-import";
import { useWorkspace } from "./WorkspaceProvider";
import Icon from "../Icon";
import s from "./share.module.css";
function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function ImportAds({
  campaign,
  channel,
  flush,
}: {
  campaign: Campaign;
  channel: Channel;
  flush: () => Promise<unknown> | undefined;
}) {
  const { run, notify } = useWorkspace();
  const dialog = useRef<HTMLDialogElement>(null),
    fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportedAd[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function template(format: "csv" | "xlsx") {
    try {
      if (format === "csv")
        return download(
          `gabarit-${channel}.csv`,
          new Blob([templateCsv(channel)], { type: "text/csv;charset=utf-8" }),
        );
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Annonces");
      sheet.addRow(importHeaders(channel));
      sheet.getRow(1).font = { bold: true, color: { argb: "FFF5F3ED" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF142B21" },
      };
      sheet.columns.forEach((col) => {
        col.width = 28;
      });
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      const formats = CATALOG[channel].map((format) => format.id).join(",");
      for (let i = 2; i <= 201; i++)
        sheet.getCell(i, 1).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${formats}"`],
          showErrorMessage: true,
          error: "Choisissez un format du canal.",
        };
      const buffer = await workbook.xlsx.writeBuffer();
      download(
        `gabarit-${channel}.xlsx`,
        new Blob([Uint8Array.from(new Uint8Array(buffer)).buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
    } catch {
      setError("Téléchargement du gabarit impossible.");
    }
  }
  async function read(file?: File) {
    setRows([]);
    setError("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Fichier limité à 5 Mo.");
      let matrix: string[][];
      if (/\.csv$/i.test(file.name)) matrix = parseCsv(await file.text());
      else if (/\.xlsx$/i.test(file.name)) {
        const { default: ExcelJS } = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error("Classeur vide.");
        if (sheet.rowCount > 201 || sheet.columnCount > 40)
          throw new Error(
            "Import limité à 200 annonces et aux colonnes du gabarit.",
          );
        matrix = [];
        const width = sheet.getRow(1).cellCount;
        for (let i = 1; i <= sheet.rowCount; i++) {
          const cells: string[] = [];
          for (
            let j = 1;
            j <= Math.max(width, sheet.getRow(i).cellCount);
            j++
          ) {
            const value = sheet.getCell(i, j).value;
            if (
              value !== null &&
              typeof value !== "string" &&
              typeof value !== "number"
            )
              throw new Error(
                `Ligne ${i} : utilisez du texte brut, sans formule ni lien Excel.`,
              );
            cells.push(value === null ? "" : String(value));
          }
          matrix.push(cells);
        }
      } else throw new Error("Choisissez un fichier .xlsx ou .csv.");
      setRows(parseImportRows(channel, matrix));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  return (
    <>
      <button
        aria-label="Importer des annonces"
        title="Importer Excel ou CSV"
        disabled={campaign.status !== "active"}
        onClick={() => {
          setRows([]);
          setError("");
          dialog.current?.showModal();
        }}
      >
        <Icon name="upload" />
      </button>
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-label="Importer des annonces"
      >
        <div className={s.heading}>
          <h2>Importer les textes</h2>
          <button
            aria-label="Fermer l’import"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <p>{CHANNELS[channel]} · une ligne par annonce</p>
        <p className={s.help}>
          Le fichier ajoute des brouillons dans ce canal. Les annonces
          existantes restent intactes. Les médias compatibles uniques sont
          associés automatiquement.
        </p>
        <div className={s.templates}>
          <button disabled={busy} onClick={() => void template("xlsx")}>
            Gabarit Excel
          </button>{" "}
          <button disabled={busy} onClick={() => void template("csv")}>
            Gabarit CSV
          </button>
        </div>
        <p className={s.help}>
          Formats :{" "}
          {CATALOG[channel].map((f) => `${f.id} (${f.label})`).join(" · ")}.
          Gardez les en-têtes du gabarit. Nom et format requis ; les autres
          champs peuvent être complétés ensuite.
        </p>
        <label className={s.label}>
          Fichier Excel ou CSV
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.csv"
            disabled={busy}
            onChange={(e) => void read(e.target.files?.[0])}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        {rows.length > 0 && (
          <>
            <p role="status">{rows.length} annonce(s) à importer</p>
            <ul>
              {rows.slice(0, 5).map((row, i) => (
                <li key={i}>
                  {row.name} · {row.format}
                </li>
              ))}
            </ul>
          </>
        )}
        <button
          className={s.primary}
          disabled={busy || !rows.length}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await flush();
              await run({
                type: "import_ads",
                campaignId: campaign.id,
                channel,
                rows,
              });
              notify(`${rows.length} annonce(s) importée(s) en brouillon.`);
              dialog.current?.close();
              setRows([]);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Traitement…" : "Importer les annonces"}
        </button>
      </dialog>
    </>
  );
}
