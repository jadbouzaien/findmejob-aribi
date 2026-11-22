/**
 * Job boards 100% remote (télétravail depuis Dubaï : seules les offres mondiales / Golfe passent le scoring).
 * Conditions d'usage : on cite la source et on renvoie vers leur URL (fait dans le tableau).
 */
import { XMLParser } from "fast-xml-parser";
import type { RawJob, Source } from "../lib/types";
import { getJson, getText, htmlToText, decodeEntities } from "../lib/text";
import { isTitleRelevant } from "../scoring/score";

// ───────────── Remote OK ─────────────
interface RemoteOkJob {
  id?: string;
  legal?: string;
  date?: string;
  company?: string;
  position?: string;
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  url?: string;
  tags?: string[];
}

export const remoteok: Source = {
  id: "remoteok",
  label: "Remote OK",
  intervalMin: 30,
  enabled: () => true,
  async fetch() {
    const data = await getJson<RemoteOkJob[]>("https://remoteok.com/api");
    return data
      .filter((j) => j.id && j.position && isTitleRelevant(j.position))
      .map((j) => ({
        source: "remoteok",
        externalId: String(j.id),
        url: j.url!,
        title: decodeEntities(j.position!),
        company: j.company ?? null,
        location: j.location || "Remote",
        workMode: "remote" as const,
        description: [htmlToText(j.description), (j.tags ?? []).join(", ")].filter(Boolean).join("\n\n"),
        salaryMin: j.salary_min || null,
        salaryMax: j.salary_max || null,
        salaryCurrency: "USD",
        salaryPeriod: "year" as const,
        postedAt: j.date ? new Date(j.date) : null,
      }));
  },
};

// ───────────── Remotive (max 4 appels/jour, offres décalées de 24h) ─────────────
interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  tags?: string[];
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

export const remotive: Source = {
  id: "remotive",
  label: "Remotive",
  intervalMin: 6 * 60,
  enabled: () => true,
  async fetch() {
    const { jobs } = await getJson<{ jobs: RemotiveJob[] }>("https://remotive.com/api/remote-jobs");
    return jobs
      .filter((j) => isTitleRelevant(j.title))
      .map((j) => ({
        source: "remotive",
        externalId: String(j.id),
        url: j.url,
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote",
        workMode: "remote" as const,
        description: [htmlToText(j.description), (j.tags ?? []).join(", ")].filter(Boolean).join("\n\n"),
        salaryText: j.salary || null,
        postedAt: j.publication_date ? new Date(j.publication_date + "Z") : null,
      }));
  },
};

// ───────────── Himalayas ─────────────
interface HimalayasJob {
  guid: string;
  title: string;
  companyName: string;
  applicationLink: string;
  description?: string;
  excerpt?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string;
  salaryPeriod?: string;
  locationRestrictions?: string[];
  categories?: string[];
  pubDate?: number;
}

export const himalayas: Source = {
  id: "himalayas",
  label: "Himalayas",
  intervalMin: 30,
  enabled: () => true,
  async fetch(ctx) {
    const pages = ctx.seeding ? 10 : 4;
    const all: HimalayasJob[] = [];
    for (let p = 0; p < pages; p++) {
      const { jobs } = await getJson<{ jobs: HimalayasJob[] }>(`https://himalayas.app/jobs/api?limit=20&offset=${p * 20}`);
      if (!jobs?.length) break;
      all.push(...jobs);
    }
    return all
      .filter((j) => isTitleRelevant(j.title))
      .map((j) => {
        const per = (j.salaryPeriod ?? "").toLowerCase();
        return {
          source: "himalayas",
          externalId: j.guid,
          url: j.applicationLink || j.guid,
          title: j.title,
          company: j.companyName,
          location: j.locationRestrictions?.length ? `Remote - ${j.locationRestrictions.join(", ")}` : "Remote - Worldwide",
          workMode: "remote" as const,
          description: [htmlToText(j.description) ?? j.excerpt, (j.categories ?? []).join(", ")].filter(Boolean).join("\n\n"),
          salaryMin: j.minSalary ?? null,
          salaryMax: j.maxSalary ?? null,
          salaryCurrency: j.currency ?? "USD",
          salaryPeriod: per.startsWith("hour") ? "hour" : per.startsWith("month") ? "month" : per.startsWith("day") ? "day" : "year",
          postedAt: j.pubDate ? new Date(j.pubDate * 1000) : null,
        } satisfies RawJob;
      });
  },
};

// ───────────── We Work Remotely (RSS) ─────────────
const WWR_FEEDS = ["remote-customer-support-jobs", "all-other-remote-jobs"];

interface WwrItem {
  title: string;
  region?: string;
  country?: string;
  link: string;
  guid?: string | { "#text": string };
  pubDate?: string;
  description?: string;
}

export const weworkremotely: Source = {
  id: "weworkremotely",
  label: "We Work Remotely",
  intervalMin: 30,
  enabled: () => true,
  async fetch(ctx) {
    const parser = new XMLParser({ ignoreAttributes: true });
    const out: RawJob[] = [];
    for (const feed of WWR_FEEDS) {
      try {
        const xml = await getText(`https://weworkremotely.com/categories/${feed}.rss`);
        const doc = parser.parse(xml);
        const items: WwrItem[] = [doc?.rss?.channel?.item ?? []].flat();
        for (const it of items) {
          const [company, ...rest] = String(it.title).split(":");
          const title = rest.join(":").trim() || String(it.title);
          if (!isTitleRelevant(title)) continue;
          out.push({
            source: "weworkremotely",
            externalId: it.link,
            url: it.link,
            title,
            company: company.trim(),
            location: `Remote - ${[it.region, it.country].filter(Boolean).join(", ") || "Anywhere"}`,
            workMode: "remote",
            description: htmlToText(it.description),
            postedAt: it.pubDate ? new Date(it.pubDate) : null,
          });
        }
      } catch (e) {
        ctx.log(`  ⚠️ wwr/${feed}: ${(e as Error).message}`);
      }
    }
    return out;
  },
};
