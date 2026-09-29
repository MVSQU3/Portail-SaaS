import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMaintenanceAction, saveMaintenanceAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { formatIsoDate } from "@/lib/notices";
import { ResourceNotFoundError } from "@/lib/errors";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { MAINTENANCE_KIND_LABEL } from "@/lib/labels";
import { getMaintenance } from "@/server/maintenance";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Opération" };

export default async function MaintenanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const { id } = await params;
  const query = await searchParams;
  const vehicles = await listVehicles(actor);
  let log;
  try {
    log = await getMaintenance(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/carnet" className="hover:underline">
              Carnet d’entretien
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{log.title}</h1>
        </div>
        <form action={deleteMaintenanceAction}>
          <input type="hidden" name="id" value={log.id} />
          <button type="submit" className="btn-danger">
            Supprimer
          </button>
        </form>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <form action={saveMaintenanceAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={log.id} />
          <label className="field">
            <span>Véhicule</span>
            <select name="vehicleId" required defaultValue={log.vehicleId}>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label} · {vehicle.registration}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select name="kind" defaultValue={log.kind}>
              {Object.entries(MAINTENANCE_KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field sm:col-span-2">
            <span>Titre</span>
            <input name="title" required minLength={2} defaultValue={log.title} />
          </label>
          <label className="field">
            <span>Date</span>
            <input name="performedAt" type="date" required defaultValue={formatIsoDate(log.performedAt)} />
          </label>
          <label className="field">
            <span>Coût (XOF)</span>
            <input name="costXof" type="number" min={0} step={1} required defaultValue={log.costXof} />
          </label>
          <label className="field">
            <span>Kilomètres</span>
            <input name="odometerKm" type="number" min={0} step={1} defaultValue={log.odometerKm ?? ""} />
          </label>
          <label className="field">
            <span>Heures</span>
            <input name="hours" type="number" min={0} step={1} defaultValue={log.hours ?? ""} />
          </label>
          <label className="field sm:col-span-2">
            <span>Description</span>
            <textarea name="description" rows={3} defaultValue={log.description ?? ""} />
          </label>
          <div>
            <button type="submit" className="btn">
              Enregistrer
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
