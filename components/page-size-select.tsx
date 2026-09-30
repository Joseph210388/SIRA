"use client";

import { useRouter } from "next/navigation";

const sizes = [5, 10, 25] as const;

// Al cambiar el tamaño se vuelve a la primera página: la petición trae solo ese tramo.
export function PageSizeSelect({
  path,
  pageSize,
  label,
  keep = {},
}: {
  path: string;
  pageSize: number;
  label: string;
  keep?: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <span className="text-ink/70">{label}</span>
      <select
        value={pageSize}
        aria-label={label}
        className="min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-base"
        onChange={(event) => {
          const params = new URLSearchParams(keep);
          params.set("page", "1");
          params.set("size", event.target.value);
          router.push(`${path}?${params}`);
        }}
      >
        {sizes.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </label>
  );
}
