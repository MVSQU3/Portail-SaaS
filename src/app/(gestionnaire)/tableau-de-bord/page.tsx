import Link from "next/link";
import { markAlertReadAction } from "@/actions/fleet";
import { markNoticeReadAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { ALERT_STATUS_LABEL } from "@/lib/labels";
import { getDashboard } from "@/server/dashboard";
import { syncOperationalNotices } from "@/server/notices";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor, company } = await requireValidatedGestionnaire();
  const query = await searchParams;
  await syncOperationalNotices(actor);
  const data = await getDashboard(actor);
  const open = data.alerts.filter((alert) => alert.status === "OUVERTE");

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Alertes de {company.name}
          {company.city ? ` · ${company.city}` : ""}
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Véhicules</p>
          <p className="mt-2 text-3xl font-semibold">{data.vehicleCount}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alertes ouvertes</p>
          <p className="mt-2 text-3xl font-semibold">{data.openAlerts}</p>
        </article>
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seuils actifs</p>
          <p className="mt-2 text-3xl font-semibold">{data.activeRules}</p>
        </article>
      </section>
      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">État des alertes</h2>
          <Link href="/vehicules" className="text-sm font-medium text-teal-800 hover:underline">
            Saisir un relevé
          </Link>
        </div>
        {data.alerts.length === 0 ? (
          <p className="px-4 py-6 text-sm leading-6 text-slate-600">
            Aucune alerte. Un seuil se déclenche lorsqu’un nouveau relevé de kilomètres ou d’heures
            franchit la valeur configurée sur le véhicule.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{alert.title}</p>
                    <StatusBadge code={alert.status} label={ALERT_STATUS_LABEL[alert.status]} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {alert.vehicle.label} · {alert.vehicle.registration} · {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                {alert.status === "OUVERTE" ? (
                  <form action={markAlertReadAction}>
                    <input type="hidden" name="alertId" value={alert.id} />
                    <button type="submit" className="btn-secondary">
                      Marquer comme lue
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {open.length === 0 && data.alerts.length > 0 ? (
          <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            Aucune alerte ouverte pour le moment.
          </p>
        ) : null}
      </section>
      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Stocks et échéances</h2>
        </div>
        {data.notices.length === 0 ? (
          <p className="px-4 py-6 text-sm leading-6 text-slate-600">
            Aucune notification de stock bas ou d’échéance. Elles apparaissent lorsque une pièce passe
            sous son seuil, ou lorsqu’une assurance ou une visite technique arrive dans les 30 jours.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.notices.map((notice) => (
              <li key={notice.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notice.title}</p>
                    <StatusBadge code={notice.status} label={ALERT_STATUS_LABEL[notice.status]} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{notice.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(notice.createdAt)}</p>
                </div>
                {notice.status === "OUVERTE" ? (
                  <form action={markNoticeReadAction}>
                    <input type="hidden" name="noticeId" value={notice.id} />
                    <button type="submit" className="btn-secondary">
                      Marquer comme lue
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
