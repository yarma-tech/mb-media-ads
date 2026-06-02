import { CATALOGUE_SEED } from "./catalog-seed";
import type { Catalogue } from "./types";

// Catalogue des plateformes numériques. Servi en local pour l'instant : la table
// Supabase `plateformes` sera ajoutée par la migration (cf. tâche dédiée). L'app
// reste fonctionnelle sans base.
export async function loadCatalogue(): Promise<Catalogue> {
  return CATALOGUE_SEED;
}
