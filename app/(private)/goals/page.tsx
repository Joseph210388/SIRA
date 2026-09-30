import { FormDialog } from "@/components/form-dialog";
import { GoalForm } from "@/components/goal-form";
import { getSession } from "@/lib/auth/session";
import { loadFinance } from "@/lib/finance/load";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ new?: string; error?: string }> }) {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const params = await searchParams;
  const notice = params.error === "generic" ? text.errorGeneric : params.error ? text.errorDatabase : null;
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-title font-semibold">{text.goalsTitle}</h1>
        <FormDialog label={text.createGoal} title={text.goalsTitle} closeLabel={text.close} openOnLoad={params.new === "1" || Boolean(notice)}>
          {notice ? <p className="text-sm text-danger">{notice}</p> : null}
          <GoalForm text={text} next="/goals" />
        </FormDialog>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.goals.map((goal) => {
          const ratio = goal.target === 0 ? 0 : Math.min(100, Math.round((goal.balance / goal.target) * 100));
          return (
            <li key={goal.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm">{text.progress}: {formatMoney(goal.balance, session.locale, session.currency)} / {formatMoney(goal.target, session.locale, session.currency)}</p>
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
