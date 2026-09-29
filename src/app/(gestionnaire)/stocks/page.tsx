import Link from "next/link";
import { savePartAction } from "@/actions/operations";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatInteger, formatXof } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { isLowStock } from "@/lib/notices";
import { listParts } from "@/server/stock";

export const metadata = { title: "Stocks" };

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requireValidatedGestionnaire();
  const query = await searchParams;
  const parts = await listParts(actor);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Stocks</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pièces de rechange. Un stock au seuil ou en dessous crée une notification et un e-mail simulé.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Nouvelle pièce</h2>
        <form action={savePartAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Référence</span>
            <input name="sku" required minLength={1} placeholder="FIL-HUILE-01" />
          </label>
          <label className="field">
            <span>Nom</span>
            <input name="name" required minLength={2} placeholder="Filtre à huile" />
          </label>
          <label className="field">
            <span>Quantité</span>
            <input name="quantity" type="number" min={0} step={1} defaultValue={0} required />
          </label>
          <label className="field">
            <span>Seuil minimum</span>
            <input name="minQuantity" type="number" min={0} step={1} defaultValue={0} required />
          </label>
          <label className="field">
            <span>Coût unitaire (XOF)</span>
            <input name="unitCostXof" type="number" min={0} step={1} defaultValue={0} required />
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn">
              Ajouter la pièce
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        {parts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucune pièce en stock.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Pièce</th>
                  <th>Quantité</th>
                  <th>Seuil</th>
                  <th>Coût unitaire</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => {
                  const low = isLowStock(part.quantity, part.minQuantity);
                  return (
                    <tr key={part.id}>
                      <td>
                        <Link href={`/stocks/${part.id}`} className="font-medium text-teal-800 hover:underline">
                          {part.name}
                        </Link>
                        <span className="block text-xs text-slate-500">{part.sku}</span>
                      </td>
                      <td>{formatInteger(part.quantity)}</td>
                      <td>{formatInteger(part.minQuantity)}</td>
                      <td>{formatXof(part.unitCostXof)}</td>
                      <td>{low ? <StatusBadge code="DEPASSEE" label="Stock bas" /> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
