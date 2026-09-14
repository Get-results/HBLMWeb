# À faire hors code

**Point de centralisation unique** de tout ce qui bloque ou attend en dehors du dépôt :
contenus à obtenir du bureau du club, comptes à créer, réglages à faire dans des
interfaces tierces, décisions à prendre.

> **Convention.** Tout ce qu'un agent IA ou un développeur ne peut pas faire seul depuis
> le code atterrit ici, et nulle part ailleurs. Pas dans un fil de discussion, pas dans un
> commentaire perdu au fond d'un composant. Quand une tâche est faite, on coche et on
> retire le `TODO` correspondant dans le code — les deux vont ensemble.

Statuts : `[ ]` à faire · `[x]` fait · `[~]` en cours
Dernière mise à jour : 14/09/2026

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
- [ ] **Remettre `docs/` dans le dépôt, une fois les identifiants retirés** — la
  documentation de l'API des matchs (`FRONTEND_INTEGRATION.md`, `api-examples.json`,
  `openapi.json`, `openapi.yaml`) a été sortie du dépôt le 14/09/2026, et `/docs/` est
  désormais ignoré (`.gitignore`). Motif : `FRONTEND_INTEGRATION.md` documente la route
  d'authentification de l'API avec `{ "username": "admin", "password": "admin" }` en
  clair, et le dépôt est public.
  → Le porteur a confirmé qu'il s'agit d'identifiants de **développement local**, sans
  valeur en production. Ce n'est donc pas une urgence — mais ça n'a pas sa place dans un
  dépôt public, où ça se lit comme un mode d'emploi d'authentification.
  → Ce n'est pas non plus tenable durablement : `src/content.config.ts` renvoie à
  `docs/FRONTEND_INTEGRATION.md` pour justifier le nommage des champs de matchs, et un
  clone neuf ne l'a pas. C'est exactement le défaut de transmissibilité que vise NFR4.
  → Geste attendu : retirer ce passage de la documentation (ou changer les identifiants
  par défaut), puis reverser `docs/` dans le dépôt et supprimer la règle du `.gitignore`.

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
- [ ] **Autorisations de droit à l'image** — mis de côté le 14/09/2026, avec pour
  conséquence directe l'ajournement des **galeries photo** (partie de la story 4.3).
  → À rouvrir avant toute publication de photo sur le site, en particulier de mineurs.
  → Argument soulevé : les photos du club sont déjà sur Instagram. À noter pour qui
  reprendra le sujet — les CGU d'Instagram encadrent ce que Meta peut faire du contenu
  publié là-bas, elles ne donnent aucun droit de republication ailleurs. Le club a
  cependant déjà pris une décision de publication : le site est une seconde surface, pas
  une nature de risque différente.

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
- [ ] **Tarif du stage d'août 2026** — introuvable aujourd'hui : HelloAsso masque la
  billetterie des événements terminés, et la page de l'édition n'affiche plus aucun prix.
  Le club l'a forcément encaissé : il suffit de le redemander au bureau. En attendant,
  `price: null` dans `src/content/stages/stage-aout-2026.yaml` et la fiche ne montre aucun
  prix — c'est volontaire, un tarif approché serait un tarif inventé.
- [ ] **Dates de la prochaine édition de stage** — tant qu'aucun stage à venir n'est
  confirmé, « Prochains stages » reste sur son état vide et renvoie vers le contact du
  club. Ce n'est pas un défaut de la page, c'est l'état réel entre deux éditions.
  → Quand les dates arrivent : un fichier de plus dans `src/content/stages/`, en
  `dataStatus: confirme`. Le classement « à venir » / « passé » se fait seul à partir des
  dates, il n'y a aucun drapeau à basculer (voir section 3).
- [ ] **Confirmer ou actualiser le nombre de licenciés** — le chiffre n'est plus affiché
  nulle part depuis le 14/09/2026. « 351 licenciés en 2025 » vient du brief projet, relevé
  sur l'ancien site WordPress : ce n'est donc pas une donnée inventée, mais il porte le
  millésime 2025 alors que la saison 2026-2027 a commencé, et l'accueil l'accompagnait d'un
  « un record ! » que rien n'étaye.
  → L'enjeu a changé : ce n'est plus un chiffre douteux publié en ligne, c'est un chiffre en
  attente hors ligne. Il vit dans `src/lib/club.ts` derrière un drapeau `confirme: false`,
  avec sa valeur et son année.
  → Le rétablir tient en un booléen passé à `true` après accord du bureau — en corrigeant
  `nombre` et `annee` si le bureau donne l'effectif de la saison en cours. Rien d'autre à
  toucher : les deux pages qui l'affichaient (accueil et « Le club ») le relisent au même
  endroit.
