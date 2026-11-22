import "../src/lib/env"; // charge .env avant de lire SALARY_*
/**
 * PROFIL DE RECHERCHE — Mahdi Aribi, basé à Dubaï.
 * Relation client, accueil / assistanat administratif, guest relations, immobilier, coordination commerciale.
 * Trilingue arabe (natif) / anglais / français : le français et l'arabe sont des atouts recherchés à Dubaï.
 *
 * Après modification : `npm run rescore` recalcule les scores des offres déjà en base.
 */

export type TrackId = "customer_service" | "admin_reception" | "guest_relations" | "real_estate" | "sales_coordination";

export interface Track {
  id: TrackId;
  label: string;
  /** Fichier dans /cvs à envoyer pour une offre rédigée en français */
  cv: string;
  /** CV pour une offre rédigée en anglais (le cas général à Dubaï) */
  cvEn: string;
  /** CV spécifiques selon le titre : [regex titre, cv FR, cv EN] (prioritaire) */
  cvByTitle?: Array<[RegExp, string, string]>;
  /**
   * Expérience réelle DANS CE MÉTIER : au-delà, les années demandées par l'offre sont pénalisées.
   * seniorTitle = pénalité si le titre dit "Senior / Sr".
   */
  seniority: { years: number; seniorTitle: number; excludeSeniorIf?: RegExp };
  /** Titre très aligné → 45 pts */
  strongTitle: RegExp[];
  /** Titre compatible mais générique → 25 pts */
  weakTitle: RegExp[];
  /** Compétences / atouts recherchés dans titre + description (poids = points, plafonné à 25) */
  skills: Array<[RegExp, number]>;
  /** Pénalités spécifiques à la catégorie */
  penalties?: Array<[RegExp, number, string]>;
}

const w = (s: string) => new RegExp(`(^|[^a-z0-9])(${s})([^a-z0-9]|$)`, "i");

const CV = (variant: string, lang: "EN" | "FR") => `CV_Mahdi_Aribi_${variant}_${lang}.pdf`;

/** Atouts communs : langues et outils (présents dans toutes les catégories) */
const LANG_SKILLS: Array<[RegExp, number]> = [
  [w("french|francophone|fran[çc]ais"), 6],
  [w("arabic|arabe"), 4],
  [w("multilingual|bilingual|trilingual|multilingue|bilingue"), 3],
];
const OFFICE_SKILLS: Array<[RegExp, number]> = [
  [w("ms office|microsoft office|office 365|outlook|excel|word"), 2],
  [w("google workspace|g ?suite|google sheets"), 1],
  [w("crm|database|salesforce|hubspot|zoho"), 2],
];

