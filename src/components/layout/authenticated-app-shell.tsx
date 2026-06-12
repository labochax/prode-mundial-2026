import Link from "next/link";
import type { ReactNode } from "react";

import { AuthenticatedNavigation } from "@/components/layout/authenticated-navigation";
import { PlayerIdentityBlock } from "@/components/layout/player-identity-block";
import { AnimatedPage } from "@/components/motion/animated-page";
import { GridTexture } from "@/components/prode/grid-texture";
import { ProdeCompactLogo } from "@/components/prode/prode-logo";
import { getShellPlayerIdentity } from "@/lib/profiles/player-identity";
import { ensureCurrentProfile } from "@/lib/supabase/profile-bootstrap";
import { getOrJoinDefaultPool } from "@/lib/supabase/queries/pools";
import { getCurrentUserStanding } from "@/lib/supabase/queries/shell-standing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type AuthenticatedAppShellProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  eyebrow?: string;
  header?: ReactNode;
  title?: string;
};

async function getCurrentShellIdentity() {
  const supabase = await createSupabaseServerClient();
  const profileState = await ensureCurrentProfile(supabase);

  if (!profileState) {
    return getShellPlayerIdentity(null);
  }

  const pool = await getOrJoinDefaultPool(supabase);
  const standing = await getCurrentUserStanding(
    supabase,
    pool.id,
    profileState.user.id,
  );

  return getShellPlayerIdentity(profileState.profile, standing);
}

export async function AuthenticatedAppShell({
  children,
  className,
  description,
  eyebrow,
  header,
  title,
}: AuthenticatedAppShellProps) {
  const playerIdentity = await getCurrentShellIdentity();
  const fallbackHeader =
    title || description || eyebrow ? (
      <section className="max-w-3xl space-y-3">
        {eyebrow && (
          <p className="font-technical text-xs font-bold uppercase text-muted-foreground">
            {eyebrow}
          </p>
        )}
        {title && (
          <h1 className="font-display text-4xl uppercase leading-none text-prode-black sm:text-5xl">
            {title}
          </h1>
        )}
        {description && (
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </section>
    ) : null;

  return (
    <div className="relative isolate min-h-svh overflow-x-hidden bg-prode-paper text-prode-black">
      <GridTexture className="fixed opacity-50" />

      <header className="prode-frame fixed inset-x-3 top-3 z-40 flex min-h-16 items-center justify-between gap-3 bg-prode-paper px-3 py-2 shadow-[4px_4px_0_var(--prode-black)] lg:hidden">
        <Link aria-label="Ir a predicciones" href="/predicciones">
          <ProdeCompactLogo priority />
        </Link>
        <PlayerIdentityBlock
          className="min-w-0 max-w-[13rem]"
          compact
          identity={playerIdentity}
        />
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r-[3px] border-prode-black bg-prode-paper p-5 lg:flex">
        <Link
          aria-label="Ir a predicciones"
          className="prode-frame prode-hard-shadow prode-pressable flex min-h-24 items-center justify-center bg-prode-surface p-3 outline-none hover:bg-[#fff7b5] focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
          href="/predicciones"
        >
          <ProdeCompactLogo imageClassName="w-32 sm:w-32" priority />
        </Link>

        <PlayerIdentityBlock className="mt-5" identity={playerIdentity} />

        <div aria-hidden="true" className="my-4 border-t-[3px] border-prode-black" />

        <AuthenticatedNavigation variant="sidebar" />

        <p className="mt-auto border-t-[3px] border-prode-black pt-4 font-technical text-xs font-bold uppercase text-muted-foreground">
          Prode Mundial 2026
        </p>
      </aside>

      <div className="relative z-10 min-h-svh pt-24 pb-28 lg:pl-72 lg:pt-0 lg:pb-0">
        <AnimatedPage
          className={cn(
            "mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10",
            className,
          )}
        >
          {header ?? fallbackHeader}
          {children}
        </AnimatedPage>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <AuthenticatedNavigation variant="mobile" />
      </div>
    </div>
  );
}
