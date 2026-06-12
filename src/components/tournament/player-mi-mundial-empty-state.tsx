import Link from "next/link";

type PlayerMiMundialEmptyStateProps = {
  description: string;
  title: string;
};

export function PlayerMiMundialEmptyState({
  description,
  title,
}: PlayerMiMundialEmptyStateProps) {
  return (
    <section className="prode-frame prode-hard-shadow bg-prode-surface p-6 sm:p-8">
      <span className="prode-frame bg-prode-yellow px-3 py-2 font-technical text-xs font-black uppercase">
        Mi Mundial
      </span>
      <h1 className="mt-5 font-display text-5xl uppercase leading-none sm:text-6xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl font-body text-base leading-7 text-muted-foreground">
        {description}
      </p>
      <Link
        className="prode-frame prode-hard-shadow prode-pressable mt-6 inline-flex min-h-12 items-center justify-center bg-prode-yellow px-4 py-3 font-technical text-xs font-black uppercase"
        href="/posiciones"
      >
        Volver a posiciones
      </Link>
    </section>
  );
}
