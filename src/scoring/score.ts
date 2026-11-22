/**
 * Scoring déterministe (sans LLM), sur 100 :
 *   Titre        45  (titre très aligné 45 / compatible 25)
 *   Compétences  25  (somme des poids des compétences/atouts trouvés, plafonnée)
 *   Localisation 20  (Dubaï, Sharjah/Ajman, remote compatible Dubaï)
 *   Salaire      10  (inconnu 5, ≥ plancher 7, ≥ bon salaire 10) — en AED / mois
 *   − pénalités (management, langue requise, permis, expérience demandée…)
 * Chaque offre est scorée pour chaque catégorie ; on garde la meilleure.
 */
import {
  TRACKS,
  LOCATIONS,
  GULF_OTHER,
  REMOTE_OK_REGIONS,
  REMOTE_RESTRICTED,
  SALARY,
  GLOBAL_PENALTIES,
  HARD_EXCLUDE_TITLE,
  HARD_EXCLUDE_DESCRIPTION,
  EXPERIENCE,
  SENIOR_TITLE,
  VERY_SENIOR_TITLE,
  LEAD_EXPERIENCE,
  VENDOR_ECOSYSTEMS,
  VENDOR_MENTION_PTS,
  EDUCATION,
  FRESHNESS,
  PRIORITY,
  PARTIAL_DESCRIPTION_MAX_FIT,
  type TrackId,
} from "../../config/profile";
import type { RawJob, WorkMode, Zone, SalaryPeriod } from "../lib/types";
import { stripAccents } from "../lib/text";

export interface ScoreDetails {
  titlePts: number;
  skillsPts: number;
  matchedSkills: string[];
  locationPts: number;
  locationNote: string;
  salaryPts: number;
  salaryNote: string;
  penalties: Array<{ label: string; pts: number }>;
  experienceYears: number | null;
  alternatives: Array<{ track: TrackId; score: number }>;
  partialDescription: boolean;
}

export interface ScoreResult {
  score: number;
  track: TrackId | null;
  trackLabel: string | null;
  cv: string | null;
  priority: "P1" | "P2" | "P3" | null;
  excluded: boolean;
  exclusionReason: string | null;
  workMode: WorkMode;
  zone: Zone;
  /** Salaire mensuel en AED (colonnes salary_*_eur en base, nom historique) */
  salaryMin: number | null;
  salaryMax: number | null;
  details: ScoreDetails;
}

const anyRe = (list: readonly string[]) =>
  new RegExp(list.map((x) => `(?:^|[^a-zà-ÿ])(?:${x})(?:[^a-zà-ÿ]|$)`).join("|"), "i");
const HOME_RE = anyRe(LOCATIONS.home);
const NEAR_RE = anyRe(LOCATIONS.near);
const FAR_RE = anyRe(LOCATIONS.far);
const COUNTRY_RE = anyRe(LOCATIONS.country);
/** Remote réellement mondial ou compatible Golfe (sans liste de pays) */
const STRICT_REMOTE_OK = /(worldwide|anywhere|global|international|mena|middle east|gcc|uae|united arab emirates|dubai)/i;

/** Région étrangère citée dans le TITRE ("Customer Support - UK", "Support Agent (US)"…) */
const TITLE_FOREIGN_REGION =
  /(^|[^a-z])(americas|amer|namer|north america|us|usa|united states|canada|latam|apac|anz|uk|united kingdom|ireland|japan|india|australia|singapore|brazil|mexico|germany|dach|nordics|benelux|spain|italy|poland|portugal|philippines|south africa|ksa|saudi|qatar|kuwait|egypt)([^a-z]|$)/i;

const REMOTE_RE =
  /\b(full[- ]?remote|fully remote|100 ?% (remote|t[ée]l[ée]travail)|remote[- ]first|work from (home|anywhere)|wfh|t[ée]l[ée]travail (total|complet|int[ée]gral|100)|en remote|remote|telecommute)\b/i;
const HYBRID_RE = /\b(hybrid|hybride|t[ée]l[ée]travail partiel|partial remote|flexible working)\b/i;

