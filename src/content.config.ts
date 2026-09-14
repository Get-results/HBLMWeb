import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/* Collections de contenu du site (AD-3 : trois collections à schéma explicite —
   `categories`, `matches` et `articles`).
   Le schéma Zod est le SEUL mécanisme de typage du contenu : pas de validation
   parallèle ailleurs dans le code (AD-2). */

/* Astro 6+ impose un loader explicite (schema-only supprimé) : on charge des
   fichiers YAML plutôt que du markdown, parce qu'une catégorie est une fiche de
   données (créneaux, tarif, contact) et non un texte rédigé — le markdown
   n'apporterait qu'un corps vide à maintenir. Le nom du fichier fait l'`id` de
   l'entrée : c'est lui l'identifiant stable que `matches.teamId` référencera
   (AD-3), d'où la convention kebab-case `u13-feminine.yaml`. */

/* Créneau d'entraînement. L'heure est stockée en chaîne « HH:MM » et non en Date :
   un créneau est un horaire récurrent de semaine, pas un instant daté — une Date
   obligerait à inventer un jour et à gérer un fuseau pour rien. */
const trainingSlot = z.object({
	day: z.enum(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']),
	startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM'),
	endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM'),
	/* Gymnase : nom + commune en clair. Pas de référence à une collection `gymnases`
	   tant qu'il n'y a qu'une poignée d'installations (AD-3 : une collection naît
	   d'un besoin réel, pas par anticipation). */
	venue: z.string().min(1),
	/* Distinction interne entre équipes d'une même catégorie, telle qu'elle figure
	   sur les visuels du club : « G1 & G2 », « D1 », « Équipe 2 »… `null` est le
	   cas courant — la plupart des catégories n'ont qu'un groupe, et inventer un
	   libellé là où le club n'en met pas donnerait une fausse précision.
	   Le champ existe pour que le planning n'ait plus à porter cette donnée à
	   côté de la fiche : une information du bureau, un seul endroit. */
	group: z.string().min(1).nullable().default(null),
});

/* Référent de la catégorie. Séparé du contact générique (AD-8) : celui-ci est une
   donnée de contenu qui varie par catégorie, celui-là est un composant unique
   servant de repli quand cette donnée manque. */
const contact = z.object({
	name: z.string().min(1),
	email: z.string().email().optional(),
	phone: z.string().min(1).optional(),
});

const categories = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/categories' }),
	schema: z
		.object({
			/* Libellé affiché tel quel au visiteur (« -13 ans féminines »). */
			label: z.string().min(1),

			/* Ordre d'affichage, du plus jeune au plus âgé. Explicite plutôt que
			   déduit des années de naissance : celles-ci peuvent être absentes tant
			   que le bureau ne les a pas confirmées, un tri qui en dépendrait
			   s'effondrerait. */
			order: z.number().int().nonnegative(),

			/* Critères de résolution du profil saisi dans « Trouver ma catégorie »
			   (AD-7, props `{ birthYear, gender }`). */
			gender: z.enum(['F', 'M', 'mixte']),
			/* Type de pratique, posé dans l'île aux seuls profils adultes.
			   `null` = sans objet (catégories de jeunes).
			   `handfit` est une troisième voie et non un sous-cas du loisir : le club
			   le tarife séparément et lui donne son propre créneau. Le fondre dans
			   `loisir` aurait obligé à le distinguer autrement ensuite. */
			practice: z.enum(['competition', 'loisir', 'handfit']).nullable().default(null),

			/* Bornes d'années de naissance, incluses. `birthYearFrom` = la plus
			   ancienne acceptée, `birthYearTo` = la plus récente. `null` = pas de
			   borne de ce côté (typiquement `birthYearFrom: null` chez les seniors).
			   Ces bornes bougent à chaque saison : c'est pour ça que `season` existe. */
			birthYearFrom: z.number().int().nullable().default(null),
			birthYearTo: z.number().int().nullable().default(null),

			/* Saison de référence des données ci-dessous (« 2026-2027 »). Sans elle,
			   un tarif resté en place douze mois se lit comme le tarif courant. */
			season: z
				.string()
				.regex(/^\d{4}-\d{4}$/, 'Saison attendue au format AAAA-AAAA')
				.nullable()
				.default(null),

			/* Poules FFHandball de cette catégorie, via l'API des matchs (AD-4).
			   Un tableau et non une valeur unique : une catégorie peut engager
			   plusieurs équipes dans des divisions différentes — -15F, -15M et -18F
			   en ont deux chacune cette saison. Vide = la catégorie ne joue pas en
			   championnat (baby-hand, école de hand, loisirs, handfit), ce qui est
			   un état normal et non une donnée manquante. */
			poolIds: z.array(z.string().min(1)).default([]),

			trainingSlots: z.array(trainingSlot).default([]),

			/* Tarif de licence en euros, une seule devise et pas de décomposition
			   licence/cotisation en v1 (AD-3). `null` = non renseigné : jamais 0,
			   qui se lirait comme « gratuit ». */
			licenseFee: z.number().positive().nullable().default(null),

			/* Disponibilité d'un essai. `null` = non renseigné — et surtout pas une
			   chaîne libre (AD-3). Le parcours affiche alors le contact générique
			   plutôt qu'un « disponible / indisponible » faux (FR-3). */
			trialAvailable: z.boolean().nullable().default(null),

			contact: contact.nullable().default(null),

			/* Garde-fou éditorial, et la raison d'être de ce champ :
			   le site est publiquement en ligne. Une fiche n'est rendue sur une page
			   publique QUE si elle vaut `confirme` — c'est-à-dire validée par le
			   bureau du club. Tant qu'elle vaut `a-confirmer`, ses valeurs (même
			   remplies) ne sortent jamais du build : un créneau inventé fait se
			   déplacer un parent pour rien. `exemple` marque les fiches de
			   démonstration du schéma, qui ne doivent jamais être publiées. */
			dataStatus: z.enum(['exemple', 'a-confirmer', 'confirme']).default('a-confirmer'),
		})
		/* On refuse au build qu'une fiche soit marquée « confirmée » sans porter ce
		   qu'une fiche publiée doit contenir. Sans ça, `dataStatus` deviendrait un
		   simple drapeau déclaratif qu'on coche par distraction. */
		.superRefine((categorie, ctx) => {
			if (categorie.dataStatus !== 'confirme') return;

			if (categorie.trainingSlots.length === 0) {
				ctx.addIssue({
					code: 'custom',
					path: ['trainingSlots'],
					message: 'Une catégorie confirmée doit porter au moins un créneau réel.',
				});
			}
			if (categorie.licenseFee === null) {
				ctx.addIssue({
					code: 'custom',
					path: ['licenseFee'],
					message: 'Une catégorie confirmée doit porter le tarif de licence réel.',
				});
			}
			if (categorie.season === null) {
				ctx.addIssue({
					code: 'custom',
					path: ['season'],
					message: 'Une catégorie confirmée doit indiquer la saison de référence de ses données.',
				});
			}
			if (categorie.birthYearFrom === null && categorie.birthYearTo === null) {
				ctx.addIssue({
					code: 'custom',
					path: ['birthYearFrom'],
					message:
						"Une catégorie confirmée doit porter au moins une borne d'année de naissance, sinon « Trouver ma catégorie » ne peut pas la résoudre.",
				});
			}
			if (
				categorie.birthYearFrom !== null &&
				categorie.birthYearTo !== null &&
				categorie.birthYearFrom > categorie.birthYearTo
			) {
				ctx.addIssue({
					code: 'custom',
					path: ['birthYearTo'],
					message: 'birthYearFrom doit être antérieure ou égale à birthYearTo.',
				});
			}
		}),
});

