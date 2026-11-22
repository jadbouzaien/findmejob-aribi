/** Recalcule le score de toutes les offres après une modification de config/profile.ts */
import { migrate, sql } from "../lib/db";
import { scoreJob } from "../scoring/score";
import { refreshFreshness } from "../scoring/freshness";
import type { RawJob, WorkMode } from "../lib/types";

await migrate();
const rows = await sql`select * from jobs`;
let changed = 0;
for (const r of rows) {
  const raw: RawJob = {
    source: r.source,
    externalId: r.external_id,
    url: r.url,
    title: r.title,
    company: r.company,
    location: r.location,
    // le mode fourni par la source est conservé s'il était explicite
    workMode: (r.work_mode as WorkMode) ?? "unknown",
    description: r.description,
    salaryText: r.salary_text,
    salaryMin: r.salary_min_eur,
    salaryMax: r.salary_max_eur,
    salaryCurrency: "AED",
    salaryPeriod: "month",
    postedAt: r.posted_at,
  };
  const s = scoreJob(raw);
  if (s.score !== r.score || s.excluded !== r.excluded) changed++;
  await sql`update jobs set score = ${s.score}, track = ${s.track}, cv = ${s.cv},
            excluded = ${s.excluded}, exclusion_reason = ${s.exclusionReason}, zone = ${s.zone}, work_mode = ${s.workMode},
            score_details = ${sql.json(s.details as never)} where id = ${r.id}`;
}
await refreshFreshness();
console.log(`${rows.length} offres rescorées, ${changed} ont changé.`);
await sql.end();