const N = "(\\d|one|two|three)";
/** Remote partiel / présence au bureau imposée → hybride */
const OFFICE_DAYS_RE = new RegExp(
  [
    `\\b${N} ?days? (a|per|each) week (in|at|from) (the |our )?office`,
    `\\b${N} (remote|wfh|home ?office) days?`,
    `\\b${N} days? (of )?(remote|wfh|work from home)( work)?( per| a| each)? ?(week)?`,
    `\\b${N} days? (at|in) (the |our )?office`,
    `\\boffice[- ]first\\b`,
    `\\bremote[- ]friendly\\b`,
    `\\bhybrid (work|model|role|position|setup|policy)\\b`,
  ].join("|"),
  "i",
);
/** Présence au bureau à 100 % → sur site */
const ONSITE_STRONG_RE =
  /\b(100 ?% (on[- ]?site|in[- ]office)|full[- ]time (in|on)[- ]?(the )?(office|site)|fully (on[- ]?site|in[- ]office)|(this|the) (role|position|job) is (fully )?(on[- ]?site|in[- ]office|in[- ]person)|no remote|on[- ]site role|work from (the )?office)\b/i;

export function detectWorkMode(raw: RawJob): WorkMode {
  const descHead = (raw.description ?? "").slice(0, 10000);
  // Offre déclarée "remote" (filtre LinkedIn, ATS…) mais la description impose du bureau → on corrige
  if (raw.workMode === "remote") {
    if (ONSITE_STRONG_RE.test(descHead)) return "onsite";
    if (OFFICE_DAYS_RE.test(descHead)) return "hybrid";
  }
  if (raw.workMode && raw.workMode !== "unknown") return raw.workMode;
  const head = `${raw.title} ${raw.location ?? ""}`;
  if (HYBRID_RE.test(head)) return "hybrid";
  if (REMOTE_RE.test(head)) return "remote";
  const desc = (raw.description ?? "").slice(0, 6000);
  if (ONSITE_STRONG_RE.test(desc)) return "onsite";
  if (HYBRID_RE.test(desc) || OFFICE_DAYS_RE.test(desc)) return "hybrid";
  if (/\b(full[- ]?remote|fully remote|100 ?% remote|work from anywhere)\b/i.test(desc)) return "remote";
  return "unknown";
}

export function detectZone(location: string | null): Zone {
  if (!location || !location.trim()) return "unknown";
  if (HOME_RE.test(location)) return "home";
  if (NEAR_RE.test(location)) return "near";
  if (FAR_RE.test(location)) return "far";
  if (COUNTRY_RE.test(location)) return "country";
  if (/^(remote|anywhere|worldwide|global|hybrid|telecommute|work from home)\b/i.test(location.trim())) return "unknown";
  return "foreign";
}

