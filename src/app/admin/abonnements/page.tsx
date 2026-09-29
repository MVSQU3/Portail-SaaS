import { updateSubscriptionAction } from "@/actions/admin";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatXof } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/guards";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/labels";
import { listCompaniesForAdmin } from "@/server/companies";

export const metadata = { title: "Abonnements" };

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>;
}) {
  const { actor } = await requirePlatformAdmin();
  const query = await searchParams;
  const companies = await listCompaniesForAdmin(actor);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnements</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Mise à jour manuelle du statut, de l’offre et du montant en francs CFA entiers. Aucun paiement
          n’est capturé ici.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="grid gap-4">
        {companies.map((company) => {
          const subscription = company.subscription;
          return (
            <article key={company.id} className="card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{company.name}</h2>
                <StatusBadge
                  code={subscription?.status ?? "AUCUN"}
                  label={SUBSCRIPTION_STATUS_LABEL[subscription?.status ?? "AUCUN"]}
                />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Montant actuel : {subscription?.amountXof != null ? formatXof(subscription.amountXof) : "—"}
              </p>
              <form action={updateSubscriptionAction} className="mt-4 grid gap-4 sm:grid-cols-4">
                <input type="hidden" name="companyId" value={company.id} />
                <label className="field">
                  <span>Statut</span>
                  <select name="status" defaultValue={subscription?.status ?? "AUCUN"}>
                    {Object.entries(SUBSCRIPTION_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Offre</span>
                  <input name="planName" defaultValue={subscription?.planName ?? ""} />
                </label>
                <label className="field">
                  <span>Montant (XOF)</span>
                  <input
                    name="amountXof"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={subscription?.amountXof ?? ""}
                  />
                </label>
                <div className="flex items-end">
                  <button type="submit" className="btn">
                    Enregistrer
                  </button>
                </div>
              </form>
            </article>
          );
        })}
      </section>
    </>
  );
}
