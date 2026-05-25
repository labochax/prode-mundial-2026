import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

const protectedRoutePrefixes = [
  "/admin",
  "/dashboard",
  "/mi-mundial",
  "/onboarding",
  "/partidos",
  "/perfil",
  "/posiciones",
  "/premios",
  "/reglas",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });

  return to;
}

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  return copyResponseCookies(response, NextResponse.redirect(new URL(pathname, request.url)));
}

function redirectToLogin(request: NextRequest, response: NextResponse) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return copyResponseCookies(response, NextResponse.redirect(loginUrl));
}

async function getAuthenticatedLandingPath(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  return data?.onboarding_completed ? "/dashboard" : "/onboarding";
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({
    request,
  });
  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user && !error);

  if (pathname === "/login" && isAuthenticated && user) {
    const landingPath = await getAuthenticatedLandingPath(supabase, user.id);
    return redirectWithCookies(request, response, landingPath);
  }

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return redirectToLogin(request, response);
  }

  if (
    isProtectedRoute(pathname) &&
    isAuthenticated &&
    user &&
    pathname !== "/onboarding"
  ) {
    const landingPath = await getAuthenticatedLandingPath(supabase, user.id);

    if (landingPath === "/onboarding") {
      return redirectWithCookies(request, response, landingPath);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)",
  ],
};
