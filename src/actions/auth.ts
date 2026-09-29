"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/auth";
import { emptyToNull, signupSchema } from "@/lib/schemas";
import { registerCompany } from "@/server/companies";

function rethrowIfRedirect(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/connexion" });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    rethrowIfRedirect(error);
    if (error instanceof AuthError) {
      redirect("/connexion?erreur=identifiants");
    }
    throw error;
  }
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    companyName: formData.get("companyName"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    managerName: formData.get("managerName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/inscription?erreur=formulaire");
  }

  const email = parsed.data.email.toLowerCase();
  try {
    await registerCompany({
      companyName: parsed.data.companyName,
      city: emptyToNull(parsed.data.city),
      phone: emptyToNull(parsed.data.phone),
      managerName: parsed.data.managerName,
      email,
      password: parsed.data.password,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/inscription?erreur=email");
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    rethrowIfRedirect(error);
    redirect("/connexion?erreur=identifiants");
  }
}
