/**
 * Génère une lettre de motivation spécifique à une offre (sans LLM) puis la rend en PDF via Chrome headless.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PROOFS, HOOKS, MY_SKILLS } from "../../config/letters";
import type { TrackId } from "../../config/profile";
import { offerLanguage } from "../scoring/score";

const run = promisify(execFile);
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export interface LetterJob {
  title: string;
  company: string | null;
  location: string | null;
  work_mode: string | null;
  zone: string | null;
  description: string | null;
  track: string | null;
  source: string;
}

type Lang = "fr" | "en";

const ME_NAME = process.env.ME_NAME || "Prénom Nom";

/** Coordonnées lues depuis .env (jamais dans le code versionné) */
function contactLine(fr: boolean) {
  const e = process.env;
  const parts = fr
    ? [e.ME_ADDRESS, e.ME_PHONE, e.ME_EMAIL, e.ME_LINKEDIN]
    : [e.ME_CITY_EN, e.ME_PHONE_INTL || e.ME_PHONE, e.ME_EMAIL, e.ME_LINKEDIN];
  return parts.filter(Boolean).join(" · ");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** "Développeur Full Stack (H/F) - CDI - Marseille" → "Développeur Full Stack" */
export function cleanTitle(t: string) {
  return t
    .replace(/\((h|f|m|w|d)\s*[/,-]?\s*(h|f|m|w|d)?\s*[/,-]?\s*(h|f|m|w|d)?\)/gi, "")
    .replace(/\b(h\/f|f\/h|m\/f|f\/m|m\/w\/d)\b/gi, "")
    .replace(/\s[-–|]\s*(cdi|cdd|freelance|remote|hybride?|t[ée]l[ée]travail|paris|marseille|lyon|nantes|toulouse|aix[- ]en[- ]provence|full remote)\b.*$/i, "")
    .replace(/^(cdi|cdd)\s*[-–:]\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s\-–|,]+$/, "")
    .trim();
}

