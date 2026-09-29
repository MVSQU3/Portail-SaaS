import { loginAction } from "@/actions/auth";
import { AuthFrame } from "@/components/auth-frame";
import { Flash } from "@/components/flash";

export const metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <AuthFrame
      title="Connexion"
      intro="Accédez à l’espace de votre entreprise ou à l’administration plateforme."
      alternate={{ href: "/inscription", label: "Créer un compte entreprise" }}
    >
      <form action={loginAction} className="grid gap-4">
        <Flash erreur={erreur} />
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn">
          Se connecter
        </button>
      </form>
    </AuthFrame>
  );
}
