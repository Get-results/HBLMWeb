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
