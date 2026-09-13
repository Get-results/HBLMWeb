import { getCollection, type CollectionEntry } from 'astro:content';
import { estEquipeDuClub } from './club';
import { getCategoriesPubliees } from './categories';

export type Match = CollectionEntry<'matches'>;

/* Un match tel que la page l'affiche : le point de vue du club, pas celui de
   l'API. L'API décrit une rencontre neutre (team1 contre team2) ; un visiteur du
   site veut savoir qui NOUS affrontons et où. La bascule se fait ici, une fois. */
export interface MatchDuClub {
	id: number;
	/** Équipe du club engagée, telle que la FFHandball l'orthographie. */
	equipeClub: string;
	adversaire: string;
	/* La FFHandball place l'équipe recevante en premier : team1 joue à domicile.
	   C'est la seule information de lieu disponible — il n'y a pas de champ dédié. */
	domicile: boolean;
	dateHeure: string | null;
	competition: string | null;
	journee: string | null;
	poolId: string;
	/** `id` de la fiche de catégorie, ou null si la poule n'est rattachée à aucune. */
	categorieId: string | null;
	categorieLabel: string | null;
	/* null = match non joué. En début de saison c'est le cas de presque tous :
	   l'état courant, pas une exception (Story 3.4). */
	scoreClub: number | null;
	scoreAdversaire: number | null;
}

/** Table poolId → fiche de catégorie, construite depuis les `poolIds` déclarés
    sur chaque fiche. Une poule non rattachée n'est pas une erreur : elle sera
    simplement affichée sans nom de catégorie. */
async function tableDesPoules(): Promise<Map<string, { id: string; label: string }>> {
	const table = new Map<string, { id: string; label: string }>();
	for (const categorie of await getCategoriesPubliees()) {
		for (const poolId of categorie.data.poolIds) {
			table.set(poolId, { id: categorie.id, label: categorie.data.label });
		}
	}
	return table;
}

/** Les matchs du club, du plus proche au plus lointain.

    `/api/matches` renvoie TOUS les matchs des poules suivies, adversaires
    compris — 24 sur 77 nous concernent. On filtre donc sur les noms d'équipe du
    club, en correspondance exacte (voir src/lib/club.ts). */
export async function getMatchsDuClub(): Promise<MatchDuClub[]> {
	const poules = await tableDesPoules();
	const bruts = await getCollection('matches');

	const matchs = bruts
		.map((entree) => entree.data)
		.filter((m) => estEquipeDuClub(m.team1Name) || estEquipeDuClub(m.team2Name))
		.map((m) => {
			const domicile = estEquipeDuClub(m.team1Name);
			const categorie = poules.get(m.poolId) ?? null;
			return {
				id: m.id,
				equipeClub: domicile ? m.team1Name : m.team2Name,
				adversaire: domicile ? m.team2Name : m.team1Name,
				domicile,
				dateHeure: m.matchDate,
				competition: m.officialPhaseName,
				journee: m.round,
				poolId: m.poolId,
				categorieId: categorie?.id ?? null,
				categorieLabel: categorie?.label ?? null,
				scoreClub: domicile ? m.team1Score : m.team2Score,
				scoreAdversaire: domicile ? m.team2Score : m.team1Score,
			} satisfies MatchDuClub;
		});

	/* Les matchs sans date en dernier : on ne peut pas les situer, les intercaler
	   au hasard donnerait une chronologie fausse. */
	return matchs.sort((a, b) => {
		if (a.dateHeure === null) return b.dateHeure === null ? a.id - b.id : 1;
		if (b.dateHeure === null) return -1;
		return a.dateHeure.localeCompare(b.dateHeure) || a.id - b.id;
	});
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « samedi 12 septembre, 16h00 ». La chaîne de l'API n'a ni fuseau ni Z : c'est
    une heure locale de match, on la découpe telle quelle plutôt que de la passer
    par un Date qui y appliquerait le fuseau du serveur de build. */
export function formaterDateMatch(valeur: string | null): string | null {
	if (!valeur) return null;
	const m = valeur.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
	if (!m) return null;
	const [, annee, mois, jour, heures, minutes] = m;
	const jourSemaine = JOURS[new Date(`${annee}-${mois}-${jour}T12:00:00Z`).getUTCDay()];
	return `${jourSemaine} ${Number(jour)} ${MOIS[Number(mois) - 1]}, ${heures}h${minutes}`;
}
