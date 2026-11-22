/**
 * Entreprises surveillées directement sur leur ATS (= les offres arrivent ici AVANT LinkedIn).
 * Ajouter une boîte : trouve l'URL de sa page carrière :
 *   job-boards.greenhouse.io/<slug>  → greenhouse
 *   jobs.lever.co/<slug>             → lever
 *   jobs.ashbyhq.com/<slug>          → ashby
 *
 * La plupart des grands employeurs de Dubaï (Emirates, Emaar, Jumeirah, Majid Al Futtaim, hôtels…)
 * utilisent Workday / Taleo / SuccessFactors, sans API publique : leurs offres arrivent via LinkedIn,
 * Workable et Careerjet. Celles ci-dessous ont des bureaux à Dubaï et recrutent en support client,
 * opérations et assistanat (souvent multilingue). Vérifiées le 2026-11-21.
 */
export interface AtsCompany {
  ats: "greenhouse" | "lever" | "ashby";
  slug: string;
  name: string;
}

export const COMPANIES: AtsCompany[] = [
  // Tech / plateformes avec siège ou hub à Dubaï
  { ats: "greenhouse", slug: "careem", name: "Careem" },
  { ats: "greenhouse", slug: "tamara", name: "Tamara" },
  { ats: "ashby", slug: "ziina", name: "Ziina" },
  { ats: "lever", slug: "airalo", name: "Airalo" },

  // Exchanges / fintech à Dubaï : support client multilingue (français, arabe) fréquent
  { ats: "greenhouse", slug: "binance", name: "Binance" },
  { ats: "greenhouse", slug: "bybit", name: "Bybit" },
  { ats: "greenhouse", slug: "okx", name: "OKX" },
  { ats: "lever", slug: "capital", name: "Capital.com" },

  // Voyage / expériences (support client, souvent remote)
  { ats: "ashby", slug: "headout", name: "Headout" },
  { ats: "ashby", slug: "getyourguide", name: "GetYourGuide" },
];
