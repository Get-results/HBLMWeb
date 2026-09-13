// Garde-fou AD-5 : le site est publié dans un sous-dossier (`base`).
// Tout chemin racine-absolu écrit en dur pointe donc hors du site (404).
// Voir ARCHITECTURE-SPINE.md → Consistency Conventions (« Chemins d'assets & liens »).
//
// Ce contrôle reste distinct de `check:links` alors que les deux se recoupent :
// ils diagnostiquent deux causes différentes, donc deux correctifs différents.
// Ici la cible est peut-être parfaitement valide, c'est le préfixe qui manque et
// la réponse est toujours la même — passer par `import.meta.env.BASE_URL`.
// Là-bas, la cible est préfixée mais ne désigne rien, et la réponse est de créer
// la page ou de corriger l'adresse. Les fusionner produirait un script à deux
// branches et un message de moins bonne qualité pour économiser un parcours de
// dix fichiers, soit quelques millisecondes. Ce qu'ils partagent vraiment — la
// lecture du HTML — est mutualisé dans `lib/html.mjs`.
//
// Correction post-mortem : la version initiale énumérait les attributs à
// surveiller (`src`, `href`) et laissait passer `action="/api/contact"`, d'où un
// formulaire de contact mort en production. La liste a été complétée, mais une
// liste à compléter est un défaut en attente : `formaction`, `poster`, `srcset`
// manquaient encore. On ne regarde donc plus le NOM de l'attribut mais la FORME
// de sa valeur — tout attribut valant « /quelque-chose » est examiné.
import { BASE, pages, ciblesDeLaBalise, estCheminAbsolu } from './lib/html.mjs';

if (!BASE) process.exit(0); // publié à la racine : rien à vérifier

const fautifs = [];

for (const { chemin, jetons } of pages('dist')) {
	for (const jeton of jetons) {
		if (jeton.type !== 'balise' || jeton.fermante) continue;
		for (const { attribut, cible } of ciblesDeLaBalise(jeton)) {
			// `//host` est protocole-relatif, pas un chemin du site.
			if (!estCheminAbsolu(cible)) continue;
			if (cible === BASE || cible.startsWith(`${BASE}/`)) continue;
			fautifs.push(`  ${chemin.replace(/^dist\//, '')} → ${attribut}="${cible}"`);
		}
	}
}

if (fautifs.length) {
	console.error(
		`\n✖ Chemins absolus non préfixés par « ${BASE} » (ils renverront 404) :\n${fautifs.join('\n')}\n` +
			`  Corrige avec import.meta.env.BASE_URL au lieu d'un « / » en dur.\n`,
	);
	process.exit(1);
}
