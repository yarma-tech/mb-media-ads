-- Karata Ads — Paiement (Phase 4) : champs Stripe sur les demandes (commandes self-service).
-- La demande est créée à l'initiation du checkout (canal='self_service') ; le webhook
-- Stripe la passe à 'payee' et renseigne les champs de paiement.
alter table demandes
  add column stripe_session_id     text,
  add column stripe_payment_intent text,
  add column montant_paye          numeric,
  add column paye_at               timestamptz;
create index idx_demandes_stripe_session on demandes(stripe_session_id);
