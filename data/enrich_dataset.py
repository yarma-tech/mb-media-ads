#!/usr/bin/env python3
"""
Karata Ads — Étape 1 : enrichissement du dataset (voir HANDOFF.md §3).

Entrée  : dataset synthétique V3 (5000 placements, grain = un placement, ';').
Sortie  : data/dataset_enrichi.csv — colonnes existantes + colonnes ajoutées,
          relations plausibles encodées (signal déterministe + bruit), 3 médias.

Principes (ADR-0002) : la crédibilité des recos dépend des relations encodées ici.
Effets MULTIPLICATIFS sur une base + bruit lognormal -> modèles SIMPLES (ADR-0001)
apprennent une structure. Bruit volontaire -> intervalles de confiance non triviaux.

Décisions de grain :
- Audience EXISTANTE (Objectif/Audience_Realisee_K_Vues, Objectif_Atteint) = grain
  CAMPAGNE, conservée. On AJOUTE `Audience_Placement_K_Vues` (additive) ; pour Karata
  existant, l'audience campagne est RÉPARTIE sur les placements (somme préservée).
- Reach/Couverture/Leads/Ventes dérivés au grain PLACEMENT.
- Conversion (grain campagne) = leads (parallèle à l'audience).

SAISONNALITÉ (métier) :
- Karata = contenu Carnaval de Guadeloupe -> HAUTE SAISON T1 (janv-mars), prix ~+40%.
  Les prix Karata EXISTANTS encodent déjà ce pic -> conservés. Les NOUVEAUX clients
  Karata le répliquent.
- Lumen / Pulse = calendrier commercial classique (Noël fort, rentrée, soldes,
  St-Valentin, fête des mères, creux estival) + légère modulation secteur.
- Feature `Fenetre_Commerciale` (+ `Mois`) ajoutée -> le modèle prix l'apprend et
  l'optimiseur (qui prend une période) l'exploite.

COMPLÉTUDE :
- Karata (média mature) : comportement rempli à 100% (les ~55% de trous du V3 sont
  comblés selon la propension de l'entreprise).
- Lumen / Pulse (médias récents) : comportement partiel (~45%) -> conserve le scénario
  cold-start profil-only du lead-score (CONTEXT.md).

ANTI-FUITE : les colonnes RÉALISÉES (Audience_Realisee, Audience_Placement, Reach,
Couverture, Leads/Ventes_Realises, *_Atteint, Conversion_Realisee) sont des SORTIES,
jamais des features. Features : Media, Programme, Plateforme, Type_Pub, Cible,
Type_Entreprise, Secteur, Quality_Score, Mois/Fenetre_Commerciale (+ comportement pour
le lead-score).

Reproductible : RNG seedé (SEED) + seeds par entreprise (hashlib).
"""
import csv, math, hashlib, datetime, random
from collections import defaultdict, OrderedDict

SEED = 20260522
SRC = "dataset_pub_enrichi_V3.csv"  # CSV source V3 (hors repo) — placer dans le dossier d'exécution
OUT = "data/dataset_enrichi.csv"    # relatif à la racine du repo
rng = random.Random(SEED)

# --------------------------------------------------------------------------- #
# Référentiels
# --------------------------------------------------------------------------- #
PLATFORMS = ["YouTube", "Facebook", "TikTok", "Instagram", "Spotify"]
CIBLES = ["Kids", "Professionnel", "Artisan", "Parent", "Gamers", "Sport_Lover"]
TYPES_PUB = ["Don", "Mécénat", "Citation orale", "Placement produit", "Logo fin", "Logo début/fin"]
SECTEURS = ["Automobile", "Food", "Tourisme", "Luxe", "Tech", "Santé"]

