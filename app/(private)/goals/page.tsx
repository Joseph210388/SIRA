import { saveGoalAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadFinance } from "@/lib/finance/load";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const savings = data.accounts.filter((item) => item.kind === "savings");
  return (
    <section className="grid gap-6">
      <h1 className="text-title font-semibold">{text.goalsTitle}</h1>
      <form action={saveGoalAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <Field label={text.goalName}><Input name="name" required /></Field>
        <Field label={text.kindSavings}>
          <Select name="accountId">
            {savings.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </Select>
        </Field>
        <Field label={text.goalTarget}><Input name="amount" inputMode="decimal" required /></Field>
        <Field label={text.goalDate}><Input name="targetDate" type="date" /></Field>
        <Button type="submit">{text.save}</Button>
      </form>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.goals.map((goal) => {
          const ratio = goal.target === 0 ? 0 : Math.min(100, Math.round((goal.balance / goal.target) * 100));
          return (
            <li key={goal.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm">{text.progress}: {formatMoney(goal.balance, session.locale)} / {formatMoney(goal.target, session.locale)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
                <div style={{ width: `${ratio}%`, height: "100%", background: "rgb(var(--primary))" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
