/* Garde-fou d'accessibilité — anti-régression, pas audit initial.
 *
 * Le socle a11y du site est déjà posé et voulu : lien d'évitement premier
 * élément tabulable, `:focus-visible` global, `aria-label` sur les boutons
 * icône, un seul <h1> par page, zones tactiles à 44px. Le risque n'est pas de
 * ne pas savoir quoi faire, c'est qu'une modification future défasse tout ça
 * sans que personne ne le voie. Ce script fige les règles qui se vérifient sur
 * le HTML généré, pour que leur disparition casse le build.
 *
 * Pourquoi aucune dépendance (ni Playwright, ni pa11y, ni axe-core) :
 *   - Playwright/pa11y installent un navigateur complet. Pour un site de club
 *     amateur, c'est une charge de maintenance réelle (téléchargements en CI,
 *     versions de Chromium qui rouillent) sur un dépôt que personne ne
 *     surveillera dans deux ans. Le garde-fou mourrait avant le défaut.
 *   - axe-core sans navigateur (sur un DOM émulé) n'exécute que la moitié de
 *     ses règles : tout ce qui dépend du rendu — contraste, taille de cible,
 *     visibilité — remonte en « incomplete », c'est-à-dire silencieux. Le
 *     projet a déjà eu un garde-fou qui ne gardait rien ; en ajouter un second,
 *     plus gros, qui passe au vert sans rien tester serait pire que rien.
 *
 * Ce qui reste donc une vérification HUMAINE, assumé et non simulé :
 *   contraste des couleurs, taille réelle des zones tactiles, ordre de lecture
 *   visuel, pertinence des textes alternatifs. Ces points demandent un rendu
 *   ou un jugement ; les déclarer « vérifiés » par un outil statique serait un
 *   mensonge confortable.
 */
import { relative } from 'node:path';
import { pages } from './lib/html.mjs';

const DIST = 'dist';

/** Index de la balise fermante correspondant à `i`, ou la fin du document. */
function finElement(jetons, i) {
	const nom = jetons[i].nom;
	if (jetons[i].autoFermante) return i;
	let profondeur = 0;
	for (let k = i + 1; k < jetons.length; k++) {
		const j = jetons[k];
		if (j.type !== 'balise' || j.nom !== nom) continue;
		if (j.fermante) {
			if (profondeur === 0) return k;
			profondeur--;
		} else if (!j.autoFermante) profondeur++;
	}
	return jetons.length - 1;
}

/* Le texte perçu par une synthèse vocale : on saute les sous-arbres
   `aria-hidden` (la flèche décorative des CTA, les <svg> d'icônes) — sinon un
   bouton dont le seul contenu est une icône masquée passerait pour nommé. */
