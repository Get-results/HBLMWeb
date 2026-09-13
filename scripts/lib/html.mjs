/* Socle commun aux garde-fous qui inspectent le HTML généré (`dist/`).
 *
 * Pourquoi un mini-tokeniseur maison plutôt qu'un parseur du registre npm :
 * le projet tient sur Astro + deux polices, et un dépôt de club amateur que
 * personne ne surveillera dans deux ans paie chaque dépendance au prix des
 * mises à jour de sécurité qu'il n'appliquera pas. Le HTML à lire est celui
 * qu'Astro produit, pas du HTML du web ouvert : pas de balise mal fermée,
 * pas d'attribut exotique. Un tokeniseur de 80 lignes suffit, et il tient
 * dans la tête de la personne qui devra le débugger.
 *
 * Ce que ce socle apporte face à l'approche « regex sur le texte brut » qui a
 * laissé passer `action="/api/contact"` : les attributs sont lus par structure,
 * donc un garde-fou peut les parcourir TOUS sans les énumérer. L'oubli de
 * `formaction`, `poster` ou `srcset` dans une liste devient impossible.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../../astro.config.mjs';

/** Préfixe de publication, sans slash final ('' si le site est à la racine). */
export const BASE = (config.base ?? '/').replace(/\/$/, '');

/** Éléments sans contenu : ils n'ont jamais de balise fermante à chercher. */
const VIDES = new Set([
	'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
	'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/* Le contenu de <script> et <style> n'est pas du HTML : un `<` y est un
   opérateur, pas une balise. On l'avale d'un bloc — sinon une comparaison en
   JS inline ferait dérailler le tokeniseur, et un garde-fou qui déraille est
   un garde-fou qui ne garde rien. */
const BRUTS = new Set(['script', 'style']);

const ATTRIBUT = /([a-zA-Z_:@][-a-zA-Z0-9_:.@]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function lireAttributs(source) {
	const attrs = {};
	for (const m of source.matchAll(ATTRIBUT)) {
		attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
	}
	return attrs;
}

/**
 * Découpe un document en jetons `{ type: 'balise' | 'texte' }`.
 * Les balises portent `nom`, `attrs`, `fermante`, `autoFermante` et la ligne
 * où elles commencent — c'est cette ligne qui rend un message d'erreur
 * actionnable plutôt que décoratif.
 */
export function tokeniser(html) {
	const jetons = [];
	const ligneDe = (index) => 1 + (html.slice(0, index).match(/\n/g)?.length ?? 0);
	let i = 0;

	while (i < html.length) {
		const lt = html.indexOf('<', i);
		if (lt === -1) {
			jetons.push({ type: 'texte', valeur: html.slice(i) });
			break;
		}
		if (lt > i) jetons.push({ type: 'texte', valeur: html.slice(i, lt) });

		if (html.startsWith('<!--', lt)) {
			const fin = html.indexOf('-->', lt);
			i = fin === -1 ? html.length : fin + 3;
			continue;
		}
		if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
			const fin = html.indexOf('>', lt);
			i = fin === -1 ? html.length : fin + 1;
			continue;
		}

		const entete = /^<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(lt, lt + 120));
		if (!entete) {
			// Un « < » littéral dans du texte : ce n'est pas une balise.
			jetons.push({ type: 'texte', valeur: '<' });
			i = lt + 1;
			continue;
		}

		// On cherche le « > » de fin en ignorant ceux placés dans une valeur
		// d'attribut (ex. content="a > b").
		let j = lt + entete[0].length;
		let guillemet = null;
		while (j < html.length) {
			const c = html[j];
			if (guillemet) {
				if (c === guillemet) guillemet = null;
			} else if (c === '"' || c === "'") {
				guillemet = c;
			} else if (c === '>') break;
			j++;
		}

		const brut = html.slice(lt, j);
		const nom = entete[2].toLowerCase();
		const fermante = entete[1] === '/';
		jetons.push({
			type: 'balise',
			nom,
			fermante,
			autoFermante: brut.trimEnd().endsWith('/') || VIDES.has(nom),
			attrs: fermante ? {} : lireAttributs(brut.slice(entete[0].length)),
			ligne: ligneDe(lt),
		});
		i = j + 1;

		if (!fermante && BRUTS.has(nom) && !brut.trimEnd().endsWith('/')) {
			const cloture = new RegExp(`</${nom}\\s*>`, 'i').exec(html.slice(i));
			i = cloture ? i + cloture.index + cloture[0].length : html.length;
			jetons.push({ type: 'balise', nom, fermante: true, autoFermante: false, attrs: {}, ligne: ligneDe(i) });
		}
	}
	return jetons;
}

/** Chemins de tous les .html d'un dossier, récursivement. */
export function fichiersHtml(racine) {
	return readdirSync(racine, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? fichiersHtml(join(racine, e.name))
			: e.name.endsWith('.html')
				? [join(racine, e.name)]
				: [],
	);
}

/** Les pages générées, tokenisées une fois pour toutes. */
export function pages(racine = 'dist') {
	return fichiersHtml(racine).map((chemin) => ({
		chemin,
		jetons: tokeniser(readFileSync(chemin, 'utf8')),
	}));
}

/* `srcset`/`imagesrcset` ne contiennent pas UNE cible mais une liste
   « url descripteur, url descripteur ». Sans ce découpage, la cible serait
   lue avec son « 2x » collé et jugée morte à tort. */
const LISTES = new Set(['srcset', 'imagesrcset']);

/**
 * Toutes les valeurs d'attributs d'une balise, éclatées en cibles unitaires.
 * Aucune énumération de noms d'attributs ici : c'est l'appelant qui décide
 * quoi retenir, en regardant la FORME de la valeur.
 */
export function ciblesDeLaBalise(jeton) {
	return Object.entries(jeton.attrs).flatMap(([nom, valeur]) =>
		(LISTES.has(nom) ? valeur.split(',') : [valeur])
			.map((part) => part.trim().split(/\s+/)[0])
			.filter(Boolean)
			.map((cible) => ({ attribut: nom, cible })),
	);
}

/** Vrai pour `https:`, `mailto:`, `tel:`, `data:`, `//cdn…` — hors périmètre. */
export function estExterne(cible) {
	return cible.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cible);
}

/**
 * Vrai si la valeur ressemble à une cible racine-absolue du site.
 * C'est le test de forme qui remplace l'énumération d'attributs.
 */
export function estCheminAbsolu(cible) {
	return cible.startsWith('/') && !cible.startsWith('//');
}
