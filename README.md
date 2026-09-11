# HBLM Web

Site vitrine officiel du Handball Lunel-Marsillargues (HBLM), construit avec [Astro 7.x](https://astro.build).

Le projet repose sur une architecture **Static Islands** (zéro JavaScript côté client par défaut, Jamstack sans base de données). L'ensemble des données est résolu à la génération statique (build) et déployé sur GitHub Pages.

> **Architecture de référence :** Pour une vue approfondie des décisions d'architecture (AD-1 à AD-12) et des invariants techniques du projet, consultez le document [`_bmad-output/planning-artifacts/architecture/architecture-HBLMWeb-2026-09-10/ARCHITECTURE-SPINE.md`](./_bmad-output/planning-artifacts/architecture/architecture-HBLMWeb-2026-09-10/ARCHITECTURE-SPINE.md).

---

## Prérequis

- **Node.js** : version fixée dans [`.nvmrc`](./.nvmrc) (`24.21.0` / moteur `>= 24.21.0`).
- **NVM** (recommandé) : exécuter `nvm use` avant de lancer des commandes.
- **npm** : gestionnaire de paquets par défaut.

---

## Commandes

Toutes les commandes s'exécutent depuis la racine du projet :

| Commande | Action |
| --- | --- |
| `nvm use` | Active la version de Node.js requise définie dans [`.nvmrc`](./.nvmrc) |
| `npm install` | Installe les dépendances du projet (`npm ci` recommandé en environnement CI) |
| `npm run dev` | Démarre le serveur de développement local sur `http://localhost:4321/HBLMWeb/` |
| `npm run build` | Génère le site statique de production dans `./dist/` et exécute automatiquement le contrôle `check:paths` |
| `npm run check:paths` | Vérifie qu'aucun chemin racine-absolu en dur (`/foo`) ne casse le préfixe de base (`scripts/check-base-paths.mjs`) |
| `npm run preview` | Prévisualise localement le build statique de `./dist/` |
| `npm run astro` | Exécute directement les commandes de la CLI Astro (ex. `npm run astro check`) |

> **Important — Préfixe de base et chemins d'assets (AD-5) :**
> Le site est servi sous le préfixe `/HBLMWeb/` (`base: '/HBLMWeb'` dans `astro.config.mjs`).
> **Ne jamais écrire de chemin racine-absolu en dur** (ex. `/img.png` ou `/contact`) dans le code ou le HTML, car ils provoqueraient des erreurs 404 une fois déployés. Utilisez toujours `import.meta.env.BASE_URL` pour préfixer les liens internes et les assets. Le script `npm run check:paths` s'exécute automatiquement après chaque build pour bloquer toute régression.

---

## Structure du projet

Arborescence des répertoires et fichiers principaux :

```text
HBLMWeb/
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Déploiement automatique sur GitHub Pages à chaque push sur main (AD-5)
│       └── refresh-matches.yml   # Pipeline planifié de rafraîchissement des matchs (AD-4, Epic 3)
├── public/                       # Assets statiques bruts servis à la racine (favicon, robots.txt...)
├── scripts/
│   └── check-base-paths.mjs      # Script de vérification post-build des chemins préfixés
├── src/
│   ├── components/               # Composants Astro et îles interactives (CategoryFinder, GenericContact, MatchList...)
│   ├── content/                  # Collections de contenu typées (Content Collections, voir section ci-dessous)
│   │   ├── articles/             # Articles Markdown de la "Vie du club"
│   │   ├── categories/           # Données des catégories (créneaux, tarifs, essai)
│   │   └── matches/              # Données JSON des matchs générées par le pipeline
│   ├── layouts/
│   │   └── BaseLayout.astro      # Layout global : polices, tokens CSS, accessibilité, métadonnées, mesure d'audience
│   ├── pages/                    # Routage par fichiers du site Astro (index.astro, le-club.astro, matchs.astro...)
│   └── styles/
│       ├── tokens.css            # Design tokens (palette "Pont de Gris", thèmes clair et sombre, espacements)
│       └── global.css            # Reset CSS minimal, typographie et styles globaux
├── _bmad-output/                 # Spécifications et artefacts d'architecture (ARCHITECTURE-SPINE.md)
├── .nvmrc                        # Version de Node.js du projet
├── astro.config.mjs              # Configuration Astro (site: 'https://get-results.github.io', base: '/HBLMWeb')
├── package.json                  # Dépendances et scripts npm
└── tsconfig.json                 # Configuration TypeScript pour Astro
```

---

## Structure du contenu

Le dépôt Git constitue la source de vérité unique du contenu (AD-6). Il n'y a aucune base de données ni serveur d'application (AD-1). Le contenu est géré via des **Content Collections** Astro à schéma Zod strict (AD-3).

### 1. Articles — Vie du club (`src/content/articles/`)
- **Format** : Fichiers Markdown (`.md`) avec en-tête frontmatter conforme au schéma de la collection (titre, date ISO 8601 `YYYY-MM-DD`, description, image de couverture optionnelle).
- **Ajouter un article** :
  1. Créer un nouveau fichier dans `src/content/articles/` avec un nom en slug kebab-case (ex. `src/content/articles/reprise-saison-2026.md`).
  2. Renseigner les métadonnées frontmatter obligatoires.
  3. Rédiger le corps de l'article en Markdown standard.
  4. Commiter et pousser sur la branche `main` (ou ouvrir une Pull Request). Le site est automatiquement reconstruit et publié avec le nouvel article.

### 2. Catégories — Trouver ma catégorie (`src/content/categories/`)
- **Format** : Fichiers YAML ou Markdown structurés par catégorie sportive.
- **Rôle** : Alimente l'outil interactif "Trouver ma catégorie" (`CategoryFinder`, AD-7) pour orienter parents et licenciés vers les créneaux, tarifs, disponibilités d'essai et référents correspondants.
- **Champs canoniques** : `id` (identifiant stable partagé avec les équipes de match), `label`, `trainingSlots[]`, `licenseFee`, `trialAvailable` (`true | false | null`).

### 3. Matchs — Calendrier et résultats (`src/content/matches/`)
- **Format** : Fichiers de données JSON générés automatiquement.
- **⚠️ Règle stricte** : Ces données sont **générées exclusivement par le pipeline automatisé** (voir ci-dessous). **Ne jamais modifier manuellement ces fichiers**, car toute modification manuelle sera écrasée lors du rafraîchissement quotidien suivant.

---

## Pipeline de rafraîchissement des matchs (AD-4)

La page des matchs affiche les rencontres passées et à venir sans aucun appel API depuis le navigateur des visiteurs :

1. **Déclenchement** : Un workflow GitHub Actions dédié (`.github/workflows/refresh-matches.yml`) s'exécute automatiquement selon un cron quotidien (~minuit heure de Paris : `timezone: Europe/Paris`) ou manuellement via `workflow_dispatch`.
2. **Appel API sécurisé** : Le runner GitHub Actions appelle l'API distante du porteur du projet (données FFHandball) en utilisant un secret de dépôt GitHub.
3. **Régénération intégrale** : Le pipeline remplace intégralement les fichiers de données de `src/content/matches/` (écrasement complet, source de vérité unique).
4. **Déploiement** : Le workflow déclenche la reconstruction du site statique et sa publication sur GitHub Pages.

---

## Secrets et configuration (AD-9)

Conformément à la règle d'architecture **AD-9**, aucun secret ne doit être commité dans le dépôt ni exposé au navigateur :

- **Emplacement des secrets** : Tous les secrets résident exclusivement dans les **GitHub Actions repository secrets** du dépôt (`Settings > Secrets and variables > Actions` sur GitHub).
- **Secrets utilisés / prévus** :
  - Clés d'accès aux APIs externes (notamment pour le pipeline de rafraîchissement des matchs de l'Epic 3).
