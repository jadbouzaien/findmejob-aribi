/**
 * Workable : recherche publique sur TOUTES les entreprises qui recrutent via Workable (jobs.workable.com).
 * Beaucoup d'agences immobilières, hôtels, cliniques et PME de Dubaï publient là, souvent avant les job boards.
 * Sans clé. On récupère toutes les offres récentes aux Émirats, puis le filtre de titres fait le tri.
 */
import type { RawJob, Source, WorkMode } from "../lib/types";
import { getJson, htmlToText, jitter } from "../lib/text";
import { isTitleRelevant } from "../scoring/score";

interface WkJob {
  id: string;
  title: string;
  url: string;
  description?: string;
  requirementsSection?: string;
  benefitsSection?: string;
  employmentType?: string;
  locations?: string[];
  location?: { city?: string; subregion?: string | null; countryName?: string };
  created?: string;
  company?: { title?: string };
  workplace?: string;
}

interface WkPage {
  totalSize: number;
  jobs: WkJob[];
  nextPageToken?: string;
}

/** Recherches remote : on ne garde ensuite que le remote mondial / Golfe (scoring) */
const REMOTE_QUERIES = ["customer support", "customer service", "french", "virtual assistant", "administrative assistant"];

const mode = (w?: string): WorkMode => (w === "remote" ? "remote" : w === "hybrid" ? "hybrid" : w === "on_site" ? "onsite" : "unknown");

async function search(params: Record<string, string>, maxPages: number): Promise<WkJob[]> {
  const out: WkJob[] = [];
  let token: string | undefined;
  for (let p = 0; p < maxPages; p++) {
    const q = new URLSearchParams(params);
    if (token) q.set("pageToken", token);
    const page = await getJson<WkPage>(`https://jobs.workable.com/api/v1/jobs?${q}`);
    out.push(...page.jobs);
    token = page.nextPageToken;
    if (!token || !page.jobs.length) break;
    await jitter(800, 1600);
  }
  return out;
}

function toRaw(j: WkJob): RawJob {
  const loc = j.location ?? {};
  const place = [loc.city, loc.countryName].filter(Boolean).join(", ");
  const remote = j.workplace === "remote";
  return {
    source: "workable",
    externalId: j.id,
    url: j.url,
    title: j.title.replace(/\s+/g, " ").trim(),
    company: j.company?.title ?? null,
    location: remote ? `Remote - ${loc.countryName || "Anywhere"}` : place || null,
    workMode: mode(j.workplace),
    description: [htmlToText(j.description), htmlToText(j.requirementsSection), htmlToText(j.benefitsSection), j.employmentType]
      .filter(Boolean)
      .join("\n\n"),
    postedAt: j.created ? new Date(j.created) : null,
  };
}

export const workable: Source = {
  id: "workable",
  label: "Workable",
  intervalMin: 20,
  enabled: () => true,
  async fetch(ctx) {
    const days = ctx.seeding ? "7" : "1";
    const jobs = await search({ location: "United Arab Emirates", day_range: days }, ctx.seeding ? 30 : 10);
    for (const query of REMOTE_QUERIES) {
      try {
        jobs.push(...(await search({ query, workplace: "remote", day_range: days }, ctx.seeding ? 5 : 2)));
      } catch (e) {
        ctx.log(`  ⚠️ workable/remote "${query}": ${(e as Error).message}`);
      }
    }
    const seen = new Set<string>();
    return jobs
      .filter((j) => !seen.has(j.id) && seen.add(j.id) && isTitleRelevant(j.title))
      .map(toRaw);
  },
};
