import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;

/* Point de passage UNIQUE entre la collection `articles` et les pages, sur le
   modèle de src/lib/categories.ts et pour la même raison : le site est
   publiquement en ligne. Un brouillon, ou l'article d'exemple qui montre le
   schéma, se publierait comme une communication officielle du club. Confier ce
   filtre à chaque page, c'est accepter qu'il soit oublié une fois. Aucune page
   n'appelle `getCollection('articles')` directement. */

/** Articles publiables, du plus récent au plus ancien.
    Le tri est lexicographique : les dates sont en ISO « AAAA-MM-JJ », donc
    l'ordre alphabétique EST l'ordre chronologique — pas besoin d'un Date, qui
    ferait entrer un fuseau horaire dans un tri qui n'en a aucun besoin.
    À égalité de date, l'`id` (le nom du fichier) départage : sans ça l'ordre
    dépendrait de celui du système de fichiers, qui varie entre machines. */
export async function getArticlesPublies(): Promise<Article[]> {
	const entrees = await getCollection('articles', ({ data }) => data.publicationStatus === 'publie');
	return entrees.sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

/* Libellés lisibles des catégories d'articles. Ils vivent ici et non dans le
   contenu : le frontmatter porte une clé stable, l'affichage porte un libellé
   qu'on peut réécrire sans toucher à un seul article. */
const LIBELLES_CATEGORIE: Record<Article['data']['category'], string> = {
	'vie-du-club': 'Vie du club',
	actualite: 'Actualité',
	evenement: 'Événement',
};

/** Libellé affichable du type d'article (« Événement »). */
export function libelleCategorie(categorie: Article['data']['category']): string {
	return LIBELLES_CATEGORIE[categorie];
}

const MOIS = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 14 septembre 2026 ». Découpée à la main plutôt que passée par un `Date` :
    « 2026-09-14 » y serait lu comme minuit UTC, puis réaffiché dans le fuseau de
    la machine de build — à l'ouest de Greenwich, la date reculerait d'un jour. */
export function formaterDateArticle(date: string): string {
	const [annee, mois, jour] = date.split('-');
	return `${Number(jour)} ${MOIS[Number(mois) - 1]} ${annee}`;
}
