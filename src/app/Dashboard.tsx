"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import type { JobListItem, SourceHealth } from "@/lib/queries";
import { timeAgo, salaryLabel, MODE_LABEL, STATUS_LABEL, TRACK_LABEL } from "@/lib/format";
import { MY_LINKS } from "@config/links";

const SOURCE_LABEL: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  linkedin: "LinkedIn",
  workable: "Workable",
  careerjet: "Careerjet",
  remoteok: "Remote OK",
  himalayas: "Himalayas",
  weworkremotely: "We Work Remotely",
  remotive: "Remotive",
};

type PrioFilter = "all" | "P1" | "P2" | "P3";
type StatusFilter = "open" | "all" | string;
type SortKey = "score" | "date";

const OPEN_STATUSES = new Set(["new", "to_apply"]);
const isFresh = (j: JobListItem, h: number) => Date.now() - new Date(j.first_seen_at).getTime() < h * 3600_000;
const publishedAt = (j: JobListItem) => j.posted_at ?? j.first_seen_at;
const fmtDate = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Dashboard({ initialJobs, initialSources }: { initialJobs: JobListItem[]; initialSources: SourceHealth[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [sources, setSources] = useState(initialSources);
  const [prio, setPrio] = useState<PrioFilter>("all");
  const [track, setTrack] = useState("all");
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [q, setQ] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [sort, setSort] = useState<SortKey>("score");
  const [open, setOpen] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, string | null>>({});
  const [, tick] = useState(0);

  // Rafraîchissement auto toutes les 60 s
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setSources(data.sources);
      }
      tick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = jobs.filter((j) => {
      if (j.excluded !== showExcluded) return false;
      if (!showExcluded && !j.priority) return false;
      if (prio !== "all" && j.priority !== prio) return false;
      if (track !== "all" && j.track !== track) return false;
      if (mode !== "all" && j.work_mode !== mode) return false;
      if (status === "open" ? !OPEN_STATUSES.has(j.status) : status !== "all" && j.status !== status) return false;
      if (onlyNew && !isFresh(j, 24)) return false;
      if (needle && !`${j.title} ${j.company} ${j.location}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    return list.sort((a, b) =>
      sort === "score"
        ? b.score - a.score || +new Date(publishedAt(b)) - +new Date(publishedAt(a))
        : +new Date(b.first_seen_at) - +new Date(a.first_seen_at),
    );
  }, [jobs, prio, track, mode, status, q, onlyNew, showExcluded, sort]);

  const stats = useMemo(() => {
    const active = jobs.filter((j) => !j.excluded && j.priority && OPEN_STATUSES.has(j.status));
    return {
      P1: active.filter((j) => j.priority === "P1").length,
      P2: active.filter((j) => j.priority === "P2").length,
      P3: active.filter((j) => j.priority === "P3").length,
      fresh: active.filter((j) => isFresh(j, 24)).length,
      applied: jobs.filter((j) => j.status === "applied" || j.status === "interview").length,
    };
  }, [jobs]);

  async function updateStatus(id: number, newStatus: string) {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, status: newStatus } : j)));
    await fetch(`/api/jobs/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
  }

  async function toggle(id: number) {
    setOpen((o) => (o === id ? null : id));
    if (!(id in details)) {
      const res = await fetch(`/api/jobs/${id}`);
      const data = res.ok ? await res.json() : null;
      setDetails((d) => ({ ...d, [id]: data?.description ?? null }));
    }
  }

  return (
    <main>
      <header className="top">
        <div>
          <h1>Find Me Job</h1>
          <p className="sub">Offres triées par fit avec ton profil · mise à jour automatique</p>
          <CopyLinks />
        </div>
        <div className="stats">
          <Stat label="P1" value={stats.P1} cls="p1" onClick={() => setPrio(prio === "P1" ? "all" : "P1")} active={prio === "P1"} />
          <Stat label="P2" value={stats.P2} cls="p2" onClick={() => setPrio(prio === "P2" ? "all" : "P2")} active={prio === "P2"} />
          <Stat label="P3" value={stats.P3} cls="p3" onClick={() => setPrio(prio === "P3" ? "all" : "P3")} active={prio === "P3"} />
          <Stat label="Nouvelles 24h" value={stats.fresh} onClick={() => setOnlyNew(!onlyNew)} active={onlyNew} />
          <Stat label="Postulé" value={stats.applied} onClick={() => setStatus(status === "applied" ? "open" : "applied")} active={status === "applied"} />
        </div>
      </header>

      <section className="filters">
        <input placeholder="Rechercher (titre, entreprise, ville)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {Object.entries(TRACK_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">Tous modes</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybride</option>
          <option value="onsite">Sur site</option>
          <option value="unknown">Non précisé</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">À traiter (nouveau + à postuler)</option>
          <option value="all">Tous statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="score">Tri : fit</option>
          <option value="date">Tri : plus récentes</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={showExcluded} onChange={(e) => setShowExcluded(e.target.checked)} />
          Voir les exclues
        </label>
        <span className="count">{filtered.length} offres</span>
      </section>

      <table className="jobs">
        <thead>
          <tr>
            <th style={{ width: 52 }}>Prio</th>
            <th style={{ width: 90 }}>Fit</th>
            <th>Poste</th>
            <th>Lieu</th>
            <th style={{ width: 100 }}>Salaire</th>
            <th>Catégorie · CV</th>
            <th style={{ width: 120 }}>Source</th>
            <th style={{ width: 150 }}>Publiée · Ajoutée</th>
            <th style={{ width: 130 }}>Statut</th>
            <th style={{ width: 120 }}>Candidature</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 500).map((j) => (
            <Fragment key={j.id}>
              <tr className={`row ${j.priority?.toLowerCase() ?? ""} ${isFresh(j, 2) ? "fresh" : ""} ${open === j.id ? "open" : ""}`} onClick={() => toggle(j.id)}>
                <td>
                  <span className={`prio ${j.priority?.toLowerCase() ?? "none"}`}>{j.priority ?? "—"}</span>
                </td>
                <td>
                  <div className="fit">
                    <div className="bar">
                      <div style={{ width: `${j.score}%` }} />
                    </div>
                    <span>{j.score}%</span>
                  </div>
                  {j.fresh_adj !== 0 && (
                    <div className={`adj ${j.fresh_adj > 0 ? "up" : "down"}`} title="Ajustement fraîcheur">
                      {j.fresh_adj > 0 ? `+${j.fresh_adj}` : j.fresh_adj} fraîcheur
                    </div>
                  )}
                </td>
                <td className="title">
                  <a href={j.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    {j.title}
                  </a>
                  {isFresh(j, 2) && <span className="new">NEW</span>}
                  <div className="company">{j.company}</div>
                </td>
                <td>
                  <div className="loc">{j.location ?? "—"}</div>
                  {MODE_LABEL[j.work_mode ?? ""] && <span className={`mode ${j.work_mode}`}>{MODE_LABEL[j.work_mode ?? ""]}</span>}
                </td>
                <td className="salary">{salaryLabel(j.salary_min_eur, j.salary_max_eur)}</td>
                <td>
                  <div>{TRACK_LABEL[j.track ?? ""] ?? "—"}</div>
                  {j.cv && <div className="cv">{j.cv.replace("CV_Jad_Bouzaien_", "").replace(".pdf", "")}</div>}
                </td>
                <td className="source">
                  {SOURCE_LABEL[j.source] ?? j.source}
                  {j.also_on.length > 0 && <div className="also">+ {j.also_on.map((s) => SOURCE_LABEL[s] ?? s).join(", ")}</div>}
                </td>
                <td className="date">
                  <div title={j.posted_at ? `Publiée sur le site le ${fmtDate(j.posted_at)}` : "Date de publication non fournie par la source"}>
                    <span className="dlabel">Site</span> {j.posted_at ? timeAgo(j.posted_at) : "inconnue"}
                  </div>
                  <div title={`Détectée par l'outil le ${fmtDate(j.first_seen_at)}`}>
                    <span className="dlabel">Outil</span> {timeAgo(j.first_seen_at)}
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select className={`status ${j.status}`} value={j.status} onChange={(e) => updateStatus(j.id, e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="dl" onClick={(e) => e.stopPropagation()}>
                  {j.cv && (
                    <a className="btn" href={`/api/jobs/${j.id}/cv`} download title={j.cv}>
                      CV
                    </a>
                  )}
                  <a className="btn primary" href={`/api/jobs/${j.id}/letter`} download title="Générer la lettre de motivation">
                    Lettre
                  </a>
                </td>
              </tr>
              {open === j.id && (
                <tr className="details">
                  <td colSpan={10}>
                    <Details job={j} description={details[j.id]} loading={!(j.id in details)} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {filtered.length > 500 && <p className="more">500 premières affichées — affine les filtres.</p>}

      <footer>
        <h3>Sources</h3>
        <div className="sources">
          {sources.map((s) => (
            <div key={s.source} className={`src ${s.last_error ? "err" : "ok"}`} title={s.last_error ?? ""}>
              <b>{SOURCE_LABEL[s.source] ?? s.source}</b>
              <span>{s.last_error ? "⚠️ erreur" : `✓ ${timeAgo(s.last_ok_at)}`}</span>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}

function CopyLinks() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied((c) => (c === value ? null : c)), 1500);
  }
  return (
    <div className="links">
      {MY_LINKS.map((l) => (
        <button key={l.value} className={`link ${copied === l.value ? "copied" : ""}`} onClick={() => copy(l.value)} title={`Copier ${l.value}`}>
          {copied === l.value ? "✓ Copié" : `📋 ${l.label}`}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, cls = "", onClick, active }: { label: string; value: number; cls?: string; onClick: () => void; active: boolean }) {
  return (
    <button className={`stat ${cls} ${active ? "active" : ""}`} onClick={onClick}>
      <b>{value}</b>
      <span>{label}</span>
    </button>
  );
}

function Details({ job, description, loading }: { job: JobListItem; description: string | null | undefined; loading: boolean }) {
  const d = job.score_details;
  return (
    <div className="detail-grid">
      <div className="breakdown">
        {job.exclusion_reason && <div className="excl">⛔ Exclue : {job.exclusion_reason}</div>}
        {d && (
          <>
            <Row label="Titre" pts={d.titlePts} max={45} />
            <Row label="Compétences" pts={d.skillsPts} max={25} note={d.partialDescription ? "description absente → score neutre" : undefined} />
            <Row label="Localisation" pts={d.locationPts} max={20} note={d.locationNote} />
            <Row label="Salaire" pts={d.salaryPts} max={10} note={d.salaryNote} />
            <div className="fresh-line">
              Fit <b>{job.fit_score}</b> {job.fresh_adj >= 0 ? "+" : "−"} fraîcheur <b>{Math.abs(job.fresh_adj)}</b> = <b>{job.score}%</b>
            </div>
            {d.penalties.map((p) => (
              <div key={p.label} className="pen">
                −{p.pts} {p.label}
              </div>
            ))}
            {d.matchedSkills.length > 0 && (
              <div className="skills">
                {d.matchedSkills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            )}
          </>
        )}
        {job.cv && (
          <div className="cvline">
            📄 CV conseillé : <code>{job.cv}</code>
          </div>
        )}
      </div>
      <div className="desc">{loading ? "Chargement…" : description ? description.slice(0, 4000) : "Pas de description récupérée."}</div>
    </div>
  );
}

function Row({ label, pts, max, note }: { label: string; pts: number; max: number; note?: string }) {
  return (
    <div className="bd-row">
      <span className="bd-label">{label}</span>
      <div className="bar small">
        <div style={{ width: `${(pts / max) * 100}%` }} />
      </div>
      <span className="bd-pts">
        {pts}/{max}
      </span>
      {note && <span className="bd-note">{note}</span>}
    </div>
  );
}
