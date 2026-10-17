// Contenu éditorial de Filamour : questions du jour, idées de dates, idées cadeaux.

export const QUESTIONS = [
  "Quel petit moment de cette semaine t'a fait penser à moi ?",
  "Quel est ton souvenir préféré de notre première année ?",
  "Si on partait demain, n'importe où, ce serait où ?",
  "Qu'est-ce que je fais qui te fait te sentir aimé·e ?",
  "Quelle habitude de l'autre t'a fait craquer au début ?",
  "Quel rêve aimerais-tu qu'on réalise ensemble ?",
  "Qu'est-ce qui t'a fait rire aujourd'hui ?",
  "Quelle chanson te fait penser à nous ?",
  "Quel est le moment où tu as su que c'était sérieux ?",
  "De quoi es-tu fier ou fière cette semaine ?",
  "Quelle tradition aimerais-tu qu'on crée rien qu'à nous ?",
  "Quel compliment aimerais-tu entendre plus souvent ?",
  "Quel plat te rappelle un bon moment ensemble ?",
  "Qu'est-ce qui te stresse en ce moment, et comment puis-je t'aider ?",
  "Quel est ton endroit préféré où on est allés ensemble ?",
  "Qu'aimerais-tu qu'on apprenne à deux ?",
  "Quelle est la plus belle surprise que je t'aie faite ?",
  "À quoi ressemblerait notre journée parfaite ?",
  "Qu'est-ce que tu n'as jamais osé me dire, en positif ?",
  "Quel film ou série te fait penser à notre histoire ?",
  "Quel petit geste du quotidien te fait du bien ?",
  "Où nous vois-tu dans cinq ans ?",
  "Quel est le meilleur conseil qu'on t'ait donné sur l'amour ?",
  "Qu'est-ce qui t'a surpris·e chez moi en apprenant à me connaître ?",
  "Quelle est ta façon préférée de passer un dimanche avec moi ?",
  "Quel souvenir d'enfance aimerais-tu me raconter ?",
  "Quel défi aimerais-tu qu'on relève ensemble ce mois-ci ?",
  "Quelle qualité admires-tu le plus chez moi ?",
  "Si notre histoire était un livre, quel serait son titre ?",
  "Qu'est-ce qui rend une soirée à deux vraiment réussie pour toi ?",
];

