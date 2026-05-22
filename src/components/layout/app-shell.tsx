import type { ReactNode } from "react";

import { SiteNav } from "@/components/layout/site-nav";
import { AnimatedPage } from "@/components/motion/animated-page";
import { ProdeLogoPlaceholder } from "@/components/prode/prode-logo-placeholder";

type AppShellProps = {
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export function AppShell({
  children,
  description,
  eyebrow = "Base temporal",
  title,
}: AppShellProps) {
  // Final shell treatment must follow the Stitch MCP audit.
  return (
    <div className="min-h-svh bg-background">
      <AnimatedPage className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
          <ProdeLogoPlaceholder />
          <SiteNav />
        </header>

        <main className="flex flex-1 flex-col gap-6 py-8">
          <section className="max-w-3xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </section>

          {children}
        </main>
      </AnimatedPage>
    </div>
  );
}