/* Matchs — AD-3, AD-4.

   Un seul fichier JSON remplacé intégralement à chaque récupération, et non un
   fichier par match : l'API est la source de vérité unique, il n'y a rien à
   fusionner. Le fichier n'est pas versionné (voir .gitignore) — il est produit
   par scripts/fetch-matches.mjs juste avant le build. Le committer ferait entrer
   une donnée volatile dans l'historique, et se heurterait à la protection de
   branche qui interdit les poussées directes sur main.

   Les champs reprennent exactement ceux de l'API (camelCase, cf.
   docs/FRONTEND_INTEGRATION.md). On ne renomme rien : un alias obligerait à
   tenir une table de correspondance de plus. */
const matches = defineCollection({
	loader: file('./src/content/matches/matches.json'),
	schema: z.object({
		id: z.number().int(),
		poolId: z.string(),
		category: z.string(),
		officialPhaseName: z.string().nullable(),
		round: z.string().nullable(),
		/* « 2026-09-12T18:00:00 » — sans fuseau ni Z, volontairement : ce sont des
		   horaires locaux de match. Y ajouter un Z les décalerait. */
		matchDate: z.string().nullable(),
		team1Name: z.string(),
		/* null = match non joué. C'est le cas de 76 matchs sur 77 en début de
		   saison : l'état courant, pas un cas limite (Story 3.4). */
		team1Score: z.number().int().nullable(),
		team2Name: z.string(),
		team2Score: z.number().int().nullable(),
	}),
});

