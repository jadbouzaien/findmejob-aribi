import { sql, getSetting, setSetting } from "../lib/db";
import { env } from "../lib/env";
import { timeAgo, salaryLabel, MODE_LABEL, STATUS_LABEL, TRACK_LABEL } from "../lib/format";
import { sleep } from "../lib/text";

const API = `https://api.telegram.org/bot${env.telegramToken}`;
const PRIO_EMOJI: Record<string, string> = { P1: "🔴", P2: "🟠", P3: "🟡" };
const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function tg<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(method === "getUpdates" ? 40_000 : 15_000),
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string; parameters?: { retry_after?: number } };
  if (!data.ok) {
    if (data.parameters?.retry_after) {
      await sleep(data.parameters.retry_after * 1000);
      return tg(method, body);
    }
    throw new Error(`Telegram ${method}: ${data.description}`);
  }
  return data.result;
}

async function chatId(): Promise<string | null> {
  return env.telegramChatId || (await getSetting("telegram_chat_id"));
}

export async function sendText(text: string, extra: Record<string, unknown> = {}) {
  const id = await chatId();
  if (!env.telegramToken || !id) return false;
  await tg("sendMessage", { chat_id: id, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...extra });
  return true;
}

interface JobRow {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  work_mode: string | null;
  url: string;
  source: string;
  score: number;
  final_score: number;
  fresh_adj: number;
  priority: string | null;
  track: string | null;
  cv: string | null;
  salary_min_eur: number | null;
  salary_max_eur: number | null;
  posted_at: Date | null;
  first_seen_at: Date;
  status: string;
  score_details: { matchedSkills?: string[]; penalties?: Array<{ label: string }>; locationNote?: string; salaryNote?: string } | null;
}

function buttons(id: number, status: string) {
  const b = (label: string, st: string) => ({ text: status === st ? `• ${label} •` : label, callback_data: `st:${id}:${st}` });
  return { inline_keyboard: [[b("✅ À postuler", "to_apply"), b("📨 Postulé", "applied"), b("❌ Ignorer", "ignored")]] };
}

function formatJob(j: JobRow) {
  const d = j.score_details ?? {};
  const mode = MODE_LABEL[j.work_mode ?? ""] ? ` (${MODE_LABEL[j.work_mode ?? ""]})` : "";
  const lines = [
    `${PRIO_EMOJI[j.priority ?? ""] ?? "⚪"} <b>${j.priority ?? "—"} · ${j.final_score}%</b> <i>(fit ${j.score} ${j.fresh_adj >= 0 ? "+" : "−"} ${Math.abs(j.fresh_adj)} fraîcheur)</i> · ${esc(TRACK_LABEL[j.track ?? ""] ?? "")}`,
    `<b>${esc(j.title)}</b>`,
    `🏢 ${esc(j.company)} · 📍 ${esc(j.location)}${mode}`,
    `💰 ${salaryLabel(j.salary_min_eur, j.salary_max_eur)}  ·  🕐 ${timeAgo(j.posted_at ?? j.first_seen_at)} · ${esc(j.source)}`,
  ];
  if (d.matchedSkills?.length) lines.push(`✅ ${esc(d.matchedSkills.slice(0, 8).join(", "))}`);
  if (d.penalties?.length) lines.push(`⚠️ ${esc(d.penalties.map((p) => p.label).join(" · "))}`);
  if (j.cv) lines.push(`📄 CV : <code>${esc(j.cv)}</code>`);
  lines.push(`\n<a href="${esc(j.url)}">👉 Ouvrir l'offre</a>`);
  return lines.join("\n");
}

export async function notifyJob(id: number): Promise<boolean> {
  const [j] = await sql<JobRow[]>`select * from jobs where id = ${id}`;
  if (!j) return false;
  try {
    const sent = await sendText(formatJob(j), { reply_markup: buttons(j.id, j.status) });
    if (sent) await sql`update jobs set notified_at = now() where id = ${id}`;
    return sent;
  } catch (e) {
    console.error("Telegram:", (e as Error).message);
    return false;
  }
}

