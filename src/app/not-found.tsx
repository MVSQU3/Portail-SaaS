import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-8">
        <h1 className="text-xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cette adresse ne correspond à aucun écran FleetCare.
        </p>
        <Link href="/" className="btn mt-6">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
