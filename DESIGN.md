# Design

## Theme

Clair, **quasi-monochrome**, inspiré Apple. Fond gris très clair (`#f5f5f7`, jamais `#fff` pur), encre **graphite** profonde (`#1d1d1f`, jamais `#000`), surfaces **blanches** en cartes à coins arrondis et ombre douce. La confiance vient de l'**espace généreux**, des **grandes typos SF Pro** et de la **retenue** : un seul accent (bleu Apple) réservé aux actions et au KPI clé. Stratégie couleur **Restrained**. Un **héros graphite « Pro »** (panneau presque noir, chiffre clé énorme et lumineux) crée le moment de confiance, comme une section sombre de page produit Apple. Évite le **rouge** cliché des médias et le **bleu SaaS** générique. Peu de texte : de grands chiffres et des actions évidentes (pilules) parlent à la place des paragraphes.

## Color (OKLCH)

Chroma quasi nul sur les neutres (graphite froid, hue ~265), monté seulement sur l'accent bleu et les états sémantiques.

Neutres graphite (hue ~265) :
- `--paper` `oklch(0.966 0.002 265)` — fond global (#f5f5f7)
- `--surface` `oklch(0.995 0.001 265)` — cartes blanches ; `--surface-2` `oklch(0.975 0.0015 265)` — tracks / hovers / insets
- `--ink` `oklch(0.22 0.003 265)` — texte principal (#1d1d1f)
- `--ink-soft` `oklch(0.52 0.005 265)` — secondaire (#6e6e73)
- `--muted` `oklch(0.62 0.005 265)` — labels / tertiaire (#86868b)
- `--border` `oklch(0.9 0.002 265)` (hairline) ; `--border-strong` `oklch(0.84 0.003 265)`

Accent **bleu Apple** (#0071e3, hue ~252) : liens, état actif, anneau de focus, KPI clé, boutons primaires, stepper, le « Ads » du logo reste neutre (gris) — l'accent est rare :
- `--accent` `oklch(0.58 0.17 252)`
- `--accent-strong` `oklch(0.52 0.17 252)` — sur texte / lien (AA sur blanc)
- `--accent-wash` `oklch(0.96 0.025 252)` — fond d'état sélectionné
- `--ring` `color-mix(in oklch, var(--accent) 22%, transparent)` — anneau de focus 4px

**Héros = graphite profond** (moment de confiance « Pro », pas de navy) :
- `--hero` `oklch(0.21 0.003 265)` — fond · `--on-hero` `oklch(0.97 0 0)` — texte
- `--on-hero-soft` `oklch(0.72 0.005 265)` · `--hero-accent` `oklch(0.72 0.15 248)` — chiffre lumineux

Action primaire = bleu Apple : `--primary` `oklch(0.58 0.17 252)`, texte blanc, hover `oklch(0.52 0.18 252)`. Boutons **pilule** (border-radius 980px), grands (min-height 48px), faciles à identifier. Secondaire = **gray fill** (`--fill` `color-mix(in oklch, var(--ink) 7%, transparent)`), sans bordure.

États sémantiques (couleurs système Apple, mates ; toujours icône + texte) :
- success `oklch(0.6 0.15 150)` · warn `oklch(0.7 0.16 65)` · danger `oklch(0.58 0.2 25)`

## Typography

Stack **système** : `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", system-ui, Roboto, sans-serif`. Sur Mac/iOS = **SF Pro** authentique. Pas de webfont chargée (rapide, natif). Chiffres tabulaires pour les données (`font-variant-numeric: tabular-nums`).

- Échelle généreuse : 12 / 13 / 16 (corps) / 19 / 23 / 28 (h2) / 52 (h1) / 76 (chiffre héros) px. Grande typo = confiance et lisibilité immédiate.
- Poids : 400 corps, 500 labels / boutons, **600 titres** (semibold, jamais 700 — l'élégance Apple). Hiérarchie par **taille + poids** ; le bleu accentue le KPI clé et les actions, jamais une information à lui seul.
- Letter-spacing négatif sur les grands titres (h1 -0.025em, chiffre héros -0.04em). Prose ≤ 60ch.

## Spacing & Layout

- Base 4px ; échelle 4 / 8 / 12 / 16 / 24 / 32 / 48. Rythme **très aéré** (sections respirantes, données denses).
- Largeur de contenu ~980px. Formulaire en une colonne lisible ; récap de reco en colonnes.
- Navigation produit standard : top bar **translucide** (matière) + contenu centré. **Jamais de carte dans une carte.**
- Rayons : `--radius` 18px (cartes), `--radius-lg` 22px (héros), `--radius-sm` 12px (champs / petits), `--radius-pill` 980px (boutons, badges, tags).
- Responsive structurel : colonnes → empilées, tableau admin → condensé / scroll horizontal.

## Elevation

Profondeur par **ombres douces et diffuses** (façon Apple), pas par bordures lourdes. Cartes blanches sur fond gris : `--shadow-sm` `0 1px 2px rgba(0,0,0,.04)` ; flottant / héros : `--shadow` `0 1px 2px rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.06)`. Top bar = **matière translucide** : `backdrop-filter: saturate(180%) blur(20px)` sur fond papier à 72 %.

## Components

Boutons **pilule** (primary = bleu plein, ghost = gray fill sans bordure, danger = contour rouge), press `scale(0.98)`. Champs (fond blanc, bordure hairline, focus = anneau bleu 4px + bordure accent, radius 12px). Segmented control = **option-cards** (carte blanche, bordure hairline, sélection = bordure accent + anneau bleu 3px) — façon page d'achat Apple. Badges d'état (icône + texte + teinte, pilule), tags pilule gris, métriques avec barre de confiance, tableau admin (carte blanche à ombre, lignes hairline, hover, tri par lead-score). Chaque composant porte ses états : default / hover / focus / active / disabled / loading / error. Skeletons pour le chargement. États vides pédagogiques.

## Motion

150–400 ms, ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`). La motion signale un **état** (focus, apparition de la reco, press d'un bouton via `scale`), jamais décorative. `prefers-reduced-motion: reduce` neutralise les transitions. Ne jamais animer les propriétés de layout.

## Accessibility

WCAG AA + daltonisme. Contraste ≥4.5 (texte) / ≥3 (UI), focus visibles (anneau bleu 4px), clavier complet, cibles ≥44px.

Daltonisme (deutéranopie / protanopie / tritanopie) :
- Aucune information par la couleur seule : chaque état porte **icône + libellé** (✓ « Objectif atteint » / ✕ « Non atteint », ● « Acceptée » / ○ « Refusée »).
- Pas de couple rouge/vert séparé par la seule teinte : on s'appuie sur la **clarté** et des **icônes de forme différente**, pas sur le hue.
- Niveau de confiance = **% chiffré + libellé** (faible / moyen / élevé) + longueur de barre, jamais la couleur seule.
- Icônes d'état en `currentColor` (monochromes) pour rester lisibles si la couleur est mal perçue.
