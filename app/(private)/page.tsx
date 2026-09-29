import { HomeDashboard } from "@/components/home-dashboard";
import { Landing } from "@/components/landing";
import { getSession } from "@/lib/auth/session";
import { loadFinance } from "@/lib/finance/load";
import { categoryName, copy } from "@/lib/i18n";
import { appCopy } from "@/lib/i18n-db";
import { moneyLocale } from "@/lib/money";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function hourIn(timeZone: string) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getSession();
  if (!session) {
    const jar = await cookies();
    return <Landing text={copy(jar.get("sira_locale")?.value ?? "es")} />;
  }
  if (!session.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const hour = hourIn(session.timezone);
  const greet = hour < 12 ? text.greetMorning : hour < 20 ? text.greetAfternoon : text.greetEvening;
  const kindLabel = (kind: string) => kind === "cash" ? text.kindCash : kind === "savings" ? text.kindSavings : text.kindCurrent;
  const spendSlices = data.byCategory
    .filter((item) => item.total > 0)
    .map((item) => ({ label: categoryName(item.key, text), value: item.total }));
  const accountSlices = data.accounts
    .filter((item) => item.balance > 0)
    .map((item) => ({ label: item.name, value: item.balance }));
  const slices = spendSlices.length > 0 ? spendSlices : accountSlices;
  const monthLabel = new Intl.DateTimeFormat(moneyLocale(session.locale), { month: "long", year: "numeric", timeZone: session.timezone }).format(new Date());
  const when = new Intl.DateTimeFormat(moneyLocale(session.locale), { dateStyle: "short", timeStyle: "short", timeZone: session.timezone });
  const movements = data.movements
    .filter((item) => !query || `${item.concept} ${item.accountName}`.toLowerCase().includes(query))
    .map((item) => ({
      id: item.id,
      concept: item.concept,
      accountName: item.accountName,
      amount: item.amount,
      direction: item.direction,
      kind: item.kind,
      when: when.format(item.occurredAt),
    }));
  const sums = [0, 0, 0, 0];
  for (const item of data.byHour) {
    const hourValue = Number(item.hour);
    const slot = hourValue < 6 ? 0 : hourValue < 12 ? 1 : hourValue < 18 ? 2 : 3;
    sums[slot] += item.total;
  }
  const bands = [
    { label: text.bandDawn, value: sums[0] },
    { label: text.bandMorning, value: sums[1] },
    { label: text.bandAfternoon, value: sums[2] },
    { label: text.bandNight, value: sums[3] },
  ];
  const budgets = data.budgets.map((item) => {
    const category = data.categories.find((row) => row.id === item.categoryId);
    const spent = data.spentByCategory.find((row) => row.categoryId === item.categoryId)?.total ?? 0;
    const name = category?.key ? categoryName(category.key, text) : category?.name || text.cat_other;
    return { name, spent, limit: item.limit };
  });
  const firstGoal = data.goals[0];
  return (
      <HomeDashboard
        currency={session.currency}
      text={text}
      locale={session.locale}
      name={session.displayName}
      greet={greet}
      monthLabel={monthLabel}
      total={data.total}
      monthIncome={data.monthIncome}
      monthExpense={data.monthExpense}
      savingsTotal={data.savingsTotal}
      slices={slices}
      accounts={data.accounts.map((item) => ({ id: item.id, name: item.name, kind: kindLabel(item.kind), balance: item.balance }))}
      movements={movements}
      bands={bands}
      budgets={budgets}
      goal={firstGoal ? { name: firstGoal.name, balance: firstGoal.balance, target: firstGoal.target } : null}
      partnerName={data.partnerName}
      showReminder={data.showReminder}
      query={query}
    />
  );
}
