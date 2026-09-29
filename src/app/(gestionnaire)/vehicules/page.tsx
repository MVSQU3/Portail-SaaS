import Link from "next/link";
import { createVehicleAction } from "@/actions/fleet";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatInteger, metricUnit } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { VEHICLE_STATUS_LABEL } from "@/lib/labels";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Véhicules" };

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const query = await searchParams;
  const vehicles = await listVehicles(actor);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Véhicules</h1>
        <p className="mt-1 text-sm text-slate-600">
          Compteurs saisis à la main. Aucune télématique n’est connectée.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Nouveau véhicule</h2>
        <form action={createVehicleAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Nom</span>
            <input name="label" required minLength={2} placeholder="Hilux chantier" />
          </label>
          <label className="field">
            <span>Immatriculation</span>
            <input name="registration" required minLength={2} placeholder="AA-452-CI" />
          </label>
          <label className="field">
            <span>Marque</span>
            <input name="brand" />
          </label>
          <label className="field">
            <span>Modèle</span>
            <input name="model" />
          </label>
          <label className="field">
            <span>Année</span>
            <input name="year" inputMode="numeric" />
          </label>
          <label className="field">
            <span>Kilomètres actuels</span>
            <input name="currentKm" type="number" min={0} step={1} defaultValue={0} required />
          </label>
          <label className="field">
            <span>Heures actuelles</span>
            <input name="currentHours" type="number" min={0} step={1} defaultValue={0} required />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn">
              Ajouter le véhicule
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        {vehicles.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            Aucun véhicule pour le moment. Ajoutez le premier engin de la flotte.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Véhicule</th>
                  <th>Immatriculation</th>
                  <th>Kilomètres</th>
                  <th>Heures</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <Link href={`/vehicules/${vehicle.id}`} className="font-medium text-teal-800 hover:underline">
                        {vehicle.label}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td>{vehicle.registration}</td>
                    <td>
                      {formatInteger(vehicle.currentKm)} {metricUnit("KILOMETRES")}
                    </td>
                    <td>
                      {formatInteger(vehicle.currentHours)} {metricUnit("HEURES")}
                    </td>
                    <td>
                      <StatusBadge code={vehicle.status} label={VEHICLE_STATUS_LABEL[vehicle.status]} />
                    </td>
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
