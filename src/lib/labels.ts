/* Labels fédéraux FFHandball obtenus par le club.

   ── Ce que c'est ───────────────────────────────────────────────────────────
   Depuis 2023, la FFHandball labellise ses clubs sur dix thématiques. Un label
   n'est pas un trophée sportif : il atteste que le club structure durablement
   une activité — former ses arbitres, encadrer les tout-petits, faire vivre
   l'association. Il est délivré pour DEUX ANS, sur dossier instruit par le
   comité départemental et la ligue.

   ── D'où viennent ces données ──────────────────────────────────────────────
   Les sept labels ci-dessous sont RELEVÉS le 15/09/2026 sur la fiche officielle
   du club (voir `ficheOfficielle`), et non transmis par le bureau. C'est une
   source publique et fédérale, donc publiable en l'état — contrairement au
   nombre de licenciés de club.ts, qui reste tu faute de chiffre à jour. La même
   fiche annonce d'ailleurs 99 licenciés, ce que le bureau sait faux : la fiche
   est à jour sur les labels, pas sur les effectifs. Ne pas en tirer d'autres
   chiffres.

   ── Ce qui n'y est pas, et pourquoi le fichier n'en parle pas ──────────────
   La fiche officielle n'affiche NI le niveau de chaque label (s'il en existe
   un), NI la période de validité des deux ans en cours. Ces deux informations
   sont donc absentes de ce fichier plutôt qu'estimées : une date de validité
   inventée se périmerait en silence. Elles sont demandées au bureau
   (A-FAIRE-HORS-CODE.md) ; quand elles arrivent, ajouter les champs ici et les
   afficher sur la page — rien d'autre à toucher.

   ── Les textes ─────────────────────────────────────────────────────────────
   Les descriptions décrivent le DISPOSITIF FÉDÉRAL : ce que le label
   récompense, chez n'importe quel club. Elles sont volontairement génériques,
   parce qu'aucun texte propre au HBLM n'a encore été transmis. Elles sont donc
   exactes mais impersonnelles : quand le bureau fournira ce que le club fait
   concrètement pour chaque label, c'est `description` qu'on remplacera — la
   page n'a pas besoin de changer. */

import type { ImageMetadata } from 'astro';

import arbitrage from '../assets/labels/arbitrage.png';
import babyhand from '../assets/labels/babyhand.png';
import clubFormateur from '../assets/labels/club-formateur.png';
import ecoleDeHand from '../assets/labels/ecole-de-hand.png';
import feminisation from '../assets/labels/feminisation.png';
import handA4 from '../assets/labels/hand-a-4.png';
import vieDuClub from '../assets/labels/vie-du-club.png';

/** Fiche du club sur l'annuaire fédéral — la source de tout ce fichier. */
export const ficheOfficielle = 'https://monclub.ffhandball.fr/clubs/handball-lunel-marsillargues/';

/** Date du relevé, au format des dates du projet. Sert à dater l'information
    sur la page : un label court deux ans, le visiteur a le droit de savoir de
    quand date ce qu'il lit. */
export const dateReleve = '2026-09-15';

/** Nombre total de labels au catalogue fédéral, toutes thématiques confondues.
    Il sert la phrase « 7 des 10 labels », et rien d'autre : les trois que le
    club n'a pas ne sont volontairement pas listés ici — une page qui parle de
    ce que le club N'A PAS ne valorise personne. */
export const nombreLabelsFederaux = 10;

export type Label = {
	/** Identifiant stable, et ancre de la page (`/labels#arbitrage`). */
	slug: string;
	/** Nom du label, orthographié comme la fédération l'écrit. */
	nom: string;
	/** Pictogramme officiel FFHandball (voir src/assets/labels/README.md). */
	icone: ImageMetadata;
	/** Une phrase : ce que le label dit du club, lisible seule sur une carte. */
	resume: string;
	/** Ce que la fédération regarde pour l'attribuer. Deux ou trois phrases. */
	description: string;
};

/* Ordre d'affichage : celui de la fiche officielle. Il n'a rien d'alphabétique
   ni de hiérarchique — aucun label ne prime sur un autre, et les réordonner par
   importance supposée reviendrait à inventer un classement fédéral qui
   n'existe pas. */
