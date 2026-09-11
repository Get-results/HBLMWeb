// Garde-fou AD-5 : le site est publié dans un sous-dossier (`base`).
// Tout chemin racine-absolu écrit en dur pointe donc hors du site (404).
// Voir ARCHITECTURE-SPINE.md → Consistency Conventions (« Chemins d'assets & liens »).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import config from '../astro.config.mjs';

const base = (config.base ?? '/').replace(/\/$/, '');
if (!base) process.exit(0); // publié à la racine : rien à vérifier

const htmlFiles = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
	);

// src="/x", href="/x" ou action="/x", en excluant `//host` (protocole-relatif)
// et les chemins déjà préfixés. `action` compte : un <form action="/api/…"> sur
// un site statique pointe hors du site et perd la soumission en silence.
const OFFENDER = new RegExp(`(?:src|href|action)="(/(?!/|${base.slice(1)}/)[^"]*)"`, 'g');

const offenders = htmlFiles('dist').flatMap((file) =>
	[...readFileSync(file, 'utf8').matchAll(OFFENDER)].map((m) => `  ${relative('dist', file)} → ${m[1]}`),
);

if (offenders.length) {
	console.error(
		`\n✖ Chemins absolus non préfixés par « ${base } » (ils renverront 404) :\n${offenders.join('\n')}\n` +
			`  Corrige avec import.meta.env.BASE_URL au lieu d'un « / » en dur.\n`,
	);
	process.exit(1);
}
