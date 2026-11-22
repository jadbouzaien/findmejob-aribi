import { migrate, sql, getSetting, setSetting } from "../lib/db";
import { SOURCES } from "../sources";
import { runSource } from "./pipeline";
import { startTelegramPolling, sendDigest, sendText } from "../notify/telegram";
import { env } from "../lib/env";
import { refreshFreshness } from "../scoring/freshness";
import { TIMEZONE } from "../../config/profile";

const DIGEST_HOURS = [9, 18];

async function main() {
  await migrate();
  const active = SOURCES.filter((s) => s.enabled());
  const disabled = SOURCES.filter((s) => !s.enabled());
  console.log(`🚀 Worker démarré — sources actives : ${active.map((s) => `${s.label} (${s.intervalMin} min)`).join(", ")}`);
  if (disabled.length) console.log(`   Désactivées : ${disabled.map((s) => s.label).join(", ")} (voir .env)`);

  void startTelegramPolling();

  // Fraîcheur : les offres vieillissent → score final et priorité recalculés
  await refreshFreshness();
  setInterval(() => refreshFreshness().catch((e) => console.error("Fraîcheur:", e.message)), 15 * 60_000);

  // Premier passage : on attend que toutes les sources aient tourné une fois pour envoyer un résumé
  const firstRun = new Set(active.map((s) => s.id));
  let anySeeding = false;

  active.forEach((source, i) => {
    const loop = async () => {
      const r = await runSource(source);
      if (firstRun.has(source.id)) {
        firstRun.delete(source.id);
        anySeeding ||= r.seeding;
        if (firstRun.size === 0 && anySeeding) await sendInitSummary();
      }
      setTimeout(loop, source.intervalMin * 60_000);
    };
    // Démarrages décalés pour ne pas tout lancer en même temps
    setTimeout(loop, i * 3000);
  });

  // Récap P2 à 9h et 18h (heure de Dubaï)
  setInterval(async () => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
    if (!DIGEST_HOURS.includes(now.getHours())) return;
    const key = `${now.toDateString()}-${now.getHours()}`;
    if ((await getSetting("last_digest")) === key) return;
    await setSetting("last_digest", key);
    await sendDigest().catch((e) => console.error("Digest:", e.message));
  }, 60_000);
}

async function sendInitSummary() {
  const [s] = await sql<{ p1: number; p2: number; p3: number; total: number }[]>`
    select count(*) filter (where priority='P1')::int p1, count(*) filter (where priority='P2')::int p2,
           count(*) filter (where priority='P3')::int p3, count(*)::int total
    from jobs where duplicate_of is null and not excluded`;
  const msg =
    `✅ <b>Initialisation terminée</b>\n${s.total} offres pertinentes en base\n🔴 P1 : ${s.p1} · 🟠 P2 : ${s.p2} · 🟡 P3 : ${s.p3}\n\n` +
    `À partir de maintenant, chaque nouvelle P1 t'arrive ici en direct.\n<a href="${env.dashboardUrl}">Ouvrir le tableau</a>`;
  console.log(msg.replace(/<[^>]+>/g, ""));
  await sendText(msg).catch(() => {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
