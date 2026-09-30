import { GoalPanel, type GoalItem } from "@/components/goal-panel";
import type { Copy } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { Leaf, PiggyBank, ShoppingBag, Users, Wallet, ArrowDownLeft, Info } from "lucide-react";
import { Newsreader } from "next/font/google";
import Link from "next/link";

const display = Newsreader({ subsets: ["latin"], weight: ["400", "500"] });

type Slice = { label: string; value: number };
type Band = { label: string; value: number };
type BudgetRow = { name: string; spent: number; limit: number };
type AccountCard = { id: string; name: string; kind: string; balance: number };
type MoveCard = { id: string; concept: string; accountName: string; amount: number; direction: "in" | "out"; kind: string; when: string };

const chartColors = ["rgb(var(--expense))", "rgb(var(--primary))", "rgb(var(--accent))", "rgb(var(--savings))"];

function Bar({ ratio, tone }: { ratio: number; tone: string }) {
  const width = Math.max(0, Math.min(100, ratio));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-mist">
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: tone }} />
    </div>
  );
}

function Donut({ slices, center, caption }: { slices: Slice[]; center: string; caption: string }) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const radius = 38;
  const length = 2 * Math.PI * radius;
  let offset = 0;
  const rings = slices.map((slice, index) => {
    const piece = total > 0 ? (slice.value / total) * length : 0;
    const ring = (
      <circle
        key={`${slice.label}-${index}`}
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={chartColors[index % chartColors.length]}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${piece} ${length - piece}`}
        strokeDashoffset={-offset}
      />
    );
    offset += piece;
    return ring;
  });
  return (
    <div className="grid items-center gap-4 md:grid-cols-12">
      <div className="relative mx-auto h-44 w-44 max-w-full md:col-span-5">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgb(var(--soft))" strokeWidth="13" />
          {rings}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[0.65rem] uppercase tracking-wide text-ink/60">{caption}</span>
          <span className={`${display.className} text-xl text-pine`}>{center}</span>
        </div>
      </div>
      <ul className="grid gap-2 md:col-span-7">
        {slices.map((slice, index) => {
          const share = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <li key={`${slice.label}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                <span className="truncate text-sm font-medium">{slice.label}</span>
              </span>
              <span className="shrink-0 text-right text-sm">
                <span className="block font-semibold">{share}%</span>
              </span>
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
  currency,
  name,
  greet,
  monthLabel,
  total,
  monthIncome,
  monthExpense,
  incomeLabel,
  expenseLabel,
  savingsTotal,
  slices,
  accounts,
  movements,
  bands,
  budgets,
  goals,
  partnerName,
  showReminder,
  initialGoalId,
  createNotice,
  addNotice,
}: {
  text: Copy;
  locale: string;
  currency: string;
  name: string;
  greet: string;
  monthLabel: string;
  total: number;
  monthIncome: number;
  monthExpense: number;
  incomeLabel: string;
  expenseLabel: string;
  savingsTotal: number;
  slices: Slice[];
  accounts: AccountCard[];
  movements: MoveCard[];
  bands: Band[];
  budgets: BudgetRow[];
  goals: GoalItem[];
  partnerName: string | null;
  showReminder: boolean;
  query: string;
  initialGoalId: string | null;
  createNotice: string | null;
  addNotice: string | null;
}) {
  const money = (value: number) => formatMoney(value, locale, currency);
  const kept = Math.max(0, monthIncome - monthExpense);
  const saveRate = monthIncome > 0 ? Math.round((kept / monthIncome) * 1000) / 10 : null;
  const expenseShare = monthIncome > 0 ? Math.round((monthExpense / monthIncome) * 1000) / 10 : null;
  const cushion = monthExpense > 0 ? Math.round((savingsTotal / monthExpense) * 10) / 10 : null;
  const placed = slices.reduce((sum, item) => sum + item.value, 0);
  const bandMax = Math.max(...bands.map((item) => item.value), 1);
  const peak = bands.reduce((best, item) => (item.value > best.value ? item : best), bands[0]);
  const incomes = movements.filter((item) => item.kind === "income").slice(0, 3);
  const recent = movements.slice(0, 4);
  const card = "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10 sm:p-5";

  return (
    <section className="grid w-full gap-4 sm:gap-5">
      {showReminder ? <p className="rounded-2xl bg-mist px-4 py-3 text-sm">{text.reminderBanner}</p> : null}
      <div className="flex flex-col gap-4 rounded-2xl bg-mist/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pine">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`${display.className} text-[clamp(1.35rem,4vw,1.75rem)] leading-tight text-pine`}>{greet}, {name}</h1>
              {saveRate !== null && saveRate >= 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[0.7rem] text-pine">
                  <span className="h-1.5 w-1.5 rounded-full bg-pine" />
                  {text.calmBadge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink/70">{text.homeCalm}</p>
            <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[0.7rem] uppercase tracking-wide text-ink/60">
              <span className="font-semibold text-pine">{monthLabel}</span>
              {saveRate !== null ? <span>{text.saveRate}: {saveRate}%</span> : null}
              {cushion !== null ? <span>{text.cushion}: {cushion} {text.monthsWord}</span> : null}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-ink/60">{text.balanceLabel}</p>
              <p className={`${display.className} mt-1 text-[clamp(1.6rem,4vw,2rem)] text-pine`}>{money(total)}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/30 text-expense"><Wallet className="h-4 w-4" aria-hidden /></span>
          </div>
          <div className="mt-4 h-1 rounded-full bg-expense/70" />
        </article>
        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-ink/60">{incomeLabel}</p>
              <p className={`${display.className} mt-1 text-[clamp(1.6rem,4vw,2rem)] text-pine`}>{monthIncome > 0 ? "+" : ""}{money(monthIncome)}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-pine"><ArrowDownLeft className="h-4 w-4" aria-hidden /></span>
          </div>
          <div className="mt-4"><Bar ratio={monthIncome > 0 ? 100 : 0} tone="rgb(var(--primary))" /></div>
        </article>
        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-ink/60">{expenseLabel}</p>
              <p className={`${display.className} mt-1 text-[clamp(1.6rem,4vw,2rem)] text-expense`}>{money(monthExpense)}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-expense"><ShoppingBag className="h-4 w-4" aria-hidden /></span>
          </div>
          <p className="mt-3 text-xs text-ink/60">{expenseShare !== null ? `${expenseShare}% ${text.ofIncome}` : text.thisMonth}</p>
          <div className="mt-2"><Bar ratio={expenseShare ?? 0} tone="rgb(var(--expense))" /></div>
        </article>
        <article className={card}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-ink/60">{text.savingsLabel}</p>
              <p className={`${display.className} mt-1 text-[clamp(1.6rem,4vw,2rem)] text-pine`}>{money(kept || savingsTotal)}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-savings"><PiggyBank className="h-4 w-4" aria-hidden /></span>
          </div>
          <p className="mt-3 text-xs text-ink/60">{kept > 0 ? text.keptMonth : text.thisMonth}</p>
          <div className="mt-2"><Bar ratio={saveRate ?? 0} tone="rgb(var(--primary))" /></div>
        </article>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-8">
          <article className={card}>
            <h2 className={`${display.className} text-xl text-pine`}>{text.distributionTitle}</h2>
            {slices.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.distributionEmpty}</p> : (
              <div className="mt-4">
                <Donut slices={slices} center={money(placed)} caption={text.assigned} />
              </div>
            )}
          </article>

          <article className={card}>
            <h2 className={`${display.className} text-xl text-pine`}>{text.flowTitle}</h2>
            {incomes.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.flowEmpty}</p> : (
              <ul className="mt-4 grid gap-3">
                {incomes.map((item) => (
                  <li key={item.id} className="grid gap-2 rounded-xl bg-paper px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.concept}</span>
                        <span className="text-xs text-ink/60">{item.accountName} · {item.when}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-income">+{money(item.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className={card}>
            <h2 className={`${display.className} text-xl text-pine`}>{text.rhythmTitle}</h2>
            {bands.every((item) => item.value === 0) ? <p className="mt-4 text-sm text-ink/70">{text.noSpend}</p> : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {bands.map((band) => {
                    const hot = band.label === peak.label && band.value > 0;
                    return (
                      <div key={band.label} className={`grid gap-2 rounded-xl p-3 ${hot ? "bg-accent/25" : "bg-paper"}`}>
                        <p className="text-xs text-ink/60">{band.label}</p>
                        <p className="font-semibold">{money(band.value)}</p>
                        <div className="flex h-12 items-end rounded-lg bg-mist p-1">
                          <div className="w-full rounded" style={{ height: `${Math.max(8, (band.value / bandMax) * 100)}%`, background: hot ? "rgb(var(--expense))" : "rgb(var(--primary))" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {peak.value > 0 ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink/70">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-expense" aria-hidden />
                    <span>{text.peakNote} {peak.label.toLowerCase()}.</span>
                  </p>
                ) : null}
              </>
            )}
          </article>

          <article className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={`${display.className} text-xl text-pine`}>{text.budgetHome}</h2>
              <Link href="/budgets" className="inline-flex min-h-11 items-center text-sm text-pine">{text.seeAll}</Link>
            </div>
            {budgets.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.budgetHint}</p> : (
              <ul className="mt-4 grid gap-3">
                {budgets.map((item) => {
                  const ratio = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
                  return (
                    <li key={item.name} className="flex flex-wrap items-center justify-between gap-3">
                      <span className="min-w-0 font-medium">{item.name}</span>
                      <span className="grid min-w-[10rem] flex-1 gap-1 sm:max-w-xs">
                        <Bar ratio={ratio} tone={ratio > 100 ? "rgb(var(--danger))" : "rgb(var(--primary))"} />
                        <span className="text-right text-xs text-ink/60">{money(item.spent)} / {money(item.limit)} · {ratio > 100 ? text.overPlan : text.withinPlan}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          {accounts.length > 0 ? (
            <article className={card}>
              <h2 className={`${display.className} text-xl text-pine`}>{text.accountsFlow}</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {accounts.map((account) => (
                  <li key={account.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{account.name}</span>
                      <span className="text-xs text-ink/60">{account.kind}</span>
                    </span>
                    <span className="shrink-0 font-semibold">{money(account.balance)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>

        <div className="grid content-start gap-4 lg:col-span-4">
          <GoalPanel
            goals={goals}
            text={text}
            locale={locale}
            currency={currency}
            initialId={initialGoalId}
            createNotice={createNotice}
            addNotice={addNotice}
          />

          <article className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className={`${display.className} text-xl text-pine`}>{text.recentTitle}</h2>
              <Link href="/accounts" className="inline-flex min-h-11 items-center text-sm text-ink/60">{text.seeAll}</Link>
            </div>
            {recent.length === 0 ? <p className="mt-4 text-sm text-ink/70">{text.noMoves}</p> : (
              <ul className="mt-4 grid gap-3">
                {recent.map((item) => (
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

          <article className="rounded-2xl bg-mist/80 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-expense" aria-hidden />
              <h2 className="font-semibold text-pine">{partnerName ? text.duoActive : text.duoIdle}</h2>
            </div>
            <p className="mt-3 text-sm text-ink/70">{partnerName ?? text.duoIdleHint}</p>
            <Link href="/duo" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-expense">{text.navDuo}</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
