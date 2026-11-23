// Contenu des CV de Mahdi Aribi (non versionné : données personnelles).
// Source : Mahdi_Aribi_Updated_CV.pdf. Ne rien ajouter qui n'y figure pas.
// 4 variantes (même parcours, titre / profil / ordre des points forts adaptés) × 2 langues.

const contact = [
  { icon: "pin", text: "Dubai, UAE" },
  { icon: "phone", text: "+971 50 365 8235" },
  { icon: "mail", text: "aribi_mehdi@hotmail.com" },
];

// ───────────────────────── ANGLAIS ─────────────────────────

const EN = {
  lang: "en",
  name: "MAHDI ARIBI",
  tagline: "Trilingual: Arabic · English · French  —  7+ years in client-facing roles in France and the UAE",
  contact,
  labels: {
    contact: "Contact",
    languages: "Languages",
    software: "Software",
    education: "Education",
    certs: "Certifications",
    training: "Additional training",
    interests: "Interests",
    profile: "Profile",
    strengths: "Core strengths",
    experience: "Professional experience",
  },
  languages: [
    { name: "Arabic", level: "Native", pct: 100 },
    { name: "English", level: "Fluent · IELTS B2", pct: 85 },
    { name: "French", level: "Fluent (professional)", pct: 95 },
  ],
  software: ["Microsoft Office", "Outlook", "Excel", "Google Workspace", "CRM / Databases", "Document management"],
  education: [
    { degree: "Bachelor's Degree, Industrial IT", school: "Nîmes University, France", years: "2014 – 2016" },
    { degree: "Bachelor's Degree, Management Computer Science", school: "FSEG Sfax, Tunisia", years: "2011 – 2014" },
  ],
  certs: [
    { name: "AML / CFT Training", detail: "Al Firouz Real Estate · Nov 2026 · Final exam: 100%" },
    { name: "Onboarding Completion", detail: "Al Firouz Real Estate · Nov 2026" },
  ],
  training: ["IELTS — B2 level", "Prompt Engineering for AI Systems"],
  interests: ["Home renovation & DIY", "Swimming", "Wild camping"],
  experience: [
    {
      role: "Property Consultant",
      company: "Al Firouz Real Estate",
      place: "Dubai, UAE",
      dates: "Aug 2026 – Present",
      bullets: [
        "**Lead generation** and client prospecting.",
        "**Client relationship management** from first contact to follow-up.",
        "Organising and conducting **property viewings**.",
        "**Documentation** and administrative support on client files.",
      ],
    },
    {
      role: "VIP Host & Team Leader",
      company: "WeddingEvents",
      place: "Dubai, UAE",
      dates: "May – Jul 2026",
      bullets: [
        "Welcomed and assisted **VIP guests** in a fast-paced event setting, maintaining a professional and calm presence.",
        "**Coordinated team activity** and responded quickly to guest needs to ensure a smooth experience.",
      ],
    },
    {
      role: "Administrative Assistant",
      company: "Étude Letulle",
      note: "Parisian notary firm",
      place: "Paris, France",
      dates: "Apr 2021 – Jan 2026",
      bullets: [
        "Managed **reception, calls, emails, calendars, meetings** and client appointments.",
        "Prepared the administrative parts of client files and **tracked missing documents**.",
        "Coordinated with **clients, banks, lawyers, insurers, public bodies** and property stakeholders.",
        "Maintained **databases, correspondence, registers** and deadline follow-up.",
        "Assisted with document production, mailing, **electronic signatures** and meeting logistics.",
        "Handled sensitive information with **strict confidentiality** and accuracy.",
      ],
    },
    {
      role: "Event Receptionist",
      company: "Viva Technology (VivaTech)",
      place: "Paris, France",
      dates: "2023 – 2025",
      bullets: [
        "Provided **front-of-house reception** and visitor support at major professional events.",
        "Directed attendees and ensured clear, courteous communication throughout the event.",
      ],
    },
    {
      role: "Customer Service Assistant",
      company: "Kalstein France",
      note: "Supplier of scientific, medical & industrial laboratory equipment",
      place: "Paris, France",
      dates: "Feb 2018 – Feb 2021",
      bullets: [
        "Replied to **customer enquiries** about laboratory, medical and industrial equipment.",
        "Prepared and coordinated **personalised quotations**: prices, shipping costs and delivery times.",
        "**Processed orders** and helped customers track shipments, including DHL tracking.",
        "Updated customer and order records; worked closely with the sales and sales-administration team.",
        "Coordinated **warranty, after-sales service**, documentation, spare parts and service requests.",
        "**Handled complaints** and followed up to make sure every issue was resolved.",
      ],
    },
  ],
};

