import { getCollection, type CollectionEntry } from 'astro:content';

export type Stage = CollectionEntry<'stages'>;

/* Point de passage UNIQUE entre la collection `stages` et les pages, sur le
   modèle de src/lib/categories.ts. Le site est publiquement en ligne : une date
   de stage que le bureau n'a pas confirmée ne doit jamais s'afficher comme un
   fait. Laisser ce filtre à chaque page, c'est l'oublier une fois — donc on ne
   publie qu'à travers ces fonctions, jamais par `getCollection('stages')`. */

/** Stages publiables : uniquement ceux validés par le bureau du club. */
async function getStagesPublies(): Promise<Stage[]> {
	return getCollection('stages', ({ data }) => data.dataStatus === 'confirme');
}

/* Instant de fin réel du stage, construit en heure locale à partir des chaînes
   du schéma. C'est la fin qui départage passé et à venir, et non le début : un
   stage commencé hier et qui s'achève demain est toujours d'actualité pour le
   parent qui consulte la page. */
function finDuStage(stage: Stage): Date {
	return new Date(`${stage.data.endDate}T${stage.data.endTime}:00`);
}

function debutDuStage(stage: Stage): Date {
	return new Date(`${stage.data.startDate}T${stage.data.startTime}:00`);
}

/** Stages triés en « à venir » et « passés », d'après les dates saisies.

    Dérivé et non déclaré : un champ `passe: true` à basculer à la main resterait
    à `false` le jour où personne n'y pense, et le site annoncerait un stage déjà
    terminé.

    La référence de temps est l'instant du BUILD, le site étant statique. Ce
    n'est pas un défaut ici : le dépôt est reconstruit à chaque push et par le
    cron quotidien du pipeline des matchs, donc un stage bascule dans les
    éditions passées au plus tard le lendemain de sa fin. */
export async function getStagesClasses(maintenant: Date = new Date()): Promise<{
	aVenir: Stage[];
	passes: Stage[];
}> {
	const stages = await getStagesPublies();
	const aVenir = stages
		.filter((stage) => finDuStage(stage) >= maintenant)
		/* Le prochain d'abord : c'est celui auquel on peut encore inscrire. */
		.sort((a, b) => debutDuStage(a).getTime() - debutDuStage(b).getTime());
	const passes = stages
		.filter((stage) => finDuStage(stage) < maintenant)
		/* Le plus récent d'abord : une édition d'il y a trois ans n'apprend plus
		   grand-chose sur ce que le club organise aujourd'hui. */
		.sort((a, b) => debutDuStage(b).getTime() - debutDuStage(a).getTime());
	return { aVenir, passes };
}

/** Période du stage en une phrase : « du 24 au 28 août 2026 », ou « le 24 août
    2026 » quand il tient sur un seul jour. Le mois et l'année ne sont répétés
    que s'ils changent, sinon la ligne se lit comme un formulaire. */
export function formaterPeriode(stage: Stage): string {
	const debut = debutDuStage(stage);
	const fin = finDuStage(stage);
	const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' });
	const jourMois = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
	const complet = new Intl.DateTimeFormat('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	if (stage.data.startDate === stage.data.endDate) return `le ${complet.format(debut)}`;
	if (debut.getFullYear() !== fin.getFullYear()) {
		return `du ${complet.format(debut)} au ${complet.format(fin)}`;
	}
	if (debut.getMonth() !== fin.getMonth()) {
		return `du ${jourMois.format(debut)} au ${complet.format(fin)}`;
	}
	return `du ${jour.format(debut)} au ${complet.format(fin)}`;
}

/** Horaires d'une journée : « 9h30 – 17h00 ». Même écriture que les créneaux
    d'entraînement, pour que le site ne parle pas deux langues. */
export function formaterHoraires(stage: Stage): string {
	const heure = (valeur: string) => valeur.replace(':', 'h').replace(/^0/, '');
	return `${heure(stage.data.startTime)} – ${heure(stage.data.endTime)}`;
}

/** Tarif formaté en euros. `null` n'a pas de rendu : un stage sans tarif connu
    n'affiche aucun prix plutôt qu'un prix approché (voir le schéma). */
export function formaterTarifStage(price: number): string {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0,
	}).format(price);
}