// Date du jour à Paris, au format AAAA-MM-JJ, identique pour les deux partenaires.
export function todayParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function questionFor(isoDate: string): string {
  const days = Math.floor(Date.parse(isoDate + "T00:00:00Z") / 86400000);
  return QUESTIONS[((days % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];
}

export type Idea = { t: string; d: string; b: "free" | "low" | "high"; w: "home" | "out"; time: string };

export const IDEAS: Idea[] = [
  { t: "Pique-nique de nuit sous les étoiles", d: "Plaid, lampe frontale, thermos de chocolat chaud et une appli d'astronomie.", b: "free", w: "out", time: "2 h" },
  { t: "Battle de pâtes maison", d: "Chacun prépare une sauce en secret, l'autre note sur 10.", b: "low", w: "home", time: "1 h 30" },
  { t: "Rejouer votre premier rendez-vous", d: "Même lieu, même commande, et vous comparez vos souvenirs de ce jour-là.", b: "low", w: "out", time: "2 h" },
  { t: "Soirée « 36 questions »", d: "Les fameuses questions pour se rapprocher, une bougie et zéro téléphone.", b: "free", w: "home", time: "1 h" },
  { t: "Escape game en duo", d: "Parfait pour voir comment vous communiquez sous pression.", b: "high", w: "out", time: "1 h 30" },
  { t: "Brocante challenge", d: "10 € chacun pour trouver l'objet le plus improbable à offrir à l'autre.", b: "low", w: "out", time: "Une matinée" },
  { t: "Ciné-maison à thème", d: "Vous choisissez un pays, un film, et un repas qui va avec.", b: "low", w: "home", time: "3 h" },
  { t: "Dîner surprise dans un resto inconnu", d: "L'un réserve, l'autre ne sait rien jusqu'à la porte.", b: "high", w: "out", time: "2 h" },
  { t: "Balade photo", d: "Un thème (« rouge », « reflets »), 20 photos chacun, puis vous comparez.", b: "free", w: "out", time: "1 h 30" },
  { t: "Écrire la lettre de vos 80 ans", d: "Chacun imagine votre vie dans 50 ans, puis vous vous lisez les lettres.", b: "free", w: "home", time: "45 min" },
  { t: "Cours de danse en ligne", d: "Une vidéo de salsa ou de rock, le salon comme piste.", b: "free", w: "home", time: "1 h" },
  { t: "Lever de soleil et croissants", d: "Réveil très tôt, un point de vue, et le petit-déjeuner dehors.", b: "low", w: "out", time: "2 h" },
  { t: "Atelier poterie ou peinture", d: "Repartir chacun avec un objet fait pour l'autre.", b: "high", w: "out", time: "2 h" },
  { t: "Soirée jeux de société", d: "Un jeu coopératif, puis un jeu où vous êtes adversaires.", b: "free", w: "home", time: "2 h" },
];

export type GiftIdea = { t: string; d: string; p: string; tag: string; inApp?: boolean };
export const GIFT_EVENTS: { k: string; t: string; month: number | null; day: number | null; ideas: GiftIdea[] }[] = [
  { k: "noel", t: "Noël", month: 12, day: 25, ideas: [
    { t: "Calendrier de l'Avent amoureux", d: "24 surprises tirées de vos souvenirs, une par jour jusqu'au 24.", p: "Premium", tag: "Dans l'appli · bientôt", inApp: true },
    { t: "Plaid XXL et soirée film", d: "Un grand plaid à partager, avec une liste de films de Noël à regarder ensemble.", p: "25–40 €", tag: "Cocooning" },
    { t: "Marché de Noël d'une autre ville", d: "Une journée surprise dans une ville proche, vin chaud compris.", p: "30–60 €", tag: "Expérience" },
    { t: "Boule à neige personnalisée", d: "Avec une photo de vous à l'intérieur.", p: "15–25 €", tag: "Personnalisé" },
    { t: "Bons pour l'année qui vient", d: "12 bons, un par mois : massage, resto, journée sans corvée…", p: "Gratuit", tag: "Fait main" },
  ]},
  { k: "valentin", t: "Saint-Valentin", month: 2, day: 14, ideas: [
    { t: "Chasse au trésor de votre histoire", d: "Des énigmes sur vos souvenirs qui mènent à un rendez-vous surprise.", p: "Premium", tag: "Dans l'appli · bientôt", inApp: true },
    { t: "Dîner fait maison du premier rendez-vous", d: "Recréer le plat ou l'ambiance de votre toute première sortie.", p: "20–40 €", tag: "Romantique" },
    { t: "Cours de cuisine ou de poterie à deux", d: "Une activité où vous apprenez quelque chose ensemble.", p: "60–120 €", tag: "Expérience" },
    { t: "Carte des étoiles de votre rencontre", d: "Le ciel tel qu'il était le soir de votre rencontre.", p: "25–45 €", tag: "Personnalisé" },
    { t: "Lettre manuscrite", d: "Ce que tu n'oses jamais dire à voix haute. Souvent le cadeau le plus marquant.", p: "Gratuit", tag: "Fait main" },
  ]},
  { k: "couple", t: "Anniversaire de couple", month: null, day: null, ideas: [
    { t: "Wrapped de votre année", d: "Vos chiffres, vos souvenirs et vos moments forts en stories.", p: "Premium", tag: "Dans l'appli · bientôt", inApp: true },
    { t: "Week-end surprise", d: "Une destination qu'il ou elle a mentionnée sans y penser.", p: "150–300 €", tag: "Voyage" },
    { t: "Album des 12 derniers mois", d: "Une photo par mois, avec une phrase pour chacune.", p: "Gratuit", tag: "Fait main" },
    { t: "Bijou gravé de votre date", d: "Bracelet ou gourmette avec la date de votre rencontre.", p: "30–80 €", tag: "Personnalisé" },
    { t: "Refaire votre premier rendez-vous", d: "Même lieu, même commande, et vous comparez vos souvenirs.", p: "20–50 €", tag: "Romantique" },
  ]},
  { k: "anniv", t: "Son anniversaire", month: null, day: null, ideas: [
    { t: "Lettres « Ouvre quand… »", d: "Une série de messages à ouvrir tout au long de l'année.", p: "Premium", tag: "Dans l'appli · bientôt", inApp: true },
    { t: "L'expérience qu'il ou elle n'ose pas s'offrir", d: "Concert, karting, spa, saut en parachute…", p: "50–200 €", tag: "Expérience" },
    { t: "Vidéo de ses proches", d: "Des messages de ses amis et sa famille, montés en une seule vidéo.", p: "Gratuit", tag: "Fait main" },
    { t: "Petit-déjeuner surprise au lit", d: "Avec ses viennoiseries et sa boisson préférées.", p: "10–20 €", tag: "Romantique" },
  ]},
  { k: "rien", t: "Juste comme ça", month: null, day: null, ideas: [
    { t: "Ses fleurs ou sa pâtisserie préférée", d: "Sans occasion, c'est justement ce qui touche.", p: "10–30 €", tag: "Attention" },
    { t: "Un mot caché", d: "Dans sa poche, son sac ou son livre en cours.", p: "Gratuit", tag: "Fait main" },
    { t: "Une soirée sans écran", d: "Jeux de société, musique et vrai temps ensemble.", p: "Gratuit", tag: "Moment à deux" },
  ]},
];
