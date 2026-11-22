/**
 * Banque de contenu des lettres de motivation — Mahdi Aribi.
 * Chaque "preuve" est un fait réel du CV, déclenché par des mots-clés de l'offre.
 * Le générateur garde les 3 preuves qui matchent le plus l'offre (titre + description).
 * Ne jamais ajouter ici un fait absent du CV.
 */
import type { TrackId } from "./profile";

export interface Proof {
  id: string;
  /** Mots-clés de l'offre qui rendent cette preuve pertinente */
  keywords: RegExp;
  /** Catégories pour lesquelles cette preuve est mise en avant par défaut */
  tracks: TrackId[];
  fr: string;
  en: string;
}

export const PROOFS: Proof[] = [
  {
    id: "kalstein_enquiries",
    keywords: /\b(enquir\w*|inquir\w*|customers?|clients?|complaints?|r[ée]clamations?|calls?|phone|e-?mails?|support|service)\b/gi,
    tracks: ["customer_service", "sales_coordination"],
    fr: "Chez Kalstein France, fournisseur d'équipements de laboratoire, médicaux et industriels, j'ai traité pendant trois ans les demandes des clients, suivi les réclamations jusqu'à leur résolution et coordonné le service après-vente.",
    en: "At Kalstein France, a supplier of laboratory, medical and industrial equipment, I handled customer enquiries for three years, followed complaints through to resolution and coordinated after-sales service.",
  },
  {
    id: "kalstein_orders",
    keywords: /\b(orders?|commandes?|quotations?|quotes?|devis|shipments?|shipping|deliver\w*|dhl|tracking|logistics|sales|ventes?|adv)\b/gi,
    tracks: ["sales_coordination", "customer_service"],
    fr: "Chez Kalstein, je préparais des devis personnalisés (prix, frais de port, délais), traitais les commandes et aidais les clients à suivre leurs expéditions DHL, en lien direct avec l'équipe commerciale et l'administration des ventes.",
    en: "At Kalstein, I prepared personalised quotations (prices, shipping costs, delivery times), processed orders and helped customers track their DHL shipments, working closely with the sales and sales-administration team.",
  },
  {
    id: "notary_admin",
    keywords: /\b(admin\w*|calendars?|agenda|appointments?|meetings?|scheduling|reception|phone|calls?|e-?mails?|correspondence|filing|documents?|records)\b/gi,
    tracks: ["admin_reception"],
    fr: "Pendant près de cinq ans dans une étude notariale parisienne, j'ai géré l'accueil, le standard, les e-mails, les agendas et les rendez-vous clients, ainsi que la préparation administrative des dossiers.",
    en: "For nearly five years at a Parisian notary firm, I managed reception, calls, emails, calendars and client appointments, and prepared the administrative side of client files.",
  },
  {
    id: "notary_stakeholders",
    keywords: /\b(stakeholders?|banks?|lawyers?|legal|insur\w*|government|authorities|property|real estate|immobilier|contracts?|conveyancing|documentation|compliance)\b/gi,
    tracks: ["admin_reception", "real_estate"],
    fr: "À l'étude notariale, je coordonnais les échanges avec les clients, banques, avocats, assureurs, administrations et acteurs immobiliers, et suivais les pièces manquantes et les échéances de chaque dossier.",
    en: "At the notary firm, I coordinated with clients, banks, lawyers, insurers, public bodies and property stakeholders, and tracked missing documents and deadlines on every file.",
  },
  {
    id: "confidentiality",
    keywords: /\b(confidential\w*|discretion|sensitive|accura\w*|attention to detail|data entry|databases?|registers?|crm)\b/gi,
    tracks: ["admin_reception"],
    fr: "À l'étude, j'ai tenu des bases de données, registres et courriers sensibles avec une stricte confidentialité et une grande rigueur, et géré la production de documents et les signatures électroniques.",
    en: "At the notary firm, I maintained databases, registers and sensitive correspondence with strict confidentiality and accuracy, and handled document production and electronic signatures.",
  },
  {
    id: "property_consultant",
    keywords: /\b(property|properties|real estate|leasing|leads?|prospect\w*|viewings?|investors?|buyers?|tenants?|off[- ]plan|brokerage|rera|dld)\b/gi,
    tracks: ["real_estate"],
    fr: "Depuis août 2026, je suis Property Consultant chez Al Firouz Real Estate à Dubaï : prospection et génération de leads, gestion de la relation client, visites de biens et suivi administratif des dossiers. J'y ai validé la formation AML / CFT avec 100 % à l'examen final.",
    en: "Since August 2026, I have been a Property Consultant at Al Firouz Real Estate in Dubai, handling lead generation and prospecting, client relationships, property viewings and documentation. I completed the company's AML / CFT training with a 100% final exam score.",
  },
  {
    id: "vip_host",
    keywords: /\b(vip|guests?|hospitality|hosts?|hostess|luxury|events?|welcom\w*|concierge|lounge|team lead\w*|coordinat\w*)\b/gi,
    tracks: ["guest_relations"],
    fr: "À Dubaï, comme VIP Host et Team Leader pour WeddingEvents, j'ai accueilli des invités VIP dans un environnement exigeant et coordonné l'équipe pour répondre rapidement à leurs besoins.",
    en: "In Dubai, as VIP Host and Team Leader for WeddingEvents, I welcomed VIP guests in a fast-paced setting and coordinated the team to respond quickly to their needs.",
  },
  {
    id: "vivatech",
    keywords: /\b(events?|exhibitions?|conferences?|visitors?|front[- ]of[- ]house|reception\w*|attendees|guests?|welcom\w*)\b/gi,
    tracks: ["guest_relations", "admin_reception"],
    fr: "De 2023 à 2025, j'ai assuré l'accueil et l'orientation des visiteurs à VivaTech, l'un des plus grands salons technologiques d'Europe, à Paris.",
    en: "From 2023 to 2025, I provided front-of-house reception and visitor support at VivaTech in Paris, one of Europe's largest technology events.",
  },
  {
    id: "languages",
    keywords: /\b(french|fran[çc]ais|francophone|arabic|arabe|multilingual|bilingual|trilingual|languages?)\b/gi,
    tracks: [],
    fr: "Arabe natif, je parle couramment l'anglais et le français, et j'ai travaillé huit ans en France avec une clientèle exigeante.",
    en: "A native Arabic speaker, I am fluent in English and French, and spent eight years working with demanding clients in France.",
  },
];

