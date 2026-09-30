import { PageSizeSelect } from "@/components/page-size-select";
import Link from "next/link";
import type { ReactNode } from "react";

export type TableRow = {
  id: string;
  cells: ReactNode[];
};

function pageHref(path: string, page: number, pageSize: number, keep: Record<string, string>) {
  const params = new URLSearchParams(keep);
  params.set("page", String(page));
  params.set("size", String(pageSize));
  return `${path}?${params}`;
}

// Tabla con páginas. Quien la usa ya trajo solo las filas de esta página.
export function DataTable({
  headers,
  rows,
  page,
  pageSize,
  total,
  path,
  keep = {},
  empty,
  perPage,
  previous,
  next,
}: {
  headers: string[];
  rows: TableRow[];
  page: number;
  pageSize: number;
  total: number;
  path: string;
  keep?: Record<string, string>;
  empty: string;
  perPage: string;
  previous: string;
  next: string;
}) {
  if (total === 0) {
    return <p className="rounded-2xl bg-white px-4 py-6 text-sm text-ink/70 ring-1 ring-ink/10">{empty}</p>;
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pager = "inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-ink ring-1 ring-ink/10";
  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="text-ink/60">
              {headers.map((header) => (
                <th key={header} scope="col" className="px-3 py-3 font-medium sm:px-4">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-ink/10">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className="px-3 py-3 align-middle sm:px-4">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink/70">{from}–{to} / {total}</p>
        <div className="flex flex-wrap items-center gap-2">
          <PageSizeSelect path={path} pageSize={pageSize} label={perPage} keep={keep} />
          {page > 1 ? (
            <Link href={pageHref(path, page - 1, pageSize, keep)} className={pager}>{previous}</Link>
          ) : (
            <span className={`${pager} opacity-40`} aria-disabled="true">{previous}</span>
          )}
          <span className="min-h-11 px-1 text-sm leading-[2.75rem] text-ink/70">{page} / {pages}</span>
          {page < pages ? (
            <Link href={pageHref(path, page + 1, pageSize, keep)} className={pager}>{next}</Link>
          ) : (
            <span className={`${pager} opacity-40`} aria-disabled="true">{next}</span>
          )}
        </div>
      </div>
    </div>
  );
}
