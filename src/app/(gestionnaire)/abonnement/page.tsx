import { StatusBadge } from "@/components/status-badge";
import { formatDay, formatXof } from "@/lib/format";
import { requireValidatedGestionnaire } from "@/lib/guards";
import { PAY_KADEV_URL } from "@/lib/integrations";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/labels";
import { getCompanySubscription } from "@/server/companies";

export const metadata = { title: "Abonnement" };

export default async function SubscriptionPage() {
  const { actor, company } = await requireValidatedGestionnaire();
  const subscription = await getCompanySubscription(actor);
  const status = subscription?.status ?? "AUCUN";

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="mt-1 text-sm text-slate-600">
          Statut de {company.name}. FleetCare ne capture aucun paiement.
        </p>
      </header>
      <section className="card p-4 sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</dt>
            <dd className="mt-2">
              <StatusBadge code={status} label={SUBSCRIPTION_STATUS_LABEL[status]} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offre</dt>
            <dd className="mt-2 text-sm">{subscription?.planName ?? "Aucune offre"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Montant</dt>
            <dd className="mt-2 text-sm">
              {subscription?.amountXof != null ? formatXof(subscription.amountXof) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Période</dt>
            <dd className="mt-2 text-sm">
              {subscription?.periodEnd
                ? `Jusqu’au ${formatDay(subscription.periodEnd)}`
                : "Aucune période en cours"}
            </dd>
          </div>
        </dl>
        <a href={PAY_KADEV_URL} className="btn mt-6" rel="noreferrer">
          Continuer vers pay.kadev.ci
        </a>
        <p className="mt-3 text-sm text-slate-600">
          Le règlement se fait sur pay.kadev.ci. Le statut affiché ici est mis à jour manuellement par
          l’administrateur plateforme.
        </p>
      </section>
    </>
  );
}
