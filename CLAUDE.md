# HBLMWeb — règles du projet

Site du club de handball Lunel-Marsillargues-Lansargues. Astro statique, déployé sur
GitHub Pages. **Le dépôt et le site sont publics.**

Ces règles existent parce que chacune a déjà été enfreinte au moins une fois, sur un
site en ligne. Elles sont écrites ici et pas seulement dans `_bmad-output/` :
un document qu'on n'ouvre pas en codant ne protège de rien.

## 1. Ne jamais inventer un fait sur le club

C'est la règle qui prime sur toutes les autres. Un horaire fabriqué fait se déplacer un
parent pour rien ; un chiffre approximatif se publie comme une information officielle.

- Les créneaux, tarifs, effectifs, noms et dates viennent du **bureau du club**, jamais
  d'une déduction plausible.
- Chaque collection porte un garde-fou, et seules les fiches validées sortent du build :
  `dataStatus: confirme` (catégories, stages), `publicationStatus: publie` (articles).
  Les `superRefine` de `src/content.config.ts` **refusent au build** une fiche marquée
  confirmée mais incomplète.
- Une page passe toujours par le point d'entrée de `src/lib/` (`getCategoriesPubliees`,
  `getArticlesPublies`, `getStagesClasses`). **Jamais `getCollection()` en direct** :
  un filtre confié à chaque page finit par être oublié une fois.
- Donnée absente : on l'écrit. Un état vide honnête vaut mieux qu'un contenu inventé —
  voir `planning.astro` et l'état vide de `/vie-du-club`.
- Un chiffre non confirmé vit derrière un drapeau (`licencies.confirme` dans
  `src/lib/club.ts`) et ne s'affiche pas tant qu'il vaut `false`.

## 2. Git

- **Mettre en scène des chemins explicites.** `git add -A`, `git add .` et `git add --all`
  sont interdits, et refusés par un hook installé hors du dépôt
  (`~/.claude/hooks/refus-git-add-global.sh`) — un hook versionné ici ne s'appliquerait
  qu'aux branches qui le portent, et disparaîtrait au premier `git switch`. La règle vaut
  même sans le hook : un poste qui ne l'a pas doit s'y tenir. Motif : le 14/09/2026
  un `git add -A` a publié cinq fichiers de travail qui traînaient à la racine, dont un
  document interne nommant des personnes. Sur un dépôt public, l'objet reste servi par
  GitHub même après un force-push.
- **Jamais de commit direct sur `main`.** Une branche, une PR, et c'est Cédric qui fusionne.
- **Jamais de `--force` / `--force-with-lease` sans accord explicite.** Un force-push ne
  supprime rien : il rend l'ancien commit orphelin, et GitHub continue de le servir.
- **Aucune image à la racine** du dépôt — `.gitignore` les refuse. Les documents source du
  club vont dans `assets/`, les visuels de travail dans `asset_placeholder/` ; ni l'un ni
  l'autre n'est versionné.
- Commits et PR **en français**, préfixés `feat:` / `fix:` / `docs:` / `chore:`.

## 3. Build et vérifications

`npm run build` enchaîne `astro build` puis quatre contrôles sur `dist/` :
`check:tokens`, `check:paths`, `check:links`, `check:a11y`.

**Ne jamais rendre la main sur un build rouge, ni contourner une vérification.** Elles
existent chacune en réponse à un défaut réel qui était parti en production.

## 4. Design system

Les règles complètes sont dans `DESIGN.md` (`_bmad-output/planning-artifacts/ux-designs/`).
Les trois qui ont déjà été violées :

- **Tokens uniquement.** Aucune couleur, taille ou espacement en dur — `check:tokens` le
  vérifie, et `src/styles/tokens.css` est la seule source.
- **Un seul accent.** `--color-accent` est réservé aux badges, aux CTA et aux filets.
  Jamais en fond de page ni en grand aplat. Pas de seconde couleur d'accent, même pour un
  état « succès » ou « attention » : utiliser la graisse ou une icône.
- **Texte sur accent = `--color-on-accent`**, jamais `--color-text`. L'accent ne change pas
  entre les thèmes : un texte qui suit le thème tombe à 1,47:1 en sombre.

Mobile-first partout : styles petits écrans d'abord. Quand la mise en page dépend de la
largeur d'un composant et non de la fenêtre, utiliser une **requête de conteneur**.

## 5. Chemins

Le site est servi sous une base (`/HBLMWeb`). **Ne jamais écrire `import.meta.env.BASE_URL`
à la main dans une page** : reprendre la construction des pages existantes, ou passer par un
composant qui s'en charge. `check:paths` refuse les chemins absolus non préfixés.

## 6. Ce qui bloque hors du code

Tout ce qu'un développeur ou un agent ne peut pas régler depuis le dépôt va dans
**`A-FAIRE-HORS-CODE.md`**, et nulle part ailleurs — pas dans un fil de discussion, pas dans
un commentaire au fond d'un composant.

Ce fichier est versionné dans un dépôt public : n'y écrire ni secret, ni donnée
personnelle, ni mode d'emploi pour accéder à l'un des deux.

## 7. Version du site

Le champ `version` de `package.json` est la **seule** source du numéro affiché en bas de
chaque page (`src/components/Footer.astro`, lu au build). Ne jamais écrire un numéro en dur
ailleurs.

**Chaque PR incrémente la version**, dans un commit de la PR — jamais après coup sur `main`.
Utiliser `npm version <patch|minor|major> --no-git-tag-version`, qui écrit le fichier sans
créer de tag ni de commit.

On suit **Semantic Versioning 2.0.0** (<https://semver.org>). La spec exige une *API
publique déclarée* et ne dit rien d'un site web : ici, l'API publique est **l'ensemble des
URL du site et ce qu'un visiteur ou un lien extérieur peut attendre d'y trouver.** C'est ce
contrat-là qui décide de l'incrément.

| Incrément | Quand | Exemples sur ce site |
|---|---|---|
| **MAJOR** | Rupture du contrat : une URL disparaît ou change, une page est supprimée, la navigation est refondue. Un favori ou un lien extérieur cesse de fonctionner. | Renommer `/le-club` ; supprimer `/stages` ; refonte complète de la navigation. |
| **MINOR** | Ajout compatible : rien de ce qui existait ne casse. | Nouvelle page ; nouveau composant visible ; formulaire de contact activé ; affichage de la version. |
| **PATCH** | Correction compatible, ou changement invisible pour le visiteur. | Correction de bug ou de contenu ; ajustement visuel ; token ; script de vérification ; documentation ; CI. |

Une PR qui ne touche que la doc ou l'outillage prend quand même un **PATCH** : la règle est
« une PR, un incrément », sans exception à arbitrer.

`check:version` (`scripts/check-version-bump.mjs`) refuse en CI une PR dont la version n'a
pas augmenté par rapport à la base. Il tourne dans le job `build` de `ci.yml`, **pas** dans
`npm run build` : il a besoin de la branche de base, que le build local n'a pas forcément.
Pour le lancer à la main : `git fetch origin main` puis `npm run check:version`. Il vérifie
qu'on s'est posé la question de l'incrément, **pas** qu'on a choisi le bon ordre — ça, ça
demande de savoir si une URL disparaît, et ça reste un jugement humain.

**Avant la mise en ligne publique, on reste en `0.y.z`** : la spec réserve la majeure zéro au
développement initial, où tout peut changer. Le passage à **`1.0.0` se fait à la mise en
ligne publique du site**, et à ce moment-là seulement. Tant qu'on est en `0.y.z`, une rupture
d'URL prend une **minore**, pas une majeure — la majeure reste à zéro.