PROGRAMMES = OrderedDict([
    ("INSIDE MAS",       {"media": "Karata", "platforms": {"YouTube": .40, "Facebook": .35, "Instagram": .25}, "pop": 1.30}),
    ("LIVE",             {"media": "Karata", "platforms": {"YouTube": .55, "Facebook": .45},                   "pop": 1.10}),
    ("KARATA TOUR",      {"media": "Karata", "platforms": {"YouTube": .45, "Facebook": .35, "Instagram": .20}, "pop": 1.05}),
    ("MOUN A MAS",       {"media": "Karata", "platforms": {"Facebook": .55, "Instagram": .45},                 "pop": 0.90}),
    ("FWET A MAS",       {"media": "Karata", "platforms": {"YouTube": .30, "TikTok": .40, "Instagram": .30},   "pop": 0.95}),
    ("MIZIK A",          {"media": "Karata", "platforms": {"Spotify": .60, "YouTube": .40},                    "pop": 0.85}),
    ("VIDEO PARTENAIRE", {"media": "Karata", "platforms": {"YouTube": .60, "Facebook": .40},                   "pop": 0.70}),
    ("ECO MATIN",        {"media": "Lumen", "platforms": {"YouTube": .40, "Spotify": .35, "Facebook": .25},   "pop": 0.90}),
    ("GRAND FORMAT",     {"media": "Lumen", "platforms": {"YouTube": 1.0},                                     "pop": 1.00}),
    ("TECH & CO",        {"media": "Lumen", "platforms": {"YouTube": .55, "Spotify": .45},                     "pop": 0.85}),
    ("SANTÉ PLUS",       {"media": "Lumen", "platforms": {"Facebook": .50, "YouTube": .50},                    "pop": 0.80}),
    ("PULSE DAILY",      {"media": "Pulse", "platforms": {"TikTok": .60, "Instagram": .40},                    "pop": 1.40}),
    ("GAME ON",          {"media": "Pulse", "platforms": {"TikTok": .55, "YouTube": .45},                      "pop": 1.20}),
    ("STREET FOOD",      {"media": "Pulse", "platforms": {"Instagram": .45, "TikTok": .35, "Facebook": .20},   "pop": 1.10}),
    ("VIBE CHECK",       {"media": "Pulse", "platforms": {"TikTok": .50, "Instagram": .50},                    "pop": 1.00}),
])
KARATA_PROGS = [p for p, m in PROGRAMMES.items() if m["media"] == "Karata"]
PROGS_BY_MEDIA = {med: [p for p, m in PROGRAMMES.items() if m["media"] == med] for med in ("Karata", "Lumen", "Pulse")}

CIBLE_DIST = {
    "Karata": {"Parent": .25, "Sport_Lover": .20, "Artisan": .15, "Professionnel": .15, "Kids": .15, "Gamers": .10},
    "Lumen":  {"Professionnel": .35, "Parent": .25, "Sport_Lover": .20, "Artisan": .10, "Kids": .05, "Gamers": .05},
    "Pulse":  {"Gamers": .30, "Kids": .25, "Artisan": .20, "Sport_Lover": .15, "Parent": .05, "Professionnel": .05},
}

PLATFORM_FREQ = {"TikTok": 3.6, "Instagram": 3.0, "Facebook": 2.2, "YouTube": 1.5, "Spotify": 1.8}
MEDIA_FREQ_FACTOR = {"Pulse": 1.15, "Karata": 1.0, "Lumen": 0.82}
PLATFORM_REACH = {"YouTube": 1.15, "Facebook": 1.0, "TikTok": 1.25, "Instagram": 1.05, "Spotify": 0.80}
TYPEPUB_VIS    = {"Placement produit": 1.15, "Citation orale": 1.05, "Logo début/fin": 1.0, "Mécénat": 0.95, "Logo fin": 0.90, "Don": 0.90}
# Audience par placement (K vues). Ordre Pulse(viral) > Karata(grand public) > Lumen
# (premium niche : audience plus petite mais CPM élevé). Calé sur l'existant Karata (~20K/placement).
MEDIA_AUD_BASE = {"Karata": 22.0, "Lumen": 16.0, "Pulse": 34.0}
MEDIA_QS       = {"Karata": (7.5, 1.3), "Lumen": (8.0, 1.0), "Pulse": (6.8, 1.2)}

def f_quality_aud(qs):
    return 0.92 + 0.016 * (qs - 5.0)

