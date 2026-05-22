import * as React from "react";

import { cn } from "@/lib/utils";

type ProdeFieldProps = {
  children: React.ReactNode;
  className?: string;
  htmlFor: string;
  label: string;
};

const prodeControlClassName =
  "prode-frame min-h-14 w-full bg-prode-surface px-3 py-3 text-base text-prode-black outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-prode-black focus-visible:ring-offset-[3px] focus-visible:ring-offset-prode-paper";

export function ProdeField({
  children,
  className,
  htmlFor,
  label,
}: ProdeFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label
        className="font-technical text-xs font-bold uppercase text-prode-black"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function ProdeInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(prodeControlClassName, className)}
      data-slot="prode-input"
      {...props}
    />
  );
}

export function ProdeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(prodeControlClassName, "cursor-pointer", className)}
      data-slot="prode-select"
      {...props}
    />
  );
}

export function ProdeTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        prodeControlClassName,
        "min-h-32 resize-y leading-6",
        className,
      )}
      data-slot="prode-textarea"
      {...props}
    />
  );
}
