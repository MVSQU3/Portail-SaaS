"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-8">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          L’action n’a pas abouti. Réessayez dans un instant.
        </p>
        <button type="button" className="btn mt-6" onClick={() => reset()}>
          Réessayer
        </button>
      </div>
    </main>
  );
}
