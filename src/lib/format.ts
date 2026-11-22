export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.round(ms / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return `il y a ${j} j`;
}

export function salaryLabel(min: number | null, max: number | null): string {
  if (!min && !max) return "—";
  // Salaire mensuel en AED
  const k = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`);
  if (min && max && min !== max) return `AED ${k(min)}–${k(max)}/mois`;
  return `AED ${k((max ?? min)!)}/mois`;
}

export const MODE_LABEL: Record<string, string> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Remote",
  unknown: "",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "Nouveau",
  to_apply: "À postuler",
  applied: "Postulé",
  interview: "Entretien",
  rejected: "Refus",
  ignored: "Ignoré",
  expired: "N'existe plus",
};

export const TRACK_LABEL: Record<string, string> = {
  customer_service: "Customer Service",
  admin_reception: "Accueil / Admin",
  guest_relations: "Guest Relations",
  real_estate: "Immobilier",
  sales_coordination: "Coordination commerciale",
};
