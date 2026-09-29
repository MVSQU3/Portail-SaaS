import Link from "next/link";
import { saveMaintenanceAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatDay, formatXof } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { MAINTENANCE_KIND_LABEL } from "@/lib/labels";
import { listMaintenance } from "@/server/maintenance";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Carnet d’entretien" };

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const query = await searchParams;
  const [logs, vehicles] = await Promise.all([listMaintenance(actor), listVehicles(actor)]);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Carnet d’entretien</h1>
        <p className="mt-1 text-sm text-slate-600">
          Opérations liées aux véhicules de l’entreprise. Les coûts sont des francs CFA entiers.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Nouvelle opération</h2>
        {vehicles.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Ajoutez d’abord un véhicule pour enregistrer une opération.
          </p>
        ) : (
          <form action={saveMaintenanceAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Véhicule</span>
              <select name="vehicleId" required defaultValue={vehicles[0]?.id}>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.label} · {vehicle.registration}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Type</span>
              <select name="kind" defaultValue="PREVENTIVE">
                {Object.entries(MAINTENANCE_KIND_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field sm:col-span-2">
              <span>Titre</span>
              <input name="title" required minLength={2} placeholder="Vidange" />
            </label>
            <label className="field">
              <span>Date</span>
              <input name="performedAt" type="date" required />
            </label>
            <label className="field">
              <span>Coût (XOF)</span>
              <input name="costXof" type="number" min={0} step={1} defaultValue={0} required />
            </label>
            <label className="field">
              <span>Kilomètres</span>
              <input name="odometerKm" type="number" min={0} step={1} />
            </label>
            <label className="field">
              <span>Heures</span>
              <input name="hours" type="number" min={0} step={1} />
            </label>
            <label className="field sm:col-span-2">
              <span>Description</span>
              <textarea name="description" rows={3} />
            </label>
            <div>
              <button type="submit" className="btn">
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="card">
        {logs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucune opération enregistrée.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opération</th>
                  <th>Véhicule</th>
                  <th>Type</th>
                  <th>Coût</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDay(log.performedAt)}</td>
                    <td>
                      <Link href={`/carnet/${log.id}`} className="font-medium text-teal-800 hover:underline">
                        {log.title}
                      </Link>
                    </td>
                    <td>
                      {log.vehicle.label}
                      <span className="block text-xs text-slate-500">{log.vehicle.registration}</span>
                    </td>
                    <td>
                      <StatusBadge code={log.kind} label={MAINTENANCE_KIND_LABEL[log.kind]} />
                    </td>
                    <td>{formatXof(log.costXof)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
