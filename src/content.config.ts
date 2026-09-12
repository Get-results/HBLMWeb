import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Collections de contenu du site (AD-3 : trois collections à schéma explicite —
   `categories` ici, `articles` et `matches` viendront avec les Epics 4 et 3).
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
			/* Distinction compétition/loisir, posée dans l'île pour les profils
			   adultes. `null` = sans objet (catégories de jeunes). */
			practice: z.enum(['competition', 'loisir']).nullable().default(null),

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

export const collections = { categories };
