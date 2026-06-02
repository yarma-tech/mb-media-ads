"""Fit log-linear OLS models (Prix, Taux_Conversion) on dataset_ml_final.xlsx.

Numeric columns (audience, durée, score de marque) are intentionally EXCLUDED:
they carry no signal (corr ~ 0). Categorical features use dummy coding (one
reference level dropped per category) so the export matches the TS scoring
convention: predicted log-value = intercept + sum of matched level coefficients,
the reference level contributing 0 (absent from the table).

Output: data/model_coefficients.json (consumed when baking lib/models.ts).
"""

import json
import math
import statistics
from collections import defaultdict

import numpy as np
import openpyxl

SRC = "data/dataset_ml_final.xlsx"

# dataset column -> ScoringInput feature key used in lib/
FEATURES = {
    "Media_Numerique": "Plateforme",
    "Type_Pub_Normalise": "Type_Pub",
    "Cible": "Cible",
    "Periode": "Periode",
    "Secteur_Entreprise": "Secteur",
    "Type_Entreprise_Prive_Public": "Type_Entreprise",
}


# The source file mojibakes "Santé" -> "Sant√©" (Mac Roman double-encoding); other
# accents are clean. Normalize so model keys match the lib/enums.ts values.
NORMALIZE = {"Sant√©": "Santé"}


def load():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb["Sheet1"]
    rows = list(ws.iter_rows(values_only=True))
    head = list(rows[0])
    idx = {c: i for i, c in enumerate(head)}

    def fix(v):
        return NORMALIZE.get(v, v) if isinstance(v, str) else v

    return [dict((c, fix(r[idx[c]])) for c in head) for r in rows[1:]], idx


def fit(data, target_col):
    """OLS on log(target) with dummy-coded categoricals. Returns coeff payload."""
    # Reference level per feature = most frequent (stable, well-estimated intercept).
    levels = {}
    for src in FEATURES:
        counts = defaultdict(int)
        for r in data:
            counts[r[src]] += 1
        ordered = sorted(counts, key=lambda k: (-counts[k], k))
        levels[src] = {"ref": ordered[0], "rest": ordered[1:]}

    # Build design matrix: [intercept, dummies...]
    columns = []  # (src, level)
    for src in FEATURES:
        for lvl in levels[src]["rest"]:
            columns.append((src, lvl))

    X = np.zeros((len(data), 1 + len(columns)))
    X[:, 0] = 1.0
    y = np.array([math.log(r[target_col]) for r in data])
    col_index = {sl: j + 1 for j, sl in enumerate(columns)}
    for i, r in enumerate(data):
        for src in FEATURES:
            sl = (src, r[src])
            if sl in col_index:
                X[i, col_index[sl]] = 1.0

    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    sigma = float(np.std(resid, ddof=X.shape[1]))

    categorical = {}
    for src in FEATURES:
        feat = FEATURES[src]
        table = {}
        for lvl in levels[src]["rest"]:
            table[lvl] = round(float(beta[col_index[(src, lvl)]]), 4)
        # reference level explicitly 0 for readability/debug
        table[levels[src]["ref"]] = 0.0
        categorical[feat] = table

    vals = [r[target_col] for r in data]
    return {
        "kind": "regression",
        "link": "log",
        "intercept": round(float(beta[0]), 4),
        "sigma": round(sigma, 4),
        "clamp": [round(min(vals) * 0.9, 4), round(max(vals) * 1.1, 4)],
        "features": {"categorical": categorical},
    }


def audience_par_plateforme(data):
    g = defaultdict(list)
    for r in data:
        g[r["Media_Numerique"]].append(r["Objectif_Audience_K_Vues"])
    return {k: round(statistics.mean(v)) for k, v in sorted(g.items())}


def main():
    data, _ = load()
    out = {
        "prix": fit(data, "Prix_Euros"),
        "taux_conversion": fit(data, "Taux_Conversion"),
        "audienceParPlateforme": audience_par_plateforme(data),
        "audienceGlobale": round(statistics.mean(r["Objectif_Audience_K_Vues"] for r in data)),
        "n": len(data),
    }
    with open("data/model_coefficients.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