const EN_STRENGTHS = {
  service: "Customer service, empathy and **client relationship management**",
  languages: "**English, Arabic and French** communication skills",
  french: "Professional **French**, written and spoken",
  organisation: "Strong **organisation** and time management",
  detail: "**Attention to detail** and accurate document handling",
  confidentiality: "**Confidentiality** and discretion with sensitive client information",
  admin: "Managing **emails, calls, calendars and appointments**",
  tools: "**Microsoft Office, CRM / database** and document-management systems",
  followup: "**Problem-solving** and effective follow-up on requests, orders or files",
  teamwork: "**Multitasking**; collaborating with sales, legal and technical teams",
};
const pick = (dict, keys) => keys.map((k) => dict[k]);

const VARIANTS_EN = {
  Customer_Service: {
    title: "Customer Service & Client Relations",
    profile:
      "Multilingual **customer relations** professional with over **7 years of experience** in customer service, reception, administration and client-facing roles across France and the UAE. Experienced in handling enquiries and complaints, preparing quotations, processing orders and following every request through to resolution. Fluent in **English, French and Arabic**, with a strong commitment to customer satisfaction and teamwork.",
    strengths: pick(EN_STRENGTHS, ["service", "languages", "followup", "admin", "tools", "organisation", "detail", "teamwork"]),
  },
  Admin: {
    title: "Administrative Assistant · Receptionist",
    profile:
      "Organised **administrative assistant and receptionist** with nearly 5 years at a Parisian notary firm and over **7 years in client-facing roles** across France and the UAE. Skilled in running reception, managing calendars and appointments, preparing client files and handling sensitive documents with discretion. Fluent in **English, French and Arabic**.",
    strengths: pick(EN_STRENGTHS, ["admin", "confidentiality", "detail", "organisation", "tools", "languages", "service", "teamwork"]),
  },
  Guest_Relations: {
    title: "Guest Relations & VIP Hospitality",
    profile:
      "Multilingual **customer relations and guest services** professional with over **7 years of experience** in customer service, reception and client-facing roles across France and the UAE. Skilled in welcoming guests, coordinating appointments, managing enquiries and delivering professional service in fast-paced environments, from **VIP events in Dubai** to **VivaTech** in Paris. Fluent in **English, French and Arabic**, committed to creating excellent first impressions.",
    strengths: pick(EN_STRENGTHS, ["service", "languages", "organisation", "followup", "teamwork", "admin", "detail", "confidentiality"]),
  },
  Real_Estate: {
    title: "Property Consultant",
    profile:
      "Dubai-based **Property Consultant** with nearly 5 years of prior experience at a **Parisian notary firm**, coordinating property files with clients, banks, lawyers and insurers. Over **7 years in client-facing roles** across France and the UAE, combining lead generation, client relationship management and rigorous documentation. AML / CFT trained. Fluent in **English, French and Arabic**.",
    strengths: pick(EN_STRENGTHS, ["service", "languages", "detail", "confidentiality", "followup", "organisation", "tools", "teamwork"]),
  },
};

// ───────────────────────── FRANÇAIS ─────────────────────────