- [ ] **Premier vrai article, à faire rédiger par le bureau** — le dépôt ne porte que
  `src/content/articles/exemple-modele-d-article.md`, marqué `publicationStatus: exemple`,
  qui ne sort jamais du build. Tant que personne n'a écrit un article et ne l'a passé à
  `publie`, l'accueil et `/vie-du-club` affichent leur état vide. C'est l'état réel du
  club en ligne, pas une page cassée — mais c'est un site d'actualités sans actualité.
  → Un article est un fichier markdown : titre, date, type, accroche, photo de couverture
  facultative, et le texte. Le pousser sur `main` suffit à le publier (AD-6).
  → À caler **après** l'arbitrage sur la page de détail par article (section 5) : sans
  elle, le corps du texte n'est lisible nulle part et le bureau rédigerait à l'aveugle.
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
- [ ] **Liens des réseaux sociaux** du club (Instagram, Facebook) — deux endroits y
  renvoient en toutes lettres sans donner un seul lien cliquable : l'état vide de
  `/vie-du-club` invite à « suivez-nous sur les réseaux sociaux du club », et le repli du
  formulaire de contact (`src/components/ContactForm.astro`) renvoie « aux réseaux du
  club ».
  → Ce sont précisément les textes qu'on lit quand le reste manque : ils sont censés être
  la porte de sortie, et ils ne mènent nulle part. Deux URL suffisent à les réparer.
- [ ] **Logo officiel et photos** libres de droit — `asset_placeholder/` contient des visuels
  de travail (dont `logo_club.webp`) qui ne sont **pas** versionnés et ne sont pas utilisés
  par le site. `public/` ne contient que les favicons.
  → prévoir l'accord des personnes photographiées, notamment pour les mineurs.

---

## 3. Décisions prises

Journal des arbitrages, pour ne pas les rejouer dans six mois.

| Date | Décision | Motif |
|---|---|---|
| 14/09/2026 | Un **article ne paraît que si `publicationStatus: publie`** | Même mécanisme que le `dataStatus` des catégories, mais un nom et des valeurs distincts parce que la question posée diffère : une fiche de catégorie attend la *confirmation* de ses données par le bureau, un article attend d'être *prêt* à paraître. La valeur par défaut ne publie pas, et `exemple` ne paraît jamais. |
| 14/09/2026 | Un **stage ne paraît que si `dataStatus: confirme`**, et son classement passé / à venir est **déduit des dates** | Même drapeau que les catégories, pour la même raison : le site est publiquement en ligne. Le classement, lui, n'est jamais saisi — un champ « passé » à basculer à la main resterait à `false` le jour où personne n'y pense, et le site annoncerait un stage déjà terminé. Un stage passé reste `confirme` : ses données sont vraies, c'est sa date qui le range. |
| 14/09/2026 | Le **tarif d'un stage peut rester inconnu sans empêcher sa publication**, contrairement au tarif de licence | HelloAsso masque la billetterie des événements terminés : le tarif d'août 2026 est réellement introuvable. L'exiger aurait conduit à en approcher un, c'est-à-dire à l'inventer. La fiche préfère n'afficher aucun prix, et le reste de ses informations est vrai. |
| 14/09/2026 | Les **quatre cartes d'actualité inventées de l'accueil sont retirées** ; l'accueil lit désormais la même source que « Vie du club » | Elles étaient écrites en dur et ne relataient aucun fait vérifié — dont un « 351 licenciés, un record ! » — sur un site publiquement accessible. Une source unique pour les deux pages rend par ailleurs impossible qu'elles racontent deux choses différentes. |
| 14/09/2026 | Les **chiffres du club passent derrière un drapeau de confirmation** ; le nombre de gymnases est **déduit de la liste** | L'effectif portait un millésime périmé et un superlatif que rien n'étaye : mieux vaut n'afficher aucun chiffre qu'un chiffre de 2025 présenté comme courant. Le « 4 gymnases » était un littéral qu'aucune liste ne garantissait — ajouter une salle laissait le texte mentir sans que rien ne le signale. |
| 14/09/2026 | **Pas de demande de purge à GitHub Support** pour le commit orphelin du 14/09 (section 4) | La purge serait la seule action qui retirerait vraiment l'objet, mais elle suppose d'ouvrir un ticket et d'attendre, pour un contenu dont rien n'est techniquement exploitable. Le seul point qui compte se traite en prévenant les personnes concernées, pas en discutant avec un support. |
| 14/09/2026 | **Galeries photo ajournées**, droit à l'image mis de côté | Publier des photos, notamment de mineurs, sans autorisation écrite engage l'association. Les articles, eux, ne dépendent pas des photos : l'epic 4 avance sans sa partie galerie. |
| 11/09/2026 | **Web3Forms** pour le formulaire de contact, plutôt qu'un backend maison | Site statique : aucune clé ne peut être gardée secrète côté client. Un Cloudflare Worker imposerait domaine + SPF/DKIM + anti-spam à maintenir, pour ~15 messages/an attendus. |
| 11/09/2026 | **Pas de nom de domaine** pour l'instant, on reste sur `github.io` | Aller au plus simple tant que le site n'est pas en production. Le club en possède un, activable plus tard. |
| 11/09/2026 | L'endpoint du formulaire reste une **variable d'environnement** | Passer plus tard à un backend maison ne coûtera qu'un changement de variable, aucune ligne de code. |
| 11/09/2026 | Pages jalons créées pour `/essai`, `/matchs`, `/vie-du-club` | Ces liens existaient déjà dans la navigation et renvoyaient des 404. Seront remplacées par les Stories 2.3, 3.2 et 4.3. |
| 11/09/2026 | Les catégories ne s'affichent que si `dataStatus: confirme` | Un drapeau explicite par fiche, plutôt que la confiance. Le build refuse une fiche confirmée incomplète : impossible de publier un tarif ou un créneau à moitié saisi. |
| 11/09/2026 | Mentions légales livrées « à trous » plutôt qu'attendues | Le bureau complète des champs balisés au lieu de partir d'une page blanche. Aucune valeur juridique n'est inventée : un champ vide vaut mieux qu'un faux SIRET. |
| 11/09/2026 | **Page Planning passée en « en cours de préparation »** | Les créneaux affichés étaient fabriqués et le site est publiquement accessible. Mieux vaut annoncer l'absence d'horaires que publier de faux horaires. |

