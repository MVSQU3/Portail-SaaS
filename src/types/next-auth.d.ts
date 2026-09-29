import type { DefaultSession } from "next-auth";
import type { TenantRole } from "@/lib/tenant";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: TenantRole;
      companyId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: TenantRole;
    companyId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: TenantRole;
    companyId?: string | null;
  }
}
