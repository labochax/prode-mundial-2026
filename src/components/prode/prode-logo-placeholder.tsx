import { Badge } from "@/components/ui/badge";

export function ProdeLogoPlaceholder() {
  // Replace this mark after the Stitch logo audit.
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted text-sm font-semibold"
      >
        26
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold">Prode Mundial 2026</p>
          <Badge variant="outline">Logo temporal</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Stitch definira la version final.
        </p>
      </div>
    </div>
  );
}