export const TRACKS: Track[] = [
  {
    id: "customer_service",
    // Kalstein (3 ans service client) + 5 ans de relation clients chez le notaire + immobilier
    seniority: { years: 7, seniorTitle: 0 },
    label: "Customer Service / Relation client",
    cv: CV("Customer_Service", "FR"),
    cvEn: CV("Customer_Service", "EN"),
    strongTitle: [
      w("customer (service|support|care|experience|relations?|success|happiness)( \\w+)?"),
      w("client (services?|relations?|relationship|support|care|experience)( \\w+)?"),
      w("(french|arabic|bilingual|multilingual)[- ]speaking (customer|client|support|agent|advisor|representative)"),
      w("contact cent(er|re) (agent|executive|representative|advisor)|call cent(er|re) (agent|executive|representative)"),
      w("service client|relation client|conseiller(e)? client(e|èle)?|charg[ée]e? de client[èe]le"),
      w("customer service (representative|executive|officer|agent|advisor|associate|coordinator|specialist)"),
    ],
    weakTitle: [w("customer|client|support (agent|specialist|associate|executive|advisor)|helpdesk|help desk|contact cent(er|re)|call cent(er|re)")],
    skills: [
      ...LANG_SKILLS,
      ...OFFICE_SKILLS,
      [w("complaints?|r[ée]clamations?|escalations?"), 4],
      [w("enquir(y|ies)|inquir(y|ies)|requests?"), 2],
      [w("orders?|order processing|shipments?|tracking|deliver(y|ies)"), 3],
      [w("after[- ]sales|warranty|returns?"), 3],
      [w("quotations?|quotes?|devis"), 3],
      [w("phone|calls?|e-?mails?|live chat|chat"), 2],
      [w("customer satisfaction|csat|nps|service quality"), 2],
      [w("follow[- ]up|follow up"), 2],
    ],
  },
  {
    id: "admin_reception",
    // Assistant administratif chez un notaire parisien (2021-2026) + accueil événementiel
    seniority: { years: 5, seniorTitle: 5, excludeSeniorIf: w("executive assistant|personal assistant|office manager") },
    label: "Accueil / Assistanat administratif",
    cv: CV("Admin", "FR"),
    cvEn: CV("Admin", "EN"),
    cvByTitle: [[w("receptionist|front desk|front office|reception"), CV("Admin", "FR"), CV("Admin", "EN")]],
    strongTitle: [
      w("receptionist|reception (executive|officer|supervisor)|front desk( \\w+)?|front office (executive|officer|coordinator|administrator|assistant)"),
      w("(administrative|admin|office|personal|executive|legal|team|sales|hr|project|virtual) assistant"),
      w("office (administrator|coordinator|admin|executive|secretary)|administration (officer|executive|coordinator)"),
      w("admin(istrative)? (officer|executive|coordinator|specialist|clerk)"),
      w("secretary|secr[ée]taire|assistante? (administrati(f|ve)|de direction|juridique|notari(al|ale))|h[ôo]te(sse)? d'accueil|charg[ée]e? d'accueil"),
      w("document controller|back office (executive|officer|coordinator|assistant)|data entry (clerk|operator|executive)"),
    ],
    weakTitle: [w("admin|administrative|administrator|reception|office (assistant|coordinator|executive)|assistant|clerk|documentation|records")],
    skills: [
      ...LANG_SKILLS,
      ...OFFICE_SKILLS,
      [w("calendars?|agenda|scheduling|appointments?|meetings?"), 4],
      [w("phone|calls?|switchboard|visitors?|guests?|front desk"), 3],
      [w("filing|documents?|documentation|records|archiv(e|ing)|correspondence"), 4],
      [w("data entry|databases?|registers?"), 3],
      [w("confidential(ity)?|discretion|sensitive"), 3],
      [w("legal|law firm|notar(y|ial)|contracts?|conveyancing"), 3],
      [w("travel arrangements?|logistics|courier|mail"), 2],
      [w("invoices?|invoicing|petty cash|purchase orders?"), 2],
    ],
    penalties: [
      [w("medical (secretary|assistant|coding)|dha licen[cs]e|nursing"), 15, "Profil médical"],
      [w("payroll|accounts? (payable|receivable)|bookkeep(ing|er)|accountant|tally|quickbooks"), 12, "Comptabilité"],
    ],
  },
  {
    id: "guest_relations",
    // VIP Host Team Leader (Dubaï 2026) + Event Receptionist VivaTech (2023-2025)
    seniority: { years: 2, seniorTitle: 8, excludeSeniorIf: w("manager|director|head") },
    label: "Guest Relations / Hospitalité / Événementiel",
    cv: CV("Guest_Relations", "FR"),
    cvEn: CV("Guest_Relations", "EN"),
    strongTitle: [
      w("guest (relations?|services?|experience)( \\w+)?|guest service agent"),
      w("concierge|vip (host|hostess|services?|relations?)|host(ess)?|hospitality (coordinator|executive|host|officer)"),
      w("front office (agent|associate)|front desk (agent|associate)|reception(ist)? (agent|associate)"),
      w("event(s)? (coordinator|executive|assistant|host|receptionist|staff)|events? and hospitality"),
      w("customer experience (host|ambassador|associate)|client (experience|services?) (host|ambassador)|brand ambassador|lounge (host|agent)"),
    ],
    weakTitle: [w("guest|hospitality|events?|concierge|ambassador|lounge")],
    skills: [
      ...LANG_SKILLS,
      [w("vip|luxury|5[- ]star|five[- ]star|premium|high[- ]end"), 5],
      [w("hotel|hospitality|resort|lounge|events?|exhibitions?"), 4],
      [w("guests?|visitors?|welcom(e|ing)|greet(ing)?"), 4],
      [w("reservations?|bookings?|check[- ]in|check[- ]out"), 3],
      [w("opera|micros|fidelio"), 2],
      [w("complaints?|requests?"), 2],
      [w("team (leader|coordination)|coordinate"), 2],
    ],
    penalties: [
      [w("food (and|&) beverage|f&b|banquet|bartend(er|ing)|sommelier|culinary|kitchen"), 20, "Restauration (F&B)"],
      [w("housekeeping|laundry|room attendant|spa therapist"), 25, "Housekeeping / spa"],
    ],
  },
  {
    id: "real_estate",
    // Property Consultant chez Al Firouz (depuis août 2026) + 5 ans chez un notaire (dossiers immobiliers)
    seniority: { years: 1, seniorTitle: 10, excludeSeniorIf: w("manager|director|head") },
    label: "Immobilier (Property Consultant / Leasing / Admin)",
    cv: CV("Real_Estate", "FR"),
    cvEn: CV("Real_Estate", "EN"),
    strongTitle: [
      w("property (consultant|advisor|adviser|specialist|executive|coordinator|administrator|officer)"),
      w("real estate (consultant|agent|advisor|adviser|broker|specialist|executive|coordinator|administrator|admin|assistant|sales)"),
      w("leasing (consultant|executive|agent|officer|coordinator|administrator|assistant|specialist)"),
      w("(conveyancing|mortgage|transaction|handover|registration) (administrator|admin|coordinator|executive|officer|assistant)"),
      w("(real estate|property|properties) (sales )?(administrator|admin|coordinator)|(sales|crm) (administrator|admin|coordinator) (- )?(real estate|property)"),
      w("(off[- ]plan|secondary market|luxury) (property|real estate|sales) (consultant|advisor|specialist)"),
      w("conveyancer|conseiller(e)? immobilier|n[ée]gociat(eur|rice) immobilier|agent immobilier"),
    ],
    weakTitle: [w("property|properties|real estate|realty|leasing|letting|conveyancing|brokerage|immobilier")],
    skills: [
      ...LANG_SKILLS,
      ...OFFICE_SKILLS,
      [w("off[- ]plan|secondary|leasing|rental|tenancy|ejari"), 3],
      [w("rera|dld|dubai land department|brn|trakheesi|oqood"), 3],
      [w("leads?|lead generation|prospect(ing|ion)|cold calling"), 3],
      [w("viewings?|site visits?|property tours?"), 3],
      [w("client relationship|client relations|clients?|investors?|buyers?|tenants?|landlords?"), 3],
      [w("contracts?|documentation|spa|mou|title deeds?|kyc|aml"), 4],
      [w("property finder|bayut|dubizzle"), 2],
    ],
  },
  {
    id: "sales_coordination",
    // Kalstein : devis, commandes, suivi DHL, SAV en lien avec l'ADV
    seniority: { years: 3, seniorTitle: 8, excludeSeniorIf: w("manager|director|head") },
    label: "Coordination commerciale / ADV / Sales support",
    cv: CV("Customer_Service", "FR"),
    cvEn: CV("Customer_Service", "EN"),
    strongTitle: [
      w("sales (coordinator|administrator|admin|support|assistant|operations (coordinator|executive|assistant))"),
      w("order (processing|management|entry|fulfil?ment) (executive|coordinator|specialist|officer|associate)"),
      w("(customer service|cs) (and|&) (sales|logistics) (coordinator|executive|admin)"),
      w("(logistics|shipping|procurement|purchasing|operations) (coordinator|assistant|administrator)"),
      w("assistante? (commercial(e)?|adv)|administration des ventes|gestionnaire adv|charg[ée]e? adv"),
    ],
    weakTitle: [w("sales support|sales admin|customer (service )?coordinator|order|operations (executive|associate|assistant)")],
    skills: [
      ...LANG_SKILLS,
      ...OFFICE_SKILLS,
      [w("quotations?|quotes?|proformas?|price lists?"), 4],
      [w("orders?|purchase orders?|order processing"), 4],
      [w("shipments?|shipping|dhl|aramex|fedex|logistics|deliver(y|ies)"), 3],
      [w("after[- ]sales|warranty|spare parts"), 3],
      [w("erp|sap"), 1],
      [w("medical|laboratory|equipment|industrial"), 2],
    ],
    penalties: [[w("customs clearance|freight forwarding|supply chain planner|demand planning"), 10, "Logistique spécialisée"]],
  },
];

