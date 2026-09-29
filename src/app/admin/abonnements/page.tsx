import { StatusBadge } from "@/components/status-badge";
import { formatXof } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/guards";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/labels";
import { listCompaniesForAdmin } from "@/server/companies";

export const metadata = { title: "Abonnements" };

export default async function AdminSubscriptionsPage() {
  const { actor } = await requirePlatformAdmin();
  const companies = await listCompaniesForAdmin(actor);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnements</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Lecture seule du statut enregistré sur chaque entreprise. Le paiement en ligne et la
          modification manuelle détaillée ne font pas partie de cette version.
        </p>
      </header>
      <section className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Offre</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="font-medium">{company.name}</td>
                  <td>{company.subscription?.planName ?? "—"}</td>
                  <td>
                    <StatusBadge
                      code={company.subscription?.status ?? "AUCUN"}
                      label={SUBSCRIPTION_STATUS_LABEL[company.subscription?.status ?? "AUCUN"]}
                    />
                  </td>
                  <td>
                    {company.subscription?.amountXof != null
                      ? formatXof(company.subscription.amountXof)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
