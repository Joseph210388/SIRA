import type { ReactNode } from "react";

// Sale solo al pasar el ratón. No es un botón: el mismo aviso sirve en cualquier sitio.
export function Tooltip({
  content,
  children,
  align = "end",
}: {
  content: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const place = align === "start" ? "left-0" : "right-0";
  return (
    <span className="group/tip relative inline-flex max-w-full">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-40 mt-1 hidden w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-black px-3 py-2 text-left text-sm font-normal leading-snug text-white group-hover/tip:block ${place}`}
      >
        {content}
      </span>
    </span>
  );
}
