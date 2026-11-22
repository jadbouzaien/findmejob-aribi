export type WorkMode = "onsite" | "hybrid" | "remote" | "unknown";
export type Zone = "home" | "near" | "country" | "far" | "foreign" | "unknown";
export type SalaryPeriod = "year" | "month" | "day" | "hour";

/** Offre normalisée renvoyée par chaque source */
export interface RawJob {
  source: string;
  externalId: string;
  url: string;
  title: string;
  company: string | null;
  location: string | null;
  workMode?: WorkMode;
  description: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: SalaryPeriod | null;
  salaryText?: string | null;
  postedAt: Date | null;
}

export interface SourceContext {
  /** true si l'offre est déjà en base (évite de re-télécharger le détail) */
  isKnown(source: string, externalId: string): Promise<boolean>;
  /** true pour le tout premier passage de cette source */
  seeding: boolean;
  log(msg: string): void;
}

export interface Source {
  /** identifiant stable, ex: "linkedin", "greenhouse" */
  id: string;
  label: string;
  intervalMin: number;
  enabled(): boolean;
  fetch(ctx: SourceContext): Promise<RawJob[]>;
}

export const JOB_STATUSES = ["new", "to_apply", "applied", "interview", "rejected", "ignored", "expired"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
