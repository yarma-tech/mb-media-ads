# Module Social Ads — aperçu & validation de campagnes

Outil façon [Adpiler](https://adpiler.com/) greffé sur MB Média Ads : un partenaire
connecté compose un **plan** d'annonces social, génère un **lien public**, et le
destinataire (sans compte) **valide** et **commente** chaque annonce. Une partie
LLM rédige les contenus marketing.

## Périmètre de ce prototype (V1)

- Plateformes : **Facebook, Instagram, LinkedIn, TikTok** (mockups fidèles fil / story / reel / carrousel).
- Médias : **images, GIF, vidéos** (upload dans Supabase Storage, bucket public `social-ads`).
- Éditeur : texte principal, titre, CTA, description, domaine, logo de marque, live preview.
- **Rédaction assistée par IA** (Claude) : variations de copy par plateforme, expertise social ads.
- **Lien de partage public** `/preview/{token}` : validation (Approuver / Demander une révision) + commentaires, **sans compte**.
- Suivi côté owner : statut du plan (Brouillon → En revue → Approuvé), feedback par annonce.

**Hors V1 (prévu) :** mockup sur sites de presse/display (V2), notifications e-mail, multi-relecteurs avancé, versions.

## Architecture

- **Auth** : réutilise l'auth Supabase existante (pas de Clerk — cohérence avec l'app).
- **DB** : mêmes projet Supabase, tables préfixées `sa_` (voir migration `20260901120000_social_ads.sql`).
- **RLS** : owner-only. La page publique n'a **aucun** accès direct à la base : tout passe par
  du code serveur (clé `service_role`) qui valide le **token** du lien.
- **LLM** : route `POST /api/social/copy` (réservée aux connectés), SDK `@anthropic-ai/sdk`, modèle `claude-opus-5` par défaut.

### Fichiers clés

| Zone | Fichiers |
|---|---|
| Migration | `supabase/migrations/20260901120000_social_ads.sql` |
| Types / référentiels | `lib/social-ads/types.ts` |
| Accès données (owner + review) | `lib/social-ads/db.ts` |
| Génération LLM | `lib/social-ads/copy.ts`, `app/api/social/copy/route.ts` |
| Espace owner | `app/social/` (liste, éditeur, actions, composants) |
| Mockups plateformes | `app/social/_components/SocialPreview.tsx` |
| Page publique | `app/preview/[token]/` |

## Activation

1. **Appliquer la migration** sur le projet Supabase (dashboard SQL editor, `supabase db push`,
   ou l'outil MCP Supabase). Elle crée les tables `sa_*`, la RLS, et le bucket public `social-ads`.
2. **Variables d'environnement** (voir `.env.local.example`) :
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (déjà en place)
   - `SUPABASE_SERVICE_ROLE_KEY` — **requis** pour la page publique `/preview`
   - `ANTHROPIC_API_KEY` — pour l'assistant de rédaction (sinon le bouton renvoie un message)
   - `ANTHROPIC_MODEL` — optionnel (défaut `claude-opus-5`)
3. `npm install && npm run dev`, puis **Social Ads** dans la barre de navigation.

## Parcours de test

1. Se connecter → **Social Ads** → créer un plan.
2. Ajouter des annonces, choisir plateforme/format, uploader un visuel, rédiger (ou **✨ Rédiger avec l'IA**).
3. **Générer le lien de validation** → copier l'URL `/preview/{token}`.
4. Ouvrir ce lien en navigation privée (sans compte) → saisir un nom → **Approuver** / commenter.
5. Retour éditeur : le feedback et le statut du plan se mettent à jour.
