// Gabarit HTML du CV (A4, une page) : barre latérale avec photo + colonne principale.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const photo = readFileSync(join(here, "photo.jpg")).toString("base64");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// **gras** dans les textes
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

const ICON = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.3 18H5.7V9.7h2.6zM7 8.6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18.3 18h-2.6v-4c0-1-.02-2.2-1.4-2.2s-1.6 1.1-1.6 2.2v4H10V9.7h2.5v1.1a2.7 2.7 0 0 1 2.5-1.4c2.6 0 3.1 1.7 3.1 4z"/></svg>',
};

export function render(cv) {
  const L = cv.labels;
  return `<!doctype html>
<html lang="${cv.lang}"><head><meta charset="utf-8"><title>${esc(cv.name)} — ${esc(cv.title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --navy: #1f2f45; --navy2: #2a3d57; --gold: #b8913a; --ink: #2a3340; --mute: #6b7684; --line: #e4e7eb; }
  body { width: 210mm; height: 297mm; font-family: "Inter", "Helvetica Neue", Arial, sans-serif; color: var(--ink);
         font-size: 8.5pt; line-height: 1.31; display: grid; grid-template-columns: 64mm 1fr; overflow: hidden; }

  /* ── Barre latérale ── */
  aside { background: var(--navy); color: #e8edf3; padding: 11mm 6.5mm 8mm; }
  .photo { width: 36mm; height: 36mm; border-radius: 50%; overflow: hidden; margin: 0 auto 6mm;
           border: 1.2mm solid var(--gold); }
  .photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; }
  aside h3 { font-size: 8.4pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold);
             border-bottom: 0.3mm solid rgba(184,145,58,.55); padding-bottom: 1mm; margin: 5mm 0 2.2mm; }
  aside h3:first-of-type { margin-top: 0; }
  .contact div { display: flex; align-items: center; gap: 2mm; margin-bottom: 1.5mm; font-size: 8.2pt; word-break: break-all; }
  .contact svg { width: 3.4mm; height: 3.4mm; fill: var(--gold); flex: none; }
  .lang { margin-bottom: 1.8mm; }
  .lang .row { display: flex; justify-content: space-between; font-size: 8.3pt; }
  .lang .row span { color: #b9c4d0; font-size: 7.6pt; }
  .bar { height: 1.1mm; background: rgba(255,255,255,.15); border-radius: 1mm; margin-top: 0.8mm; }
  .bar i { display: block; height: 100%; background: var(--gold); border-radius: 1mm; }
  .tags { display: flex; flex-wrap: wrap; gap: 1.3mm; }
  .tags span { background: var(--navy2); border: 0.25mm solid rgba(255,255,255,.12); border-radius: 1mm; padding: 0.6mm 1.8mm; font-size: 7.8pt; }
  .item { margin-bottom: 2.2mm; }
  .item b { display: block; color: #fff; font-size: 8.3pt; }
  .item span { display: block; color: #b9c4d0; font-size: 7.7pt; }
  aside ul { list-style: none; }
  aside li { font-size: 8pt; margin-bottom: 1mm; padding-left: 3mm; position: relative; }
  aside li::before { content: ""; position: absolute; left: 0; top: 1.6mm; width: 1.2mm; height: 1.2mm; background: var(--gold); border-radius: 50%; }

  /* ── Colonne principale ── */
  main { padding: 9.5mm 9mm 6mm 8.5mm; }
  h1 { font-size: 24pt; letter-spacing: 0.04em; color: var(--navy); font-weight: 800; line-height: 1; }
  .title { font-size: 11.5pt; color: var(--gold); font-weight: 700; margin-top: 2mm; letter-spacing: 0.02em; }
  .tagline { color: var(--mute); font-size: 8.6pt; margin-top: 0.8mm; }
  h2 { font-size: 9.6pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--navy); margin: 3.6mm 0 1.8mm;
       display: flex; align-items: center; gap: 2.5mm; }
  h2::after { content: ""; flex: 1; height: 0.35mm; background: var(--line); }
  .profile { font-size: 8.6pt; color: #3a4452; text-align: justify; }
  .strengths { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm 4mm; }
  .strengths div { font-size: 8.1pt; padding-left: 3.2mm; position: relative; }
  .strengths div::before { content: "✓"; position: absolute; left: 0; color: var(--gold); font-weight: 700; }
  .job { margin-bottom: 2.3mm; }
  .job .head { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
  .job .role { font-weight: 700; font-size: 9.4pt; color: var(--navy); }
  .job .dates { color: var(--mute); font-size: 7.9pt; white-space: nowrap; font-weight: 600; }
  .job .co { font-size: 8.4pt; color: var(--gold); font-weight: 600; margin-top: 0.3mm; }
  .job .co span { color: var(--mute); font-weight: 400; font-style: italic; }
  .job ul { margin: 1mm 0 0 3.6mm; }
  .job li { margin-bottom: 0.2mm; }
  .job li::marker { color: var(--gold); }
</style></head>
<body>
  <aside>
    <div class="photo"><img src="data:image/jpeg;base64,${photo}" alt=""></div>

    <h3>${esc(L.contact)}</h3>
    <div class="contact">
      ${cv.contact.map((c) => `<div>${ICON[c.icon] ?? ""}<span>${esc(c.text)}</span></div>`).join("")}
    </div>

    <h3>${esc(L.languages)}</h3>
    ${cv.languages
      .map(
        (l) => `<div class="lang"><div class="row"><b>${esc(l.name)}</b><span>${esc(l.level)}</span></div><div class="bar"><i style="width:${l.pct}%"></i></div></div>`,
      )
      .join("")}

    <h3>${esc(L.software)}</h3>
    <div class="tags">${cv.software.map((s) => `<span>${esc(s)}</span>`).join("")}</div>

    <h3>${esc(L.education)}</h3>
    ${cv.education.map((e) => `<div class="item"><b>${esc(e.degree)}</b><span>${esc(e.school)} · ${esc(e.years)}</span></div>`).join("")}

    <h3>${esc(L.certs)}</h3>
    ${cv.certs.map((c) => `<div class="item"><b>${esc(c.name)}</b><span>${esc(c.detail)}</span></div>`).join("")}

    <h3>${esc(L.training)}</h3>
    <ul>${cv.training.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>

    <h3>${esc(L.interests)}</h3>
    <ul>${cv.interests.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </aside>

  <main>
    <h1>${esc(cv.name)}</h1>
    <div class="title">${esc(cv.title)}</div>
    <div class="tagline">${esc(cv.tagline)}</div>

    <h2>${esc(L.profile)}</h2>
    <p class="profile">${rich(cv.profile)}</p>

    <h2>${esc(L.strengths)}</h2>
    <div class="strengths">${cv.strengths.map((s) => `<div>${rich(s)}</div>`).join("")}</div>

    <h2>${esc(L.experience)}</h2>
    ${cv.experience
      .map(
        (j) => `<div class="job">
      <div class="head"><div class="role">${esc(j.role)}</div><div class="dates">${esc(j.dates)}</div></div>
      <div class="co">${esc(j.company)}${j.note ? ` <span>· ${esc(j.note)}</span>` : ""} <span>· ${esc(j.place)}</span></div>
      <ul>${j.bullets.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>
    </div>`,
      )
      .join("")}
  </main>
</body></html>`;
}
