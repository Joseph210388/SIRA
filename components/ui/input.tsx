import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-base text-ink",
        props.className,
      )}
    />
  );
}
