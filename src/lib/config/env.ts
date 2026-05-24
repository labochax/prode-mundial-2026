type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

function requirePublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta configurar ${name}. Revisá .env.local antes de usar Supabase.`);
  }

  return value;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    url: requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
