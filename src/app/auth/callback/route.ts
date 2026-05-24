import { NextResponse, type NextRequest } from "next/server";

import { getProfileRedirectPath, ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectToLoginWithError(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("error", "auth");
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectToLoginWithError(request);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToLoginWithError(request);
    }

    const profileState = await ensureCurrentProfile(supabase);

    if (!profileState) {
      return redirectToLoginWithError(request);
    }

    return NextResponse.redirect(new URL(getProfileRedirectPath(profileState.profile), request.url));
  } catch {
    return redirectToLoginWithError(request);
  }
}
