// Récupération des matchs — AD-4, AD-9.
//
// Appelle l'API du porteur du projet et REMPLACE INTÉGRALEMENT le fichier de la
// collection `matches`. Pas de fusion : l'API est la source de vérité unique à
// chaque exécution, et un upsert partiel laisserait vivre des matchs annulés.
//
// Tourne exclusivement côté serveur — GitHub Actions ou poste de développement.
// Aucun appel à cette API n'existe dans le code livré au navigateur (AD-9) : la
// page Matchs est construite à partir du fichier écrit ici.
//
// La route utilisée est publique et ne demande aucun en-tête. L'URL vient de
// l'environnement plutôt que du code : elle dépend du déploiement, pas du dépôt.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DESTINATION = 'src/content/matches/matches.json';
const base = process.env.MATCHES_API_BASE_URL?.replace(/\/$/, '');

if (!base) {
	console.error(
		"\n✖ MATCHES_API_BASE_URL n'est pas défini.\n" +
			"  En local  : MATCHES_API_BASE_URL=https://… npm run fetch:matches\n" +
			"  En CI     : secret d'environnement « api » (voir refresh-matches.yml).\n",
	);
	process.exit(1);
}

/* Un échec doit rester un échec. Écrire un fichier vide publierait une page
   « aucun match » qui se lirait comme une information, alors que c'est une
   panne : mieux vaut interrompre et laisser en ligne le dernier build réussi. */
async function recuperer(chemin) {
	const url = `${base}${chemin}`;
	const reponse = await fetch(url, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(20_000),
	});
	if (!reponse.ok) {
		throw new Error(`${chemin} → HTTP ${reponse.status} ${reponse.statusText}`);
	}
	return reponse.json();
}

const matchs = await recuperer('/api/matches');

if (!Array.isArray(matchs)) {
	throw new Error(`/api/matches n'a pas renvoyé un tableau (${typeof matchs}).`);
}

/* Le schéma Zod de la collection validera chaque entrée au build. Ici on ne
   vérifie que ce qui rendrait ce fichier inexploitable, pour échouer maintenant
   avec un message clair plutôt qu'au milieu du build. */
const champsAttendus = ['id', 'poolId', 'category', 'team1Name', 'team2Name'];
const incomplets = matchs.filter((m) => champsAttendus.some((c) => m?.[c] == null));
if (incomplets.length) {
	throw new Error(
		`${incomplets.length} match(s) sans champ obligatoire — ` +
			`l'API a-t-elle changé de forme ? Premier concerné : ${JSON.stringify(incomplets[0])}`,
	);
}

/* Tri à l'écriture plutôt qu'à l'affichage : le fichier devient lisible par un
   humain, et deux récupérations successives produisent le même ordre. */
matchs.sort((a, b) => (a.matchDate ?? '').localeCompare(b.matchDate ?? '') || a.id - b.id);

mkdirSync(dirname(DESTINATION), { recursive: true });
writeFileSync(DESTINATION, `${JSON.stringify(matchs, null, 2)}\n`, 'utf8');

const avecScore = matchs.filter((m) => m.team1Score !== null).length;
console.log(
	`✓ Matchs : ${matchs.length} récupéré(s), ${avecScore} avec score → ${DESTINATION}`,
);
