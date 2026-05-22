# Design

## Theme

Clair et chaud. Fond = papier ivoire tiède (jamais `#fff`), texte = encre chaude profonde (jamais `#000`). Ambiance « studio média » : sobre, posée, lisible en plein jour. Stratégie couleur **Restrained** : neutres tièdes + un seul accent **bleu profond** (couleur de confiance), porté avec assurance — y compris sur les boutons primaires et le KPI clé. Le contraste chaud/froid (ivoire + bleu) évite à la fois le **rouge** cliché des médias et le **bleu SaaS** générique.

## Color (OKLCH)

Chroma faible sur les neutres (0.005–0.02), monté seulement sur l'accent et les états sémantiques.

Neutres tièdes (hue ~70) :
- `--paper` `oklch(0.985 0.006 75)` — fond global
- `--surface` `oklch(0.995 0.004 75)` — contenu ; panneau secondaire `oklch(0.965 0.008 70)`
- `--ink` `oklch(0.24 0.02 60)` — texte principal
- `--ink-soft` `oklch(0.44 0.02 60)` — texte secondaire
- `--muted` `oklch(0.56 0.015 65)` — labels / tertiaire
- `--border` `oklch(0.90 0.01 70)` ; `--border-strong` `oklch(0.82 0.012 70)`

Accent **bleu profond** (hue ~225, bleu-vert penchant bleu) : liens, état actif, anneau de focus, KPI clé, boutons primaires, stepper, le « Ads » du logo :
- `--accent` `oklch(0.54 0.1 225)`
- `--accent-strong` `oklch(0.45 0.11 226)` — sur texte / KPI (AA sur papier)
- `--accent-wash` `oklch(0.95 0.025 225)` — fond d'état sélectionné

Action primaire = accent bleu : `--primary` `oklch(0.44 0.095 226)`, texte `--paper`, hover `oklch(0.38 0.1 227)`.

États sémantiques (mats, jamais néon ; toujours accompagnés d'une icône + texte) :
- success `oklch(0.52 0.11 150)` · warn `oklch(0.62 0.12 75)` · danger `oklch(0.52 0.17 27)`

## Typography

Une seule famille : **Hanken Grotesk** (via `next/font/google`), grotesque humaniste, sobre et un brin médiatique (pas l'Inter par défaut). Chiffres tabulaires pour les données (`font-variant-numeric: tabular-nums`). Fallback : `system-ui, sans-serif`.

- Échelle rem fixe, ratio ~1.2 : 12 / 13 / 15 (corps) / 18 / 22 / 28 / 38 (titres) / 48 (chiffre héros) px.
- Poids : 400 corps, 500 labels/UI, 600–700 titres. Hiérarchie par **taille + poids** ; le bleu accentue le KPI clé et les actions, sans jamais porter une information à lui seul.
- Prose ≤ 70ch ; tableaux et données peuvent être denses.

## Spacing & Layout

- Base 4px ; échelle 4 / 8 / 12 / 16 / 24 / 32 / 48. Rythme varié (sections aérées, données denses).
- Largeur de contenu ~960px. Formulaire en une colonne lisible ; récap de reco en colonnes.
- Navigation produit standard : top bar discrète + contenu centré. **Jamais de carte dans une carte.**
- Responsive structurel : colonnes → empilées, tableau admin → condensé / scroll horizontal.

## Elevation

Quasi plat. Séparation par **bordures** et légères teintes de surface, pas par ombres. Une ombre douce et basse uniquement sur le flottant (menus) : `--shadow: 0 1px 2px rgba(40,30,20,.06), 0 10px 30px rgba(40,30,20,.05)`.

## Components

Boutons (primary = accent bleu, ghost = bordure, danger = contour rouge), champs (fond papier, bordure, focus = anneau accent 3px), segmented control (mode / objectif), badges d'état (icône + texte + teinte), métriques avec barre de confiance, tableau admin (lignes, hover, tri par lead-score). Chaque composant porte ses états : default / hover / focus / active / disabled / loading / error. Skeletons pour le chargement (pas de spinner centré). États vides pédagogiques.

## Motion

150–250 ms, ease-out (quart / expo). La motion signale un **état** (focus, apparition de la reco, changement d'état d'une demande), jamais décorative. `prefers-reduced-motion: reduce` neutralise les transitions. Ne jamais animer les propriétés de layout.

## Accessibility

WCAG AA + daltonisme. Contraste ≥4.5 (texte) / ≥3 (UI), focus visibles (anneau accent 3px), clavier complet, cibles ≥44px.

Daltonisme (deutéranopie / protanopie / tritanopie) :
- Aucune information par la couleur seule : chaque état porte **icône + libellé** (✓ « Objectif atteint » / ✕ « Non atteint », ● « Acceptée » / ○ « Refusée »).
- Pas de couple rouge/vert séparé par la seule teinte : on s'appuie sur la **clarté** et des **icônes de forme différente**, pas sur le hue.
- Niveau de confiance = **% chiffré + libellé** (faible / moyen / élevé) + longueur de barre, jamais la couleur seule.
- Icônes d'état en `currentColor` (monochromes) pour rester lisibles si la couleur est mal perçue.
