---
# ARTICLE DE DÉMONSTRATION — ne relate AUCUN fait réel du club.
# Il existe pour montrer la forme attendue d'un article : c'est le modèle à
# copier, pas un contenu à publier.
#
# `publicationStatus: exemple` le tient hors de toute page publique — les
# helpers de src/lib/articles.ts ne rendent que les articles `publie`. C'est
# aussi pourquoi son contenu est ostensiblement fictif : si un jour un filtre
# lâchait, on doit le voir immédiatement.
title: "EXEMPLE — ne pas publier"
date: "2026-01-01"

# Valeurs admises : vie-du-club | actualite | evenement
category: actualite

# Accroche affichée sur la carte de la page « Vie du club ».
description: "Article de démonstration du schéma. Il ne décrit aucun événement réel et ne doit jamais paraître en ligne."

# Photo de couverture, FACULTATIVE. Sans elle, la carte affiche le visuel
# placeholder du composant NewsCard — c'est le cas ici, et c'est volontaire :
# le dépôt ne porte aucune photo du club tant que la question du droit à
# l'image n'est pas tranchée (voir A-FAIRE-HORS-CODE.md).
# Pour en ajouter une : déposer le fichier à côté de l'article et écrire
#   coverPhoto:
#     src: "./ma-photo.jpg"
#     alt: "Description de ce que montre la photo, pour qui ne la voit pas"

publicationStatus: exemple
---

Le corps de l'article s'écrit ici, en Markdown standard. C'est la seule
collection du projet où ce corps sert vraiment : une catégorie est une fiche de
données, un article est un texte.

## Un intertitre

Paragraphes, **gras**, *italique*, listes et liens fonctionnent normalement :

- un premier point ;
- un second point.

Pour publier un vrai article : copier ce fichier sous un nom en kebab-case
(`reprise-des-entrainements.md`), remplacer les métadonnées et le texte, puis
passer `publicationStatus` à `publie`. Tant que cette valeur n'est pas `publie`,
l'article n'apparaît nulle part sur le site — c'est ce qui permet de pousser un
brouillon sans le mettre en ligne.
