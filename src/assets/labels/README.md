# Pictogrammes des labels fédéraux

Les huit fichiers de ce dossier sont les visuels **officiels de la FFHandball**,
téléchargés le 15/09/2026 depuis la fiche du club sur `monclub.ffhandball.fr`
(ils y sont servis par le thème WordPress de la fédération, sous des noms
hachés du type `arbitrage.dccd97ce2f4412cfb78e.png`).

Ils ne sont **pas redessinés** : ce sont les mêmes images que celles affichées
par la fédération, renommées au slug utilisé dans `src/lib/labels.ts`. Un
pictogramme maison aurait été juridiquement plus confortable, mais aurait aussi
cessé de ressembler au label que le club a réellement obtenu — or c'est
précisément la reconnaissance fédérale que la page donne à voir.

| Fichier | Label |
|---|---|
| `arbitrage.png` | Arbitrage |
| `babyhand.png` | BabyHand |
| `club-formateur.png` | Club Formateur |
| `ecole-de-hand.png` | École de Hand |
| `feminisation.png` | Féminisation |
| `hand-a-4.png` | Hand à 4 |
| `vie-du-club.png` | Vie du Club |
| `club-labellise.png` | Sceau « Club labellisé FFHandball » |

## Ce qu'il faut savoir avant d'y toucher

**Le trait est cyan sur fond transparent.** Il n'y a pas de disque blanc dans
le fichier : le cercle clair vient du CSS de la page. C'est voulu — le thème
sombre est le thème par défaut du site, et un cyan posé directement sur le fond
`#201F1C` passe mal. Ne pas « corriger » les PNG en y incrustant un fond.

**Les tailles sont inégales** (208px, sauf `ecole-de-hand.png` en 416px et le
sceau en 232x208). C'est ainsi que la fédération les sert. Ça n'a pas
d'importance : les images passent par le pipeline d'Astro, qui les redimensionne
au rendu. Ne pas les réencoder à la main pour uniformiser.

**Ces fichiers sont figés.** Ils ne sont pas retéléchargés au build : la fiche
fédérale est une application JavaScript sans API publique, et un téléchargement
au build ferait dépendre la publication du site d'un serveur tiers. Si le club
gagne ou perd un label, il faut donc **deux** gestes : déposer ou retirer le
fichier ici, et mettre à jour `src/lib/labels.ts` (qui porte aussi la date du
relevé).
