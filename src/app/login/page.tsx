import { LoginStage } from "@/components/auth/login-stage";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function getInitialLoginError(error: string | string[] | undefined) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "auth") {
    return "No pudimos completar el acceso. Revisá la configuración local de Supabase y Google.";
  }

  return undefined;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return <LoginStage initialError={getInitialLoginError(error)} />;
}
