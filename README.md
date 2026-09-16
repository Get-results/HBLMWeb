# HBLM Web

Site vitrine officiel du Handball Lunel-Marsillargues (HBLM), construit avec [Astro 7.x](https://astro.build).

Le projet repose sur une architecture **Static Islands** (zéro JavaScript côté client par défaut, Jamstack sans base de données). L'ensemble des données est résolu à la génération statique (build) et déployé sur GitHub Pages.

> **Architecture de référence :** Pour une vue approfondie des décisions d'architecture (AD-1 à AD-12) et des invariants techniques du projet, consultez le document [`_bmad-output/planning-artifacts/architecture/architecture-HBLMWeb-2026-09-10/ARCHITECTURE-SPINE.md`](./_bmad-output/planning-artifacts/architecture/architecture-HBLMWeb-2026-09-10/ARCHITECTURE-SPINE.md).

> **À faire hors code :** contenus attendus du bureau du club, comptes à créer, réglages dans des interfaces tierces et décisions en attente sont centralisés dans [`A-FAIRE-HORS-CODE.md`](./A-FAIRE-HORS-CODE.md). Tout ce qui ne peut pas être réglé depuis le dépôt va là, et nulle part ailleurs.

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
├── .claude/
│   ├── settings.json             # Configuration Claude Code du dépôt (hooks)
│   └── hooks/
│       └── situer-sur-main.sh    # Hook SessionStart : git fetch + écart de la branche courante avec origin/main
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
│       ├── tokens.css            # Design tokens (palette "Pont de Gris" : sombre par défaut, clair sur bascule, espacements)
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
- **Format** : Fichiers Markdown (`.md`) avec en-tête frontmatter conforme au schéma de la collection.
- **Champs** : `title`, `date` (ISO 8601 `AAAA-MM-JJ`), `category` (`vie-du-club` | `actualite` | `evenement`), `description` (l'accroche affichée sur la carte), `coverPhoto` facultative (`{ src, alt }`, le fichier image étant déposé à côté de l'article), et `publicationStatus`.
- **⚠️ `publicationStatus` — garde-fou éditorial** : `exemple` | `brouillon` | `publie`. **Seuls les articles `publie` paraissent en ligne**, et la valeur par défaut est `brouillon` : un fichier poussé sans ce champ n'est donc jamais publié par accident. `exemple` marque les fichiers de démonstration du schéma. Le filtre vit à un seul endroit, `src/lib/articles.ts` — les pages n'appellent jamais `getCollection('articles')` directement.
- **Modèle à copier** : `src/content/articles/exemple-modele-d-article.md` (marqué `publicationStatus: exemple`, il ne paraît jamais).
- **Ajouter un article** :
  1. Copier le modèle dans `src/content/articles/` sous un nom en slug kebab-case (ex. `src/content/articles/reprise-saison-2026.md`).
  2. Renseigner les métadonnées frontmatter.
  3. Rédiger le corps de l'article en Markdown standard.
  4. Passer `publicationStatus` à `publie` quand l'article est prêt.
  5. Commiter et pousser sur la branche `main` (ou ouvrir une Pull Request). Le site est automatiquement reconstruit et publié avec le nouvel article — aucune étape manuelle au-delà du push (AD-6).
- **Galeries photo** : non implémentées, ajournées avec la question du droit à l'image (voir `A-FAIRE-HORS-CODE.md`).

### 2. Catégories — Trouver ma catégorie (`src/content/categories/`)
- **Format** : Fichiers YAML ou Markdown structurés par catégorie sportive.
- **Rôle** : Alimente l'outil interactif "Trouver ma catégorie" (`CategoryFinder`, AD-7) pour orienter parents et licenciés vers les créneaux, tarifs, disponibilités d'essai et référents correspondants.
- **Champs canoniques** : `id` (identifiant stable partagé avec les équipes de match), `label`, `trainingSlots[]`, `licenseFee`, `trialAvailable` (`true | false | null`).

### 3. Matchs — Calendrier et résultats (`src/content/matches/`)
- **Format** : Fichiers de données JSON générés automatiquement.
- **⚠️ Règle stricte** : Ces données sont **générées exclusivement par le pipeline automatisé** (voir ci-dessous). **Ne jamais modifier manuellement ces fichiers**, car toute modification manuelle sera écrasée lors du rafraîchissement quotidien suivant.

---

## Pipeline de rafraîchissement des matchs (AD-4)

Les matchs viennent de l'API du club (`https://…/api/matches`, route **publique**, aucun
en-tête requis). Ils ne sont **pas versionnés** : `scripts/fetch-matches.mjs` écrit
`src/content/matches/matches.json` juste avant chaque build, et ce fichier est ignoré par git.

