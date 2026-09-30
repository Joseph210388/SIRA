import { FormDialog } from "@/components/form-dialog";
import { saveBudgetAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadFinance } from "@/lib/finance/load";
import { categoryName } from "@/lib/i18n";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const expenseCategories = data.categories.filter((item) => item.kind === "expense");
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-title font-semibold">{text.budgetsTitle}</h1>
        <FormDialog label={text.newBudget} title={text.budgetsTitle} closeLabel={text.close}>
          <p className="text-sm text-ink/70">{text.budgetHint}</p>
          <form action={saveBudgetAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <Field label={text.category}>
          <Select name="categoryId">
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.key ? categoryName(category.key, text) : category.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={text.limit}><Input name="amount" inputMode="decimal" required /></Field>
        <Button type="submit">{text.save}</Button>
          </form>
        </FormDialog>
      </div>
      <ul className="grid gap-3">
        {data.budgets.map((budget) => {
          const category = expenseCategories.find((item) => item.id === budget.categoryId);
          const spent = data.spentByCategory.find((item) => item.categoryId === budget.categoryId)?.total ?? 0;
          const ratio = budget.limit === 0 ? 0 : Math.min(100, Math.round((spent / budget.limit) * 100));
          return (
            <li key={budget.categoryId} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <p className="font-medium">{category?.key ? categoryName(category.key, text) : category?.name}</p>
              <p className="text-sm">{text.spent}: {formatMoney(spent, session.locale, session.currency)} / {text.limit}: {formatMoney(budget.limit, session.locale, session.currency)}</p>
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