const FR = {
  ...EN,
  lang: "fr",
  tagline: "Trilingue : arabe · anglais · français  —  plus de 7 ans en relation client en France et aux Émirats",
  contact: [{ icon: "pin", text: "Dubaï, Émirats arabes unis" }, ...contact.slice(1)],
  labels: {
    contact: "Contact",
    languages: "Langues",
    software: "Logiciels",
    education: "Formation",
    certs: "Certifications",
    training: "Formations complémentaires",
    interests: "Centres d'intérêt",
    profile: "Profil",
    strengths: "Points forts",
    experience: "Expérience professionnelle",
  },
  languages: [
    { name: "Arabe", level: "Langue maternelle", pct: 100 },
    { name: "Anglais", level: "Courant · IELTS B2", pct: 85 },
    { name: "Français", level: "Courant (professionnel)", pct: 95 },
  ],
  software: ["Microsoft Office", "Outlook", "Excel", "Google Workspace", "CRM / bases de données", "Gestion documentaire"],
  education: [
    { degree: "Licence, informatique industrielle", school: "Université de Nîmes, France", years: "2014 – 2016" },
    { degree: "Licence, informatique de gestion", school: "FSEG Sfax, Tunisie", years: "2011 – 2014" },
  ],
  certs: [
    { name: "Formation LCB-FT (AML / CFT)", detail: "Al Firouz Real Estate · nov. 2026 · examen final : 100 %" },
    { name: "Parcours d'intégration validé", detail: "Al Firouz Real Estate · nov. 2026" },
  ],
  training: ["IELTS — niveau B2", "Prompt engineering pour les systèmes d'IA"],
  interests: ["Rénovation et bricolage", "Natation", "Camping sauvage"],
  experience: [
    {
      role: "Property Consultant (conseil immobilier)",
      company: "Al Firouz Real Estate",
      place: "Dubaï, Émirats",
      dates: "août 2026 – aujourd'hui",
      bullets: [
        "**Prospection** et génération de leads.",
        "**Gestion de la relation client**, du premier contact au suivi.",
        "Organisation et conduite des **visites de biens**.",
        "**Suivi documentaire** et appui administratif sur les dossiers clients.",
      ],
    },
    {
      role: "VIP Host & Team Leader",
      company: "WeddingEvents",
      place: "Dubaï, Émirats",
      dates: "mai – juil. 2026",
      bullets: [
        "Accueil et accompagnement d'**invités VIP** lors d'événements à fort rythme, avec calme et professionnalisme.",
        "**Coordination de l'équipe** et réponse rapide aux besoins des invités pour une expérience fluide.",
      ],
    },
    {
      role: "Assistant administratif",
      company: "Étude Letulle",
      note: "étude notariale parisienne",
      place: "Paris",
      dates: "avr. 2021 – janv. 2026",
      bullets: [
        "Gestion de l'**accueil, du standard, des e-mails, des agendas**, des réunions et des rendez-vous clients.",
        "Préparation de la partie administrative des dossiers clients et **suivi des pièces manquantes**.",
        "Coordination avec les **clients, banques, avocats, assureurs, administrations** et acteurs immobiliers.",
        "Tenue des **bases de données, courriers, registres** et suivi des échéances.",
        "Production de documents, envois, **signatures électroniques** et logistique des réunions.",
        "Traitement des informations sensibles avec une **stricte confidentialité** et une grande rigueur.",
      ],
    },
    {
      role: "Hôte d'accueil événementiel",
      company: "Viva Technology (VivaTech)",
      place: "Paris",
      dates: "2023 – 2025",
      bullets: [
        "**Accueil** et orientation des visiteurs lors de grands salons professionnels.",
        "Orientation des participants avec une communication claire et courtoise.",
      ],
    },
    {
      role: "Assistant service client",
      company: "Kalstein France",
      note: "équipements de laboratoire, médicaux et industriels",
      place: "Paris",
      dates: "févr. 2018 – févr. 2021",
      bullets: [
        "Réponse aux **demandes des clients** sur des équipements de laboratoire, médicaux et industriels.",
        "Préparation et coordination de **devis personnalisés** : prix, frais de port et délais de livraison.",
        "**Traitement des commandes** et suivi des expéditions pour les clients, notamment via DHL.",
        "Mise à jour des fiches clients et commandes, en lien avec l'équipe commerciale et l'ADV.",
        "Coordination de la **garantie et du SAV** : documentation, pièces détachées et interventions.",
        "**Traitement des réclamations** et suivi jusqu'à leur résolution.",
      ],
    },
  ],
};