/* Articles — « Vie du club » (AD-3, AD-6).

   Markdown et non YAML, contrairement à `categories` : un article EST un texte
   rédigé, son corps porte le contenu. C'est le seul endroit du projet où le
   corps markdown sert vraiment.

   AD-6 : le dépôt git est le système de publication. Pousser un fichier
   conforme à ce schéma sur `main` déclenche le workflow de déploiement
   existant — il n'y a aucune étape manuelle au-delà du push. */
const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: ({ image }) =>
		z.object({
			/* Titre affiché tel quel, sur la carte et en tête de l'article. */
			title: z.string().min(1),

			/* Date de publication, « AAAA-MM-JJ » (convention de dates du spine).
			   Chaîne et non Date, pour la raison qui vaut déjà pour les matchs :
			   un `Date` appliquerait le fuseau de la machine de build à une date
			   sans heure, et « 2026-09-14 » pourrait s'afficher le 13 au soir.
			   Le format ISO rend par ailleurs le tri chronologique lexicographique. */
			date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ'),

			/* Type d'article, repris des libellés déjà employés par le carrousel
			   de l'accueil. Une énumération et non une chaîne libre : le libellé
			   s'affiche dans un badge, et deux orthographes d'une même catégorie
			   (« Événement » / « Evenement ») produiraient deux badges distincts
			   sans que rien ne le signale. Les libellés lisibles vivent dans
			   src/lib/articles.ts, pas dans le contenu. */
			category: z.enum(['vie-du-club', 'actualite', 'evenement']),

			/* Accroche affichée sur la carte. Obligatoire, et non déduite des
			   premières lignes du corps : une troncature automatique coupe au
			   milieu d'une phrase, et l'auteur n'a alors aucun moyen de la
			   corriger sans réécrire son texte. */
			description: z.string().min(1),

			/* Photo de couverture, optionnelle (Story 4.2 : son absence affiche le
			   placeholder de NewsCard, elle ne casse pas la mise en page).
			   `image()` plutôt qu'un chemin en chaîne : Astro vérifie au build que
			   le fichier existe, l'optimise, et produit une URL déjà préfixée par
			   la base du site (AD-5) — un chemin écrit à la main ne ferait aucun
			   des trois. Le texte alternatif est exigé avec la photo, jamais
			   séparément : une image sans alt est inaccessible (NFR3), et la lier
			   au même objet rend l'oubli impossible. */
			coverPhoto: z
				.object({
					src: image(),
					alt: z.string().min(1),
				})
				.nullable()
				.default(null),

			/* Garde-fou éditorial, pendant du `dataStatus` des catégories, avec un
			   nom et des valeurs différents parce que la question posée n'est pas
			   la même : une fiche de catégorie attend la CONFIRMATION de données
			   par le bureau, un article attend simplement d'être PRÊT à paraître.
			   Le mécanisme, lui, est identique et c'est ce qui compte : seul
			   `publie` sort du build (voir src/lib/articles.ts), la valeur par
			   défaut ne publie pas, et `exemple` marque les fichiers de
			   démonstration du schéma, qui ne doivent jamais paraître. */
			publicationStatus: z.enum(['exemple', 'brouillon', 'publie']).default('brouillon'),
		}),
});

/* Stages de vacances — collection `stages`.

   Chargée en YAML pour la même raison que `categories` : un stage est une fiche
   de données (dates, horaires, lieu, tarif, inscription) et non un texte rédigé.
   Le markdown n'apporterait qu'un corps vide à maintenir. Le nom du fichier fait
   l'`id` de l'entrée, en kebab-case — `stage-aout-2026.yaml`.

   Les dates sont des chaînes « AAAA-MM-JJ » et les horaires des chaînes
   « HH:MM », jamais des `Date` : un stage est une plage annoncée en heure
   locale, comme les créneaux d'entraînement et comme `matches.matchDate`. Une
   `Date` y ajouterait un fuseau qui décalerait l'affichage selon la machine qui
   construit le site. Les guillemets sont donc obligatoires dans le YAML, sinon
   le parseur convertit lui-même la valeur en `Date`.
   Conséquence utile : c'est de ces dates que la page déduit « à venir » ou
   « passé ». Aucun drapeau saisi à la main — un stage resté annoncé en haut de
   page des mois après sa tenue est exactement le faux qu'on cherche à éviter. */