/**
 * Zones géographiques.
 * home : Dubaï (+ quartiers)  ·  near : Sharjah / Ajman (trajet quotidien possible)
 * country : Émirats sans ville précise  ·  far : autres émirats (trajet long)
 */
export const LOCATIONS = {
  home: [
    "dubai", "dubaï", "doubaï", "dxb", "jebel ali", "business bay", "jlt", "jumeirah", "difc", "deira", "bur dubai", "al quoz",
    "al barsha", "downtown", "silicon oasis", "dubai south", "jvc", "motor city", "media city", "internet city",
    "al qusais", "mirdif", "karama", "dubai marina", "palm jumeirah", "dubai hills", "al nahda", "festival city",
  ],
  near: ["sharjah", "charjah", "ajman"],
  far: ["abu dhabi", "al ain", "ras al[- ]khaimah", "rak", "fujairah", "umm al[- ]quwain", "uaq", "ruwais", "khalifa city", "musaffah"],
  country: ["united arab emirates", "uae", "u\\.a\\.e\\.?", "emirates", "[ée]mirats arabes unis"],
} as const;

/** Autres pays du Golfe / Moyen-Orient : sur site = exclu (il cherche à Dubaï) */
export const GULF_OTHER =
  /(saudi|ksa|riyadh|jeddah|dammam|khobar|qatar|doha|kuwait|bahrain|manama|oman|muscat|egypt|cairo|jordan|amman|lebanon|beirut)/i;

