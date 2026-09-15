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
	/* Division seule, extraite de `competition` : « 1ere Division » plutôt que
	   « -18 Ans F 1ere Division ». C'est le SEUL discriminant entre deux équipes
	   du club qui portent le même nom — « Lunel Marsillargues-Lansargues »
	   en désigne trois. */
	division: string | null;
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

/* « -18 Ans F 1ere Division » → « 1ere Division ». On retire le préfixe de
   catégorie, qui est déjà porté ailleurs. Si la forme ne correspond pas, on
   garde la chaîne entière : mieux vaut un libellé long que rien. */
function extraireDivision(phase: string | null): string | null {
	if (!phase) return null;
	return phase.replace(/^[+-]\d+\s+(?:Ans\s+)?[FM]\s+/i, '').trim() || phase;
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
				division: extraireDivision(m.officialPhaseName),
				journee: m.round,
				poolId: m.poolId,
				categorieId: categorie?.id ?? null,
				categorieLabel: categorie?.label ?? null,
				scoreClub: domicile ? m.team1Score : m.team2Score,
				scoreAdversaire: domicile ? m.team2Score : m.team1Score,
			} satisfies MatchDuClub;
		});

	/* L'API a livré deux fois la même rencontre — même poule, même journée, même
	   horaire, même adversaire — sous deux orthographes du nom du club. On ne
	   peut pas afficher deux fois un match au visiteur, donc on ne garde que la
	   première occurrence. Ce n'est PAS une correction de fond : l'anomalie est
	   côté source et doit y être traitée (voir A-FAIRE-HORS-CODE.md). */
	const vus = new Set<string>();
	const uniques = matchs.filter((m) => {
		const cle = `${m.poolId}|${m.journee}|${m.dateHeure}|${m.adversaire}`;
		if (vus.has(cle)) return false;
		vus.add(cle);
		return true;
	});

	/* Les matchs sans date en dernier : on ne peut pas les situer, les intercaler
	   au hasard donnerait une chronologie fausse. */
	return uniques.sort((a, b) => {
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

/** Un match est passé si son coup d'envoi est antérieur à `maintenant`.
    Sans date, on ne peut pas trancher : on le traite comme à venir plutôt que
    de l'enterrer dans les résultats, où personne ne le chercherait.

    `maintenant` est ramené à l'heure murale du club avant comparaison, comme
    dans `estDansLaFenetre` : les deux bornes sont alors dans le même référentiel
    et l'ordre lexicographique des chaînes ISO suffit. Un `new Date()` sur
    `dateHeure` — qui n'a ni fuseau ni Z — lui appliquerait celui du serveur de
    build, UTC sur GitHub Actions : les matchs du jour basculaient dans les
    résultats deux heures trop tard l'été, avec un « Résultat pas encore connu »
    posé sur une rencontre en cours. */
export function estPasse(match: MatchDuClub, maintenant: Date): boolean {
	if (!match.dateHeure) return false;
	return match.dateHeure < heureClub(maintenant);
}

/** Clé de regroupement mensuel, « 2026-09 ». */
export function cleMois(valeur: string | null): string {
	return valeur?.slice(0, 7) ?? 'sans-date';
}

/** « Septembre 2026 ». L'année est incluse : une saison chevauche deux années,
    et « Septembre » seul deviendrait ambigu dès la deuxième. */
export function libelleMois(cle: string): string {
	if (cle === 'sans-date') return 'Date à préciser';
	const [annee, mois] = cle.split('-');
	const nom = MOIS[Number(mois) - 1];
	return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${annee}`;
}

/** Groupe une liste déjà triée en blocs mensuels, dans l'ordre reçu. */
export function grouperParMois(
	matchs: MatchDuClub[],
): { cle: string; libelle: string; matchs: MatchDuClub[] }[] {
	const groupes: { cle: string; libelle: string; matchs: MatchDuClub[] }[] = [];
	for (const match of matchs) {
		const cle = cleMois(match.dateHeure);
		const dernier = groupes.at(-1);
		if (dernier?.cle === cle) dernier.matchs.push(match);
		else groupes.push({ cle, libelle: libelleMois(cle), matchs: [match] });
	}
	return groupes;
}

const JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MOIS_COURTS = [
	'janv', 'févr', 'mars', 'avr', 'mai', 'juin',
	'juil', 'août', 'sept', 'oct', 'nov', 'déc',
];

/** Découpe la date pour le bloc calendrier de la carte : « sam / 19 / sept ».
    Renvoie `null` sans date — la carte affiche alors un bloc neutre plutôt
    qu'une date inventée. */
export function blocDate(
	valeur: string | null,
): { jour: string; numero: string; mois: string; heure: string } | null {
	if (!valeur) return null;
	const m = valeur.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
	if (!m) return null;
	const [, annee, mois, jour, heures, minutes] = m;
	/* Midi en UTC pour déduire le jour de la semaine : à minuit, un décalage de
	   fuseau ferait basculer d'un jour. */
	const index = new Date(`${annee}-${mois}-${jour}T12:00:00Z`).getUTCDay();
	return {
		jour: JOURS_COURTS[index],
		numero: String(Number(jour)),
		mois: MOIS_COURTS[Number(mois) - 1],
		heure: `${heures}h${minutes}`,
	};
}

/** Durée de la fenêtre « cette semaine », en jours. Une seule valeur pour
    l'accueil et pour la page Matchs : les deux surfaces doivent découper la
    même semaine, sinon un match annoncé sur l'une manque à l'autre. */
export const FENETRE_SEMAINE_JOURS = 7;

/** Les matchs du club dont le coup d'envoi tombe dans la fenêtre glissante
    `[maintenant, maintenant + jours[`.

    Fenêtre glissante et non semaine calendaire lundi→dimanche : une semaine
    calendaire se vide le dimanche en fin d'après-midi, une fois les rencontres
    jouées — précisément le moment où l'on vient chercher le week-end suivant.

    Un match sans date est écarté : on ne peut pas affirmer qu'il tombe dans la
    fenêtre, et l'accueil n'est pas l'endroit où poser la question. Il reste
    visible sur /matchs, où la section « Date à préciser » le porte. */
export async function getMatchsProchainsJours(
	jours: number = FENETRE_SEMAINE_JOURS,
	maintenant = new Date(),
): Promise<MatchDuClub[]> {
	const fenetre = fenetreProchainsJours(maintenant, jours);
	return (await getMatchsDuClub()).filter((m) => estDansLaFenetre(m, fenetre));
}

/** Vrai si le coup d'envoi tombe dans la fenêtre.

    Extrait de `getMatchsProchainsJours` pour que la page Matchs découpe sa
    section « Cette semaine » avec exactement le même test : un match annoncé
    sur l'accueil doit se retrouver là-bas au même endroit, et deux tests
    séparés auraient divergé. */
export function estDansLaFenetre(
	match: MatchDuClub,
	fenetre: { debut: string; fin: string },
): boolean {
	if (!match.dateHeure) return false;
	/* Comparaison de chaînes ISO : leur ordre lexicographique EST l'ordre
	   chronologique, et aucune des deux bornes ne passe par un `Date` — donc
	   aucun fuseau ne s'invite. Même doctrine que `formaterDateMatch`. */
	return match.dateHeure >= fenetre.debut && match.dateHeure <= fenetre.fin;
}

/* Fuseau du club. Les heures de l'API sont des heures de Paris écrites sans
   décalage (« 2026-09-19T12:00:00 ») : les passer par `new Date()` leur
   appliquerait le fuseau du serveur de build — UTC sur GitHub Actions — et
   décalerait les bornes de deux heures l'été. */
const FUSEAU_CLUB = 'Europe/Paris';

/** L'instant donné, ramené à l'heure murale du club, au format de l'API.
    `sv-SE` est la locale qui rend « 2026-09-14 21:05:00 », soit l'ISO à l'espace
    près. */
function heureClub(instant: Date): string {
	const rendu = new Intl.DateTimeFormat('sv-SE', {
		timeZone: FUSEAU_CLUB,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}).format(instant);
	return rendu.replace(' ', 'T');
}

/** Bornes de la fenêtre, en heures du club : de maintenant à la FIN du jour situé
    `jours` plus loin.

    La borne haute est la fin de journée et non l'instant exact à 7×24 h, parce
    que le libellé affiché annonce ce jour-là. Avec une borne à 7×24 h — le site
    étant construit vers 3 h du matin — le bandeau annonçait « du 14 au 21 » mais
    s'arrêtait le 21 à 5 h : aucune rencontre du septième jour ne pouvait jamais
    y figurer. Un parent qui cherche « samedi prochain » le samedi matin en
    concluait qu'il n'y a pas de match. */
export function fenetreProchainsJours(
	maintenant = new Date(),
	jours = 7,
): { debut: string; fin: string } {
	const debut = heureClub(maintenant);
	/* Arithmétique de calendrier sur la date seule, en UTC : ajouter des jours à
	   une date nue ne peut pas être perturbé par un changement d'heure. */
	const finJour = new Date(`${debut.slice(0, 10)}T00:00:00Z`);
	finJour.setUTCDate(finJour.getUTCDate() + jours);
	return { debut, fin: `${finJour.toISOString().slice(0, 10)}T23:59:59` };
}

/** « du 14 au 21 septembre », « du 28 septembre au 5 octobre ».

    Les dates réelles, jamais « cette semaine » : le site est rebuildé une fois
    par jour (cron de deploy.yml). Si un build échoue, « cette semaine » devient
    faux en silence, alors qu'une période datée reste vérifiable d'un coup d'œil.
    Le mois de départ n'est répété que s'il diffère de celui d'arrivée. */
export function libellePeriode(debut: string, fin: string): string {
	/* Les deux bornes viennent de `fenetreProchainsJours`, donc déjà en heures du
	   club. On les découpe plutôt que de les passer par un `Date`, pour la même
	   raison qu'ailleurs dans ce fichier. */
	const [, moisDebutNum, jourDebut] = debut.slice(0, 10).split('-');
	const [, moisFinNum, jourFin] = fin.slice(0, 10).split('-');
	const moisDebut = MOIS[Number(moisDebutNum) - 1];
	const moisFin = MOIS[Number(moisFinNum) - 1];
	const borneDebut =
		moisDebut === moisFin ? `${Number(jourDebut)}` : `${Number(jourDebut)} ${moisDebut}`;
	return `du ${borneDebut} au ${Number(jourFin)} ${moisFin}`;
}


/** Libellé d'équipe par poule : « -15 ans filles » seul, ou
    « -15 ans filles · 2e Division » quand la catégorie engage plusieurs équipes.

    La division n'est ajoutée que dans ce cas parce qu'elle est alors le SEUL
    discriminant — « Lunel Marsillargues-Lansargues » désigne trois équipes — et
    qu'elle alourdirait « -11 ans garçons », qui n'en a qu'une.

    Les poules non rattachées à une fiche de catégorie sont absentes de la
    table : l'appelant retombe sur le nom d'équipe brut de la FFHandball. */
export function libellesParPoule(matchs: MatchDuClub[]): Map<string, string> {
	const poulesParCategorie = new Map<string, Set<string>>();
	for (const m of matchs) {
		if (!m.categorieId) continue;
		if (!poulesParCategorie.has(m.categorieId)) poulesParCategorie.set(m.categorieId, new Set());
		poulesParCategorie.get(m.categorieId)!.add(m.poolId);
	}

	const table = new Map<string, string>();
	for (const m of matchs) {
		if (!m.categorieId || table.has(m.poolId)) continue;
		const plusieurs = (poulesParCategorie.get(m.categorieId)?.size ?? 1) > 1;
		table.set(
			m.poolId,
			plusieurs && m.division ? `${m.categorieLabel} · ${m.division}` : m.categorieLabel!,
		);
	}
	return table;
}

/** « sam 19 ». Le jour et le quantième, sans le mois : dans une liste bornée à
    sept jours, le mois ne lève aucune ambiguïté et coûte une colonne. */
export function jourCourt(valeur: string | null): string | null {
	const bloc = blocDate(valeur);
	return bloc ? `${bloc.jour} ${bloc.numero}` : null;
}