BASE_LEAD = 0.055
TYPEPUB_LEAD = {"Placement produit": 1.40, "Citation orale": 1.20, "Mécénat": 0.90, "Don": 0.85, "Logo début/fin": 0.78, "Logo fin": 0.65}
SECTEUR_LEAD = {"Food": 1.15, "Tourisme": 1.10, "Tech": 1.05, "Automobile": 1.0, "Santé": 0.95, "Luxe": 0.90}
AFFINITY = {
    ("Gamers", "TikTok"): 1.50, ("Gamers", "YouTube"): 1.20, ("Gamers", "Instagram"): 1.10, ("Gamers", "Spotify"): 0.70, ("Gamers", "Facebook"): 0.80,
    ("Kids", "TikTok"): 1.30, ("Kids", "YouTube"): 1.25, ("Kids", "Instagram"): 1.05, ("Kids", "Spotify"): 0.60, ("Kids", "Facebook"): 0.85,
    ("Parent", "Facebook"): 1.40, ("Parent", "YouTube"): 1.10, ("Parent", "Instagram"): 1.05, ("Parent", "TikTok"): 0.80, ("Parent", "Spotify"): 0.95,
    ("Professionnel", "Spotify"): 1.20, ("Professionnel", "YouTube"): 1.15, ("Professionnel", "Facebook"): 1.05, ("Professionnel", "Instagram"): 0.85, ("Professionnel", "TikTok"): 0.70,
    ("Artisan", "Facebook"): 1.25, ("Artisan", "Instagram"): 1.15, ("Artisan", "YouTube"): 1.0, ("Artisan", "TikTok"): 0.95, ("Artisan", "Spotify"): 0.85,
    ("Sport_Lover", "Instagram"): 1.20, ("Sport_Lover", "YouTube"): 1.15, ("Sport_Lover", "TikTok"): 1.10, ("Sport_Lover", "Facebook"): 1.05, ("Sport_Lover", "Spotify"): 0.95,
}
BASE_FUNNEL = 0.22
TYPEPUB_FUNNEL = {"Placement produit": 1.30, "Citation orale": 1.10, "Mécénat": 0.95, "Don": 0.90, "Logo début/fin": 0.85, "Logo fin": 0.80}
SECTEUR_FUNNEL = {"Food": 1.20, "Tourisme": 1.15, "Automobile": 1.05, "Tech": 1.0, "Santé": 1.0, "Luxe": 0.70}
PLATFORM_FUNNEL = {"YouTube": 1.10, "Spotify": 1.10, "Facebook": 1.0, "Instagram": 0.95, "TikTok": 0.80}

PRICE_BASE = 760.0
def premium_q(qs):
    return 0.80 + 0.09 * (qs - 5.0)
PLATFORM_PRICE = {"YouTube": 1.10, "Spotify": 1.05, "Facebook": 1.0, "Instagram": 1.0, "TikTok": 0.95}
TYPEPUB_PRICE  = {"Placement produit": 1.30, "Citation orale": 1.15, "Logo début/fin": 1.05, "Mécénat": 1.0, "Logo fin": 0.90, "Don": 0.85}
# Niveau de prix par média (calé : Karata ~873€ comme l'existant ; Lumen premium ; Pulse social pas cher)
MEDIA_PRICE    = {"Lumen": 1.15, "Karata": 1.09, "Pulse": 0.72}

# --- Saisonnalité ---------------------------------------------------------- #
def fenetre_commerciale(media, mois):
    """Fenêtre commerciale propre au média (Karata = carnaval ; autres = classique)."""
    if media == "Karata":
        if mois in (1, 2, 3): return "Carnaval"       # Carnaval de Guadeloupe (T1)
        if mois in (7, 8):    return "Été"
        return "Standard"
    return {1: "Soldes", 2: "St-Valentin", 5: "Fête-des-mères", 6: "Fête-des-mères",
            7: "Été", 8: "Été", 9: "Rentrée", 11: "Noël", 12: "Noël"}.get(mois, "Standard")

SAISON_KARATA = {"Carnaval": 1.40, "Été": 0.85, "Standard": 0.91}  # calé sur le V3 (Q1 ~+40%)
SAISON_CLASSIQUE = {"Noël": 1.35, "Rentrée": 1.18, "Fête-des-mères": 1.12,
                    "St-Valentin": 1.10, "Soldes": 1.08, "Été": 0.82, "Standard": 1.0}
