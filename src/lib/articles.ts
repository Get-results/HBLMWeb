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
	const entrees = await getCollection('articles', ({ data }) => EN_LIGNE.has(data.publicationStatus));
	return entrees.sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

/* Les deux seuls statuts qui sortent du build. `demonstration` en fait partie
   au même titre que `publie` — c'est justement son objet : montrer la rubrique
   au bureau avant qu'un vrai article existe. Ce qui le distingue n'est pas sa
   visibilité mais l'avertissement qui l'accompagne partout (voir
   `estDemonstration`), et le `noindex` de sa page. */
const EN_LIGNE = new Set(['publie', 'demonstration']);

/** Article de démonstration : en ligne, mais sans aucune valeur d'information.
    Tout affichage qui le rend visible doit le signaler — c'est la contrepartie
    non négociable de sa mise en ligne. */
export function estDemonstration(article: Article): boolean {
	return article.data.publicationStatus === 'demonstration';
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

/* ── Prévisualisation des brouillons, en développement SEULEMENT ──────────────

   Un article non publié n'est visible nulle part : c'est le garde-fou, et il ne
   bouge pas. Mais il rendait impossible de RELIRE un article avant de le
   publier — la seule façon de voir à quoi il ressemble était de le mettre en
   ligne, c'est-à-dire exactement ce qu'on cherchait à éviter.

   `import.meta.env.DEV` ne vaut `true` que sous `astro dev`. Un `astro build`,
   celui du déploiement comme celui d'un contrôle local, le voit à `false` : les
   brouillons ne peuvent donc pas atteindre `dist/`, et encore moins la
   production. Ce n'est pas un réglage qu'on pourrait oublier de remettre — il
   n'y a rien à remettre. */
const PREVISUALISER_LES_BROUILLONS = import.meta.env.DEV;

/** Un article qui n'est pas `publie` — donc visible en local uniquement.
    Les pages s'en servent pour l'AFFICHER comme tel, jamais pour décider s'il
    paraît : cette décision-là se prend ici, et une seule fois. */
export function estBrouillon(article: Article): boolean {
	return !EN_LIGNE.has(article.data.publicationStatus);
}

/** Articles à afficher, du plus récent au plus ancien.
    En production : les `publie`, et rien d'autre.
    Sous `astro dev` : les brouillons aussi, signalés comme tels à l'écran.
    Les fichiers `exemple` restent exclus partout — ils documentent le schéma,
    ils ne se relisent pas. */
export async function getArticlesAffichables(): Promise<Article[]> {
	const publies = await getArticlesPublies();
	if (!PREVISUALISER_LES_BROUILLONS) return publies;

	const brouillons = await getCollection(
		'articles',
		({ data }) => data.publicationStatus === 'brouillon',
	);
	return [...publies, ...brouillons].sort(
		(a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id),
	);
}

/** Adresse de la page d'un article. Construite ici et non dans les pages :
    l'`id` d'une entrée est le nom de son fichier sans extension — c'est LUI le
    slug — et trois pages qui le recomposeraient chacune de leur côté finiraient
    par diverger. Le préfixe de base est obligatoire (AD-5) : le site est publié
    dans un sous-dossier, un « /vie-du-club/… » en dur y renverrait un 404. */
export function urlArticle(article: Article): string {
	return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/vie-du-club/${article.id}`;
}
