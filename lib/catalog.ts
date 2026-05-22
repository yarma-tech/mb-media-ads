import { CATALOGUE_SEED } from "./catalog-seed";
import type { MediaId, Plateforme } from "./enums";
import { getServerClient, supabaseConfigured } from "./supabase";
import type { Catalogue, Media, Programme } from "./types";

// Quality_Score typique par média (feature des modèles, non stockée en base).
const QS_TYPIQUE: Record<MediaId, number> = { karata: 7.5, lumen: 8.0, pulse: 6.8 };

// Charge le catalogue depuis Supabase si configuré ; sinon (ou en cas d'échec)
// retombe sur le catalogue local. L'app reste fonctionnelle sans base.
export async function loadCatalogue(): Promise<Catalogue> {
  if (!supabaseConfigured) return CATALOGUE_SEED;
  const sb = getServerClient();
  if (!sb) return CATALOGUE_SEED;

  try {
    const [mediasRes, progRes, ppRes] = await Promise.all([
      sb.from("medias").select("id,nom,description"),
      sb.from("programmes").select("id,media_id,nom,cadence_diffusions_par_mois"),
      sb.from("programme_plateformes").select("programme_id,plateforme"),
    ]);

    const med0 = mediasRes.data;
    const prog0 = progRes.data;
    const pp0 = ppRes.data;
    if (!med0?.length || !prog0?.length || !pp0?.length) return CATALOGUE_SEED;

    const platsByProg = new Map<string, Plateforme[]>();
    for (const row of pp0 as { programme_id: string; plateforme: Plateforme }[]) {
      const arr = platsByProg.get(row.programme_id) ?? [];
      arr.push(row.plateforme);
      platsByProg.set(row.programme_id, arr);
    }

    const medias: Media[] = (med0 as { id: MediaId; nom: string; description: string }[]).map((m) => ({
      id: m.id,
      nom: m.nom,
      description: m.description ?? "",
      qsTypique: QS_TYPIQUE[m.id] ?? 7.0,
    }));

    const programmes: Programme[] = (
      prog0 as { id: string; media_id: MediaId; nom: string; cadence_diffusions_par_mois: number }[]
    ).map((p) => ({
      id: p.id,
      mediaId: p.media_id,
      nom: p.nom,
      cadenceParMois: p.cadence_diffusions_par_mois,
      plateformes: platsByProg.get(p.id) ?? [],
    }));

    return { medias, programmes };
  } catch {
    return CATALOGUE_SEED;
  }
}