const FR_STRENGTHS = {
  service: "Service client, empathie et **gestion de la relation client**",
  languages: "Communication en **anglais, arabe et français**",
  french: "**Français** professionnel, écrit et oral",
  organisation: "Excellente **organisation** et gestion du temps",
  detail: "**Rigueur** et traitement précis des documents",
  confidentiality: "**Confidentialité** et discrétion sur les informations sensibles",
  admin: "Gestion des **e-mails, appels, agendas et rendez-vous**",
  tools: "**Microsoft Office, CRM / bases de données** et outils de gestion documentaire",
  followup: "**Résolution de problèmes** et suivi rigoureux des demandes",
  teamwork: "**Multitâche** ; travail avec les équipes commerciales, juridiques et techniques",
};

const VARIANTS_FR = {
  Customer_Service: {
    title: "Service client & relation client",
    profile:
      "Professionnel de la **relation client** trilingue, avec plus de **7 ans d'expérience** en service client, accueil, administration et postes en contact avec la clientèle, en France puis aux Émirats. Habitué à traiter les demandes et réclamations, préparer des devis, gérer des commandes et suivre chaque demande jusqu'à sa résolution. Courant en **anglais, français et arabe**, avec un fort attachement à la satisfaction client et au travail d'équipe.",
    strengths: pick(FR_STRENGTHS, ["service", "languages", "followup", "admin", "tools", "organisation", "detail", "teamwork"]),
  },
  Admin: {
    title: "Assistant administratif · Accueil",
    profile:
      "**Assistant administratif et chargé d'accueil** organisé, avec près de 5 ans dans une étude notariale parisienne et plus de **7 ans en contact avec la clientèle**, en France puis aux Émirats. Gestion de l'accueil, des agendas et des rendez-vous, préparation des dossiers clients et traitement discret des documents sensibles. Courant en **anglais, français et arabe**.",
    strengths: pick(FR_STRENGTHS, ["admin", "confidentiality", "detail", "organisation", "tools", "languages", "service", "teamwork"]),
  },
  Guest_Relations: {
    title: "Guest Relations & accueil VIP",
    profile:
      "Professionnel trilingue de la **relation client et de l'accueil**, avec plus de **7 ans d'expérience** en service client, accueil et postes en contact avec la clientèle, en France puis aux Émirats. Accueil des invités, gestion des demandes et service soigné dans des environnements à fort rythme, des **événements VIP à Dubaï** à **VivaTech** à Paris. Courant en **anglais, français et arabe**, attaché à offrir une excellente première impression.",
    strengths: pick(FR_STRENGTHS, ["service", "languages", "organisation", "followup", "teamwork", "admin", "detail", "confidentiality"]),
  },
  Real_Estate: {
    title: "Property Consultant · Conseil immobilier",
    profile:
      "**Property Consultant** à Dubaï, après près de 5 ans dans une **étude notariale parisienne** à coordonner les dossiers immobiliers avec les clients, banques, avocats et assureurs. Plus de **7 ans en contact avec la clientèle** en France et aux Émirats : prospection, gestion de la relation client et rigueur documentaire. Formé à la LCB-FT (AML / CFT). Courant en **anglais, français et arabe**.",
    strengths: pick(FR_STRENGTHS, ["service", "languages", "detail", "confidentiality", "followup", "organisation", "tools", "teamwork"]),
  },
};

export const ALL = [
  ...Object.entries(VARIANTS_EN).map(([v, d]) => ({ ...EN, ...d, file: `CV_Mahdi_Aribi_${v}_EN` })),
  ...Object.entries(VARIANTS_FR).map(([v, d]) => ({ ...FR, ...d, file: `CV_Mahdi_Aribi_${v}_FR` })),
];