function city(location: string | null) {
  return (location ?? "").split(/[,/|(]/)[0].replace(/^\d{2}\s*-\s*/, "").trim();
}

/** "de" + mot : élision devant voyelle ou h muet ("d'Ingénieur", "d'ALTEN") */
const de = (word: string) => (/^[aeiouyhàâéèêëîïôûAEIOUYHÀÂÉÈÊËÎÏÔÛ]/.test(word) ? `d'${word}` : `de ${word}`);

function joinList(items: string[], lang: Lang) {
  if (items.length <= 1) return items.join("");
  const and = lang === "fr" ? " et " : " and ";
  return items.slice(0, -1).join(", ") + and + items[items.length - 1];
}

/** Les 3 preuves les plus pertinentes pour l'offre */
function pickProofs(text: string, track: TrackId | null) {
  return PROOFS.map((p) => {
    const hits = new Set((text.match(p.keywords) ?? []).map((m) => m.toLowerCase())).size;
    const inTrack = track !== null && p.tracks.includes(track);
    const trackBonus = inTrack ? 2 - p.tracks.indexOf(track!) * 0.5 : 0;
    // une preuve rattachée à d'autres catégories compte moitié (ex : infra dans une lettre de PO)
    const weight = p.tracks.length && !inTrack ? 0.5 : 1;
    return { p, score: hits * weight + trackBonus };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);
}

/** Compétences que le candidat maîtrise ET que l'offre mentionne, dans l'ordre où l'offre les cite */
function skillsFromOffer(text: string, lang: Lang) {
  return MY_SKILLS.map(([re, label]) => ({ label, idx: text.search(re) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx)
    .slice(0, 5)
    .map((x) => (lang === "en" ? x.label.replace("agents IA", "AI agents").replace("facturation électronique", "e-invoicing") : x.label));
}

function locationSentence(job: LetterJob, lang: Lang) {
  const c = city(job.location);
  if (job.work_mode === "remote")
    return lang === "fr"
      ? "Je travaille en remote depuis plusieurs années, chez Beev comme en freelance : je suis à l'aise avec une organisation asynchrone et une communication écrite claire."
      : "I have worked remotely for several years, at Beev as well as in freelance: I am comfortable with asynchronous collaboration and clear written communication.";
  if (job.zone === "near")
    return lang === "fr"
      ? `Basé à Marseille, le format hybride à ${c} me convient parfaitement.`
      : `Based in Marseille, a hybrid setup in ${c} suits me perfectly.`;
  if (job.zone === "home")
    return lang === "fr"
      ? `Basé à Marseille, je suis disponible rapidement pour rejoindre vos équipes${c && !/marseille/i.test(c) ? ` à ${c}` : ""}.`
      : `Based in Marseille, I can join your team${c && !/marseille/i.test(c) ? ` in ${c}` : ""} quickly.`;
  return lang === "fr" ? "Je suis disponible rapidement." : "I am available to start quickly.";
}

export function buildLetter(job: LetterJob) {
  const lang: Lang = offerLanguage({ ...job, externalId: "", url: "", postedAt: null });
  const title = cleanTitle(job.title);
  const company = job.company?.trim() || (lang === "fr" ? "votre entreprise" : "your company");
  const track = (job.track as TrackId | null) ?? null;
  const text = `${job.title}\n${job.description ?? ""}`;

  const hook = HOOKS[track ?? "fullstack"][lang];
  const proofs = pickProofs(text, track).map((p) => p[lang]);
  const skills = skillsFromOffer(text, lang);

  const paragraphs: string[] = [];
  if (lang === "fr") {
    paragraphs.push(`Votre offre ${de(title)} chez ${company} a retenu toute mon attention. ${hook}`);
    if (proofs.length) paragraphs.push(`Quelques réalisations en lien direct avec le poste :`);
    if (skills.length)
      paragraphs.push(
        `Votre annonce mentionne des technologies et pratiques que je maîtrise : ${joinList(skills, lang)}. Je serais ravi de mettre cette expérience au service ${de(company)}, avec la même exigence de qualité et le même souci des besoins métier.`,
      );
    else paragraphs.push(`Je serais ravi de mettre cette expérience au service ${de(company)}, avec la même exigence de qualité et le même souci des besoins métier.`);
    paragraphs.push(`${locationSentence(job, lang)} Je serais heureux d'échanger avec vous pour vous présenter plus en détail mon parcours et ce que je peux apporter à votre équipe.`);
  } else {
    paragraphs.push(`Your ${title} opening at ${company} caught my attention. ${hook}`);
    if (proofs.length) paragraphs.push(`A few achievements directly related to the role:`);
    if (skills.length)
      paragraphs.push(
        `Your job description mentions technologies and practices I have hands-on experience with: ${joinList(skills, lang)}. I would be glad to bring this experience to ${company}, with the same focus on quality and on what users actually need.`,
      );
    else paragraphs.push(`I would be glad to bring this experience to ${company}, with the same focus on quality and on what users actually need.`);
    paragraphs.push(`${locationSentence(job, lang)} I would welcome the opportunity to discuss my background and how I can contribute to your team.`);
  }

  return { lang, title, company, paragraphs, proofs };
}

function letterHtml(job: LetterJob) {
  const l = buildLetter(job);
  const fr = l.lang === "fr";
  const date = new Date().toLocaleDateString(fr ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  const [intro, proofsLead, ...rest] = l.proofs.length ? l.paragraphs : [l.paragraphs[0], null, ...l.paragraphs.slice(1)];
  const docTitle = `${fr ? "Lettre de motivation" : "Cover letter"} – ${ME_NAME} – ${l.company} – ${l.title}`;
  return `<!doctype html><html lang="${l.lang}"><head><meta charset="utf-8"><title>${esc(docTitle)}</title><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 210mm; min-height: 297mm; padding: 20mm 22mm; font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: #2b3440; font-size: 10.5pt; line-height: 1.55; }
  .head { border-bottom: 2px solid #2f4356; padding-bottom: 4mm; margin-bottom: 8mm; }
  .head h1 { font-size: 18pt; color: #2c3e50; }
  .head .sub { color: #e5533d; font-weight: 600; margin-top: 1mm; }
  .head .contact { color: #6b7684; font-size: 9pt; margin-top: 1.5mm; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 7mm; }
  .to b { color: #2c3e50; }
  .date { color: #6b7684; }
  .obj { font-weight: 700; color: #2c3e50; margin-bottom: 6mm; }
  p { margin-bottom: 4mm; text-align: justify; }
  ul { margin: -2mm 0 4mm 6mm; }
  li { margin-bottom: 1.5mm; }
  .sign { margin-top: 8mm; font-weight: 600; color: #2c3e50; }
</style></head><body>
  <div class="head">
    <h1>${esc(ME_NAME)}</h1>
    <div class="sub">${esc(l.title)}</div>
    <div class="contact">${esc(contactLine(fr))}</div>
  </div>
  <div class="meta">
    <div class="to"><b>${esc(l.company)}</b>${job.location ? `<br>${esc(job.location)}` : ""}</div>
    <div class="date">${fr ? `Marseille, le ${date}` : date}</div>
  </div>
  <div class="obj">${fr ? "Objet : candidature au poste de" : "Re: application for the"} ${esc(l.title)}${fr ? "" : " position"}</div>
  <p>${fr ? "Madame, Monsieur," : "Dear Hiring Team,"}</p>
  <p>${esc(intro)}</p>
  ${proofsLead ? `<p>${esc(proofsLead)}</p><ul>${l.proofs.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
  ${rest.map((p) => `<p>${esc(p as string)}</p>`).join("")}
  <p>${fr ? "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées." : "Kind regards,"}</p>
  <div class="sign">${esc(ME_NAME)}</div>
</body></html>`;
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

export async function letterPdf(job: LetterJob): Promise<{ pdf: Buffer; filename: string; lang: Lang }> {
  const { lang, title, company } = buildLetter(job);
  const name = `${lang === "fr" ? "LM" : "Cover_Letter"}_${slug(ME_NAME)}_${slug(company)}_${slug(title)}`;
  const dir = await mkdtemp(join(tmpdir(), "letter-"));
  try {
    const html = join(dir, `${name}.html`);
    const pdf = join(dir, `${name}.pdf`);
    await writeFile(html, letterHtml(job));
    await run(CHROME, ["--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${html}`], {
      timeout: 30_000,
    });
    return { pdf: await readFile(pdf), filename: `${name}.pdf`, lang };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
