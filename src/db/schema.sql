create table if not exists jobs (
  id               bigserial primary key,
  source           text not null,
  external_id      text not null,
  url              text not null,
  title            text not null,
  company          text,
  location         text,
  work_mode        text,          -- onsite | hybrid | remote | unknown
  zone             text,          -- home | near | country | far | foreign | unknown
  description      text,
  salary_min_eur   integer,       -- nom historique : salaire MENSUEL en AED
  salary_max_eur   integer,       -- idem
  salary_text      text,
  posted_at        timestamptz,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  dedup_key        text not null,
  duplicate_of     bigint references jobs(id) on delete set null,
  also_on          text[] not null default '{}',
  score            integer not null default 0,
  track            text,
  cv               text,
  priority         text,          -- P1 | P2 | P3 | null
  excluded         boolean not null default false,
  exclusion_reason text,
  score_details    jsonb,
  status           text not null default 'new', -- new | to_apply | applied | interview | rejected | ignored
  status_updated_at timestamptz,
  from_seed        boolean not null default false,
  notified_at      timestamptz,
  unique (source, external_id)
);
create index if not exists jobs_score_idx on jobs (score desc);
create index if not exists jobs_dedup_idx on jobs (dedup_key);
create index if not exists jobs_seen_idx on jobs (first_seen_at desc);

create table if not exists source_runs (
  source       text primary key,
  last_run_at  timestamptz,
  last_ok_at   timestamptz,
  last_error   text,
  last_count   integer,
  seeded       boolean not null default false
);

create table if not exists settings (
  key   text primary key,
  value text not null
);

-- score = fit (profil) ; final_score = fit + fraîcheur ; priority dérive de final_score
alter table jobs add column if not exists fresh_adj integer not null default 0;
alter table jobs add column if not exists final_score integer not null default 0;
create index if not exists jobs_final_idx on jobs (final_score desc);