/** Accroche selon la catégorie du poste */
export const HOOKS: Record<TrackId, { fr: string; en: string }> = {
  customer_service: {
    fr: "Avec plus de sept ans d'expérience en relation client, en France puis aux Émirats, j'aime apporter des réponses claires et rapides et suivre chaque demande jusqu'à sa résolution.",
    en: "With over seven years of customer-facing experience in France and the UAE, I enjoy giving clear, fast answers and following every request through to resolution.",
  },
  admin_reception: {
    fr: "Après près de cinq ans comme assistant administratif dans une étude notariale à Paris, je sais gérer l'accueil, les agendas et les dossiers avec rigueur et discrétion.",
    en: "After nearly five years as an Administrative Assistant at a notary firm in Paris, I know how to run reception, calendars and files with accuracy and discretion.",
  },
  guest_relations: {
    fr: "Accueillir des invités et leur offrir une excellente première impression est au cœur de mon parcours, des salons professionnels à Paris aux événements VIP à Dubaï.",
    en: "Welcoming guests and creating excellent first impressions has been at the heart of my career, from major trade events in Paris to VIP events in Dubai.",
  },
  real_estate: {
    fr: "Property Consultant à Dubaï après cinq ans dans une étude notariale parisienne, je connais à la fois la relation avec les acheteurs et la rigueur documentaire des transactions immobilières.",
    en: "Now a Property Consultant in Dubai after five years at a Parisian notary firm, I bring both client relationship skills and a solid grasp of the documentation behind property transactions.",
  },
  sales_coordination: {
    fr: "Pendant trois ans chez Kalstein France, j'ai fait le lien entre les clients et l'équipe commerciale : devis, commandes, expéditions et service après-vente.",
    en: "For three years at Kalstein France, I was the link between customers and the sales team: quotations, orders, shipments and after-sales service.",
  },
};

/**
 * Compétences réelles (et leur libellé propre). La lettre ne cite QUE celles-ci,
 * quand l'offre les mentionne — jamais un outil ou une compétence absente du CV.
 */
export const MY_SKILLS: Array<[RegExp, string]> = [
  [/\b(ms office|microsoft office|office 365)\b/i, "Microsoft Office"],
  [/\boutlook\b/i, "Outlook"],
  [/\bexcel\b/i, "Excel"],
  [/\b(google workspace|g ?suite)\b/i, "Google Workspace"],
  [/\bcrm\b/i, "CRM"],
  [/\bdatabases?\b/i, "database management"],
  [/\b(calendar|diary|agenda) management|scheduling\b/i, "calendar management"],
  [/\bcomplaints?\b/i, "complaint handling"],
  [/\bquotations?\b/i, "quotations"],
  [/\border processing\b/i, "order processing"],
  [/\bafter[- ]sales\b/i, "after-sales service"],
  [/\blead generation\b/i, "lead generation"],
  [/\bviewings?\b/i, "property viewings"],
  [/\bdocument(ation)? (management|control)\b/i, "document management"],
  [/\bconfidential\w*/i, "confidentiality"],
  [/\b(aml|anti[- ]money laundering)\b/i, "AML / CFT"],
  [/\bfrench\b|\bfran[çc]ais\b/i, "French"],
  [/\barabic\b|\barabe\b/i, "Arabic"],
];
