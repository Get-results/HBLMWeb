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
	let reponse;
	try {
		reponse = await fetch(url, {
			headers: {
				Accept: 'application/json',
				/* Un User-Agent identifiable : l'API sait qui l'appelle, et une règle
				   de pare-feu peut cibler ce client plutôt que d'ouvrir tout le trafic
				   automatisé. Sans en-tête, Node s'annonce comme « undici ». */
				'User-Agent': 'HBLMWeb-build/1.0 (+https://github.com/Get-results/HBLMWeb)',
			},
			signal: AbortSignal.timeout(20_000),
		});
	} catch (erreur) {
		/* Cas vécu au premier déploiement : l'URL pointait un nom de service interne
		   à l'hébergeur. Un runner GitHub n'est pas sur ce réseau et ne peut pas le
		   résoudre. Le message brut (« EAI_AGAIN ») n'aide personne — on dit ce
		   qu'il faut vérifier. */
		const cause = erreur?.cause?.code;
		if (cause === 'EAI_AGAIN' || cause === 'ENOTFOUND') {
			throw new Error(
				`Nom d'hôte introuvable : « ${erreur.cause.hostname} ». ` +
					"MATCHES_API_BASE_URL doit être un domaine PUBLIC : ce build tourne sur " +
					"un runner GitHub, pas sur le réseau interne de l'hébergeur.",
			);
		}
		throw erreur;
	}
	if (!reponse.ok) {
		/* Le corps de la réponse dit souvent qui refuse et pourquoi — un pare-feu
		   intermédiaire renvoie une page HTML, l'API renvoie un JSON d'erreur. Sans
		   cet extrait, un 403 ne distingue pas les deux. */
		const extrait = (await reponse.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
		const parefeu = reponse.headers.get('server');
		throw new Error(
			`${chemin} → HTTP ${reponse.status} ${reponse.statusText}` +
				(parefeu ? ` (servi par « ${parefeu} »)` : '') +
				(extrait ? `\n  Réponse : ${extrait}` : '') +
				(reponse.status === 403
					? "\n  Un 403 sur une route publique vient généralement d'un pare-feu " +
						"devant l'API, pas de l'API : les runners GitHub ont des IP de " +
						'datacenter, souvent bloquées par défaut.'
					: ''),
		);
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