/** Remote compatible avec une résidence à Dubaï */
export const REMOTE_OK_REGIONS =
  /(worldwide|anywhere|global|world|international|mena|middle east|gcc|gulf|uae|united arab emirates|dubai|emea|gmt\+[2-5]|utc ?\+ ?[2-5]|gst|remote$|^remote\b)/i;

/** Remote mais réservé à un autre pays / autorisation de travail étrangère → exclu */
export const REMOTE_RESTRICTED =
  /(us[- ]only|usa only|u\.s\. only|united states only|must (be|reside|live)[^.]{0,40}(united states|u\.s\.|usa|us\b|canada|uk|united kingdom|eu\b|europe|european union)|authorized to work in the (united states|us|u\.s\.|uk|eu)|right to work in the (uk|eu)|work authorization in the (us|united states)|us citizens?|green card|eu (citizens?|residents?) only|latam only|apac only|canada only|uk only|india only|philippines|pakistan only|brazil only|north america only|americas only|us time ?zones? (only|required)|(pst|est|cst|pt|et) (hours|time ?zone) required)/i;

/**
 * Salaire : les montants sont convertis en AED par MOIS (norme aux Émirats, non imposé).
 * Plancher et "bon salaire" dans .env (SALARY_MIN_AED / SALARY_GOOD_AED) pour ne pas être publiés.
 */
export const SALARY = {
  currency: "AED",
  minAed: Number(process.env.SALARY_MIN_AED) || 0,
  goodAed: Number(process.env.SALARY_GOOD_AED) || Infinity,
  /** Taux vers l'AED */
  rates: { AED: 1, USD: 3.6725, EUR: 4.25, GBP: 4.9, CHF: 4.5, SAR: 0.98, QAR: 1.01, CAD: 2.65 } as Record<string, number>,
  /** Bornes plausibles d'un salaire mensuel en AED (au-delà : faux positif) */
  plausible: { min: 1500, max: 80_000 },
};

/**
 * Pénalités globales (toutes catégories).
 * scope "title" = seulement si le TITRE matche.
 */