- **Zéro fuite côté client** : Aucun secret n'est exposé au navigateur ou injecté dans le bundle JavaScript client. Seules les variables publiques préfixées par `PUBLIC_` ou les variables standard comme `BASE_URL` peuvent être injectées dans le build client si nécessaire.
- **Configuration non secrète** : Toutes les options publiques (cadence du cron, URL du site, chemins de base) sont versionnées dans les fichiers de configuration (`astro.config.mjs`, fichiers YAML de workflow).

---

## Déploiement

Le site est déployé automatiquement sur **GitHub Pages** :

- **Workflow** : [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).
- **Déclencheur** : Tout push ou merge sur la branche `main`.
- **Processus** :
  1. Checkout du dépôt.
  2. Configuration de Node.js d'après [`.nvmrc`](./.nvmrc).
  3. Installation propre des dépendances avec `npm ci`.
  4. Exécution de `npm run build` (build Astro + contrôle `check-base-paths`).
  5. Téléversement et déploiement de l'artefact `./dist/` sur l'environnement GitHub Pages via `actions/deploy-pages`.
- **URL de publication** : `https://get-results.github.io/HBLMWeb/`
- **Domaine personnalisé** : Configuré directement via les paramètres GitHub Pages du dépôt et les enregistrements DNS associés (sans fichier `CNAME` dans le dépôt).