/** Récap des P2 non notifiées (appelé à 9h et 18h) */
export async function sendDigest() {
  const rows = await sql<JobRow[]>`
    select * from jobs
    where priority = 'P2' and notified_at is null and not from_seed and duplicate_of is null
      and not excluded and status = 'new' and first_seen_at > now() - interval '24 hours'
    order by final_score desc limit 15`;
  if (!rows.length) return;
  const lines = rows.map(
    (j) =>
      `🟠 <b>${j.final_score}%</b> <a href="${esc(j.url)}">${esc(j.title)}</a> — ${esc(j.company)} · ${esc(j.location)} · ${salaryLabel(j.salary_min_eur, j.salary_max_eur)}`,
  );
  const ok = await sendText(`📬 <b>Récap P2 — ${rows.length} offres</b>\n\n${lines.join("\n")}\n\n<a href="${env.dashboardUrl}">Tableau complet</a>`);
  if (ok) await sql`update jobs set notified_at = now() where id in ${sql(rows.map((r) => r.id))}`;
}

interface Update {
  update_id: number;
  message?: { chat: { id: number }; text?: string; from?: { first_name?: string } };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number }; message_id: number } };
}

async function handleCommand(text: string) {
  const cmd = text.trim().split(/\s+/)[0].toLowerCase();
  if (cmd === "/top") {
    const rows = await sql<JobRow[]>`
      select * from jobs where priority in ('P1','P2') and status = 'new' and duplicate_of is null and not excluded
      order by final_score desc, first_seen_at desc limit 5`;
    if (!rows.length) return sendText("Rien de nouveau en P1/P2 pour l'instant.");
    for (const j of rows) await sendText(formatJob(j), { reply_markup: buttons(j.id, j.status) });
    return;
  }
  if (cmd === "/stats") {
    const [s] = await sql<{ p1: number; p2: number; p3: number; today: number; applied: number }[]>`
      select count(*) filter (where priority='P1')::int p1, count(*) filter (where priority='P2')::int p2,
             count(*) filter (where priority='P3')::int p3,
             count(*) filter (where first_seen_at > now() - interval '24 hours' and priority is not null)::int today,
             count(*) filter (where status in ('applied','interview'))::int applied
      from jobs where duplicate_of is null and not excluded`;
    return sendText(
      `📊 <b>Stats</b>\n🔴 P1 : ${s.p1}\n🟠 P2 : ${s.p2}\n🟡 P3 : ${s.p3}\n🆕 24h : ${s.today}\n📨 Postulé : ${s.applied}\n\n<a href="${env.dashboardUrl}">Tableau</a>`,
    );
  }
  return sendText("Commandes : /top (5 meilleures offres non traitées), /stats");
}

/** Long-polling Telegram : /start, commandes et boutons de statut */
export async function startTelegramPolling() {
  if (!env.telegramToken) {
    console.log("Telegram désactivé (TELEGRAM_BOT_TOKEN vide)");
    return;
  }
  let offset = Number((await getSetting("telegram_offset")) ?? 0);
  if (!(await chatId())) console.log("👉 Envoie /start à ton bot Telegram pour activer les alertes.");
  for (;;) {
    try {
      const updates = await tg<Update[]>("getUpdates", { offset, timeout: 30, allowed_updates: ["message", "callback_query"] });
      for (const u of updates) {
        offset = u.update_id + 1;
        await setSetting("telegram_offset", String(offset));
        const owner = await chatId();

        if (u.message) {
          const from = String(u.message.chat.id);
          const text = u.message.text ?? "";
          if (!owner && text.startsWith("/start")) {
            await setSetting("telegram_chat_id", from);
            await sendText(
              `👋 C'est branché ! Tu recevras ici les offres <b>P1</b> dès leur détection, et un récap des <b>P2</b> à 9h et 18h.\n\nCommandes : /top, /stats`,
            );
            console.log(`Telegram : chat ${from} enregistré`);
          } else if (from === owner) {
            await handleCommand(text);
          }
          // Messages d'autres personnes ignorés : le bot ne répond qu'à toi
        }

        const cb = u.callback_query;
        if (cb?.data?.startsWith("st:") && cb.message && String(cb.message.chat.id) === owner) {
          const [, id, status] = cb.data.split(":");
          await sql`update jobs set status = ${status}, status_updated_at = now() where id = ${Number(id)}`;
          await tg("answerCallbackQuery", { callback_query_id: cb.id, text: `→ ${STATUS_LABEL[status] ?? status}` });
          await tg("editMessageReplyMarkup", {
            chat_id: cb.message.chat.id,
            message_id: cb.message.message_id,
            reply_markup: buttons(Number(id), status),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("Telegram polling:", (e as Error).message);
      await sleep(5000);
    }
  }
}
