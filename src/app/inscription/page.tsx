import { signupAction } from "@/actions/auth";
import { AuthFrame } from "@/components/auth-frame";
import { Flash } from "@/components/flash";

export const metadata = { title: "Inscription" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <AuthFrame
      title="Créer une entreprise"
      intro="Le compte reste en attente de validation. Vous pourrez vous connecter, sans accéder au parc tant que la plateforme n’a pas validé l’entreprise."
      alternate={{ href: "/connexion", label: "Déjà un compte ? Se connecter" }}
    >
      <form action={signupAction} className="grid gap-4">
        <Flash erreur={erreur} />
        <label className="field">
          <span>Raison sociale</span>
          <input name="companyName" required minLength={2} maxLength={120} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Ville</span>
            <input name="city" maxLength={80} />
          </label>
          <label className="field">
            <span>Téléphone</span>
            <input name="phone" maxLength={30} />
          </label>
        </div>
        <label className="field">
          <span>Nom du gestionnaire</span>
          <input name="managerName" required minLength={2} maxLength={80} autoComplete="name" />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit" className="btn">
          Enregistrer l’entreprise
        </button>
      </form>
    </AuthFrame>
  );
}
