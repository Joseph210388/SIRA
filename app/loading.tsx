export default function RootLoading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-paper px-4" aria-busy="true">
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-4 ring-1 ring-ink/10 sm:p-6">
        <div className="mb-4 h-11 w-full rounded-full bg-mist" />
        <div className="grid gap-3">
          <div className="h-11 w-full rounded-2xl bg-mist" />
          <div className="h-11 w-full rounded-2xl bg-mist" />
        </div>
      </div>
    </div>
  );
}
