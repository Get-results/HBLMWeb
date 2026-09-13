// Garde-fou : toute variable CSS utilisée doit être définie quelque part.
//
// Une `var(--token)` inconnue ne provoque ni erreur ni avertissement : la
// déclaration entière devient invalide et le navigateur l'ignore. Un
// `padding: var(--space-5)` où `--space-5` n'existe pas ne donne pas un padding
// par défaut, il n'en donne aucun — et rien dans la chaîne ne le signale. C'est
// arrivé sur l'île « Trouver ma catégorie » : build vert, trois garde-fous
// verts, et une mise en page cassée que seul l'œil a rattrapée.
//
// L'échelle d'espacement du projet a des trous volontaires (1, 2, 3, 4, 6, 8) :
// il est facile d'écrire un cran qui n'existe pas en croyant la série continue.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const RACINE = 'src';

const fichiers = (dossier) =>
	readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
		const chemin = join(dossier, entree.name);
		if (entree.isDirectory()) return fichiers(chemin);
		return ['.astro', '.css'].includes(extname(entree.name)) ? [chemin] : [];
	});

const sources = fichiers(RACINE).map((chemin) => [chemin, readFileSync(chemin, 'utf8')]);

// Définitions : partout, pas seulement dans tokens.css. Un composant a le droit
// de déclarer une variable locale, et l'ignorer produirait un faux positif.
const definis = new Set();
for (const [, contenu] of sources) {
	for (const [, nom] of contenu.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) definis.add(nom);
}

// `var(--x, valeur)` porte sa propre valeur de repli : l'absence de définition
// n'y casse rien, on ne la signale pas.
const UTILISATION = /var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g;

const problemes = [];
const utilises = new Set();
for (const [chemin, contenu] of sources) {
	const lignes = contenu.split('\n');
	lignes.forEach((ligne, index) => {
		for (const [, nom, suite] of ligne.matchAll(UTILISATION)) {
			if (suite === ',') continue;
			utilises.add(nom);
			if (!definis.has(nom)) {
				problemes.push(`  ${relative(RACINE, chemin)}:${index + 1} → var(${nom})`);
			}
		}
	});
}

if (problemes.length) {
	console.error(
		`\n✖ Variables CSS utilisées mais définies nulle part :\n${problemes.join('\n')}\n\n` +
			`  Une var() inconnue annule la déclaration qui la contient, sans erreur.\n` +
			`  Vérifie l'orthographe, ou ajoute le token dans src/styles/tokens.css.\n` +
			`  Rappel : l'échelle d'espacement est 1, 2, 3, 4, 6, 8 — il n'y a pas de 5 ni de 7.\n`,
	);
	process.exit(1);
}

console.log(`✓ Variables CSS : les ${utilises.size} tokens utilisés sont tous définis.`);
