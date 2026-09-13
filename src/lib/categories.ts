import { getCollection, type CollectionEntry } from 'astro:content';

export type Categorie = CollectionEntry<'categories'>;

/* Point de passage UNIQUE entre la collection `categories` et les pages.
   Le site est publiquement en ligne : une fiche dont le bureau du club n'a pas
   confirmé les informations ne doit jamais s'afficher comme un fait. Plutôt que
   de confier ce filtre à chaque page (où il finira par être oublié une fois),
   on ne publie qu'à travers ces fonctions. Toute page qui affiche des créneaux
   ou des tarifs passe par ici — jamais par `getCollection('categories')`. */

/** Catégories publiables : uniquement celles validées par le bureau du club. */
export async function getCategoriesPubliees(): Promise<Categorie[]> {
	const entrees = await getCollection('categories', ({ data }) => data.dataStatus === 'confirme');
	return entrees.sort((a, b) => a.data.order - b.data.order);
}

/** Nombre de fiches en attente de confirmation — sert à dire honnêtement
    « c'est en cours de préparation » sans révéler de contenu non validé. */
export async function compterCategoriesEnAttente(): Promise<number> {
	const entrees = await getCollection('categories', ({ data }) => data.dataStatus === 'a-confirmer');
	return entrees.length;
}

/** Formate un créneau pour l'affichage : « Mardi 17h30–19h00 — Gymnase X ». */
export function formaterCreneau(creneau: Categorie['data']['trainingSlots'][number]): string {
	const jour = creneau.day.charAt(0).toUpperCase() + creneau.day.slice(1);
	const heure = (valeur: string) => valeur.replace(':', 'h');
	return `${jour} ${heure(creneau.startTime)}–${heure(creneau.endTime)} — ${creneau.venue}`;
}

/** Tarif formaté en euros. `null` n'a pas de rendu ici : une fiche publiée porte
    forcément un tarif (garanti par le schéma), et ailleurs on n'affiche rien. */
export function formaterTarif(licenseFee: number): string {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0,
	}).format(licenseFee);
}

/* ---------------------------------------------------------------------------
   Aperçu des fiches non confirmées — Story 2.3

   Le parcours « Trouver ma catégorie » ne sert à rien tant qu'aucune fiche n'est
   confirmée : impossible de le tester, impossible de le montrer. On autorise
   donc l'affichage des fiches `a-confirmer` EN DÉVELOPPEMENT uniquement.

   `import.meta.env.DEV` est vrai sous `npm run dev` et faux dans tout build de
   production : le site publié ne peut pas afficher de données non validées, même
   si quelqu'un oublie de repasser un drapeau. La variable d'environnement offre
   une porte de sortie explicite si un aperçu déployé devenait nécessaire.

   Partout où l'aperçu est actif, l'interface DOIT afficher un avertissement
   visible : c'est la contrepartie, et `apercuActif` sert justement à le
   déclencher. -------------------------------------------------------------- */
export const apercuActif =
	import.meta.env.DEV || import.meta.env.PUBLIC_CATEGORIES_APERCU === 'true';

/** Catégories utilisables par le parcours : les confirmées, plus les fiches en
    attente lorsque l'aperçu est actif. */
export async function getCategoriesResolvables(): Promise<Categorie[]> {
	const statutsAdmis = apercuActif ? ['confirme', 'a-confirmer'] : ['confirme'];
	const entrees = await getCollection('categories', ({ data }) =>
		statutsAdmis.includes(data.dataStatus),
	);
	return entrees.sort((a, b) => a.data.order - b.data.order);
}

/* ---------------------------------------------------------------------------
   Résolution d'un profil — AD-7

   UNIQUE endroit où un profil devient une catégorie. `CategoriesInfos` liste,
   il ne résout pas ; l'île appelle cette fonction. Deux calculs de catégorie
   dans le projet, c'est la garantie qu'ils divergeront.
   -------------------------------------------------------------------------- */
export type Genre = 'F' | 'M';
export type Pratique = 'competition' | 'loisir' | 'handfit';

export interface Profil {
	birthYear: number;
	gender: Genre;
	/* Posée seulement aux profils adultes ; `null` pour les jeunes. */
	practice?: Pratique | null;
}

/* Une catégorie `mixte` accueille les deux genres : elle correspond à tout
   profil dont l'année tombe dans ses bornes. Une catégorie genrée exige
   l'égalité stricte. */
function genreCompatible(categorie: Categorie, genre: Genre): boolean {
	return categorie.data.gender === 'mixte' || categorie.data.gender === genre;
}

/* Bornes incluses. `null` d'un côté = pas de limite de ce côté — typiquement
   `birthYearFrom: null` chez les séniors, qui n'ont pas d'âge maximal. */
function anneeDansBornes(categorie: Categorie, birthYear: number): boolean {
	const { birthYearFrom, birthYearTo } = categorie.data;
	if (birthYearFrom !== null && birthYear < birthYearFrom) return false;
	if (birthYearTo !== null && birthYear > birthYearTo) return false;
	return birthYearFrom !== null || birthYearTo !== null;
}

function pratiqueCompatible(categorie: Categorie, pratique: Pratique | null | undefined): boolean {
	/* Une catégorie sans distinction compétition/loisir convient à tout le monde. */
	if (categorie.data.practice === null) return true;
	/* Si la question n'a pas été posée, on ne tranche pas à la place du visiteur :
	   la catégorie n'est pas retenue, et le contact générique prend le relais. */
	if (!pratique) return false;
	return categorie.data.practice === pratique;
}

/** Résout un profil en une catégorie, ou `null` si rien ne correspond.
    `null` n'est pas un échec technique : c'est le cas nominal tant que le bureau
    n'a pas confirmé les bornes d'âge, et l'appelant doit alors afficher le
    contact générique plutôt qu'un résultat inventé (FR-3). */
export function resoudreCategorie(categories: Categorie[], profil: Profil): Categorie | null {
	const candidates = categories.filter(
		(categorie) =>
			genreCompatible(categorie, profil.gender) &&
			anneeDansBornes(categorie, profil.birthYear) &&
			pratiqueCompatible(categorie, profil.practice),
	);
	/* `order` porte déjà l'intention éditoriale du club : à égalité de critères,
	   la première dans cet ordre est la bonne. */
	return candidates[0] ?? null;
}

/** Un profil est adulte si son année de naissance le place hors des catégories
    de jeunes — c'est ce qui déclenche la question compétition/loisir (AD-7).
    Le seuil est déduit des données et non écrit en dur : il suivra tout seul le
    changement de saison. */
export function estProfilAdulte(categories: Categorie[], birthYear: number): boolean {
	return categories.some(
		(categorie) =>
			categorie.data.practice !== null && anneeDansBornes(categorie, birthYear),
	);
}