SECTEUR_SAISON = {  # modulation secteur × fenêtre (médias classiques)
    ("Luxe", "Noël"): 1.15, ("Food", "Noël"): 1.12, ("Tourisme", "Été"): 1.30,
    ("Tourisme", "Fête-des-mères"): 1.10, ("Automobile", "Rentrée"): 1.08,
}
def saison_prix(media, mois, secteur):
    fen = fenetre_commerciale(media, mois)
    if media == "Karata":
        return SAISON_KARATA[fen], fen
    return SAISON_CLASSIQUE[fen] * SECTEUR_SAISON.get((secteur, fen), 1.0), fen

TYPE_ENTREPRISE_DIST = {"Privé": 0.601, "Public": 0.195, "Association": 0.103, "Particulier": 0.101}
OBJ_AUDIENCE_MENU = [50, 100, 200, 300, 500, 800]

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def lognoise(sigma):
    return math.exp(rng.gauss(0.0, sigma))

def wchoice(weights):
    items = list(weights.items()); tot = sum(w for _, w in items); x = rng.random() * tot; c = 0.0
    for k, w in items:
        c += w
        if x <= c: return k
    return items[-1][0]

def affinity(cible, plat): return AFFINITY.get((cible, plat), 1.0)
def compute_freq(media, plat): return max(1.0, min(6.0, PLATFORM_FREQ[plat] * MEDIA_FREQ_FACTOR[media] * lognoise(0.12)))
def compute_taux_lead(tp, ci, pl, se, p_co): return max(0.005, min(0.35, BASE_LEAD * TYPEPUB_LEAD[tp] * affinity(ci, pl) * SECTEUR_LEAD[se] * p_co * lognoise(0.18)))
def compute_taux_vente(tl, tp, se, pl):
    funnel = max(0.05, min(0.50, BASE_FUNNEL * TYPEPUB_FUNNEL[tp] * SECTEUR_FUNNEL[se] * PLATFORM_FUNNEL[pl] * lognoise(0.20)))
    return max(0.001, min(tl, tl * funnel))
def compute_price(aud_k, qs, plat, tp, media, saison_mult):
    # audience normalisée par la base du média -> niveau fixé par MEDIA_PRICE (décorrélé de l'échelle d'audience)
    aud_term = (max(aud_k, 3.0) / MEDIA_AUD_BASE[media]) ** 0.55
    v = PRICE_BASE * aud_term * premium_q(qs) * PLATFORM_PRICE[plat] * TYPEPUB_PRICE[tp] * MEDIA_PRICE[media] * saison_mult * lognoise(0.22)
    return max(50.0, min(6000.0, v))
def reach_and_cover(aud_k, freq):
    reach = aud_k / freq
    return reach, (reach if freq >= 3.0 else reach * (freq / 3.0))
def draw_heure(cible):
    pool = {"Professionnel": [7, 8, 8, 9, 9, 10, 12, 13, 18], "Kids": [10, 14, 16, 17, 17, 18, 19, 20],
            "Gamers": [18, 20, 21, 21, 22, 22, 23, 0, 1], "Parent": [8, 9, 12, 13, 19, 20, 21, 21]}.get(cible, list(range(6, 24)))
    return rng.choice(pool)
def co_seed(name): return int.from_bytes(hashlib.md5(name.encode("utf-8")).digest()[:8], "big") ^ SEED

def fill_behavior(row, p_co, cible):
    """Remplit les 4 colonnes comportementales, corrélées à la propension (lead-score)."""
    temps = max(1.5, min(44.9, 23.0 + 30.0 * (p_co - 1.0) + rng.gauss(0, 6.0)))
    vav = max(1, min(11, round(6.0 - 12.0 * (p_co - 1.0) + rng.gauss(0, 2.0))))
    row["Temps_Plateforme"] = f"{temps:.1f}"
    row["Visites_Avant_Achat"] = f"{vav}.0"
    row["Device"] = rng.choice(["Mobile", "Desktop", "Tablet"])
    row["Heure_Achat"] = f"{draw_heure(cible)}.0"

def placement_outputs(media, plat, cible, tpub, sect, p_co, aud_k):
    freq = compute_freq(media, plat)
    reach, cover = reach_and_cover(aud_k, freq)
    tl = compute_taux_lead(tpub, cible, plat, sect, p_co)
    tv = compute_taux_vente(tl, tpub, sect, plat)
    return {"Frequence": freq, "Audience_Placement_K_Vues": aud_k, "Reach_K": reach,
            "Couverture_Efficace_K": cover, "Taux_Lead": tl, "Taux_Vente": tv,
            "Leads_Realises": aud_k * tl, "Ventes_Realises": aud_k * tv}

