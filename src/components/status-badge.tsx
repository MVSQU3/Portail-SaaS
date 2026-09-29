const TONE: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-900 ring-amber-200",
  VALIDEE: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  SUSPENDUE: "bg-red-50 text-red-800 ring-red-200",
  OUVERTE: "bg-amber-50 text-amber-900 ring-amber-200",
  LUE: "bg-slate-100 text-slate-700 ring-slate-200",
  RESOLUE: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  ACTIF: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  AUCUN: "bg-slate-100 text-slate-700 ring-slate-200",
  ESSAI: "bg-sky-50 text-sky-900 ring-sky-200",
  EXPIRE: "bg-amber-50 text-amber-900 ring-amber-200",
  SUSPENDU: "bg-red-50 text-red-800 ring-red-200",
  HORS_SERVICE: "bg-slate-100 text-slate-700 ring-slate-200",
  ARCHIVE: "bg-slate-100 text-slate-700 ring-slate-200",
  A_VENIR: "bg-sky-50 text-sky-900 ring-sky-200",
  PROCHE: "bg-amber-50 text-amber-900 ring-amber-200",
  DEPASSEE: "bg-red-50 text-red-800 ring-red-200",
  TRAITEE: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function StatusBadge({ code, label }: { code: string; label: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[code] ?? TONE.AUCUN}`}>
      {label}
    </span>
  );
}
