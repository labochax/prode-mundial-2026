"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { GridTexture } from "@/components/prode/grid-texture";
import { ProdeBadge } from "@/components/prode/prode-badge";
import { ProdeButton } from "@/components/prode/prode-button";
import { ProdeCard } from "@/components/prode/prode-card";
import { ProdeLogo } from "@/components/prode/prode-logo";
import { ScanlineOverlay } from "@/components/prode/scanline-overlay";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginStageProps = {
  initialError?: string;
};

export function LoginStage({ initialError }: LoginStageProps) {
  const reduceMotion = useReducedMotion();
  const [started, setStarted] = useState(Boolean(initialError));
  const [authError, setAuthError] = useState<string | null>(initialError ?? null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setAuthError(null);
    setIsGoogleLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
        provider: "google",
      });

      if (error) {
        setAuthError(
          "No se pudo iniciar sesión con Google. Revisá que el proveedor esté configurado en Supabase local.",
        );
        setIsGoogleLoading(false);
      }
    } catch {
      setAuthError(
        "No se pudo iniciar sesión con Google. Revisá las variables locales de Supabase.",
      );
      setIsGoogleLoading(false);
    }
  }

  useEffect(() => {
    function startFromKeyboard() {
      setStarted(true);
    }

    window.addEventListener("keydown", startFromKeyboard, { once: true });

    return () => window.removeEventListener("keydown", startFromKeyboard);
  }, []);

  useEffect(() => {
    if (initialError) {
      setAuthError(initialError);
      setStarted(true);
    }
  }, [initialError]);

  return (
    <main className="relative isolate flex min-h-svh overflow-x-hidden bg-prode-paper text-prode-black">
      <GridTexture className="opacity-80" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(247,255,0,0.34),transparent_38%)]"
      />
      <ScanlineOverlay className="opacity-70" />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center gap-8 px-4 py-8 sm:px-6 lg:gap-10 lg:px-8">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full flex-col items-center gap-4 text-center"
          initial={reduceMotion ? false : { opacity: 0, y: -18 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
        >
          <ProdeBadge variant="ink">Mundial 2026</ProdeBadge>
          <ProdeLogo />
        </motion.div>

        <AnimatePresence initial={!reduceMotion} mode="wait">
          {!started ? (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              aria-label="Abrir selección de jugador"
              className="prode-frame prode-hard-shadow prode-pressable bg-prode-black px-6 py-4 font-technical text-base font-bold uppercase text-prode-yellow outline-none focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper"
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              key="start"
              onClick={() => setStarted(true)}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.24 }}
              type="button"
            >
              Pulse una tecla
            </motion.button>
          ) : (
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-xl"
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.98, y: 20 }
              }
              key="selection"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.28, ease: "easeOut" }
              }
            >
              <ProdeCard className="space-y-6 p-5 sm:p-7">
                <header className="space-y-3">
                  <ProdeBadge>Acceso al Prode</ProdeBadge>
                  <div className="space-y-2">
                    <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">
                      Selección de Jugador
                    </h1>
                    <p className="max-w-lg text-base leading-7">
                      Entrá al Prode del grupo, anticipá cada partido y defendé
                      tus puntos antes del cierre de pronósticos.
                    </p>
                  </div>
                </header>

                <div className="grid gap-3">
                  <ProdeButton
                    aria-label={
                      isGoogleLoading
                        ? "Conectando con Google"
                        : "Continuar con Google"
                    }
                    className="w-full"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleLogin}
                    size="large"
                  >
                    <span
                      aria-hidden="true"
                      className="prode-frame flex size-7 items-center justify-center bg-prode-surface font-technical text-sm"
                    >
                      {isGoogleLoading ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        "G"
                      )}
                    </span>
                    {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
                  </ProdeButton>
                  <ProdeButton
                    className="w-full"
                    disabled
                    size="large"
                    variant="surface"
                  >
                    <Mail aria-hidden="true" />
                    Ingresar con email · Próximamente
                  </ProdeButton>
                </div>

                {authError ? (
                  <p
                    className="prode-frame bg-prode-surface px-3 py-2 font-technical text-sm font-bold uppercase text-prode-black"
                    role="alert"
                  >
                    {authError}
                  </p>
                ) : null}

                <div className="space-y-3 border-t-[3px] border-prode-black pt-4 text-sm leading-6">
                  <p className="font-technical font-bold uppercase">
                    Google crea la sesión real. Email queda para una etapa futura.
                  </p>
                  <p>
                    Al continuar aceptás las reglas del Prode y el bloqueo de
                    pronósticos por partido antes del inicio.
                  </p>
                </div>
              </ProdeCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
