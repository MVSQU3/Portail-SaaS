import Link from "next/link";
import { saveDeadlineAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatDay, formatXof } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { DEADLINE_KIND_LABEL, DEADLINE_STATUS_LABEL } from "@/lib/labels";
import { listDeadlines } from "@/server/deadlines";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Échéances" };

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const query = await searchParams;
  const [deadlines, vehicles] = await Promise.all([listDeadlines(actor), listVehicles(actor)]);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Échéances</h1>
        <p className="mt-1 text-sm text-slate-600">
          Assurances et visites techniques. Une échéance dans les 30 jours, ou déjà dépassée, crée une
          notification et un e-mail simulé.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Nouvelle échéance</h2>
        <form action={saveDeadlineAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Libellé</span>
            <input name="label" required minLength={2} placeholder="Assurance Hilux" />
          </label>
          <label className="field">
            <span>Type</span>
            <select name="kind" defaultValue="ASSURANCE">
              {Object.entries(DEADLINE_KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Véhicule</span>
            <select name="vehicleId" defaultValue="">
              <option value="">Aucun véhicule</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label} · {vehicle.registration}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Date d’échéance</span>
            <input name="dueOn" type="date" required />
          </label>
          <label className="field">
            <span>Coût (XOF)</span>
            <input name="costXof" type="number" min={0} step={1} />
          </label>
          <label className="field sm:col-span-2">
            <span>Notes</span>
            <textarea name="notes" rows={3} />
          </label>
          <div>
            <button type="submit" className="btn">
              Enregistrer
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        {deadlines.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucune échéance enregistrée.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Échéance</th>
                  <th>Type</th>
                  <th>Véhicule</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Coût</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((deadline) => (
                  <tr key={deadline.id}>
                    <td>
                      <Link href={`/echeances/${deadline.id}`} className="font-medium text-teal-800 hover:underline">
                        {deadline.label}
                      </Link>
                    </td>
                    <td>{DEADLINE_KIND_LABEL[deadline.kind]}</td>
                    <td>{deadline.vehicle ? `${deadline.vehicle.label}` : "—"}</td>
                    <td>{formatDay(deadline.dueOn)}</td>
                    <td>
                      <StatusBadge code={deadline.status} label={DEADLINE_STATUS_LABEL[deadline.status]} />
                    </td>
                    <td>{deadline.costXof != null ? formatXof(deadline.costXof) : "—"}</td>
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
