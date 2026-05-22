# Design

## Theme

Clair et **frais**. Fond = gris-bleu très clair (jamais `#fff`), texte = encre froide profonde (jamais `#000`). Ambiance calme et confiante, lisible en plein jour. Stratégie couleur **Restrained**, mais l'accent **bleu** est porté avec assurance : boutons primaires, KPI clé, et un **héros bleu nuit** comme moment de confiance. Évite le **rouge** cliché des médias et le **bleu SaaS** générique. Peu de texte : de grands chiffres et des actions évidentes parlent à la place des paragraphes.

## Color (OKLCH)

Chroma faible sur les neutres (0.005–0.02), monté seulement sur l'accent et les états sémantiques.

Neutres frais (hue ~258) :
- `--paper` `oklch(0.98 0.004 258)` — fond global
- `--surface` `oklch(0.995 0.003 258)` — contenu ; panneau secondaire `oklch(0.965 0.006 258)`
- `--ink` `oklch(0.25 0.02 262)` — texte principal
- `--ink-soft` `oklch(0.46 0.018 262)` — texte secondaire
- `--muted` `oklch(0.58 0.014 262)` — labels / tertiaire
- `--border` `oklch(0.91 0.008 262)` ; `--border-strong` `oklch(0.84 0.011 262)`

Accent **bleu affirmé** (hue ~248) : liens, état actif, anneau de focus, KPI clé, boutons primaires, stepper, le « Ads » du logo :
- `--accent` `oklch(0.52 0.13 248)`
- `--accent-strong` `oklch(0.45 0.14 250)` — sur texte / KPI (AA sur clair)
- `--accent-wash` `oklch(0.95 0.03 248)` — fond d'état sélectionné

**Héros = bleu nuit** (moment de confiance : panneau du résultat, chiffre clé énorme) :
- `--hero` `oklch(0.3 0.07 258)` — fond · `--on-hero` `oklch(0.97 0.006 258)` — texte
- `--on-hero-soft` `oklch(0.78 0.02 258)` · `--hero-accent` `oklch(0.78 0.12 240)` — chiffre lumineux

Action primaire = bleu affirmé : `--primary` `oklch(0.47 0.14 250)`, texte clair, hover `oklch(0.41 0.15 252)`. Boutons grands (min-height 48px) et nets, faciles à identifier.

États sémantiques (mats, jamais néon ; toujours accompagnés d'une icône + texte) :
- success `oklch(0.55 0.13 155)` · warn `oklch(0.64 0.13 75)` · danger `oklch(0.54 0.18 27)`

## Typography

Une seule famille : **Hanken Grotesk** (via `next/font/google`), grotesque humaniste, sobre et un brin médiatique (pas l'Inter par défaut). Chiffres tabulaires pour les données (`font-variant-numeric: tabular-nums`). Fallback : `system-ui, sans-serif`.

- Échelle généreuse : 12 / 13 / 15 (corps) / 18 / 25 (h2) / 48 (h1) / 64 (chiffre héros) px. Grande typo = confiance et lisibilité immédiate.
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
