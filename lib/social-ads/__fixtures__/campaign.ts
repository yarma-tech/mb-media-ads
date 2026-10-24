import ExcelJS from "exceljs";

// Synthétique: mêmes colonnes et disposition que le gabarit, aucune donnée privée.
export async function campaignFixture(legacy = false): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  for (const [index, name] of (legacy
    ? ["Montréal", "Québec"]
    : ["Facebook", "Instagram"]
  ).entries()) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(["Campagne AEC Automne 2026"]);
    sheet.addRow(["Rentrée - gabarit anonymisé"]);
    sheet.addRow([
      "#",
      "Plateforme",
      "Format",
      "Texte principal",
      "Car.",
      "Titre",
      "Description",
      "CTA",
      "Lien de destination (tracké)",
      "Fichier",
      "Type",
      "Angle / Déclinaison",
    ]);
    for (let row = 1; row <= 6; row++) {
      sheet.addRow([
        row,
        legacy ? "Facebook" : name,
        row % 2 ? "Image" : "Video 4/5",
        `Formation ${row} à découvrir`,
        24,
        `Étudiez ${row}`,
        "Votre prochaine étape",
        "En savoir plus",
        `https://example.com/formation?ville=${index}&annonce=${row}`,
        `AEC-${index}-${row < 4 ? "A" : "B"}`,
        "Conversion",
        "Rentrée",
      ]);
    }
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