---

## 4. Sujets techniques ouverts

Des constats et des limitations connus, chacun avec son état et ce qui le débloquerait.
Rien ici n'attend le bureau, mais rien ne se règle non plus d'un simple commit.

- [ ] **Lien vers la fiche officielle FFHandball (story 3.3)** — l'API ne fournit **aucune
  URL par match**. Le seul champ `url` existe sur `TrackedCategory`, pointe la *poule* et non
  le match, et est retiré de la vue publique `/api/competitions/public`.
  → Trois issues : l'exposer sur la route publique (le plus simple, c'est une URL FFHandball
  déjà publique) ; faire que le build s'authentifie en JWT, ce qui suppose un compte de
  service et des identifiants en secrets ; ou renoncer à la story.
  → Décision reportée le 13/09/2026 : « on verra plus tard pour l'authentification ».

- [ ] **Bot Fight Mode désactivé sur `cedricsanchez.xyz`** — le 13/09/2026, pour débloquer le
  pipeline : Cloudflare bloquait les runners GitHub, dont les IP sont des IP de datacenter.
  La protection DDoS, elle, reste active — c'est un mécanisme distinct et non désactivable.
  → Conséquence : robots d'indexation et scrapers passent désormais sur **toute la zone**,
  pas seulement sur `/api/`.
  → Durcissement possible si ça devient gênant : ajouter un en-tête secret partagé à la
  requête du pipeline, créer une règle WAF qui n'autorise `/api/` qu'aux requêtes le
  portant, et réactiver Bot Fight Mode. La valeur du secret se renseigne des deux côtés
  (environnement GitHub `api` et règle Cloudflare) — le site n'a pas à la connaître.
  → À noter pour qui reprendrait le sujet : le Bot Fight Mode de l'offre gratuite ne peut
  **pas** être contourné par une règle WAF. Seul Super Bot Fight Mode (offre Pro) accepte
  des exceptions par chemin.

- [ ] **Doublon dans les données de matchs (côté API)** — `/api/matches` renvoie deux fois la
  même rencontre dans la poule 193544 : `SOMMIERES HBC` contre le club, le 19/09 à 14h30,
  journée 1, sous les identifiants **1069** et **1094**. Les deux ne diffèrent que par
  l'orthographe du nom du club : « LUNEL MARSILLARGUES-LANSARGUES » et la même chose suivie
  de « (-18F) ».
  → Le site n'en affiche qu'un, mais c'est un pansement : la déduplication est faite à
  l'affichage, l'anomalie reste dans la source. À corriger côté scraper ou côté API, sans
  quoi elle se reproduira à chaque catégorie où la FFHandball renomme une équipe en cours
  de saison.

