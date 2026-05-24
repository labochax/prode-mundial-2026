import Image from "next/image";
import * as React from "react";

import { stitchLogoAsset } from "@/lib/design/stitch-assets";
import { cn } from "@/lib/utils";

type ProdeLogoProps = React.ComponentProps<"div">;

export function ProdeLogo({ className, ...props }: ProdeLogoProps) {
  return (
    <div
      aria-label="Prode 2026"
      className={cn(
        "relative isolate inline-flex max-w-full items-center gap-3 text-prode-black sm:gap-5",
        className,
      )}
      data-slot="prode-logo"
      {...props}
    >
      <Image
        alt={stitchLogoAsset.alt}
        className="h-auto w-full max-w-[22rem] object-contain mix-blend-multiply sm:max-w-[28rem] md:max-w-[34rem]"
        height={stitchLogoAsset.height}
        priority
        sizes="(max-width: 640px) 22rem, (max-width: 768px) 28rem, 34rem"
        src={stitchLogoAsset.src}
        width={stitchLogoAsset.width}
      />
    </div>
  );
}

type ProdeCompactLogoProps = React.ComponentProps<"div"> & {
  imageClassName?: string;
  priority?: boolean;
};

export function ProdeCompactLogo({
  className,
  imageClassName,
  priority = false,
  ...props
}: ProdeCompactLogoProps) {
  return (
    <div
      aria-label="Prode 2026"
      className={cn(
        "inline-flex min-w-0 items-center gap-2 text-prode-black",
        className,
      )}
      data-slot="prode-compact-logo"
      {...props}
    >
      <Image
        alt={stitchLogoAsset.alt}
        className={cn(
          "h-auto w-[4.5rem] shrink-0 object-contain mix-blend-multiply sm:w-20",
          imageClassName,
        )}
        height={stitchLogoAsset.height}
        priority={priority}
        sizes="5rem"
        src={stitchLogoAsset.src}
        width={stitchLogoAsset.width}
      />
    </div>
  );
}
