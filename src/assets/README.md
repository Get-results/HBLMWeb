# Assets versionnés du site

À ne pas confondre avec `/assets/` à la racine, qui est **ignoré par git** : ce
dossier-ci est versionné, et tout ce qu'on y dépose part dans le dépôt public et
dans le build. N'y mettre que ce qui peut être vu de tous — donc jamais de photo
de personne identifiable.

| Fichier | Ce que c'est |
|---|---|
| `logo.svg` | Blason officiel du club, vectoriel, 500x500 dans son `viewBox` |

## Le blason

Il est servi par le composant `src/components/Logo.astro`, qui est le **seul**
point d'entrée : ne pas importer `logo.svg` directement dans une page.

Il est **vectoriel**, donc net à n'importe quelle taille : le même fichier sert
le blason de 36px du header et le filigrane de 520px du hero d'accueil. Il n'y a
plus de taille maximale à surveiller — c'était le cas de la première version,
tirée d'un PNG de 432px.

### D'où il vient, et comment le refabriquer

La source est `logo-hblm.ai` (Illustrator 27, 2022), transmis par le club et
conservé dans `/assets/` à la racine, non versionné. C'est un PDF déguisé, sans
aucun bitmap et avec les textes déjà vectorisés — vérifiable avec
`pdfimages -list` et `pdffonts`, qui ne doivent rien retourner.

```sh
pdftocairo -svg assets/logo-hblm.ai /tmp/logo-brut.svg
npx svgo@3 /tmp/logo-brut.svg -o src/assets/logo.svg --precision=1 --multipass
# puis remplacer width="500pt" height="500pt" par width="500" height="500"
```

`--precision=1` fait passer le fichier de 357 Ko à 55 Ko (23 Ko une fois
compressé par le serveur) sans différence visible, y compris sur le texte
circulaire et les rayures du tigre — comparé côte à côte avec `precision=2` au
navigateur avant de trancher.

### Les déclinaisons dans `public/`

`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` et
`og-image.jpg` sont dérivés du même fichier Illustrator, via un rendu PNG de
2084x2084 (`pdftocairo -png -r 300 -transp`). Ils vivent dans `public/` et non
ici parce que des clients extérieurs — l'onglet du navigateur, le robot
d'aperçu de Facebook ou WhatsApp — les réclament à une URL **fixe**, ce que le
pipeline d'images d'Astro ne garantit pas puisqu'il hache les noms de fichiers.

Ils ne sont pas régénérés au build : si le blason change, les refabriquer avec
le script donné dans le message du commit qui les a introduits.
`apple-touch-icon.png` et `icon-512.png` reçoivent un fond `#EDEBE7` car iOS et
Android aplatissent la transparence sur du noir, ce qui masquerait le disque
noir du blason.

## Le filigrane du hero

`src/pages/index.astro` pose le blason en filigrane à droite du titre d'accueil,
à 7 % d'opacité, au-dessus de 1200px de large seulement. Ce seuil est **mesuré**,
pas arbitraire : en dessous, le filigrane passe derrière le texte au lieu de
l'accompagner. Le raisonnement complet est dans le commentaire CSS, à lire avant
de toucher à la taille, au seuil ou au décalage.
