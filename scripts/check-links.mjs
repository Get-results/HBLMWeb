/* Garde-fou « toute cible interne existe vraiment ».
 *
 * Pourquoi il existe : deux défauts sont partis en production sans que rien ne
 * les arrête — un <form action="/api/contact"> pointant vers une route serveur
 * qui ne peut pas exister sur un site statique (messages perdus en silence), et
 * trois liens de navigation en 404 dont le CTA principal de la page Inscription.
 * Les deux se ramènent à la même question, jamais posée : « ce que je désigne
 * est-il réellement présent dans `dist/` ? ». Ce script la pose, une fois, sur
 * tout le site généré.
 *
 * Principe : on relit le HTML produit, pas les sources. Un lien peut être
 * correct dans un .astro et faux après rendu (base mal préfixée, page
 * supprimée, ancre renommée) ; seul `dist/` dit la vérité qui sera publiée.
 *
 * Hors périmètre, assumé :
 *   - les cibles externes (http://, https://, //cdn…) : leur disponibilité
 *     dépend d'un tiers, la vérifier en CI rendrait le build dépendant du
 *     réseau et sujet à des échecs qui ne viennent pas de nous ;
 *   - mailto: et tel: : rien à résoudre dans `dist/` ;
 *   - data: et javascript: : pas des cibles de navigation.
 *
 * Dans le périmètre, y compris les ancres (`#contact-form`) : une ancre morte
 * est exactement le même échec vécu qu'un lien mort — le visiteur clique et
 * n'arrive pas où on le lui promet. Le CTA fautif de la rétro était d'ailleurs
 * un lien à ancre. L'`id` cible est dans le HTML voisin : le coût de la
 * vérification est nul, l'omettre serait un choix par paresse.
 */
import { existsSync, statSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { BASE, pages, ciblesDeLaBalise, estExterne, estCheminAbsolu } from './lib/html.mjs';

const DIST = 'dist';

/* Les cibles racine-absolues et les ancres sont reconnues à leur FORME, sans
   regarder le nom de l'attribut : c'est ce qui évite de rejouer l'oubli de
   `action` avec `formaction` ou `poster` la prochaine fois.
   Les cibles RELATIVES, elles, sont indiscernables d'une valeur quelconque
   (`class="a b"`, `viewBox="0 0 24 24"`) : là seulement il faut connaître
   l'attribut. Le site n'en produit pas aujourd'hui, la liste est une réserve. */
const ATTRIBUTS_URL_RELATIVE = new Set([
	'href', 'src', 'action', 'formaction', 'poster', 'srcset', 'imagesrcset', 'data', 'cite', 'ping',
]);

/** Tous les ancrages atteignables d'une page : `id`, plus `name` sur <a>. */
function ancres(jetons) {
	const trouvees = new Set();
	for (const j of jetons) {
		if (j.type !== 'balise' || j.fermante) continue;
		if (j.attrs.id) trouvees.add(j.attrs.id);
		if (j.nom === 'a' && j.attrs.name) trouvees.add(j.attrs.name);
	}
	return trouvees;
}

const documents = new Map(pages(DIST).map((p) => [p.chemin, p]));
const ancresParFichier = new Map([...documents].map(([chemin, p]) => [chemin, ancres(p.jetons)]));

/**
 * Fichier servi pour un chemin de site, ou null s'il n'y en a aucun.
 * GitHub Pages sert `/x` depuis `x/index.html` ou `x.html` : les deux comptent,
 * sinon on déclarerait morts des liens qui fonctionnent en production.
 */
function fichierServi(cheminSite) {
	const nettoye = cheminSite.replace(/^\/+/, '').replace(/\/+$/, '');
	const candidats = nettoye
		? [join(DIST, nettoye), join(DIST, nettoye, 'index.html'), join(DIST, `${nettoye}.html`)]
		: [join(DIST, 'index.html')];
	return candidats.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const morts = [];

for (const { chemin, jetons } of documents.values()) {
	const signale = (cible, attribut, raison) =>
		morts.push({ page: relative(DIST, chemin), attribut, cible, raison });

	for (const jeton of jetons) {
		if (jeton.type !== 'balise' || jeton.fermante) continue;

		for (const { attribut, cible } of ciblesDeLaBalise(jeton)) {
			if (estExterne(cible)) continue;

			const ancre = cible.startsWith('#');
			const absolu = estCheminAbsolu(cible);
			if (!ancre && !absolu && !ATTRIBUTS_URL_RELATIVE.has(attribut)) continue;

			// La partie utile s'arrête à la query ; le fragment est traité à part.
			const [avantFragment, fragment] = cible.split('#');
			const sansQuery = avantFragment.split('?')[0];

			let fichierCible = chemin;
			if (!ancre && sansQuery) {
				let cheminSite = sansQuery;
				if (absolu) {
					if (BASE && cheminSite !== BASE && !cheminSite.startsWith(`${BASE}/`)) {
						/* Hors du préfixe de publication : la cible ne sera jamais
						   servie. `check:paths` explique le correctif (BASE_URL) ;
						   on le redit ici pour que ce script reste autonome si
						   l'autre disparaît. */
						signale(cible, attribut, `hors du préfixe de publication « ${BASE} »`);
						continue;
					}
					cheminSite = cheminSite.slice(BASE.length);
				} else {
					cheminSite = posix.normalize(posix.join('/', relative(DIST, dirname(chemin)), cheminSite));
				}

				fichierCible = fichierServi(cheminSite);
				if (!fichierCible) {
					signale(cible, attribut, 'aucun fichier généré ne répond à ce chemin');
					continue;
				}
			}

			if (!fragment) continue;

			// Une ancre ne se vérifie que dans une page HTML.
			if (!fichierCible.endsWith('.html')) continue;
			if (!ancresParFichier.get(fichierCible)?.has(fragment)) {
				signale(cible, attribut, `aucun id « ${fragment} » dans ${relative(DIST, fichierCible)}`);
			}
		}
	}
}

if (morts.length) {
	const parPage = new Map();
	for (const m of morts) parPage.set(m.page, [...(parPage.get(m.page) ?? []), m]);

	console.error('\n✖ Liens internes morts dans le site généré :\n');
	for (const [page, liens] of parPage) {
		console.error(`  ${page}`);
		for (const l of liens) console.error(`    ${l.attribut}="${l.cible}" → ${l.raison}`);
	}
	console.error(
		`\n  ${morts.length} cible(s) morte(s). Une cible qui n'existe pas dans dist/ est\n` +
			`  un 404 en production — ou, pour un formulaire, une soumission perdue.\n`,
	);
	process.exit(1);
}

console.log(`✓ Liens internes : toutes les cibles de ${documents.size} page(s) existent.`);
