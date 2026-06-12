import "server-only";

import {
  AdminAuthorizationError,
  getAdminAuthorizationDecision,
} from "@/lib/admin/admin-authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentAdminAuthorization =
  | {
      email: null;
      status: "unauthenticated";
    }
  | {
      email: string;
      status: "authorized" | "unauthorized";
    };

export async function getCurrentAdminAuthorization(): Promise<CurrentAdminAuthorization> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return {
      email: null,
      status: "unauthenticated",
    };
  }

  const decision = getAdminAuthorizationDecision(
    user.email,
    process.env.ADMIN_EMAILS,
  );

  return {
    email: decision.email ?? user.email ?? "",
    status: decision.isAuthorized ? "authorized" : "unauthorized",
  };
}

export async function assertCurrentUserIsAdmin() {
  const authorization = await getCurrentAdminAuthorization();

  if (authorization.status !== "authorized") {
    throw new AdminAuthorizationError();
  }

  return authorization;
}
