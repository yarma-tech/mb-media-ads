-- Social Ads — ratio d'image par annonce (gabarits précis Meta/plateformes).
-- Additif à 20260901120000_social_ads.sql.

alter table sa_ads
  add column ratio text not null default '1:1'
  check (ratio in ('1:1', '4:5', '1.91:1', '9:16'));
