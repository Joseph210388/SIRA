export default function PrivateLoading() {
  return (
    <section className="grid w-full gap-3" aria-busy="true">
      <div className="h-8 max-w-xs rounded-full bg-mist" />
      <div className="h-28 w-full rounded-2xl bg-white ring-1 ring-ink/10" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-white ring-1 ring-ink/10" />
        <div className="h-24 rounded-2xl bg-white ring-1 ring-ink/10" />
      </div>
    </section>
  );
}
