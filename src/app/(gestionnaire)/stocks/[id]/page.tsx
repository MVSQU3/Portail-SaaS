import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePartAction, savePartAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { ResourceNotFoundError } from "@/lib/errors";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { getPart } from "@/server/stock";

export const metadata = { title: "Pièce" };

export default async function PartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const { id } = await params;
  const query = await searchParams;
  let part;
  try {
    part = await getPart(actor, id);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/stocks" className="hover:underline">
              Stocks
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{part.name}</h1>
        </div>
        <form action={deletePartAction}>
          <input type="hidden" name="id" value={part.id} />
          <button type="submit" className="btn-danger">
            Supprimer
          </button>
        </form>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <form action={savePartAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={part.id} />
          <label className="field">
            <span>Référence</span>
            <input name="sku" required minLength={1} defaultValue={part.sku} />
          </label>
          <label className="field">
            <span>Nom</span>
            <input name="name" required minLength={2} defaultValue={part.name} />
          </label>
          <label className="field">
            <span>Quantité</span>
            <input name="quantity" type="number" min={0} step={1} required defaultValue={part.quantity} />
          </label>
          <label className="field">
            <span>Seuil minimum</span>
            <input name="minQuantity" type="number" min={0} step={1} required defaultValue={part.minQuantity} />
          </label>
          <label className="field">
            <span>Coût unitaire (XOF)</span>
            <input name="unitCostXof" type="number" min={0} step={1} required defaultValue={part.unitCostXof} />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn">
              Enregistrer
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Un écart de quantité crée un mouvement d’entrée ou de sortie. Si le stock passe sous le seuil,
          une notification apparaît sur le dashboard.
        </p>
      </section>
    </>
  );
}