# --------------------------------------------------------------------------- #
# 1) Charger l'existant + propension par entreprise
# --------------------------------------------------------------------------- #
with open(SRC, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=";")
    src_cols = list(reader.fieldnames)
    existing = [dict(r) for r in reader]

sector_of, beh_temps, beh_visites = {}, defaultdict(list), defaultdict(list)
for r in existing:
    sector_of[r["Nom_Entreprise"]] = r["Secteur"]
    if r["Temps_Plateforme"].strip(): beh_temps[r["Nom_Entreprise"]].append(float(r["Temps_Plateforme"]))
    if r["Visites_Avant_Achat"].strip(): beh_visites[r["Nom_Entreprise"]].append(float(r["Visites_Avant_Achat"]))

P_CO = {}
def make_p_co(co, mt=23.0, mv=6.0):
    t_norm = max(-1.5, min(1.5, (mt - 23.0) / 12.0)); v_norm = max(-1.5, min(1.5, (6.0 - mv) / 3.0))
    bscore = 0.5 * t_norm + 0.5 * v_norm
    return max(0.72, min(1.32, 1.0 + 0.13 * bscore + random.Random(co_seed(co)).gauss(0.0, 0.10)))
for co in sector_of:
    mt = sum(beh_temps[co]) / len(beh_temps[co]) if beh_temps[co] else 23.0
    mv = sum(beh_visites[co]) / len(beh_visites[co]) if beh_visites[co] else 6.0
    P_CO[co] = make_p_co(co, mt, mv)

_size_counter = defaultdict(int)
for r in existing: _size_counter[r["ID_Campagne"]] += 1
EXISTING_SIZES = list(_size_counter.values())
max_numero = defaultdict(int)
for r in existing:
    try: max_numero[r["Nom_Entreprise"]] = max(max_numero[r["Nom_Entreprise"]], int(r["Numero_Campagne"]))
    except ValueError: pass

enriched = []

# --------------------------------------------------------------------------- #
# 2) Enrichir l'existant (Karata) : audience répartie, trous comblés, saison
# --------------------------------------------------------------------------- #
by_camp = OrderedDict()
for r in existing: by_camp.setdefault(r["ID_Campagne"], []).append(r)

for camp_id, rows in by_camp.items():
    media = "Karata"
    camp_cible = wchoice(CIBLE_DIST[media])
    dates = sorted(x["Date"] for x in rows if x["Date"].strip())
    d_deb, d_fin = (dates[0], dates[-1]) if dates else ("", "")
    camp_realisee = float(rows[0]["Audience_Realisee_K_Vues"])
    weights, plats = [], []
    for x in rows:
        meta = PROGRAMMES.get(x["Programme"], {"platforms": {"YouTube": 1.0}, "pop": 1.0})
        plat = wchoice(meta["platforms"]); plats.append(plat)
        weights.append(meta["pop"] * PLATFORM_REACH[plat] * f_quality_aud(float(x["Quality_Score"])) * TYPEPUB_VIS[x["Type_Pub"]] * lognoise(0.25))
    wsum = sum(weights) or 1.0
    leads_sum = 0.0
    for x, plat, w in zip(rows, plats, weights):
        out = dict(x)  # conserve toutes les colonnes d'origine (prix, QS, audience, etc.)
        p_co = P_CO[x["Nom_Entreprise"]]
        mois = int(x["Date"][5:7]) if x["Date"].strip() else 0
        _, fen = saison_prix(media, mois, x["Secteur"]) if mois else (1.0, "Standard")
        out["Media"] = media; out["Plateforme_Diffusion"] = plat; out["Cible"] = camp_cible
        out["Date_Debut"], out["Date_Fin"] = d_deb, d_fin
        out["Mois"] = mois or ""; out["Fenetre_Commerciale"] = fen
        aud_k = camp_realisee * w / wsum  # somme exacte = audience campagne (prix NON modifié : carnaval déjà dans le V3)
        out.update(placement_outputs(media, plat, camp_cible, x["Type_Pub"], x["Secteur"], p_co, aud_k))
        if not out["Temps_Plateforme"].strip():  # comble les trous -> Karata 100%
            fill_behavior(out, p_co, camp_cible)
        leads_sum += out["Leads_Realises"]
        enriched.append(out)
    conv_real = round(leads_sum, 3); obj_conv = round(leads_sum / rng.uniform(0.85, 1.20), 1)
    atteint = "Oui" if conv_real >= obj_conv else "Non"
    for out in enriched[-len(rows):]:
        out["Objectif_Conversion"] = obj_conv; out["Conversion_Realisee"] = conv_real
        out["Objectif_Conversion_Atteint"] = atteint

