/* Contact générique du club — Story 2.2, AD-8.

   SOURCE UNIQUE. Toute mention du contact de repli sur le site passe par ici :
   le composant GenericContact, la fiche de « Trouver ma catégorie » quand la
   catégorie n'a pas de référent, la page Mentions légales. Dupliquer ces valeurs
   ailleurs, c'est garantir qu'une des copies deviendra fausse.

   Les valeurs reflètent la décision du bureau du 12/09/2026 : ni téléphone ni
   adresse e-mail publiés — la ligne d'un bénévole ne doit pas être exposée au
   démarchage, et l'adresse du club doit changer. Le jour où une adresse pérenne
   existe, il n'y a qu'à renseigner `email` ci-dessous : tous les affichages
   suivent. */

export const contactClub = {
	nom: 'Handball Lunel Marsillargues',
	adressePostale: 'Rue Tivoli, 34400 Lunel',
	/* `null` = non publié. Jamais une chaîne vide, qui se rendrait comme un lien
	   mailto: vide au moindre oubli de test. */
	email: null as string | null,
	telephone: null as string | null,
} as const;

/* Le formulaire de contact n'est rendu que si un endpoint est configuré
   (voir ContactForm.astro). Le contact générique doit donc savoir s'il peut y
   renvoyer, sinon il enverrait vers une page où il n'y a rien à remplir. */
export const formulaireDisponible = Boolean(import.meta.env.PUBLIC_CONTACT_ENDPOINT);
