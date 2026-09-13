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
