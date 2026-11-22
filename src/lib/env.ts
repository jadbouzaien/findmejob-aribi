import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env"), quiet: true });

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} manquant : copie .env.example vers .env et renseigne-le`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  dashboardUrl: process.env.DASHBOARD_URL ?? "http://localhost:3101",
  /** Careerjet (agrégateur, couvre les Émirats) : identifiant partenaire gratuit sur careerjet.com/partners */
  careerjetAffid: process.env.CAREERJET_AFFID ?? "",
  /** Doit correspondre au site déclaré chez Careerjet (sans port : un Referer avec port est refusé) */
  careerjetReferer: process.env.CAREERJET_REFERER || "http://localhost/",
};