export const labelsDuClub: Label[] = [
	{
		slug: 'arbitrage',
		nom: 'Arbitrage',
		icone: arbitrage,
		resume: 'Le club forme et accompagne ses propres arbitres.',
		description:
			"Sans arbitres, aucun match ne se joue. Ce label distingue les clubs qui prennent leur part de cette responsabilité collective plutôt que de compter sur les autres : repérer des jeunes volontaires, les former, les accompagner au bord du terrain lors de leurs premières désignations, et les garder d'une saison à l'autre. La fédération regarde le nombre d'arbitres formés au regard de la taille du club, et la présence d'un référent qui suit réellement leur progression.",
	},
	{
		slug: 'babyhand',
		nom: 'BabyHand',
		icone: babyhand,
		resume: 'Une vraie pratique pour les 3 à 5 ans, encadrée par des adultes formés.',
		description:
			"Le BabyHand n'est pas du handball en plus petit : c'est de l'éveil moteur — courir, attraper, lancer, jouer avec les autres — dans lequel le ballon n'est qu'un prétexte. Le label vérifie que le créneau existe vraiment dans la semaine, qu'il est tenu par un encadrant formé à cette tranche d'âge, et que le matériel est adapté à des enfants de trois ans.",
	},
	{
		slug: 'feminisation',
		nom: 'Féminisation',
		icone: feminisation,
		resume: 'Les femmes jouent, encadrent et dirigent le club.',
		description:
			"Ce label ne compte pas seulement les licenciées. Il regarde aussi qui entraîne, qui arbitre et qui siège au conseil d'administration : un club où les femmes sont nombreuses sur le terrain mais absentes des instances ne le décroche pas. Il valorise donc autant l'accueil des joueuses que l'accès des femmes aux responsabilités associatives.",
	},
	{
		slug: 'club-formateur',
		nom: 'Club Formateur',
		icone: clubFormateur,
		resume: "Un parcours construit pour progresser, de l'école de hand aux seniors.",
		description:
			"Former, c'est faire progresser un joueur sur plusieurs saisons, et non aligner la meilleure équipe possible chaque week-end. Le label distingue les clubs qui organisent ce parcours : des catégories qui s'enchaînent sans rupture, des entraîneurs diplômés à chaque étage, et une attention portée à ceux qui progressent moins vite autant qu'aux plus doués.",
	},
	{
		slug: 'hand-a-4',
		nom: 'Hand à 4',
		icone: handA4,
		resume: 'Une forme de jeu réduite, accessible et sans contact.',
		description:
			"Quatre joueurs, un terrain plus court, pas de contact : le Hand à 4 se pratique en salle comme en plein air, et se découvre en quelques minutes. Il ouvre le handball à ceux que la compétition à sept n'attire pas — adultes qui reprennent le sport, publics scolaires, animations de quartier. Le label récompense les clubs qui en font une pratique installée, et pas seulement une animation d'un après-midi.",
	},
	{
		slug: 'vie-du-club',
		nom: 'Vie du Club',
		icone: vieDuClub,
		resume: "La vie associative, les bénévoles et l'ancrage dans la ville.",
		description:
			"C'est le label du hors-terrain : un bureau qui fonctionne, des bénévoles accueillis et reconnus, des moments qui rassemblent les familles, une communication qui tient informés licenciés et parents, et des liens réels avec les communes et les partenaires. Il distingue les clubs où l'on reste pour l'ambiance autant que pour le sport.",
	},
	{
		slug: 'ecole-de-hand',
		nom: 'École de Hand',
		icone: ecoleDeHand,
		resume: 'Les fondamentaux transmis aux plus jeunes, dans les règles fédérales.',
		description:
			"L'école de hand accueille les enfants jusqu'aux moins de 11 ans et leur transmet les bases : se déplacer, passer, tirer, respecter l'adversaire et l'arbitre. Le label contrôle la qualification des encadrants, le volume d'entraînement proposé et la participation aux plateaux organisés par le comité — les premières rencontres, où l'on joue sans classement.",
	},
];