const stages = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/stages' }),
	schema: z
		.object({
			/* Intitulé affiché tel quel, repris de l'annonce du club. */
			title: z.string().min(1),

			startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ'),
			endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ'),

			/* Horaires de la journée, identiques sur toute la durée du stage : c'est
			   ainsi que le club les annonce. Le jour où une édition aura des horaires
			   différents d'un jour à l'autre, ce sera le moment de les détailler —
			   pas avant (AD-3). */
			startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM'),
			endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM'),

			/* Gymnase + commune en clair, comme `trainingSlot.venue` : pas de
			   collection `gymnases` tant qu'une poignée de salles suffit (AD-3).
			   C'est la dénomination du site qui fait foi, pas celle de la billetterie
			   — « Gymnase Arnassan » là où HelloAsso écrit « Salle Arnassan ». */
			venue: z.string().min(1),

			/* Public visé, en libellé libre — et NON une liste d'`id` de la collection
			   `categories`. Le stage d'août 2026 vise « -9, -11, -13 et -15, filles et
			   garçons » alors qu'il n'existe aucune catégorie -9 au club (il a
			   `baby-hand` et `ecole-de-hand`). Référencer par `id` obligerait donc soit
			   à inventer une catégorie, soit à faire disparaître un public réellement
			   invité : deux façons de mentir sur un fait du club. Un stage ne s'adresse
			   d'ailleurs pas aux équipes engagées en championnat mais à des tranches
			   d'âge, licenciés comme non-licenciés — ce n'est pas la même notion que
			   la catégorie. Le jour où une page devra vraiment croiser les deux, le
			   besoin sera réel et le champ pourra changer de nature. */
			audience: z.string().min(1),

			/* Tarif en euros. `null` = non renseigné, jamais 0 qui se lirait
			   « gratuit » — même raisonnement que `licenseFee`.
			   Différence assumée avec `licenseFee` en revanche : le tarif n'est PAS
			   exigé d'un stage confirmé (voir le garde-fou plus bas). HelloAsso masque
			   la billetterie des événements terminés, le tarif d'août 2026 est donc
			   réellement introuvable. L'exiger conduirait à en approcher un, c'est-à-
			   dire à en inventer un ; la page préfère n'afficher aucun prix. */
			price: z.number().positive().nullable().default(null),

			/* Billetterie en ligne (HelloAsso). `null` = pas d'inscription en ligne
			   pour cette édition. Sur un stage passé, la page cesse d'en faire un
			   bouton d'inscription : l'événement est clos. */
			registrationUrl: z.string().url().nullable().default(null),

			/* Moyens de paiement acceptés, en libellés d'affichage (« chèques vacances
			   ANCV »). Une énumération fermée serait à rouvrir au premier moyen que le
			   club accepte en plus, pour un champ qui n'est que lu. Vide = le club ne
			   l'a pas précisé, et la page n'en dit alors rien. */
			paymentMethods: z.array(z.string().min(1)).default([]),

			/* Même garde-fou éditorial que `categories`, et pour la même raison : le
			   site est publiquement en ligne. Seules les fiches `confirme` sortent du
			   build. Un stage passé reste `confirme` — ses données sont vraies ; c'est
			   sa date qui le range dans les éditions passées, jamais son statut. */
			dataStatus: z.enum(['exemple', 'a-confirmer', 'confirme']).default('a-confirmer'),
		})
		/* On refuse au build une fiche marquée « confirmée » qui ne porte pas ce
		   qu'une fiche publiée doit contenir, comme pour `categories` : sans ça,
		   `dataStatus` redevient un drapeau qu'on coche par distraction. */
		.superRefine((stage, ctx) => {
			/* Cohérence des dates et des horaires : vérifiée quel que soit le statut.
			   Une plage inversée est une faute de saisie, pas un contenu en attente —
			   et elle fausserait le classement passé / à venir. */
			if (stage.endDate < stage.startDate) {
				ctx.addIssue({
					code: 'custom',
					path: ['endDate'],
					message: 'La date de fin doit être postérieure ou égale à la date de début.',
				});
			}
			if (stage.endTime <= stage.startTime) {
				ctx.addIssue({
					code: 'custom',
					path: ['endTime'],
					message: "L'heure de fin doit être postérieure à l'heure de début.",
				});
			}

			if (stage.dataStatus !== 'confirme') return;

			/* Sans lien de billetterie ni moyen de paiement, un stage publié laisse le
			   visiteur sans aucune façon d'y inscrire son enfant : la fiche n'est pas
			   exploitable, même complète par ailleurs. Exigence volontairement « au
			   moins l'un des deux » — le club encaisse aussi sur place le jour même. */
			if (stage.registrationUrl === null && stage.paymentMethods.length === 0) {
				ctx.addIssue({
					code: 'custom',
					path: ['registrationUrl'],
					message:
						"Un stage confirmé doit indiquer comment s'inscrire : un lien de billetterie, ou au moins un moyen de paiement.",
				});
			}
		}),
});

export const collections = { categories, matches, articles, stages };