- [ ] **Protection anti-spam du formulaire de contact** — à activer si du spam arrive, pas
  avant. État actuel : seul le honeypot `botcheck` protège, et il n'arrête que les robots
  qui remplissent une vraie page. La clé Web3Forms étant publique par conception — elle est
  dans le HTML — n'importe qui peut poster directement sur leur API sans passer par le site,
  et contourner le piège.
  → **hCaptcha** est la seule protection réellement efficace sur l'offre gratuite, et
  Web3Forms l'intègre sans configuration (clé de site partagée fournie).
  → La **restriction par domaine** répondrait exactement au problème, mais elle est payante.
  → Coût d'hCaptcha à ne pas oublier : un script tiers sur un site conçu sans JavaScript
  client, une friction pour le visiteur, et une **obligation RGPD** — il faudra compléter
  les mentions légales, car un tiers reçoit alors des données du visiteur.
  → Le pire scénario actuel est du spam dans la boîte du club : désagréable, visible
  immédiatement, sans danger.

- [ ] **Prévenir le bureau d'une exposition de contenu** — le 14/09/2026, un `git add`
  trop large a fait entrer dans un commit poussé des fichiers de travail qui traînaient à
  la racine du dépôt, dont un document interne concernant les membres du conseil
  d'administration. Le commit a été remplacé par un force-push, mais GitHub conserve les
  objets de ce type et l'exposition reste en cours.
  → **Ce fichier ne décrit pas le contenu concerné ni la manière d'y accéder : il est
  lui-même versionné dans un dépôt public.** Le détail — référence exacte, inventaire,
  analyse d'exploitabilité — est dans le rapport d'audit du 14/09/2026, conservé **hors
  dépôt**. À ranger dans un endroit durable, le rapport d'origine étant temporaire.
  → **Décision du 14/09/2026 : pas de demande de purge à GitHub Support** (motif en
  section 3). Ce n'est donc pas une action en attente, c'est un état assumé.
  → Reste à faire : **prévenir les personnes concernées**, en disant que l'exposition est
  en cours et non close, puisque la purge est écartée. Obligation de transparence, pas
  incident à déclarer : ce sont des adultes en fonction associative, aucun mineur.
  → Garde-fou déjà posé : le `.gitignore` refuse désormais toute image déposée à la racine
  du dépôt. L'origine est une manipulation trop large, pas un défaut de conception.

---

## 5. À trancher plus tard

- **Activer le nom de domaine du club** ? Déclencheur : mise en production réelle.
  Implique un `CNAME` sur GitHub Pages et la mise à jour de `site` dans `astro.config.mjs`.
- **Quitter Web3Forms** ? Déclencheur : dépassement des ~50 messages/mois du palier gratuit,
  ou besoin de champs sur mesure. Voir la décision du 11/09/2026.
- **Qui met à jour le site au quotidien** (créneaux, actualités, stages) ? Personne au
  bureau, ou une personne désignée ? La réponse conditionne le niveau d'automatisation à
  viser dans les Epics 3 et 4.
  → Élément de réponse déjà acquis : le club tient un **compte HelloAsso**, qui sert
  aujourd'hui aux inscriptions aux stages — la billetterie du stage d'août 2026 est reliée
  depuis `src/content/stages/stage-aout-2026.yaml`. Quelqu'un l'alimente donc déjà, et
  publie déjà sur Instagram. La question n'est pas de trouver une personne capable de tenir
  un outil en ligne, mais de savoir si le dépôt git est le bon outil **pour elle** (AD-6).
- **Une page de détail par article ?** Sans route `/vie-du-club/[slug]`, le corps markdown
  d'un article n'est lisible nulle part : l'accueil et `/vie-du-club` n'affichent que le
  titre, la date, le type et l'accroche, alors que le schéma prévoit un vrai texte rédigé.
  Déclencheur : **avant le premier vrai article** (section 2). Trancher après, c'est faire
  rédiger le bureau à l'aveugle pour un format sans destination — soit un texte écrit pour
  rien, soit une accroche qu'il faudra reprendre en article complet.
- **`MATCHES_API_BASE_URL` : secret de CI, ou variable assumée ?** L'URL est traitée comme
  un secret de l'environnement GitHub `api`, alors que le domaine `cedricsanchez.xyz` est
  écrit en clair dans ce fichier même (section 4, Bot Fight Mode), et sur `main` depuis une
  vingtaine de commits. Ce n'est pas exploitable : `scripts/fetch-matches.mjs` documente que
  la route est publique et n'exige aucun en-tête — un lecteur du dépôt n'obtient rien qu'il
  n'obtiendrait en interrogeant l'API directement. Mais le mélange actuel donne le coût du
  secret sans son bénéfice, et rend les logs de CI illisibles au diagnostic. Deux issues
  cohérentes : passer l'URL en **variable**, comme les `PUBLIC_*` pour la même raison, ou
  maintenir le secret et retirer le domaine de ces notes. Déclencheur : le prochain
  diagnostic de pipeline, ou la prochaine relecture de sécurité.

---

## 6. Fait

*(rien pour l'instant — les éléments cochés ci-dessus viendront s'archiver ici)*