function texteAccessible(jetons, i) {
	const fin = finElement(jetons, i);
	let texte = '';
	for (let k = i + 1; k < fin; k++) {
		const j = jetons[k];
		if (j.type === 'texte') {
			texte += j.valeur;
			continue;
		}
		if (!j.fermante && (j.attrs['aria-hidden'] === 'true' || j.nom === 'svg')) {
			k = finElement(jetons, k);
		}
	}
	return texte.replace(/&nbsp;|&#160;/g, ' ').trim();
}

/** Tabulable au clavier : c'est ce qui définit l'ordre de parcours réel. */
function estTabulable(j) {
	if (j.type !== 'balise' || j.fermante) return false;
	const tabindex = j.attrs.tabindex;
	if (tabindex !== undefined && Number(tabindex) < 0) return false;
	if (j.attrs.disabled !== undefined) return false;
	if (tabindex !== undefined && Number(tabindex) >= 0) return true;
	if (j.nom === 'a' || j.nom === 'area') return j.attrs.href !== undefined;
	if (j.nom === 'input') return j.attrs.type !== 'hidden';
	return j.nom === 'button' || j.nom === 'select' || j.nom === 'textarea';
}

const CHAMPS = new Set(['input', 'select', 'textarea']);
/* Ces types d'input se nomment par leur propre valeur ou n'ont rien à nommer. */
const CHAMPS_SANS_ETIQUETTE = new Set(['hidden', 'submit', 'button', 'reset', 'image']);

const problemes = [];

for (const { chemin, jetons } of pages(DIST)) {
	const page = relative(DIST, chemin);
	const signale = (regle, detail) => problemes.push({ page, regle, detail });

	const balises = jetons.filter((j) => j.type === 'balise' && !j.fermante);
	const ids = balises.flatMap((j) => (j.attrs.id ? [j.attrs.id] : []));
	const idsUniques = new Set(ids);
	const nomme = (j, i) =>
		Boolean(
			j.attrs['aria-label']?.trim() ||
				j.attrs['aria-labelledby']?.trim() ||
				j.attrs.title?.trim() ||
				texteAccessible(jetons, i) ||
				j.attrs.alt?.trim(),
		);

	// Langue et titre : sans eux, la synthèse vocale prononce la page dans la
	// mauvaise langue et l'onglet n'est pas identifiable (WCAG 3.1.1, 2.4.2).
	const html = balises.find((j) => j.nom === 'html');
	if (!html?.attrs.lang?.trim()) signale('lang', '<html> sans attribut lang');

	const iTitre = jetons.findIndex((j) => j.type === 'balise' && !j.fermante && j.nom === 'title');
	if (iTitre === -1 || !texteAccessible(jetons, iTitre)) signale('title', '<title> absent ou vide');

	// Structure des titres : un seul h1, et pas de niveau sauté — c'est le plan
	// du document pour qui navigue de titre en titre.
	const titres = balises.filter((j) => /^h[1-6]$/.test(j.nom)).map((j) => Number(j.nom[1]));
	const nbH1 = titres.filter((n) => n === 1).length;
	if (nbH1 !== 1) signale('un-seul-h1', `${nbH1} <h1> au lieu d'un seul`);
	titres.reduce((precedent, niveau) => {
		if (precedent && niveau > precedent + 1) signale('niveaux-de-titre', `h${precedent} suivi de h${niveau}`);
		return niveau;
	}, 0);

	if (idsUniques.size !== ids.length) {
		const doublons = [...new Set(ids.filter((id, k) => ids.indexOf(id) !== k))];
		signale('id-unique', `id dupliqué(s) : ${doublons.join(', ')}`);
	}

	for (let i = 0; i < jetons.length; i++) {
		const j = jetons[i];
		if (j.type !== 'balise' || j.fermante) continue;

		// `alt` absent ≠ `alt=""` : le premier laisse le lecteur d'écran lire le
		// nom du fichier, le second déclare l'image décorative.
		if (j.nom === 'img' && j.attrs.alt === undefined) {
			signale('img-alt', `<img src="${j.attrs.src ?? '?'}"> sans attribut alt`);
		}

		// Masqué aux technologies d'assistance mais atteignable au clavier : le
		// focus part sur un élément que rien n'annonce.
		if (j.attrs['aria-hidden'] === 'true' && estTabulable(j)) {
			signale('aria-hidden-focusable', `<${j.nom} aria-hidden="true"> reste tabulable`);
		}

		/* Un élément retiré de l'arbre d'accessibilité n'a plus de nom à porter :
		   exiger une étiquette sur le piège à robots du formulaire (aria-hidden,
		   hors parcours clavier) ferait échouer le build sur un faux positif —
		   et un garde-fou qui crie à tort finit désactivé. */
		if (j.attrs['aria-hidden'] === 'true' || j.attrs.hidden !== undefined) continue;

		// Un contrôle sans nom accessible s'annonce « lien » ou « bouton », sans
		// dire vers quoi ni pour quoi faire.
		if ((j.nom === 'a' && j.attrs.href !== undefined) || j.nom === 'button') {
			if (!nomme(j, i)) signale('nom-accessible', `<${j.nom}> sans nom accessible (href/classe : ${j.attrs.href ?? j.attrs.class ?? '?'})`);
		}

		if (CHAMPS.has(j.nom) && !CHAMPS_SANS_ETIQUETTE.has(j.attrs.type ?? 'text')) {
			const etiquete =
				j.attrs['aria-label']?.trim() ||
				j.attrs['aria-labelledby']?.trim() ||
				(j.attrs.id && balises.some((b) => b.nom === 'label' && b.attrs.for === j.attrs.id));
			if (!etiquete) signale('champ-etiquette', `<${j.nom} name="${j.attrs.name ?? '?'}"> sans étiquette`);
		}

		if (j.nom === 'label' && j.attrs.for && !idsUniques.has(j.attrs.for)) {
			signale('label-orphelin', `<label for="${j.attrs.for}"> ne désigne aucun id de la page`);
		}

		// tabindex positif : réordonne le parcours clavier différemment de
		// l'ordre visuel, ce qui désynchronise les deux (WCAG 2.4.3).
		if (Number(j.attrs.tabindex) > 0) {
			signale('tabindex-positif', `<${j.nom} tabindex="${j.attrs.tabindex}">`);
		}

	}

	// Lien d'évitement : la règle porte sur la POSITION, pas sur un id en dur.
	// Il doit être le premier élément tabulable du corps de page, sinon il
	// n'évite plus rien — et sa cible doit exister (WCAG 2.4.1).
	const iBody = jetons.findIndex((j) => j.type === 'balise' && !j.fermante && j.nom === 'body');
	const premier = jetons.slice(iBody + 1).find(estTabulable);
	if (!premier) {
		signale('lien-evitement', 'aucun élément tabulable dans <body>');
	} else if (premier.nom !== 'a' || !premier.attrs.href?.startsWith('#')) {
		signale('lien-evitement', `le premier élément tabulable est <${premier.nom}>, pas un lien d'évitement`);
	} else if (!idsUniques.has(premier.attrs.href.slice(1))) {
		signale('lien-evitement', `le lien d'évitement vise « ${premier.attrs.href} », absent de la page`);
	}
}

if (problemes.length) {
	const parPage = new Map();
	for (const p of problemes) parPage.set(p.page, [...(parPage.get(p.page) ?? []), p]);

	console.error('\n✖ Régressions d\'accessibilité dans le site généré :\n');
	for (const [page, liste] of parPage) {
		console.error(`  ${page}`);
		for (const p of liste) console.error(`    [${p.regle}] ${p.detail}`);
	}
	console.error(`\n  ${problemes.length} problème(s). Rappel : contraste, taille des zones tactiles\n` +
		`  et ordre de lecture visuel ne sont PAS couverts ici et restent à vérifier à la main.\n`);
	process.exit(1);
}

console.log('✓ Accessibilité : socle structurel intact sur toutes les pages.');
