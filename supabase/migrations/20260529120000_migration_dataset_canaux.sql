-- Karata Ads — Migration vers le nouveau dataset (data/dataset_ml_final.xlsx).
--
-- Le produit passe d'un modèle "média/programme" (Karata/Lumen/Pulse + INSIDE MAS…)
-- à des canaux numériques génériques (Meta/TikTok/Google Ads/YouTube Ads), avec un
-- taux de conversion direct et des objectifs réduits à Notoriété / Conversion.
--
-- ⚠️ À VALIDER AVANT APPLICATION : touche la base déployée (constraints + données).
-- Ordre : (1) remap des valeurs existantes, (2) bascule des contraintes, (3) catalogue,
-- (4) nettoyage des coefficients. Idempotence partielle (drop ... if exists).

begin;

-- ---------------------------------------------------------------------------
-- 1) Remap des valeurs existantes pour satisfaire les nouvelles contraintes.
-- ---------------------------------------------------------------------------
update demandes set secteur = 'Alimentation' where secteur = 'Food';
update demandes set type_entreprise = 'Privé' where type_entreprise in ('Association', 'Particulier');
update demandes set objectif_principal = 'conversion' where objectif_principal in ('lead', 'vente');

update profiles set secteur = 'Alimentation' where secteur = 'Food';
update profiles set type_entreprise = 'Privé' where type_entreprise in ('Association', 'Particulier');

-- ---------------------------------------------------------------------------
-- 2) Nouvelles contraintes (secteur, type d'entreprise, objectif).
-- ---------------------------------------------------------------------------
alter table demandes drop constraint if exists demandes_secteur_check;
alter table demandes add constraint demandes_secteur_check
  check (secteur in ('Automobile', 'Alimentation', 'Tourisme', 'Luxe', 'Tech', 'Santé'));

alter table demandes drop constraint if exists demandes_type_entreprise_check;
alter table demandes add constraint demandes_type_entreprise_check
  check (type_entreprise in ('Privé', 'Public'));

alter table demandes drop constraint if exists demandes_objectif_principal_check;
alter table demandes add constraint demandes_objectif_principal_check
  check (objectif_principal in ('notoriete', 'conversion'));

alter table profiles drop constraint if exists profiles_secteur_check;
alter table profiles add constraint profiles_secteur_check
  check (secteur in ('Automobile', 'Alimentation', 'Tourisme', 'Luxe', 'Tech', 'Santé'));

alter table profiles drop constraint if exists profiles_type_entreprise_check;
alter table profiles add constraint profiles_type_entreprise_check
  check (type_entreprise in ('Privé', 'Public'));

-- ---------------------------------------------------------------------------
-- 3) Catalogue : remplacer médias/programmes/plateformes par les canaux numériques.
-- ---------------------------------------------------------------------------
drop table if exists programme_plateformes cascade;
drop table if exists programmes cascade;
drop table if exists medias cascade;

create table if not exists plateformes (
  id                text primary key,   -- valeur exacte du dataset : 'Meta' | 'TikTok' | 'Google Ads' | 'YouTube Ads'
  nom               text not null,
  description       text,
  audience_typique_k integer not null check (audience_typique_k > 0)
);

alter table plateformes enable row level security;
create policy "lecture publique" on plateformes
  for select to anon, authenticated using (true);

insert into plateformes (id, nom, description, audience_typique_k) values
  ('Meta',        'Meta',        'Facebook & Instagram. Large portée, ciblage social fin.', 330),
  ('TikTok',      'TikTok',      'Vidéo courte, audience jeune, fort engagement.', 328),
  ('Google Ads',  'Google Ads',  'Search & Display à forte intention — meilleur taux de conversion.', 309),
  ('YouTube Ads', 'YouTube Ads', 'Vidéo longue et préroll, couverture de masse.', 308)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4) Coefficients : on ne garde que les modèles du nouveau dataset.
--    (Les payloads sont rechargés depuis lib/models.ts au runtime — table optionnelle.)
-- ---------------------------------------------------------------------------
delete from model_coefficients
  where model_name not in ('prix', 'taux_conversion');

commit;
