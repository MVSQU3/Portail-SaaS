import { suspendCompanyAction, validateCompanyAction } from "@/actions/admin";
import { Flash } from "@/components/flash";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/guards";
import { COMPANY_STATUS_LABEL } from "@/lib/labels";
import { listCompaniesForAdmin } from "@/server/companies";

export const metadata = { title: "Entreprises" };

export default async function CompaniesPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">Entreprises</h1>
        <p className="mt-1 text-sm text-slate-600">
          Validez une inscription ou suspendez l’accès gestionnaire. Les données du parc restent en place.
        </p>
      </header>
      <Flash erreur={query.erreur} ok={query.ok} />
      <section className="card">
        {companies.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">Aucune entreprise inscrite.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Statut</th>
                  <th>Parc</th>
                  <th>Inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-slate-500">
                        {[company.city, company.email].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </td>
                    <td>
                      <StatusBadge code={company.status} label={COMPANY_STATUS_LABEL[company.status]} />
                    </td>
                    <td>
                      {company._count.vehicles} véhicule{company._count.vehicles > 1 ? "s" : ""} ·{" "}
                      {company._count.users} compte{company._count.users > 1 ? "s" : ""}
                    </td>
                    <td>{formatDateTime(company.createdAt)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {company.status !== "VALIDEE" ? (
                          <form action={validateCompanyAction}>
                            <input type="hidden" name="companyId" value={company.id} />
                            <button type="submit" className="btn px-3 py-1.5">
                              Valider
                            </button>
                          </form>
                        ) : (
                          <form action={suspendCompanyAction}>
                            <input type="hidden" name="companyId" value={company.id} />
                            <button type="submit" className="btn-danger">
                              Suspendre
                            </button>
                          </form>
                        )}
                      </div>
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
