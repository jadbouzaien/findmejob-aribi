import { sql } from "../lib/db";
import type { RawJob, Source } from "../lib/types";
import { dedupKey } from "../lib/text";
import { scoreJob, freshnessAdjust, finalScore, priorityFor } from "../scoring/score";
import { notifyJob } from "../notify/telegram";
import { TIMEZONE } from "../../config/profile";

const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString("fr-FR", { timeZone: TIMEZONE })}] ${msg}`);

/** Notifier seulement les offres récentes (évite d'alerter sur une vieille offre découverte tard) */
const MAX_NOTIFY_AGE_H = 72;

export async function runSource(source: Source) {
  const [run] = await sql<{ seeded: boolean }[]>`
    insert into source_runs (source) values (${source.id})
    on conflict (source) do update set last_run_at = now()
    returning seeded`;
  const seeding = !run.seeded;
  const started = Date.now();
  try {
    const raws = await source.fetch({
      seeding,
      log,
      // "connue" = déjà en base AVEC sa description (sinon on retente de la récupérer)
      isKnown: async (src, id) =>
        (await sql`select 1 from jobs where source = ${src} and external_id = ${id}
                   and (description is not null or status = 'deleted')`).length > 0,
    });
    const { inserted, notified } = await ingest(raws, seeding);
    await sql`update source_runs set last_ok_at = now(), last_error = null, last_count = ${raws.length}, seeded = true,
              last_run_at = now() where source = ${source.id}`;
    log(
      `✓ ${source.label}: ${raws.length} pertinentes, ${inserted} nouvelles${notified ? `, ${notified} alertes` : ""}` +
        `${seeding ? " (initialisation, pas d'alerte)" : ""} — ${((Date.now() - started) / 1000).toFixed(1)}s`,
    );
    return { inserted, seeding };
  } catch (e) {
    const msg = (e as Error).message;
    await sql`update source_runs set last_error = ${msg.slice(0, 500)}, last_run_at = now() where source = ${source.id}`;
    log(`✗ ${source.label}: ${msg}`);
    return { inserted: 0, seeding };
  }
}

export async function ingest(raws: RawJob[], seeding: boolean) {
  let inserted = 0;
  let notified = 0;
  const seen = new Set<string>();
  for (const raw of raws) {
    const k = `${raw.source}:${raw.externalId}`;
    if (seen.has(k)) continue;
    seen.add(k);

    const existing = await sql<{ id: number; missing_desc: boolean }[]>`
      update jobs set last_seen_at = now() where source = ${raw.source} and external_id = ${raw.externalId}
      returning id, description is null and status <> 'deleted' as missing_desc`;
    if (existing.length) {
      // Description récupérée après coup (ex : LinkedIn bloqué au 1er passage) → on complète et on rescore
      if (existing[0].missing_desc && raw.description) {
        const s = scoreJob(raw);
        await sql`update jobs set description = ${raw.description}, score = ${s.score}, track = ${s.track}, cv = ${s.cv},
                  priority = ${priorityFor(finalScore(s.score, freshnessAdjust(raw.postedAt)), s.excluded)},
                  final_score = ${finalScore(s.score, freshnessAdjust(raw.postedAt))},
                  excluded = ${s.excluded}, exclusion_reason = ${s.exclusionReason},
                  work_mode = ${s.workMode}, salary_min_eur = ${s.salaryMin}, salary_max_eur = ${s.salaryMax},
                  score_details = ${sql.json(s.details as never)} where id = ${existing[0].id}`;
      }
      continue;
    }

    const s = scoreJob(raw);
    const posted = raw.postedAt && !isNaN(raw.postedAt.getTime()) ? raw.postedAt : null;
    const adj = freshnessAdjust(posted ?? new Date());
    const final = finalScore(s.score, adj);
    const priority = priorityFor(final, s.excluded);
    const key = dedupKey(raw.company, raw.title);
    const [canonical] = await sql<{ id: number }[]>`
      select id from jobs where dedup_key = ${key} and duplicate_of is null
        and first_seen_at > now() - interval '45 days' order by id limit 1`;

    const [row] = await sql<{ id: number }[]>`
      insert into jobs ${sql({
        source: raw.source,
        external_id: raw.externalId,
        url: raw.url,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        work_mode: s.workMode,
        zone: s.zone,
        description: raw.description,
        salary_min_eur: s.salaryMin,
        salary_max_eur: s.salaryMax,
        salary_text: raw.salaryText ?? null,
        posted_at: posted,
        dedup_key: key,
        duplicate_of: canonical?.id ?? null,
        score: s.score,
        fresh_adj: adj,
        final_score: final,
        track: s.track,
        cv: s.cv,
        priority,
        excluded: s.excluded,
        exclusion_reason: s.exclusionReason,
        score_details: sql.json(s.details as never),
        from_seed: seeding,
      })}
      on conflict (source, external_id) do nothing
      returning id`;
    if (!row) continue;
    inserted++;

    if (canonical) {
      await sql`update jobs set also_on = array(select distinct unnest(also_on || ${raw.source}::text)) where id = ${canonical.id}`;
      continue;
    }

    const fresh = !raw.postedAt || Date.now() - raw.postedAt.getTime() < MAX_NOTIFY_AGE_H * 3600_000;
    if (!seeding && priority === "P1" && fresh) {
      if (await notifyJob(row.id)) notified++;
    }
  }
  return { inserted, notified };
}
