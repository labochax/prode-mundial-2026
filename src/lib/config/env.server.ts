import "server-only";

import { getPublicSupabaseEnv } from "@/lib/config/env";

type SupabaseAdminEnv = ReturnType<typeof getPublicSupabaseEnv> & {
  serviceRoleKey: string;
};

function requireServerEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta configurar ${name}. Este valor solo debe existir en contexto servidor.`);
  }

  return value;
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