function scoreLocation(raw: RawJob, mode: WorkMode, zone: Zone): { pts: number; note: string; exclude?: string } {
  const loc = raw.location ?? "";
  const desc = (raw.description ?? "").slice(0, 8000);

  if (mode === "remote" && (zone === "home" || zone === "near" || zone === "country")) return { pts: 20, note: "Remote depuis les Émirats" };
  if (zone === "home") return { pts: 20, note: `Dubaï (${modeLabel(mode)})` };
  if (zone === "near") return { pts: mode === "onsite" || mode === "unknown" ? 15 : 18, note: `${loc} (trajet depuis Dubaï, ${modeLabel(mode)})` };
  if (zone === "country") return { pts: 14, note: "Émirats, ville non précisée" };
  if (zone === "far") {
    if (mode === "remote") return { pts: 18, note: `Remote (${loc})` };
    return { pts: 4, note: `Autre émirat (${loc}) : trajet long ou déménagement` };
  }

  if (mode === "remote") {
    if (REMOTE_RESTRICTED.test(loc)) return { pts: 0, note: "", exclude: `Remote réservé à une autre zone (${loc})` };
    const titleRegion = raw.title.match(TITLE_FOREIGN_REGION);
    if (titleRegion && !STRICT_REMOTE_OK.test(raw.title))
      return { pts: 0, note: "", exclude: `Poste rattaché à une autre zone (${titleRegion[0].trim()})` };
    // "Remote - Belize", "Remote (Poland)" : remote réservé aux résidents de ce pays
    const region = loc.replace(/^\s*(remote|telecommute|work from home)\s*[-–:,(/]?\s*/i, "").replace(/\)\s*$/, "").trim();
    if (region && region !== loc.trim() && !REMOTE_OK_REGIONS.test(region))
      return { pts: 0, note: "", exclude: `Remote limité à : ${region}` };
    const locOk = STRICT_REMOTE_OK.test(loc) || (zone !== "foreign" && REMOTE_OK_REGIONS.test(loc));
    if (!locOk && REMOTE_RESTRICTED.test(`${loc} ${desc}`)) return { pts: 0, note: "", exclude: "Remote réservé à un autre pays" };
    if (!locOk && zone === "foreign") return { pts: 0, note: "", exclude: `Remote limité à : ${loc}` };
    if (raw.source === "linkedin" && !/(remote|work from (home|anywhere)|home[- ]based|telecommute|t[ée]l[ée]travail)/i.test(desc))
      return { pts: 12, note: "Remote selon LinkedIn, non confirmé dans l'annonce" };
    if (locOk) return { pts: 20, note: `Remote (${loc || "monde"})` };
    return { pts: 12, note: "Remote, zone non précisée" };
  }

  if (zone === "foreign")
    return { pts: 0, note: "", exclude: GULF_OTHER.test(loc) ? `Autre pays du Golfe (${loc})` : `Étranger sur site (${loc})` };
  return { pts: 6, note: "Localisation inconnue" };
}

function modeLabel(m: WorkMode) {
  return { onsite: "sur site", hybrid: "hybride", remote: "remote", unknown: "mode non précisé" }[m];
}

// ───────────────────────── Salaire (AED / mois) ─────────────────────────

const RATES = SALARY.rates;

function currencyCode(sym: string | null | undefined): string {
  if (!sym) return "AED";
  const s = sym.toLowerCase();
  if (s.includes("aed") || s.includes("dhs") || s.includes("dirham") || s.includes("د.إ")) return "AED";
  if (s.includes("$") || s.includes("usd")) return "USD";
  if (s.includes("€") || s.includes("eur")) return "EUR";
  if (s.includes("£") || s.includes("gbp")) return "GBP";
  if (s.includes("sar")) return "SAR";
  if (s.includes("chf")) return "CHF";
  return "AED";
}

/** Montant → mensuel */
function toMonthly(amount: number, period: SalaryPeriod): number {
  switch (period) {
    case "hour":
      return amount * 173;
    case "day":
      return amount * 22;
    case "year":
      return amount / 12;
    default:
      return amount;
  }
}

