import type { Copy } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

type Slice = { label: string; value: number };
type Band = { label: string; value: number };
type BudgetRow = { name: string; spent: number; limit: number };
type AccountCard = { id: string; name: string; kind: string; balance: number };
type MoveCard = { id: string; concept: string; accountName: string; amount: number; direction: "in" | "out"; when: string };
type GoalCard = { name: string; balance: number; target: number } | null;

const chartColors = ["rgb(var(--chart-1))", "rgb(var(--chart-2))", "rgb(var(--chart-3))", "rgb(var(--chart-4))"];

function Meter({ ratio, tone }: { ratio: number; tone: string }) {
  const width = Math.max(0, Math.min(100, ratio));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-mist">
      <div style={{ width: `${width}%`, height: "100%", background: tone }} />
    </div>
  );
}

function Donut({ slices, center }: { slices: Slice[]; center: string }) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const radius = 42;
  const length = 2 * Math.PI * radius;
  let offset = 0;
  const rings = slices.map((slice, index) => {
    const piece = total > 0 ? (slice.value / total) * length : 0;
    const ring = (
      <circle
        key={`${slice.label}-${index}`}
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={chartColors[index % chartColors.length]}
        strokeWidth="14"
        strokeDasharray={`${piece} ${length - piece}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 60 60)"
      />
    );
    offset += piece;
    return ring;
  });
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="mx-auto h-36 w-36 max-w-full shrink-0" role="img">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgb(var(--soft))" strokeWidth="14" />
        {rings}
        <text x="60" y="64" textAnchor="middle" fill="rgb(var(--ink))" fontSize="10">
          {center}
        </text>
      </svg>
      <ul className="grid min-w-0 flex-1 gap-2">
        {slices.map((slice, index) => {
          const share = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <li key={`${slice.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span style={{ background: chartColors[index % chartColors.length], height: "1.25rem", width: "1.25rem", borderRadius: "9999px", display: "inline-block" }} />
                <span className="truncate">{slice.label}</span>
              </span>
              <span className="shrink-0 text-ink/70">{share}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HomeDashboard({
  text,
  locale,
  name,
  greet,
  total,
  monthIncome,
  monthExpense,
  savingsTotal,
  slices,
  accounts,
  movements,
  bands,
  budgets,
  goal,
  partnerName,
  showReminder,
  query,
}: {
  text: Copy;
  locale: string;
  name: string;
  greet: string;
  total: number;
  monthIncome: number;
  monthExpense: number;
  savingsTotal: number;
  slices: Slice[];
  accounts: AccountCard[];
  movements: MoveCard[];
  bands: Band[];
  budgets: BudgetRow[];
  goal: GoalCard;
  partnerName: string | null;
  showReminder: boolean;
  query: string;
}) {
  const money = (value: number) => formatMoney(value, locale);
  const placed = slices.reduce((sum, item) => sum + item.value, 0);
  const bandMax = Math.max(...bands.map((item) => item.value), 1);
  const goalRatio = goal && goal.target > 0 ? (goal.balance / goal.target) * 100 : 0;
  return (
    <section className="grid gap-4">
      {showReminder ? <p className="rounded-2xl bg-mist px-4 py-3 text-sm">{text.reminderBanner}</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-semibold">{greet}, {name}</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/70">{text.homeCalm}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs uppercase tracking-wide text-ink/60">{text.balanceLabel}</p>
          <p className="mt-2 text-2xl font-semibold text-pine sm:text-3xl">{money(total)}</p>
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs uppercase tracking-wide text-ink/60">{text.incomeMonth}</p>
          <p className="mt-2 text-2xl font-semibold text-income sm:text-3xl">{money(monthIncome)}</p>
          <p className="text-xs text-ink/50">{text.thisMonth}</p>
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs uppercase tracking-wide text-ink/60">{text.expenseMonth}</p>
          <p className="mt-2 text-2xl font-semibold text-expense sm:text-3xl">{money(monthExpense)}</p>
          <p className="text-xs text-ink/50">{text.thisMonth}</p>
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs uppercase tracking-wide text-ink/60">{text.savingsLabel}</p>
          <p className="mt-2 text-2xl font-semibold text-savings sm:text-3xl">{money(savingsTotal)}</p>
        </article>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <h2 className="text-base font-semibold">{text.distributionTitle}</h2>
          {slices.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.distributionEmpty}</p> : (
            <>
              <p className="mt-1 text-xs text-ink/50">{money(placed)} · 100% {text.assigned}</p>
              <div className="mt-4"><Donut slices={slices} center={money(placed)} /></div>
            </>
          )}
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <h2 className="text-base font-semibold">{text.goalCard}</h2>
          {goal ? (
            <div className="mt-4 grid gap-3">
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-ink/70">{money(goal.balance)} / {money(goal.target)}</p>
              <Meter ratio={goalRatio} tone="rgb(var(--savings))" />
              <Link href="/goals" className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-4 text-sm text-white">{text.newGoal}</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-sm text-ink/70">{text.goalEmpty}</p>
              <Link href="/goals" className="inline-flex min-h-11 items-center justify-center rounded-full bg-mist px-4 text-sm">{text.newGoal}</Link>
            </div>
          )}
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <h2 className="text-base font-semibold">{text.accountsFlow}</h2>
          {accounts.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.empty}</p> : (
            <ul className="mt-4 grid gap-3">
              {accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{account.name}</span>
                    <span className="text-xs text-ink/60">{account.kind}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{money(account.balance)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{text.recentTitle}</h2>
            <Link href="/movements" className="text-sm text-pine">{text.seeAll}</Link>
          </div>
          {movements.length === 0 ? <p className="mt-4 text-sm text-ink/70">{query ? text.noMoves : text.noMoves}</p> : (
            <ul className="mt-4 grid gap-2">
              {movements.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.concept}</span>
                    <span className="text-xs text-ink/50">{item.accountName} · {item.when}</span>
                  </span>
                  <span className={item.direction === "out" ? "shrink-0 text-expense" : "shrink-0 text-income"}>
                    {item.direction === "out" ? "−" : "+"}{money(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <h2 className="text-base font-semibold">{text.rhythmTitle}</h2>
          {bands.every((item) => item.value === 0) ? <p className="mt-4 text-sm text-ink/70">{text.noSpend}</p> : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bands.map((band) => (
                <div key={band.label} className="grid gap-2">
                  <div className="flex h-28 items-end">
                    <div style={{ height: `${Math.max(12, (band.value / bandMax) * 100)}%`, width: "100%", background: "rgb(var(--primary))", borderRadius: "0.75rem" }} />
                  </div>
                  <p className="text-xs text-ink/60">{band.label}</p>
                  <p className="text-sm font-semibold">{money(band.value)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
          <h2 className="text-base font-semibold">{partnerName ? text.duoActive : text.duoIdle}</h2>
          <p className="mt-3 text-sm text-ink/70">{partnerName ?? text.duoIdleHint}</p>
          <Link href="/duo" className="mt-4 inline-flex min-h-11 items-center text-sm text-pine">{text.navDuo}</Link>
        </article>
      </div>
      <article className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{text.budgetHome}</h2>
          <Link href="/budgets" className="text-sm text-pine">{text.seeAll}</Link>
        </div>
        {budgets.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.budgetHint}</p> : (
          <ul className="mt-4 grid gap-4">
            {budgets.map((item) => {
              const ratio = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
              return (
                <li key={item.name} className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-ink/60">{money(item.spent)} / {money(item.limit)} · {ratio > 100 ? text.overPlan : text.withinPlan}</span>
                  </div>
                  <Meter ratio={ratio} tone={ratio > 100 ? "rgb(var(--danger))" : "rgb(var(--primary))"} />
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </section>
  );
}
