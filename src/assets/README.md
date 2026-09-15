# Assets versionnés du site

À ne pas confondre avec `/assets/` à la racine, qui est **ignoré par git** : ce
dossier-ci est versionné, et tout ce qu'on y dépose part dans le dépôt public et
dans le build. N'y mettre que ce qui peut être vu de tous — donc jamais de photo
de personne identifiable.

| Fichier | Ce que c'est |
|---|---|
| `logo.webp` | Blason officiel du club, 432x432, fond transparent |

## Le blason

Il est servi par le composant `src/components/Logo.astro`, qui est le **seul**
point d'entrée : ne pas importer `logo.webp` directement dans une page.

Limite à connaître : la source est **raster**, 432x432. Au-delà d'environ 216px
de rendu, le 2x demandé par `Logo.astro` n'est plus tenable et l'image
s'adoucit. Les emplacements actuels (34px header, 44px footer, 96px page Le
club, 120px page 404) restent largement en dessous.

Un **filigrane en grand format dans le hero d'accueil** a été écarté pour cette
raison : il demande un fichier vectoriel. Si un SVG du blason est transmis par
le club, c'est ici qu'il se pose, et `Logo.astro` s'en sert à la place.

### Les déclinaisons dans `public/`

`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` et
`og-image.jpg` sont dérivés de ce même fichier. Ils vivent dans `public/` et non
ici parce que des clients extérieurs — l'onglet du navigateur, le robot
d'aperçu de Facebook ou WhatsApp — les réclament à une URL **fixe**, ce que le
pipeline d'images d'Astro ne garantit pas puisqu'il hache les noms de fichiers.

Ils ne sont pas régénérés au build : si `logo.webp` change, les refabriquer. Le
script qui les a produits est dans le message du commit qui les a introduits.
`apple-touch-icon.png` et `icon-512.png` reçoivent un fond `#EDEBE7` car iOS et
Android aplatissent la transparence sur du noir, ce qui masquerait le disque
noir du blason.