export const GLOBAL_PENALTIES: Array<{ re: RegExp; pts: number; label: string; scope: "title" | "all" }> = [
  { re: w("head of|director|directeur|directrice|vp|vice president|chief|general manager|gm"), pts: 35, label: "Poste de direction", scope: "title" },
  {
    re: w("(customer service|customer experience|guest relations|front office|reception|admin(istration)?|sales|leasing|operations|call cent(er|re)|contact cent(er|re)) manager|manager"),
    pts: 15,
    label: "Poste de manager (toi : team leader sur une mission)",
    scope: "title",
  },
  { re: w("supervisor|team lead(er)?|superviseur"), pts: 5, label: "Poste de supervision", scope: "title" },
  {
    re: w("(fluent|native|proficien(t|cy) in|speaking) (russian|chinese|mandarin|cantonese|hindi|urdu|tagalog|german|italian|spanish|portuguese|japanese|korean|turkish|farsi|persian|hebrew|dutch|polish)|(russian|chinese|mandarin|hindi|urdu|tagalog|german|italian|spanish|portuguese|japanese|korean|turkish|farsi|persian)[- ](speaking|speaker|is required|required|mandatory)"),
    pts: 30,
    label: "Autre langue requise",
    scope: "all",
  },
  {
    re: w("russian|chinese|mandarin|cantonese|hindi|urdu|tagalog|german|italian|spanish|portuguese|japanese|korean|turkish|farsi|persian|hebrew|dutch|polish|czech|greek|swedish|danish|norwegian|finnish|hungarian|romanian|bulgarian"),
    pts: 30,
    label: "Autre langue dans le titre",
    scope: "title",
  },
  { re: w("native english( speaker)?|english native|english mother tongue"), pts: 8, label: "Anglais natif demandé (toi : courant, IELTS B2)", scope: "all" },
  {
    re: w("valid uae driving licen[cs]e|uae driving licen[cs]e (is )?(required|mandatory|a must|must)|must (have|hold) (a )?(valid )?(uae )?driving licen[cs]e"),
    pts: Number(process.env.HAS_UAE_DRIVING_LICENSE === "true" ? 0 : 10),
    label: "Permis de conduire UAE exigé",
    scope: "all",
  },
  {
    re: w("(\\d+)\\+? years? (of )?(uae|gcc|dubai|middle east|local) experience|(uae|gcc|dubai) experience (is )?(required|mandatory|a must)"),
    pts: 6,
    label: "Expérience UAE/GCC exigée (toi : depuis 2026)",
    scope: "all",
  },
];

/**
 * Logiciels / écosystèmes métiers non maîtrisés : simple pénalité s'ils sont cités dans la description.
 * (Dans le titre → offre masquée.)
 */
export const VENDOR_ECOSYSTEMS =
  /(^|[^a-z])(sap|oracle|tally|quickbooks|sage|zoho books|yardi|salesforce admin\w*)([^a-z]|$)/i;
export const VENDOR_MENTION_PTS = 3;

/**
 * Expérience de management exigée par l'offre. Toi : ~1 an (team leader en événementiel, ponctuel).
 */
