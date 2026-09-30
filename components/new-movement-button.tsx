"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// En Cuentas abre el aviso. Desde otra pantalla llega allí con el aviso ya abierto.
export function NewMovementButton({ label }: { label: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-pine px-4 text-sm font-medium text-white"
      onClick={() => {
        if (pathname === "/accounts") {
          window.dispatchEvent(new CustomEvent("sira-open-form", { detail: "movement" }));
          return;
        }
        router.push("/accounts?new=1");
      }}
    >
      <Plus className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
