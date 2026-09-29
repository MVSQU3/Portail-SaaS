import Link from "next/link";
import { notFound } from "next/navigation";
import { addReadingAction, createRuleAction } from "@/actions/fleet";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { VehicleNotFoundError } from "@/lib/errors";
import { formatDateTime, formatInteger, metricName, metricUnit } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { VEHICLE_STATUS_LABEL } from "@/lib/labels";
import { getVehicle } from "@/server/vehicles";

export const metadata = { title: "Véhicule" };

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { actor } = await requireValidatedGestionnaire();

  let vehicle;
  try {
    vehicle = await getVehicle(actor, id);
  } catch (error) {
    if (error instanceof VehicleNotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <header>
        <Link href="/vehicules" className="text-sm font-medium text-teal-800 hover:underline">
          Véhicules
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{vehicle.label}</h1>
          <StatusBadge code={vehicle.status} label={VEHICLE_STATUS_LABEL[vehicle.status]} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {vehicle.registration}
          {vehicle.brand || vehicle.model ? ` · ${[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}` : ""}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kilomètres</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatInteger(vehicle.currentKm)} <span className="text-base font-medium text-slate-500">km</span>
          </p>
        </article>
        <article className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Heures de fonctionnement</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatInteger(vehicle.currentHours)} <span className="text-base font-medium text-slate-500">h</span>
          </p>
        </article>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <form action={addReadingAction} className="card grid gap-4 p-4 sm:p-6">
          <h2 className="text-sm font-semibold">Nouveau relevé</h2>
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <label className="field">
            <span>Compteur</span>
            <select name="metric" defaultValue="KILOMETRES">
              <option value="KILOMETRES">Kilomètres</option>
              <option value="HEURES">Heures</option>
            </select>
          </label>
          <label className="field">
            <span>Valeur</span>
            <input name="value" type="number" min={0} step={1} required />
          </label>
          <label className="field">
            <span>Note</span>
            <input name="note" maxLength={200} />
          </label>
          <button type="submit" className="btn">
            Enregistrer le relevé
          </button>
        </form>
        <form action={createRuleAction} className="card grid gap-4 p-4 sm:p-6">
          <h2 className="text-sm font-semibold">Seuil d’alerte</h2>
          <p className="text-sm leading-6 text-slate-600">
            L’alerte est créée quand un relevé passe d’une valeur inférieure au seuil à une valeur
            égale ou supérieure.
          </p>
          <input type="hidden" name="vehicleId" value={vehicle.id} />
          <label className="field">
            <span>Nom de la règle</span>
            <input name="name" required minLength={2} placeholder="Vidange" />
          </label>
          <label className="field">
            <span>Compteur</span>
            <select name="metric" defaultValue="KILOMETRES">
              <option value="KILOMETRES">Kilomètres</option>
              <option value="HEURES">Heures</option>
            </select>
          </label>
          <label className="field">
            <span>Seuil</span>
            <input name="threshold" type="number" min={1} step={1} required />
          </label>
          <button type="submit" className="btn">
            Ajouter le seuil
          </button>
        </form>
      </section>
      <section className="card">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">Seuils</h2>
        {vehicle.alertRules.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucun seuil sur ce véhicule.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {vehicle.alertRules.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  {rule.name} · {metricName(rule.metric)} · {formatInteger(rule.threshold)} {metricUnit(rule.metric)}
                </span>
                <StatusBadge code={rule.active ? "ACTIF" : "ARCHIVE"} label={rule.active ? "Actif" : "Inactif"} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">Historique des relevés</h2>
        {vehicle.meterReadings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucun relevé enregistré.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Compteur</th>
                  <th>Valeur</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {vehicle.meterReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatDateTime(reading.recordedAt)}</td>
                    <td>{metricName(reading.metric)}</td>
                    <td>
                      {formatInteger(reading.value)} {metricUnit(reading.metric)}
                    </td>
                    <td>{reading.note ?? "—"}</td>
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
