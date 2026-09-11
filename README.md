# HBLM Web

Site du Handball Lunel-Marsillargues, construit avec [Astro](https://astro.build).

> Documentation complète à venir (Story 1.9). Ce README couvre le minimum pour builder et lancer le site en local.

## Prérequis

- Node.js — version fixée dans [`.nvmrc`](./.nvmrc) (`nvm use`)

## Commandes

Toutes les commandes s'exécutent depuis la racine du projet :

| Commande          | Action                                         |
| ------------------ | ----------------------------------------------- |
| `npm install`       | Installe les dépendances                        |
| `npm run dev`        | Démarre le serveur de dev local (`localhost:4321`) |
| `npm run build`       | Build le site de production dans `./dist/`        |
| `npm run preview`      | Prévisualise le build localement                  |

## Déploiement

Le site est déployé automatiquement sur GitHub Pages via `.github/workflows/deploy.yml` à chaque push sur `main`. Aucune étape manuelle n'est nécessaire.
