export function PhaseTwoPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </header>
      <section className="card p-6">
        <p className="text-sm font-semibold text-slate-900">Pas encore disponible</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </section>
    </>
  );
}
