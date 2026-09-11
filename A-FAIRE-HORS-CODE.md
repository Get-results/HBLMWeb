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
  les équipes.
  → `src/pages/planning.astro:16`, **les créneaux actuellement affichés sont des exemples
  fabriqués**. C'est le point le plus sensible de la liste : un parent qui se déplace sur un
  horaire inventé, c'est une confiance perdue.
- [ ] **Mentions légales** — nom de l'association, adresse du siège, n° RNA ou SIRET,
  directeur·rice de publication, hébergeur (GitHub Pages, GitHub Inc.). Obligatoire pour un
  site d'association accessible au public.
  → le footer ne contient aujourd'hui qu'un `© 2026` (`src/components/Footer.astro`).
  À confirmer avec le bureau, éventuellement avec la mairie ou le comité départemental.

### Non bloquant, mais visible comme « trou » dans la page

- [ ] **Tarifs des licences** par catégorie — `src/pages/inscription.astro:35`
  (`[Tarif à compléter]`). Alimentera aussi la Story 2.1 (collection `categories`).
- [ ] **Stages** : dates, horaires, tarifs — `src/pages/stages.astro:24-26`.
- [ ] **Liste et adresses des gymnases** — 4 installations annoncées, à confirmer
  (`src/pages/le-club.astro:47+`).
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