# --------------------------------------------------------------------------- #
# 3) Générateur de campagne synthétique (nouveaux clients Karata + Lumen + Pulse)
# --------------------------------------------------------------------------- #
def start_date():
    return datetime.date(2020, 1, 1) + datetime.timedelta(days=rng.randint(0, 365 * 5 + 270))

def generate_campaign(media, co, secteur, p_co, numero, id_prefix, fill_rate):
    progs = PROGS_BY_MEDIA[media]
    n_plac = rng.choice(EXISTING_SIZES)
    sd = start_date(); dur = rng.choice([14, 21, 30, 45, 60, 90]); ed = sd + datetime.timedelta(days=dur)
    camp_cible = wchoice(CIBLE_DIST[media]); camp_id = f"{co}_{id_prefix}{numero:02d}"
    plac_rows, aud_sum, leads_sum = [], 0.0, 0.0
    for _ in range(n_plac):
        prog = rng.choice(progs); meta = PROGRAMMES[prog]
        plat = wchoice(meta["platforms"]); tpub = rng.choice(TYPES_PUB); tent = wchoice(TYPE_ENTREPRISE_DIST)
        mu, sg = MEDIA_QS[media]; qs = round(max(5.0, min(10.0, rng.gauss(mu, sg))), 1)
        aud_k = max(3.0, MEDIA_AUD_BASE[media] * meta["pop"] * PLATFORM_REACH[plat] * f_quality_aud(qs) * TYPEPUB_VIS[tpub] * lognoise(0.30))
        pdate = sd + datetime.timedelta(days=rng.randint(0, dur)); mois = pdate.month
        smult, fen = saison_prix(media, mois, secteur)
        row = {"Date": pdate.isoformat(), "Nom_Entreprise": co, "Secteur": secteur, "Type_Entreprise": tent,
               "Type_Pub": tpub, "Programme": prog, "Quality_Score": qs,
               "Prix_Euros": round(compute_price(aud_k, qs, plat, tpub, media, smult), 2),
               "Temps_Plateforme": "", "Nb_Visites": "", "Device": "", "Heure_Achat": "", "Visites_Avant_Achat": "",
               "ID_Campagne": camp_id, "Numero_Campagne": numero, "Media": media, "Plateforme_Diffusion": plat,
               "Cible": camp_cible, "Date_Debut": sd.isoformat(), "Date_Fin": ed.isoformat(),
               "Mois": mois, "Fenetre_Commerciale": fen}
        row.update(placement_outputs(media, plat, camp_cible, tpub, secteur, p_co, aud_k))
        row["Nb_Visites"] = max(1, min(51, round(math.exp(rng.gauss(math.log(5.0), 0.6)) + 1.2 * (p_co - 1.0))))
        if rng.random() < fill_rate: fill_behavior(row, p_co, camp_cible)
        aud_sum += aud_k; leads_sum += row["Leads_Realises"]; plac_rows.append(row)
    aud_real = round(aud_sum, 1); obj_aud = min(OBJ_AUDIENCE_MENU, key=lambda m: abs(m - aud_sum / rng.uniform(0.80, 1.25)))
    conv_real = round(leads_sum, 3); obj_conv = round(leads_sum / rng.uniform(0.85, 1.20), 1)
    trcp = max(0, min(100, round(50 + 120 * (p_co - 1.0) + rng.gauss(0, 18))))
    for row in plac_rows:
        row["Objectif_Audience_K_Vues"] = obj_aud; row["Audience_Realisee_K_Vues"] = aud_real
        row["Objectif_Atteint"] = "Oui" if aud_real >= obj_aud else "Non"
        row["Taux_Reussite_Campagne_Precedente"] = trcp
        row["Objectif_Conversion"] = obj_conv; row["Conversion_Realisee"] = conv_real
        row["Objectif_Conversion_Atteint"] = "Oui" if conv_real >= obj_conv else "Non"
    return plac_rows

