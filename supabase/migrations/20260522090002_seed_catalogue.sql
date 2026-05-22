-- Karata Ads — Seed du catalogue (voir HANDOFF.md §3/§4)
--
-- Médias / programmes / plateformes calqués EXACTEMENT sur data/enrich_dataset.py
-- (dict PROGRAMMES) : le catalogue servi par Supabase doit correspondre aux données
-- sur lesquelles les modèles sont entraînés.
--
-- cadence_diffusions_par_mois : ABSENT du dataset -> valeurs plausibles assignées ici
-- (Lumen formats longs = cadence basse ; Pulse formats courts/quotidien = cadence haute).
-- Elles ne servent qu'à borner la capacité (cadence x durée) dans l'optimiseur (étape 3) ;
-- à ajuster avec MB Média. Aucun impact sur les modèles.
--
-- Idempotent (on conflict do nothing) : rejouable sans casse.

insert into medias (id, nom, description) values
  ('karata', 'Karata', 'Média grand public ancré sur le Carnaval de Guadeloupe (haute saison T1). 7 programmes, audience large.'),
  ('lumen',  'Lumen',  'Média premium / professionnel. Formats longs (YouTube/Spotify), cible Professionnel, prix élevé.'),
  ('pulse',  'Pulse',  'Média jeune / social. Formats courts (TikTok/Instagram), cible Gamers/Kids, forte fréquence.')
on conflict (id) do nothing;

insert into programmes (id, media_id, nom, cadence_diffusions_par_mois) values
  ('inside-mas',       'karata', 'INSIDE MAS',        8),
  ('live',             'karata', 'LIVE',              4),
  ('karata-tour',      'karata', 'KARATA TOUR',       4),
  ('moun-a-mas',       'karata', 'MOUN A MAS',        6),
  ('fwet-a-mas',       'karata', 'FWET A MAS',        6),
  ('mizik-a',          'karata', 'MIZIK A',           8),
  ('video-partenaire', 'karata', 'VIDEO PARTENAIRE',  4),
  ('eco-matin',        'lumen',  'ECO MATIN',        12),
  ('grand-format',     'lumen',  'GRAND FORMAT',      2),
  ('tech-and-co',      'lumen',  'TECH & CO',         4),
  ('sante-plus',       'lumen',  'SANTÉ PLUS',        4),
  ('pulse-daily',      'pulse',  'PULSE DAILY',      30),
  ('game-on',          'pulse',  'GAME ON',          16),
  ('street-food',      'pulse',  'STREET FOOD',      12),
  ('vibe-check',       'pulse',  'VIBE CHECK',       16)
on conflict (id) do nothing;

insert into programme_plateformes (programme_id, plateforme) values
  ('inside-mas','YouTube'), ('inside-mas','Facebook'), ('inside-mas','Instagram'),
  ('live','YouTube'), ('live','Facebook'),
  ('karata-tour','YouTube'), ('karata-tour','Facebook'), ('karata-tour','Instagram'),
  ('moun-a-mas','Facebook'), ('moun-a-mas','Instagram'),
  ('fwet-a-mas','YouTube'), ('fwet-a-mas','TikTok'), ('fwet-a-mas','Instagram'),
  ('mizik-a','Spotify'), ('mizik-a','YouTube'),
  ('video-partenaire','YouTube'), ('video-partenaire','Facebook'),
  ('eco-matin','YouTube'), ('eco-matin','Spotify'), ('eco-matin','Facebook'),
  ('grand-format','YouTube'),
  ('tech-and-co','YouTube'), ('tech-and-co','Spotify'),
  ('sante-plus','Facebook'), ('sante-plus','YouTube'),
  ('pulse-daily','TikTok'), ('pulse-daily','Instagram'),
  ('game-on','TikTok'), ('game-on','YouTube'),
  ('street-food','Instagram'), ('street-food','TikTok'), ('street-food','Facebook'),
  ('vibe-check','TikTok'), ('vibe-check','Instagram')
on conflict (programme_id, plateforme) do nothing;
