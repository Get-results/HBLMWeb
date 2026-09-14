// Garde-fou de versionnement : la version de `package.json` doit avoir augmenté
// par rapport à la branche de base. Voir CLAUDE.md § 7 — « une PR, un incrément ».
//
// POURQUOI UN CONTRÔLE, ET PAS SEULEMENT LA RÈGLE ÉCRITE. Sur ce dépôt, quatre
// règles écrites ont déjà été enfreintes dans le code — texte sur accent, chemins
// absolus, motif griffé sur un élément interactif, et le garde-fou git lui-même,
// écrit puis laissé sur une branche jamais fusionnée. À chaque fois la règle
// existait, dans un document que personne n'ouvre en codant. Une version qu'on
// oublie d'incrémenter ne casse rien tout de suite : elle rend juste le numéro
// affiché en bas de page faux, et un numéro faux est pire que pas de numéro.
//
// CE QU'IL NE VÉRIFIE PAS, ET C'EST ASSUMÉ : que l'incrément soit du bon ORDRE.
// Décider qu'un changement est MAJOR, MINOR ou PATCH demande de savoir si une URL
// disparaît — un jugement, pas une comparaison de chaînes. Le script vérifie qu'on
// s'est posé la question, pas qu'on y a bien répondu.
//
// Usage : node scripts/check-version-bump.mjs
//   BASE_REF — branche de comparaison (défaut : main).
// En local, `git fetch origin main` doit avoir été fait au moins une fois.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseRef = process.env.BASE_REF || 'main';

/* Un numéro de version est un triplet d'entiers. On refuse tout le reste plutôt
   que de le comparer de travers : `0.1.0-beta` passerait une comparaison naïve et
   personne ne saurait dire dans quel sens. Le jour où une préversion est
   nécessaire, c'est ici qu'on l'ajoute, sciemment. */
function versionEnTriplet(brut, provenance) {
	const correspondance = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(brut ?? '').trim());
	if (!correspondance) {
		throw new Error(
			`Version illisible dans ${provenance} : « ${brut} ».\n` +
				'Format attendu : X.Y.Z, trois entiers (Semantic Versioning 2.0.0).',
		);
	}
	return correspondance.slice(1, 4).map(Number);
}

/* -1, 0 ou 1 — l'ordre lexicographique sur le triplet, qui est exactement l'ordre
   de précédence défini par la spec pour des versions sans préversion. */
function comparer([aMaj, aMin, aCor], [bMaj, bMin, bCor]) {
	return aMaj - bMaj || aMin - bMin || aCor - bCor;
}

function versionDeLaBase() {
	try {
		const paquet = execFileSync('git', ['show', `origin/${baseRef}:package.json`], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		return versionEnTriplet(JSON.parse(paquet).version, `origin/${baseRef}`);
	} catch (erreur) {
		/* Pas de comparaison possible = pas de verdict. On le dit et on sort en
		   succès : un contrôle qui échoue faute de pouvoir travailler bloquerait
		   toutes les PR sur un incident d'outillage, ce qui apprend à le contourner. */
		console.warn(
			`⚠ Version : comparaison impossible avec origin/${baseRef} — contrôle ignoré.\n` +
				`  ${erreur.message.split('\n')[0]}\n` +
				`  En local : git fetch origin ${baseRef}`,
		);
		return null;
	}
}

/* Une version illisible est une erreur de l'auteur, pas un plantage du script :
   elle mérite le même message lisible que les autres refus, pas une trace de pile
   qu'il faut décoder pour comprendre qu'il manque un chiffre. */
let actuelle;
let base;
try {
	actuelle = versionEnTriplet(
		JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
		'package.json',
	);
	base = versionDeLaBase();
} catch (erreur) {
	console.error(`✗ ${erreur.message}`);
	process.exit(1);
}

if (base === null) process.exit(0);

const ecart = comparer(actuelle, base);
const enTexte = (triplet) => triplet.join('.');

if (ecart > 0) {
	console.log(`✓ Version : ${enTexte(base)} → ${enTexte(actuelle)}.`);
	process.exit(0);
}

console.error(
	ecart === 0
		? `✗ Version inchangée (${enTexte(actuelle)}).\n\n` +
				'Chaque PR incrémente la version — CLAUDE.md § 7. Le numéro est affiché en bas\n' +
				"de chaque page : sans incrément, la page annonce une version qui n'est plus celle\n" +
				"qu'on regarde.\n"
		: `✗ Version en recul : ${enTexte(base)} sur origin/${baseRef}, ${enTexte(actuelle)} ici.\n\n` +
				'Une version ne redescend jamais. Rebase probable sur une base plus récente.\n'
);
console.error(
	'  npm version patch  — correction, ou invisible pour le visiteur (doc, CI comprises)\n' +
		'  npm version minor  — ajout compatible : rien de ce qui existait ne casse\n' +
		'  npm version major  — une URL disparaît ou change (on reste en 0.y.z avant la mise en ligne)\n\n' +
		'Ajouter --no-git-tag-version pour écrire le fichier sans créer de tag ni de commit.',
);
process.exit(1);
