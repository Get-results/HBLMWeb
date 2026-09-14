/* Identité du club dans les données extérieures.

   L'API des matchs renvoie tous les matchs des poules suivies, adversaires
   compris : 24 sur 77 concernent le club à ce jour. Il faut donc savoir
   reconnaître nos équipes — et c'est aussi ce qui détermine si un match se joue
   à domicile ou à l'extérieur.

   La FFHandball n'orthographie pas le nom du club de la même façon d'une
   catégorie à l'autre. Les six formes ci-dessous sont RELEVÉES dans les données
   réelles, pas devinées. Une comparaison approximative (« contient LUNEL »)
   marcherait aujourd'hui et rattacherait un jour un club voisin par accident :
   on exige donc une correspondance exacte, et une forme inconnue est signalée
   au lieu d'être silencieusement ignorée. */
export const nomsEquipesClub = [
	'HANDBALL LUNEL MARSILLARGUES',
	'LUNEL MARSILLARGUES HB',
	'LUNEL MARSILLARGUES HB 2',
	'LUNEL MARSILLARGUES-LANSARGUES',
	'LUNEL MARSILLARGUES-LANSARGUES (-15F)',
	'LUNEL MARSILLARGUES-LANSARGUES (-18F)',
] as const;

const connus = new Set<string>(nomsEquipesClub);

/** Vrai si ce nom d'équipe est une équipe du club. Comparaison exacte : voir
    ci-dessus pourquoi on refuse l'approximation. */
export function estEquipeDuClub(nom: string): boolean {
	return connus.has(nom.trim());
}

/* ---------------------------------------------------------------------------
   Faits publiés sur le club

   Ces valeurs étaient écrites en dur, et deux fois : sur l'accueil et sur la
   page « Le club ». Le nombre de gymnases y était en outre un littéral (« nos
   4 gymnases ») qu'aucune liste ne garantissait — ajouter une salle laissait
   le texte mentir sans que rien ne le signale.
   -------------------------------------------------------------------------- */

/* Adresses transmises par le bureau le 13/09/2026. Les dénominations suivent
   celles du document du club — la page écrivait « Collège de Lansargues » et
   « Gymnase Pierre de Coubertin » là où le club dit « Gymnase du collège » et
   « Halle des sports Pierre de Coubertin ». Le planning utilise déjà la
   dénomination du club : garder deux noms pour une même salle selon la page
   était le vrai défaut. */
export const gymnases = [
	{
		nom: 'Gymnase Arnassan',
		rue: 'Avenue Louis Médard',
		codePostal: '34400',
		ville: 'Lunel',
	},
	{
		nom: 'Gymnase Spinosi',
		rue: 'Chemin des Calinières',
		codePostal: '34590',
		ville: 'Marsillargues',
	},
	{
		nom: 'Gymnase du collège',
		rue: '3 rue du Mondial 98',
		codePostal: '34130',
		ville: 'Lansargues',
	},
	{
		nom: 'Halle des sports Pierre de Coubertin',
		rue: '133-193 rue du Dardalhon',
		codePostal: '34400',
		ville: 'Lunel-Viel',
	},
] as const;

/** Nombre de gymnases, DÉDUIT de la liste ci-dessus et jamais écrit en toutes
    lettres : la phrase suit l'ajout ou le retrait d'une salle. */
export const nombreGymnases = gymnases.length;

/* Nombre de licenciés — même garde-fou que le `dataStatus` des catégories, et
   pour la même raison : le site est publiquement en ligne.

   « 351 licenciés en 2025 » vient du brief projet, relevé sur l'ancien site
   WordPress. Ce n'est donc pas un chiffre inventé, mais il porte le millésime
   2025 alors que la saison 2026-2027 a commencé, et il était accompagné sur
   l'accueil d'un « un record ! » que rien n'étaye. Tant que le bureau ne l'a
   pas actualisé ou confirmé, les pages n'affichent AUCUN chiffre plutôt qu'un
   chiffre périmé présenté comme courant.

   Pour le rétablir : passer `confirme` à true après accord du bureau, en
   corrigeant `nombre` et `annee` si besoin. Rien d'autre à toucher — les deux
   pages qui l'affichaient le relisent ici. */
export const licencies = {
	nombre: 351,
	annee: 2025,
	confirme: false,
} as const;