export const LEAD_EXPERIENCE = {
  myYears: 1,
  mentionPts: 6,
  yearsRe:
    /(\d+)\s*\+?\s*(?:years?|yrs?|ans|années)\s+(?:of\s+|d['’]\s*)?(?:experience\s+|exp[ée]rience\s+)?(?:(?:as\s+(?:a\s+)?|en\s+tant\s+que\s+|in\s+(?:a\s+)?)?(?:team\s+lead(?:er)?|supervisor|supervisory|manager|managerial|management)\b|(?:leading|managing|supervising)\s+(?:a\s+team|teams|staff|people))/i,
  strongRe: w("proven (management|managerial|leadership) experience|proven track record (of )?(leading|managing) (teams?|people|staff)"),
  mentionRe: w("people management|management experience|supervisory experience|(experience|track record) (leading|managing|supervising) (a team|teams|staff|people)"),
};

/** Exclusions dures sur le titre (offre masquée) */
export const HARD_EXCLUDE_TITLE: Array<[RegExp, string]> = [
  [w("intern|internship|trainee|stage|stagiaire|apprentice"), "Stage / alternance"],
  [w("female|ladies|lady|filipina|office girl|office boy|tea ?boy"), "Profil restreint (genre / nationalité)"],
  [w("uae ?nationals?|uaen|emirati|emiratisation|emiratization|national talent|nationals only"), "Réservé aux Émiratis"],
  [
    w("nurse|nursing|doctor|physician|dentist|dental assistant|pharmac(ist|y)|therapist|physiotherap\\w*|radiograph\\w*|lab technician|caregiver|nanny|babysitter|teacher|tutor|lecturer"),
    "Métier médical / enseignement",
  ],
  [
    w("chef|cook|commis|waiter|waitress|barista|bartender|steward|housekeep\\w*|cleaner|cleaning|laundry|room attendant|bell ?(boy|attendant|man)|valet|porter|driver|rider|courier|delivery|security guard|guard|technician|mechanic|electrician|plumber|carpenter|painter|mason|labou?rer|helper|cashier|storekeeper|merchandiser|picker|packer|warehouse|forklift"),
    "Métier non ciblé (opérationnel)",
  ],
  [
    w("developer|engineer|software|devops|data (scientist|analyst|engineer)|architect|designer|accountant|auditor|lawyer|advocate|paralegal|actuar\\w*|underwriter|recruiter|talent acquisition|hr (generalist|business partner)|marketing (manager|executive|specialist)|seo|graphic|video|photographer"),
    "Métier non ciblé",
  ],
  [w("telesales|telemarket\\w*|cold call\\w*|door[- ]to[- ]door|field sales|insurance (sales|advisor|agent)|financial advisor|wealth|credit card sales|bank sales"), "Vente à la commission (non ciblé)"],
  [VENDOR_ECOSYSTEMS, "Logiciel métier non maîtrisé"],
];

/**
 * Exclusions dures sur la DESCRIPTION : restrictions de nationalité / genre fréquentes aux Émirats.
 */
export const HARD_EXCLUDE_DESCRIPTION: Array<[RegExp, string]> = [
  [
    /\b(uae nationals? only|only (for )?uae nationals?|emiratis? only|only emiratis?|open (only )?to (uae nationals?|emiratis?)|(for|exclusively for) (uae )?nationals|emiratisation (role|position|program)|this (role|position) is (open )?(only )?(to|for) (uae nationals?|emiratis?))\b/i,
    "Réservé aux Émiratis",
  ],
  [/\b(female (candidates? )?only|only female|ladies only|female (applicants?|candidates?) (are )?(preferred|required)|looking for (a )?female)\b/i, "Réservé aux femmes"],
  [
    /\b(filipino|filipina|indian|pakistani|nepali|sri lankan|bangladeshi|russian|chinese|european|british|american|indonesian|kenyan|ugandan|nigerian) (nationals?|nationality|candidates?|applicants?)?\s*(only|preferred)\b/i,
    "Nationalité spécifique demandée",
  ],
];

/**
 * Diplôme : Bachelor (Licence) en informatique industrielle (Nîmes) + Bachelor management (FSEG Sfax).
 * Pénalité quand l'offre demande un Master / MBA.
 */
export const EDUCATION = {
  required: 12,
  preferred: 5,
  equivalent: 3,
};

/**
 * Expérience demandée par l'offre vs ton expérience dans le métier (seniority.years de la catégorie) :
 * au-delà → −moderate ; au-delà de +bigGap ans → −severe.
 */
export const EXPERIENCE = { moderate: 8, severe: 18, bigGap: 3 };

/** Mots du titre qui signalent un poste senior */
export const SENIOR_TITLE = /(^|[^a-z])(senior|sr\.?|confirm[ée]e?|exp[ée]riment[ée]e?)([^a-z]|$)/i;

/** Titres encore plus hauts (utilisés pour les exclusions "pas ton profil") */
export const VERY_SENIOR_TITLE = /(^|[^a-z])(lead|principal|head|director|directeur|directrice|vp|chief|manager)([^a-z]|$)/i;

/**
 * Fraîcheur : ajustement ajouté au score de fit selon l'âge de l'offre. [âge max en heures, points].
 */
export const FRESHNESS: Array<[number, number]> = [
  [24, 5],
  [72, 3],
  [7 * 24, 0],
  [14 * 24, -3],
  [30 * 24, -8],
  [Infinity, -15],
];

/** Seuils de priorité (appliqués au score final = fit + fraîcheur) */
export const PRIORITY = { P1: 78, P2: 62, P3: 45 };

/**
 * Offre sans description complète (Careerjet ne donne qu'un extrait) : fit plafonné,
 * pour qu'elle arrive dans le récap P2 plutôt qu'en alerte immédiate.
 */
export const PARTIAL_DESCRIPTION_MAX_FIT = 70;

/** Fuseau horaire des récaps Telegram */
export const TIMEZONE = "Asia/Dubai";
