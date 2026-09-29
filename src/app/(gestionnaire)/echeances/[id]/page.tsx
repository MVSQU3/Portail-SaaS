import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeadlineAction, saveDeadlineAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { ResourceNotFoundError } from "@/lib/errors";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { DEADLINE_KIND_LABEL } from "@/lib/labels";
import { formatIsoDate } from "@/lib/notices";
import { getDeadline } from "@/server/deadlines";
import { listVehicles } from "@/server/vehicles";

export const metadata = { title: "Échéance" };

export default async function DeadlinePage({
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
  let deadline;
  try {
    deadline = await getDeadline(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/echeances" className="hover:underline">
              Échéances
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{deadline.label}</h1>
        </div>
        <form action={deleteDeadlineAction}>
          <input type="hidden" name="id" value={deadline.id} />
          <button type="submit" className="btn-danger">
            Supprimer
          </button>
        </form>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <form action={saveDeadlineAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={deadline.id} />
          <label className="field">
            <span>Libellé</span>
            <input name="label" required minLength={2} defaultValue={deadline.label} />
          </label>
          <label className="field">
            <span>Type</span>
            <select name="kind" defaultValue={deadline.kind}>
              {Object.entries(DEADLINE_KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Véhicule</span>
            <select name="vehicleId" defaultValue={deadline.vehicleId ?? ""}>
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
            <input name="dueOn" type="date" required defaultValue={formatIsoDate(deadline.dueOn)} />
          </label>
          <label className="field">
            <span>Coût (XOF)</span>
            <input name="costXof" type="number" min={0} step={1} defaultValue={deadline.costXof ?? ""} />
          </label>
          <label className="flex items-center gap-2 self-end text-sm">
            <input name="treated" type="checkbox" defaultChecked={deadline.status === "TRAITEE"} />
            Marquer comme traitée
          </label>
          <label className="field sm:col-span-2">
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={deadline.notes ?? ""} />
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
