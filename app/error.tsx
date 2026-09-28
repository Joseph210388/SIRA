"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center gap-3 px-4">
      <p className="text-center text-sm">No se pudo conectar con la base de SIRA.</p>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-pine px-4 text-sm text-white">
        Reintentar
      </button>
    </main>
  );
}