/** Période explicite dans le contexte, sinon déduite du montant (AED : mensuel jusqu'à 80k) */
function guessPeriod(context: string, amount: number, cur: string): SalaryPeriod | null {
  if (/(\/ ?h(ou)?r?\b|per hour|hourly|\/heure|de l'heure)/i.test(context)) return "hour";
  if (/(\/ ?day|per day|daily|par jour)/i.test(context)) return "day";
  if (/(\/ ?mo(nth)?\b|per month|monthly|p\.?m\.?\b|par mois|mensuel)/i.test(context)) return "month";
  if (/(\/ ?y(ea)?r\b|per (year|annum)|annual(ly)?|p\.?a\.?\b|yearly|par an)/i.test(context)) return "year";
  if (cur === "AED" || cur === "SAR") return amount >= 100_000 ? "year" : amount >= 1500 ? "month" : null;
  return amount >= 15_000 ? "year" : amount >= 800 ? "month" : null;
}

const CUR = "aed|dhs?|dirhams?|usd|eur|gbp|sar|chf|€|\\$|£";
const MONEY_RE = new RegExp(
  `(?:(${CUR})\\.?\\s?(\\d{1,3}(?:[ ,.]\\d{3})+|\\d+(?:[.,]\\d+)?)(\\s?k\\b)?|(\\d{1,3}(?:[ ,.]\\d{3})+|\\d+(?:[.,]\\d+)?)(\\s?k)?\\s?(${CUR})(?![a-z]))`,
  "gi",
);
const K_RANGE_RE = new RegExp(`(${CUR})?\\s?(\\d{1,3})\\s?k?\\s?(?:-|–|to)\\s?(${CUR})?\\s?(\\d{1,3})\\s?k\\b\\s?(${CUR})?`, "i");
const NUM = "(\\d{1,3}(?:[ ,.]\\d{3})+|\\d{3,6})";
const FULL_RANGE_RE = new RegExp(`(?:(${CUR})\\.?\\s?)${NUM}\\s?(?:-|–|to)\\s?(?:${CUR})?\\.?\\s?${NUM}|${NUM}\\s?(?:-|–|to)\\s?${NUM}\\s?(${CUR})(?![a-z])`, "i");
const NOT_SALARY_AFTER = /^\s?(m|mm|b|bn|million|billion|users|clients|customers|employees|sq|sqft)\b/i;

function parseAmount(num: string, k: boolean): number {
  const n = /^\d+[.,]\d{1,2}$/.test(num) ? parseFloat(num.replace(",", ".")) : parseFloat(num.replace(/[ ,.]/g, ""));
  return k ? n * 1000 : n;
}

const plausible = (m: number) => m >= SALARY.plausible.min && m <= SALARY.plausible.max;

/** Extrait une fourchette de salaire mensuel en AED depuis du texte libre */
export function parseSalaryText(text: string | null | undefined): { min: number; max: number } | null {
  if (!text) return null;

  // "AED 8k - 10k", "$40k-50k"
  const kr = text.match(K_RANGE_RE);
  if (kr && (kr[1] || kr[3] || kr[5])) {
    const cur = currencyCode(kr[1] ?? kr[3] ?? kr[5]);
    const ctx = text.slice(Math.max(0, (kr.index ?? 0) - 30), (kr.index ?? 0) + kr[0].length + 30);
    const a = parseInt(kr[2], 10) * 1000;
    const b = parseInt(kr[4], 10) * 1000;
    const period = guessPeriod(ctx, b, cur) ?? "month";
    const lo = Math.round(toMonthly(a, period) * (RATES[cur] ?? 1));
    const hi = Math.round(toMonthly(b, period) * (RATES[cur] ?? 1));
    if (lo <= hi && plausible(lo) && plausible(hi)) return { min: lo, max: hi };
  }

  // "AED 5,000 - 6,000 per month"
  const fr = text.match(FULL_RANGE_RE);
  if (fr) {
    const cur = currencyCode(fr[1] ?? fr[6]);
    const ctx = text.slice(Math.max(0, (fr.index ?? 0) - 40), (fr.index ?? 0) + fr[0].length + 40);
    const a = parseAmount(fr[2] ?? fr[4], false);
    const b = parseAmount(fr[3] ?? fr[5], false);
    const period = guessPeriod(ctx, b, cur);
    if (period && a <= b) {
      const lo = Math.round(toMonthly(a, period) * (RATES[cur] ?? 1));
      const hi = Math.round(toMonthly(b, period) * (RATES[cur] ?? 1));
      if (plausible(lo) && plausible(hi)) return { min: lo, max: hi };
    }
  }

  const found: Array<{ aed: number; idx: number }> = [];
  for (const m of text.matchAll(MONEY_RE)) {
    const idx = m.index ?? 0;
    if (NOT_SALARY_AFTER.test(text.slice(idx + m[0].length, idx + m[0].length + 12))) continue;
    const sym = m[1] ?? m[6];
    const num = m[2] ?? m[4];
    if (!num || !sym) continue;
    const cur = currencyCode(sym);
    const amount = parseAmount(num, Boolean(m[3] ?? m[5]));
    const ctx = text.slice(Math.max(0, idx - 40), idx + m[0].length + 40);
    // Commission / budget / prix d'un bien immobilier : pas un salaire
    if (/(property|properties|apartment|villa|price|worth|deal|transaction|portfolio|turnover|revenue|budget|fees?)\b/i.test(ctx) && !/salary|package|compensation|pay\b/i.test(ctx)) continue;
    const period = guessPeriod(ctx, amount, cur);
    if (!period) continue;
    const monthly = Math.round(toMonthly(amount, period) * (RATES[cur] ?? 1));
    if (plausible(monthly)) found.push({ aed: monthly, idx });
  }
  if (!found.length) return null;
  const first = found[0];
  const second = found.find((f) => f !== first && f.idx - first.idx < 60);
  const vals = second ? [first.aed, second.aed] : [first.aed];
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

function resolveSalary(raw: RawJob): { min: number; max: number } | null {
  if (raw.salaryMin || raw.salaryMax) {
    const cur = (raw.salaryCurrency ?? "AED").toUpperCase();
    const lo = raw.salaryMin || raw.salaryMax!;
    const hi = raw.salaryMax || raw.salaryMin!;
    const period = raw.salaryPeriod ?? guessPeriod("", hi, cur) ?? "month";
    const min = Math.round(toMonthly(lo, period) * (RATES[cur] ?? 1));
    const max = Math.round(toMonthly(hi, period) * (RATES[cur] ?? 1));
    if (plausible(max)) return { min, max };
  }
  return parseSalaryText(raw.salaryText) ?? parseSalaryText((raw.description ?? "").slice(0, 15000));
}

const aedK = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`);

function scoreSalary(sal: { min: number; max: number } | null): { pts: number; note: string; exclude?: string } {
  if (!sal) return { pts: 5, note: "Salaire non communiqué" };
  const range = `AED ${sal.min === sal.max ? aedK(sal.max) : `${aedK(sal.min)}–${aedK(sal.max)}`}/mois`;
  if (sal.max < SALARY.minAed) return { pts: 0, note: range, exclude: `Salaire sous le plancher (${range})` };
  if (sal.max >= SALARY.goodAed) return { pts: 10, note: range };
  return { pts: 7, note: sal.min < SALARY.minAed ? `${range} (bas de fourchette < ${aedK(SALARY.minAed)})` : range };
}

// ───────────────────────── Expérience ─────────────────────────

const EXP_RE =
  /(?:minimum|at least|au moins|min\.?)?\s*(\d{1,2})\s*(?:\+|-\s*\d{1,2}|à\s*\d{1,2}|to\s*\d{1,2})?\s*\+?\s*(?:years?|yrs|ans|ann[ée]es)\b[^.\n]{0,40}?(?:exp[ée]rience|experience|exp\b|in |of |d'|de |dans|en )/gi;

export function requiredYears(text: string): number | null {
  let best: number | null = null;
  for (const m of text.matchAll(EXP_RE)) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 20) best = best === null ? n : Math.max(best, n);
  }
  return best;
}

// ───────────────────────── Langue de l'offre ─────────────────────────

const EN_WORDS = /\b(the|and|you|with|our|we|will|for|experience|team|are|your)\b/gi;
const FR_WORDS = /\b(le|la|les|et|vous|avec|nous|des|une|pour|équipe|expérience|est|sur)\b/gi;

export function offerLanguage(raw: RawJob): "fr" | "en" {
  const text = `${raw.title} ${(raw.description ?? "").slice(0, 3000)}`;
  const en = text.match(EN_WORDS)?.length ?? 0;
  const fr = text.match(FR_WORDS)?.length ?? 0;
  if (en === 0 && fr === 0) return /\b(h\/f|f\/h)\b|[éèàç]/i.test(raw.title) ? "fr" : "en";
  return en > fr ? "en" : "fr";
}

function pickCv(track: (typeof TRACKS)[number], title: string, lang: "fr" | "en"): string {
  const rule = track.cvByTitle?.find(([re]) => re.test(title));
  if (rule) return lang === "en" ? rule[2] : rule[1];
  return lang === "en" ? track.cvEn : track.cv;
}

// ───────────────────────── Diplôme ─────────────────────────

const DEGREE_RE =
  /(bac ?\+ ?5|\bmaster ?(2|ii)\b|\bm2\b|(?<!scrum )\bmaster(?:'?s)?(?! data)\b|\bmsc\b|\bmba\b|\bms degree|[ée]cole d['’]ing[ée]nieurs?|dipl[oô]m[ée]e?s? d['’]ing[ée]nieur|grande [ée]cole|engineering degree)/gi;
const DEGREE_CONTEXT = /(formation|dipl[oô]m|degree|bac|[ée]tudes|education|universit|[ée]cole|cursus|graduate)/i;
const DEGREE_OK_RANGE = /bac ?\+ ?[234] ?(à|a|-|–|\/|ou|or|to) ?(bac ?\+ ?)?[345]|bac ?\+ ?[234] (minimum|min\b)|bachelor/i;
const DEGREE_EQUIV = /(ou [ée]quivalent|or equivalent|ou exp[ée]rience [ée]quivalente|equivalent (practical |professional |work )?experience)/i;
const DEGREE_SOFT = /(id[ée]alement|souhait[ée]|appr[ée]ci[ée]|un plus|serait un plus|preferred|ideally|a plus|nice to have|bonus|de pr[ée]f[ée]rence)/i;

function lastIndexOfAny(text: string, chars: string, before: number) {
  for (let i = before - 1; i >= 0; i--) if (chars.includes(text[i])) return i;
  return -1;
}
function firstIndexOfAny(text: string, chars: string, from: number) {
  for (let i = from; i < text.length; i++) if (chars.includes(text[i])) return i;
  return text.length;
}

/** Pénalité si l'offre demande un niveau au-dessus du tien (Bac+5, Master, ingénieur) */
export function educationPenalty(text: string): { label: string; pts: number } | null {
  let worst: { label: string; pts: number } | null = null;
  for (const m of text.matchAll(DEGREE_RE)) {
    const idx = m.index ?? 0;
    const ctx = text.slice(Math.max(0, idx - 90), idx + m[0].length + 90);
    if (/^master/i.test(m[0]) && !DEGREE_CONTEXT.test(ctx)) continue; // "master the craft", etc.
    if (DEGREE_OK_RANGE.test(ctx)) continue; // "Bac+3 à Bac+5" → ton niveau est accepté
    // "idéalement" ne compte que dans le même segment (entre virgules) :
    // "De formation Bac+5, idéalement école d'ingé" → le Bac+5 reste demandé
    const end = idx + m[0].length;
    const clause = text.slice(lastIndexOfAny(text, ",;.\n", idx) + 1, firstIndexOfAny(text, ",;.\n", end));
    const sentence = text.slice(lastIndexOfAny(text, ".\n", idx) + 1, firstIndexOfAny(text, ".\n", end));
    const p = DEGREE_EQUIV.test(sentence)
      ? { label: "Master demandé (équivalence possible)", pts: EDUCATION.equivalent }
      : DEGREE_SOFT.test(clause)
        ? { label: "Master souhaité", pts: EDUCATION.preferred }
        : { label: "Master / MBA demandé", pts: EDUCATION.required };
    if (!worst || p.pts > worst.pts) worst = p;
  }
  return worst;
}

// ───────────────────────── Fraîcheur & priorité ─────────────────────────

/** Bonus/malus selon l'âge de l'offre */
export function freshnessAdjust(publishedAt: Date | string | null | undefined, now = Date.now()): number {
  if (!publishedAt) return 0;
  const ageH = Math.max(0, (now - new Date(publishedAt).getTime()) / 3600_000);
  for (const [maxH, pts] of FRESHNESS) if (ageH < maxH) return pts;
  return 0;
}

export function priorityFor(score: number, excluded: boolean): "P1" | "P2" | "P3" | null {
  if (excluded) return null;
  return score >= PRIORITY.P1 ? "P1" : score >= PRIORITY.P2 ? "P2" : score >= PRIORITY.P3 ? "P3" : null;
}

export const finalScore = (fit: number, adj: number) => Math.max(0, Math.min(100, fit + adj));

// ───────────────────────── Score principal ─────────────────────────

export function isTitleRelevant(title: string): boolean {
  if (HARD_EXCLUDE_TITLE.some(([re]) => re.test(title))) return false;
  return TRACKS.some((t) => t.strongTitle.some((re) => re.test(title)) || t.weakTitle.some((re) => re.test(title)));
}

/** Expérience de lead exigée vs la tienne (LEAD_EXPERIENCE.myYears) */
export function leadRequirement(text: string): { kind: "exclude"; reason: string } | { kind: "mention" } | null {
  // "souhaité / a plus / nice to have" autour de l'exigence → simple pénalité, pas d'exclusion
  const SOFT = /\b(plus|bonus|nice[- ]to[- ]have|preferred|ideally|id[ée]alement|souhait[ée]e?s?|appr[ée]ci[ée]e?s?|serait un atout|un atout|not required|optional)\b/i;
  const required: number[] = [];
  let soft = false;
  for (const m of text.matchAll(new RegExp(LEAD_EXPERIENCE.yearsRe, "gi"))) {
    const n = Number(m[1]);
    if (!(n > LEAD_EXPERIENCE.myYears && n < 20)) continue;
    const around = text.slice(Math.max(0, m.index! - 160), m.index! + m[0].length + 60);
    if (SOFT.test(around)) soft = true;
    else required.push(n);
  }
  const max = required.length ? Math.max(...required) : null;
  if (max !== null)
    return { kind: "exclude", reason: `${max} ans d'expérience de lead/management exigés (toi : ~${LEAD_EXPERIENCE.myYears})` };
  if (LEAD_EXPERIENCE.strongRe.test(text)) return { kind: "exclude", reason: "Expérience de lead confirmée exigée (toi : ~1 an)" };
  if (soft || LEAD_EXPERIENCE.mentionRe.test(text)) return { kind: "mention" };
  return null;
}

export function scoreJob(raw: RawJob): ScoreResult {
  const title = raw.title;
  const description = raw.description ?? "";
  const fullText = `${title}\n${description}`;
  const fullTextNoAccent = stripAccents(fullText);
  const partialDescription = description.length < 300;

  const mode = detectWorkMode(raw);
  const zone = detectZone(raw.location);
  const loc = scoreLocation(raw, mode, zone);
  const salary = resolveSalary(raw);
  const sal = scoreSalary(salary);

  const penalties: Array<{ label: string; pts: number }> = [];
  for (const p of GLOBAL_PENALTIES) {
    const target = p.scope === "title" ? title : fullText;
    if (p.re.test(target)) penalties.push({ label: p.label, pts: p.pts });
  }

  const years = requiredYears(fullText);
  const isSeniorTitle = SENIOR_TITLE.test(title);

  const vendor = description.match(VENDOR_ECOSYSTEMS);
  if (vendor && !VENDOR_ECOSYSTEMS.test(title)) penalties.push({ label: `${vendor[2]} mentionné (non maîtrisé)`, pts: VENDOR_MENTION_PTS });

  const lead = leadRequirement(fullText);
  if (lead?.kind === "mention") penalties.push({ label: "Expérience de management mentionnée", pts: LEAD_EXPERIENCE.mentionPts });

  const edu = educationPenalty(fullText);
  if (edu) penalties.push(edu);

  const globalPenalty = penalties.reduce((s, p) => s + p.pts, 0);

  const perTrack = TRACKS.map((t) => {
    const titlePts = t.strongTitle.some((re) => re.test(title)) ? 45 : t.weakTitle.some((re) => re.test(title)) ? 25 : 0;
    const matched: string[] = [];
    let skillSum = 0;
    for (const [re, weight] of t.skills) {
      const m = fullText.match(re) ?? fullTextNoAccent.match(re);
      if (m) {
        skillSum += weight;
        matched.push(m[2] ?? m[0].trim());
      }
    }
    let skillsPts = Math.min(25, skillSum);
    if (partialDescription) skillsPts = Math.max(skillsPts, 8);

    const trackPenalties: Array<{ label: string; pts: number }> = [];
    for (const [re, pts, label] of t.penalties ?? []) {
      if (re.test(title)) trackPenalties.push({ label, pts });
      else if (re.test(description)) trackPenalties.push({ label: `${label} (mentionné)`, pts: Math.round(pts / 2) });
    }
    // Séniorité évaluée par rapport à TON expérience dans ce métier précis
    if (isSeniorTitle && t.seniority.seniorTitle > 0)
      trackPenalties.push({ label: `Poste senior (${t.seniority.years} an${t.seniority.years > 1 ? "s" : ""} d'exp. dans ce métier)`, pts: t.seniority.seniorTitle });
    if (years !== null && years > t.seniority.years) {
      const gap = years - t.seniority.years;
      trackPenalties.push({
        label: `${years} ans d'exp. demandés (toi : ~${t.seniority.years} dans ce métier)`,
        pts: gap > EXPERIENCE.bigGap ? EXPERIENCE.severe : EXPERIENCE.moderate,
      });
    }
    const tp = trackPenalties.reduce((s, p) => s + p.pts, 0);
    let score = titlePts + skillsPts + loc.pts + sal.pts - globalPenalty - tp;
    if (titlePts === 0) score = Math.min(score, 30);
    if (partialDescription) score = Math.min(score, PARTIAL_DESCRIPTION_MAX_FIT);
    score = Math.max(0, Math.min(100, score));
    return { track: t, titlePts, skillsPts, matched, trackPenalties, score };
  }).sort((a, b) => b.score - a.score);

  const best = perTrack[0];
  const descExclude = HARD_EXCLUDE_DESCRIPTION.find(([re]) => re.test(description));
  let exclusionReason: string | null = null;
  const hard = HARD_EXCLUDE_TITLE.find(([re]) => re.test(title));
  if (hard) exclusionReason = hard[0] === VENDOR_ECOSYSTEMS ? `${hard[1]} (${title.match(VENDOR_ECOSYSTEMS)?.[2]})` : hard[1];
  else if (
    best.titlePts > 0 &&
    best.track.seniority.excludeSeniorIf?.test(title) &&
    (isSeniorTitle || VERY_SENIOR_TITLE.test(title))
  )
    exclusionReason = `Poste senior en ${best.track.label} : pas ton profil`;
  else if (descExclude) exclusionReason = descExclude[1];
  else if (lead?.kind === "exclude") exclusionReason = lead.reason;
  else if (loc.exclude) exclusionReason = loc.exclude;
  else if (sal.exclude) exclusionReason = sal.exclude;

  const score = best.score;
  const excluded = exclusionReason !== null;
  const priority = excluded
    ? null
    : score >= PRIORITY.P1
      ? "P1"
      : score >= PRIORITY.P2
        ? "P2"
        : score >= PRIORITY.P3
          ? "P3"
          : null;

  return {
    score,
    track: best.titlePts > 0 ? best.track.id : null,
    trackLabel: best.titlePts > 0 ? best.track.label : null,
    cv: best.titlePts > 0 ? pickCv(best.track, title, offerLanguage(raw)) : null,
    priority,
    excluded,
    exclusionReason,
    workMode: mode,
    zone,
    salaryMin: salary?.min ?? null,
    salaryMax: salary?.max ?? null,
    details: {
      titlePts: best.titlePts,
      skillsPts: best.skillsPts,
      matchedSkills: best.matched,
      locationPts: loc.pts,
      locationNote: loc.note || loc.exclude || "",
      salaryPts: sal.pts,
      salaryNote: sal.note,
      penalties: [...penalties, ...best.trackPenalties],
      experienceYears: years,
      alternatives: perTrack.slice(1, 3).filter((p) => p.titlePts > 0).map((p) => ({ track: p.track.id, score: p.score })),
      partialDescription,
    },
  };
}
