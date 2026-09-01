-- Social Ads — plafond de taille du bucket média (vidéos lourdes).
-- 300 Mo par fichier. NB : la limite GLOBALE du projet (dashboard Storage →
-- Settings, souvent 50 Mo par défaut) prime si elle est inférieure — l'augmenter
-- côté projet pour bénéficier réellement de ces 300 Mo.
update storage.buckets
  set file_size_limit = 314572800  -- 300 * 1024 * 1024
  where id = 'social-ads';
