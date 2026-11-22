/**
 * Careerjet : moteur d'agrégation d'offres, API publique pour partenaires (identifiant gratuit).
 * Version Émirats (locale en_AE) : reprend les offres de nombreux sites locaux et pages carrières,
 * ce qui compense Indeed, Bayt, GulfTalent et Naukrigulf, inaccessibles sans navigateur (protection anti-robots).
 *
 * L'API ne renvoie qu'un extrait de description : le score s'appuie surtout sur le titre.
 * Inscription : https://www.careerjet.com/partners/ → CAREERJET_AFFID dans .env
 */
import { createHash } from "node:crypto";
import type { RawJob, Source } from "../lib/types";
import { getJson, htmlToText, jitter } from "../lib/text";
import { env } from "../lib/env";
import { isTitleRelevant } from "../scoring/score";

interface CjJob {
  title: string;
  company?: string;
  locations?: string;
  date?: string;
  url: string;
  description?: string;
  salary?: string;
  salary_min?: string | number;
  salary_max?: string | number;
  salary_currency_code?: string;
  salary_type?: string; // Y | M | W | D | H
}

const KEYWORDS = [
  "customer service",
  "customer support",
  "receptionist",
  "front desk",
  "guest relations",
  "concierge",
  "administrative assistant",
  "office administrator",
  "executive assistant",
  "property consultant",
  "real estate",
  "leasing",
  "sales coordinator",
  "french speaking",
];

const PERIOD: Record<string, "year" | "month" | "day" | "hour"> = { Y: "year", M: "month", D: "day", H: "hour" };

export const careerjet: Source = {
  id: "careerjet",
  label: "Careerjet",
  intervalMin: 30,
  enabled: () => Boolean(env.careerjetAffid),
  async fetch(ctx) {
    const out: RawJob[] = [];
    const pages = ctx.seeding ? 3 : 1;
    for (const keywords of KEYWORDS) {
      for (let page = 1; page <= pages; page++) {
        const p = new URLSearchParams({
          locale_code: "en_AE",
          keywords,
          location: "Dubai",
          sort: "date",
          pagesize: "50",
          page: String(page),
          affid: env.careerjetAffid,
          user_ip: "127.0.0.1",
          user_agent: "find-me-job",
          url: env.careerjetReferer,
        });
        let data: { type: string; jobs?: CjJob[]; pages?: number };
        try {
          data = await getJson(`http://public.api.careerjet.net/search?${p}`, { headers: { Referer: env.careerjetReferer } });
        } catch (e) {
          ctx.log(`  ⚠️ careerjet "${keywords}": ${(e as Error).message}`);
          break;
        }
        for (const j of data.jobs ?? []) {
          const title = htmlToText(j.title) ?? j.title;
          if (!isTitleRelevant(title)) continue;
          const posted = j.date ? new Date(j.date) : null;
          // Pas d'identifiant stable dans l'API : entreprise + titre + lieu
          const id = createHash("sha1").update(`${j.company}|${title}|${j.locations}`).digest("hex").slice(0, 20);
          out.push({
            source: "careerjet",
            externalId: id,
            url: j.url,
            title,
            company: j.company || null,
            location: j.locations || "Dubai",
            description: htmlToText(j.description),
            salaryText: j.salary || null,
            salaryMin: Number(j.salary_min) || null,
            salaryMax: Number(j.salary_max) || null,
            salaryCurrency: j.salary_currency_code || null,
            salaryPeriod: j.salary_type ? (PERIOD[j.salary_type] ?? null) : null,
            postedAt: posted && !isNaN(posted.getTime()) ? posted : null,
          });
        }
        if (!data.pages || page >= data.pages) break;
        await jitter(1000, 2000);
      }
    }
    return out;
  },
};
