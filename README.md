# FleetCare

Portail de suivi de flotte pour les entreprises (phase 1). Interface en français, montants en francs CFA entiers (XOF, sans décimales). Les kilomètres et les heures se saisissent à la main : pas de télématique, pas d’application native, pas de paiement automatique.

## Phase 1

- Inscription entreprise (statut en attente) et connexion Auth.js / NextAuth v5 par identifiants, sur la table `User`.
- Rôles `gestionnaire` (une entreprise) et `admin_plateforme`.
- Écran bloquant sans menu gestionnaire tant que l’entreprise est en attente ou suspendue.
- Validation et suspension des entreprises par l’admin plateforme.
- Liste et fiche véhicules, relevés kilomètres / heures.
- Seuils d’alerte : un relevé qui franchit le seuil crée une notification dans l’application et un e-mail transactionnel simulé (`EmailLog`).
- Dashboard des alertes de l’entreprise connectée.
- Pages préparé pour la phase 2 (carnet, stocks, échéances, abonnement) dans le même menu, avec un état vide explicite.
- Schéma Prisma complet (entreprises, utilisateurs, véhicules, relevés, carnet, pièces, échéances, règles, alertes, abonnements).

Le paiement [pay.kadev.ci](https://pay.kadev.ci) est une constante nommée (`PAY_KADEV_URL` dans `src/lib/integrations.ts`). Aucune capture n’est implémentée.

## Prérequis

- Node.js 20 ou plus
- Une base Postgres. En local : Postgres installé, ou une base [Neon](https://neon.tech). En production : Neon, relié au projet Vercel.

## Variables d’environnement

Copier `.env.example` vers `.env`.

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL Postgres (Neon ou locale), utilisée par Prisma au runtime et pour les migrations. |
| `AUTH_SECRET` | Secret Auth.js. `openssl rand -base64 32`. Obligatoire pour se connecter. |
| `AUTH_URL` | URL publique de l’app, par exemple `http://localhost:3000`. |
| `BLOB_READ_WRITE_TOKEN` | Jeton Vercel Blob. Le helper `uploadBlob` (`src/lib/blob.ts`) l’utilise. Aucun écran d’upload en phase 1. |
| `EMAIL_FROM` | Expéditeur journalisé par le stub e-mail. |
| `EMAIL_STUB` | Documente le mode simulé. La phase 1 journalise toujours l’e-mail (`EmailLog` + log serveur) et n’appelle aucun fournisseur. |

`https://pay.kadev.ci` n’est pas une variable d’environnement : c’est la constante `PAY_KADEV_URL`.

Le build n’ouvre pas de connexion. Si `DATABASE_URL` est absente, `scripts/prisma-generate.mjs` injecte uniquement pour `prisma generate` l’URL factice :

`postgresql://user:password@localhost:5432/fleetcare?schema=public`

Cette URL ne suffit pas à lancer l’application.

## Lancer en local

```bash
npm install
cp .env.example .env
# Renseigner DATABASE_URL et AUTH_SECRET dans .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Commandes utiles :

- `npm test` — logique d’alerte et isolement des entreprises, sans base.
- `npm run lint`
- `npm run build` — peut réussir sans secret ni base réelle.
- `npm run db:setup` — migration + seed.

## Comptes de démonstration

`npm run db:seed` crée les comptes locaux (admin plateforme, entreprise validée, entreprise en attente). Les identifiants sont uniquement dans `prisma/seed.ts`. Ils servent à une base de développement, pas à la production. Relancer le seed réapplique le statut des entreprises de démo ; le mot de passe n’est posé qu’à la création du compte. La configuration d’environnement reste celle de `.env.example`.

Pour déclencher une alerte sur l’entreprise validée : ouvrir le Hilux `AA-452-CI` (compteur 45 200 km, seuil « Vidange Hilux » à 48 000 km) et enregistrer un relevé kilomètres ≥ 48 000. Le fourgon `BB-118-CI` a un seuil à 2 500 heures (compteur actuel 2 100). L’alerte apparaît sur le dashboard et une ligne est écrite dans `EmailLog`.

## Neon et Vercel Blob

1. Créer un projet Neon et copier l’URL Postgres dans `DATABASE_URL` (l’URL pooler convient au runtime serverless).
2. Sur Vercel, créer un magasin Blob et copier le jeton dans `BLOB_READ_WRITE_TOKEN`.
3. Les uploads ne sont pas exposés dans l’interface de cette version.

## Déploiement Vercel

1. Importer le dépôt. Framework Next.js. Commande de build : `npm run build`.
2. Renseigner `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (domaine de production), `BLOB_READ_WRITE_TOKEN`, `EMAIL_FROM`, `EMAIL_STUB`.
3. Appliquer le schéma avant le premier usage : en local, avec l’URL Neon de production, `npx prisma migrate deploy`. Ne pas lancer le seed sur une base réelle de clients.
4. Le build ne migre pas la base et ne capture pas de paiement.

## Phase 2 (hors de cette version)

Carnet d’entretien, stocks et alertes de seuil bas, échéances (assurance, visite technique) et alertes associées, page abonnement avec passage vers pay.kadev.ci, édition admin plus complète des abonnements. Le schéma et les entrées de menu sont déjà là pour que ces ajouts restent additifs.
