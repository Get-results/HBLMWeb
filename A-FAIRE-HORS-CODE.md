# À faire hors code

**Point de centralisation unique** de tout ce qui bloque ou attend en dehors du dépôt :
contenus à obtenir du bureau du club, comptes à créer, réglages à faire dans des
interfaces tierces, décisions à prendre.

> **Convention.** Tout ce qu'un agent IA ou un développeur ne peut pas faire seul depuis
> le code atterrit ici, et nulle part ailleurs. Pas dans un fil de discussion, pas dans un
> commentaire perdu au fond d'un composant. Quand une tâche est faite, on coche et on
> retire le `TODO` correspondant dans le code — les deux vont ensemble.

Statuts : `[ ]` à faire · `[x]` fait · `[~]` en cours
Dernière mise à jour : 11/09/2026

---

## 1. Technique — à faire par Cédric

Rien ici ne demande le bureau, mais rien ne peut être fait depuis le dépôt.

- [ ] **Créer la clé Web3Forms** — sur [web3forms.com](https://web3forms.com), saisir l'adresse
  mail du club. La clé arrive par mail.
  → à coller dans `.env` (`PUBLIC_CONTACT_ACCESS_KEY`), voir `.env.example`.
- [ ] **Déclarer les variables sur GitHub** — *Settings → Secrets and variables → Actions →
  **Variables*** : `PUBLIC_CONTACT_ENDPOINT` (`https://api.web3forms.com/submit`) et
  `PUBLIC_CONTACT_ACCESS_KEY`.
  → sans ça, le site déployé affiche le bloc de contact de repli, pas le formulaire.
  Le workflow les lit déjà (`.github/workflows/deploy.yml`).
- [ ] **Tester un envoi réel** et **vérifier les courriers indésirables**. Première réception
  sur une réputation neuve : le risque de spam est réel.
- [ ] **Mettre en place Umami** (Story 1.4) — instance ou Umami Cloud, puis renseigner
  `PUBLIC_UMAMI_URL` et `PUBLIC_UMAMI_ID` (localement + variables GitHub).
  → tant que c'est vide, aucun script de mesure n'est inclus. Le site fonctionne, il n'y a
  simplement aucune statistique de fréquentation.

---

## 2. Contenus à obtenir du bureau du club

Ce sont des **faits sur le club**. Ils ne peuvent pas être devinés, et tout ce qui est
inventé ici finirait publié comme une information officielle.

### Bloquant avant toute mise en ligne

- [ ] **Adresse mail officielle du club** — destination du formulaire de contact, et repli
  `mailto` en attendant (`PUBLIC_CONTACT_EMAIL`).
- [ ] **Composition du bureau** — nom du/de la président·e, secrétaire, trésorier·ère.
  → `src/pages/le-club.astro:31-42`, actuellement `[Nom à compléter]` ×3.
- [ ] **Vrais créneaux d'entraînement** — jour, gymnase, catégorie, horaires, pour toutes
  les équipes. *Le point le plus attendu du site.*
  → `src/pages/planning.astro` affiche « Planning en cours de préparation » depuis le
  11/09/2026. Les exemples fabriqués qui y figuraient ont été retirés : ils étaient
  **publiés en ligne** et un parent pouvait se déplacer sur un horaire inventé.
  → Les styles des créneaux sont conservés dans la page : dès que les horaires arrivent,
  il n'y a que le balisage à réécrire.
  → Format attendu, par jour : gymnase + une ligne par catégorie avec son horaire.
    Exemple : *Lundi — Gymnase Arnassan (Lunel) — -15 ans, 18h–19h30*.
  → Penser aussi à rétablir la sous-ligne de la page et le rappel « le planning peut
  évoluer en cours de saison », retirés avec les créneaux.
- [ ] **Mentions légales** — la page existe désormais (`src/pages/mentions-legales.astro`,
  liée depuis le footer) avec **14 champs à compléter** : dénomination officielle, siège,
  n° RNA, SIRET, téléphone, e-mail, agrément Jeunesse et Sports / affiliation FFHandball,
  directeur·rice de publication, crédits photo, auteur du logo, boîte destinataire du
  formulaire, e-mail et adresse postale pour l'exercice des droits RGPD, date de mise à jour.
  → **16 questions prêtes à envoyer au bureau** dans la description de la PR #3.
  → Point à valider : la durée de conservation des messages est proposée à **12 mois**.
  Aucune durée n'est imposée par la CNIL, c'est au bureau de trancher.
- [ ] **Autorisations de droit à l'image** — à vérifier pour les photos déjà publiées,
  **en particulier celles de mineurs**. Si les accords écrits n'existent pas, il faut les
  recueillir ou retirer les photos. Soulevé lors de la rédaction des mentions légales.

### Non bloquant, mais visible comme « trou » dans la page

- [x] **Données des catégories** — tarifs et tranches d'années de naissance transmis par
  le bureau le 13/09/2026 (document « TARIFS SAISON 2026-2027 »), créneaux repris des
  visuels du club. Les 12 fiches sont publiées.
- [x] **Disponibilité d'essai** — tranché le 13/09/2026 : elle se voit directement avec le
  club. Le champ `trialAvailable` reste donc à `null`, le parcours affiche « à voir
  directement avec le club » et donne le contact. Ce n'est pas une donnée en attente.
- [ ] **Référent par catégorie** — nom + mail ou téléphone publiable, avec l'accord de la
  personne (site et dépôt publics). Sans référent, le contact générique s'affiche.
- [x] **Le Handfit** — tarif 150 €, samedi 11h30-12h30 au gymnase Arnassan, réservé aux
  adultes (même borne que les séniors loisirs). Publié, et proposé comme troisième choix
  dans « Trouver ma catégorie » à côté de Compétition et Loisir.
- [x] **Genre du Handfit** — confirmé mixte par le bureau le 13/09/2026.
- [x] **Les garçons nés en 2009, 2010 et 2011** — le bureau a confirmé le 13/09/2026 qu'il
  **n'existe pas d'équipe -18 masculins** cette saison. Le comportement actuel est donc le
  bon : « Trouver ma catégorie » affiche le contact du club plutôt qu'une catégorie
  inadaptée. Ce n'est pas un trou dans les données, c'est la réalité du club — à revoir si
  une équipe se crée.
- [ ] **Stages** : dates, horaires, tarifs — `src/pages/stages.astro:24-26`.
- [ ] **Confirmer le chiffre « 351 licenciés en 2025 »** affiché sur la page Le club
  (`src/pages/le-club.astro:20-22`). Il vient du brief projet, relevé sur l'ancien site
  WordPress — ce n'est donc pas une donnée inventée, mais il porte le millésime 2025 alors
  que la saison 2026-2027 commence. À actualiser ou à confirmer.
- [x] **Correspondance commune → gymnase** — confirmée par le bureau le 13/09/2026 :
  une commune désigne toujours la même salle. Lunel → Arnassan, Marsillargues → Spinosi,
  Lansargues → gymnase du collège. Les 27 créneaux du planning sont renseignés.
- [x] **Adresses des gymnases** — transmises par le bureau le 13/09/2026 et affichées sur
  la page « Le club ». Dénominations harmonisées sur celles du club : « Gymnase du
  collège » et « Halle des sports Pierre de Coubertin » remplacent « Collège de
  Lansargues » et « Gymnase Pierre de Coubertin ».
- [ ] **Photos des membres du bureau et du CA** — la page « Le club » affiche un avatar
  rond portant les initiales de chaque personne, en attendant les vraies photos. Le club
  en dispose (organigramme transmis le 12/09/2026) mais elles n'ont pas été récupérées.
  → `src/pages/le-club.astro` : quand les photos arrivent, remplacer le contenu du
  `.avatar` par une `<img>`, le cercle et sa bordure restent identiques.
  → Prévoir l'accord de chaque personne : le site et le dépôt sont publics.
- [ ] **Liens des réseaux sociaux** du club (Instagram, Facebook) — plusieurs pages y
  renvoient en texte sans lien cliquable (`matchs.astro`, `vie-du-club.astro`).
- [ ] **Logo officiel et photos** libres de droit — `asset_placeholder/` contient des visuels
  de travail (dont `logo_club.webp`) qui ne sont **pas** versionnés et ne sont pas utilisés
  par le site. `public/` ne contient que les favicons.
  → prévoir l'accord des personnes photographiées, notamment pour les mineurs.

---

## 3. Décisions prises

Journal des arbitrages, pour ne pas les rejouer dans six mois.

| Date | Décision | Motif |
|---|---|---|
| 11/09/2026 | **Web3Forms** pour le formulaire de contact, plutôt qu'un backend maison | Site statique : aucune clé ne peut être gardée secrète côté client. Un Cloudflare Worker imposerait domaine + SPF/DKIM + anti-spam à maintenir, pour ~15 messages/an attendus. |
| 11/09/2026 | **Pas de nom de domaine** pour l'instant, on reste sur `github.io` | Aller au plus simple tant que le site n'est pas en production. Le club en possède un, activable plus tard. |
| 11/09/2026 | L'endpoint du formulaire reste une **variable d'environnement** | Passer plus tard à un backend maison ne coûtera qu'un changement de variable, aucune ligne de code. |
| 11/09/2026 | Pages jalons créées pour `/essai`, `/matchs`, `/vie-du-club` | Ces liens existaient déjà dans la navigation et renvoyaient des 404. Seront remplacées par les Stories 2.3, 3.2 et 4.3. |
| 11/09/2026 | Les catégories ne s'affichent que si `dataStatus: confirme` | Un drapeau explicite par fiche, plutôt que la confiance. Le build refuse une fiche confirmée incomplète : impossible de publier un tarif ou un créneau à moitié saisi. |
| 11/09/2026 | Mentions légales livrées « à trous » plutôt qu'attendues | Le bureau complète des champs balisés au lieu de partir d'une page blanche. Aucune valeur juridique n'est inventée : un champ vide vaut mieux qu'un faux SIRET. |
| 11/09/2026 | **Page Planning passée en « en cours de préparation »** | Les créneaux affichés étaient fabriqués et le site est publiquement accessible. Mieux vaut annoncer l'absence d'horaires que publier de faux horaires. |

---

## 4. À trancher plus tard

- **Activer le nom de domaine du club** ? Déclencheur : mise en production réelle.
  Implique un `CNAME` sur GitHub Pages et la mise à jour de `site` dans `astro.config.mjs`.
- **Quitter Web3Forms** ? Déclencheur : dépassement des ~50 messages/mois du palier gratuit,
  ou besoin de champs sur mesure. Voir la décision du 11/09/2026.
- **Qui met à jour le site au quotidien** (créneaux, actualités, stages) ? Personne au
  bureau, ou une personne désignée ? La réponse conditionne le niveau d'automatisation à
  viser dans les Epics 3 et 4.

---

## 5. Fait

*(rien pour l'instant — les éléments cochés ci-dessus viendront s'archiver ici)*