# --- 3a) Nouveaux clients Karata (plus grande pluralité) ------------------- #
KARATA_PREFIX = ["Gwada", "Soley", "Kreyòl", "Zouk", "Kannaval", "Bèlè", "Gwoka", "Madinina", "Lambi", "Doudou",
                 "Péyi", "Maracudja", "Kasika", "Karukera", "Antiy", "Filao", "Flanboyan", "Kolibri", "Mòn", "Lasotjè"]
KARATA_SUFFIX = ["Tech", "Shop", "Pro", "Lab", "Store", "Médja", "Konsèy", "Group", "Distrib", "Butik", "Market", "Studio", "Food", "Tour", "Events"]
existing_names = set(sector_of.keys())
combos = [p + s for p in KARATA_PREFIX for s in KARATA_SUFFIX if (p + s) not in existing_names]
rng.shuffle(combos)
NEW_KARATA = combos[:45]
for co in NEW_KARATA:
    secteur = rng.choice(SECTEURS); p_co = make_p_co(co); sector_of[co] = secteur; P_CO[co] = p_co
    for n in range(1, rng.randint(4, 9) + 1):
        enriched += generate_campaign("Karata", co, secteur, p_co, n, "C", fill_rate=1.0)

# --- 3b) Lumen + Pulse (clients = 60 entreprises d'origine) ---------------- #
companies = list(existing_names)
for media, prefix in (("Lumen", "L"), ("Pulse", "P")):
    for _ in range(250):
        co = rng.choice(companies); max_numero[co] += 1
        enriched += generate_campaign(media, co, sector_of[co], P_CO[co], max_numero[co], prefix, fill_rate=0.446)

# --------------------------------------------------------------------------- #
# 4) Écriture
# --------------------------------------------------------------------------- #
NEW_COLS = ["Media", "Plateforme_Diffusion", "Cible", "Date_Debut", "Date_Fin", "Mois", "Fenetre_Commerciale",
            "Frequence", "Audience_Placement_K_Vues", "Reach_K", "Couverture_Efficace_K",
            "Taux_Lead", "Taux_Vente", "Leads_Realises", "Ventes_Realises",
            "Objectif_Conversion", "Conversion_Realisee", "Objectif_Conversion_Atteint"]
OUT_COLS = src_cols + NEW_COLS
ROUND = {"Frequence": 2, "Audience_Placement_K_Vues": 1, "Reach_K": 1, "Couverture_Efficace_K": 1,
         "Taux_Lead": 4, "Taux_Vente": 4, "Leads_Realises": 3, "Ventes_Realises": 3,
         "Objectif_Conversion": 1, "Conversion_Realisee": 3}
def fmt(col, val):
    if val == "" or val is None: return ""
    if col in ROUND and isinstance(val, float): return f"{round(val, ROUND[col]):.{ROUND[col]}f}"
    return str(val)
with open(OUT, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";"); w.writerow(OUT_COLS)
    for row in enriched: w.writerow([fmt(c, row.get(c, "")) for c in OUT_COLS])

# QA inline
cnt = lambda m: sum(1 for r in enriched if r["Media"] == m)
ncos = lambda m: len(set(r["Nom_Entreprise"] for r in enriched if r["Media"] == m))
fill_k = sum(1 for r in enriched if r["Media"] == "Karata" and r["Temps_Plateforme"].strip()) / max(1, cnt("Karata"))
print(f"OK -> {OUT}")
print(f"Lignes: {len(enriched)} | Karata={cnt('Karata')} ({ncos('Karata')} clients), Lumen={cnt('Lumen')}, Pulse={cnt('Pulse')}")
print(f"Colonnes: {len(OUT_COLS)} ({len(src_cols)} + {len(NEW_COLS)}) | Karata comportement rempli: {100*fill_k:.1f}%")
