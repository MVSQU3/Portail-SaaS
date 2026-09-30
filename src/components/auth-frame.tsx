import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthFrame({
  title,
  intro,
  children,
  alternate,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  alternate: { href: string; label: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-md gap-6">
        <div>
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
            FleetCare
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{intro}</p>
        </div>
        <section className="card p-6">{children}</section>
        <p className="text-sm text-slate-600">
          <Link href={alternate.href} className="font-medium text-teal-800 hover:underline">
            {alternate.label}
          </Link>
        </p>
        <ThemeToggle />
      </div>
    </main>
  );
}