| Quand | Quoi |
|---|---|
| Push sur `main` | Build + déploiement, matchs récupérés au passage |
| Cron quotidien `0 3 * * *` (UTC) | Même workflow, donc mêmes données fraîches en ligne |
| `workflow_dispatch` | Pour forcer une actualisation sans attendre le cron |

**Récupérer les matchs en local :**

```bash
MATCHES_API_BASE_URL=https://votre-api npm run fetch:matches
```

Sans ce fichier, le site se construit quand même : la page Matchs affiche simplement un état
vide. C'est ce qui permet aux vérifications de PR de tourner sans dépendre de l'API.

**En cas d'API injoignable**, l'étape de récupération échoue et le déploiement n'a pas lieu :
le site déjà en ligne reste servi. C'est délibéré — mieux vaut une page inchangée qu'une page
« aucun match » qui se lirait comme une information.

### Où vivent les secrets (AD-9)

`MATCHES_API_BASE_URL` est un **secret de l'environnement GitHub « api »**. Le job de build
déclare `environment: api` pour y accéder : sans cette ligne, le secret est simplement absent.

Aucune clé n'est nécessaire pour lire les matchs. Le `X-API-KEY` de l'API est réservé au
scraper en écriture et ne doit jamais entrer dans ce dépôt.

### Rattacher une catégorie à ses poules

Chaque fiche de `src/content/categories/` porte un tableau `poolIds`. Les identifiants
disponibles se lisent sur `GET /api/competitions/public`. Un tableau vide signifie que la
catégorie ne joue pas en championnat — c'est un état normal.

Les noms d'équipe du club sont listés dans `src/lib/club.ts` : ce sont eux qui distinguent nos
matchs de ceux des adversaires, et déterminent domicile ou extérieur. La FFHandball utilise
plusieurs orthographes ; la liste est relevée sur les données réelles et exige une
correspondance exacte.

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

---

## Outillage Claude Code

Le dépôt embarque une configuration Claude Code minimale, versionnée pour valoir
pour toute personne qui travaille ici.

### Hook `SessionStart` — se situer par rapport à `origin/main`

À l'ouverture d'une session, l'agent reçoit un instantané de `git status` qui ne
dit rien de l'écart avec le dépôt distant : une branche locale en retard de
plusieurs dizaines de commits se lit alors comme l'état courant du projet. Un
audit fait dessus conclut sur du code qui n'existe plus, et une branche créée
dessus se fait fermer quand sa base disparaît à la fusion.

[`.claude/hooks/situer-sur-main.sh`](./.claude/hooks/situer-sur-main.sh) lance
donc un `git fetch origin` au démarrage, puis annonce en clair le retard et
l'avance de la branche courante sur `origin/main`.

- **Rien n'est modifié** : `fetch` met à jour les refs distantes, il ne fusionne
  ni ne réécrit la copie de travail.
- **Échec silencieux** : hors dépôt git, sans remote ou sans réseau, le hook sort
  sans erreur et la session démarre normalement.
- **Après modification** du hook ou de [`.claude/settings.json`](./.claude/settings.json),
  ouvrir `/hooks` une fois ou relancer la session pour que la configuration soit
  rechargée.
