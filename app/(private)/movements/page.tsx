import { createMovementAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadFinance } from "@/lib/finance/load";
import { categoryName } from "@/lib/i18n";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney, moneyLocale } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function conceptLabel(concept: string, text: Awaited<ReturnType<typeof appCopy>>) {
  if (concept === "initial") return text.opening;
  if (concept === "gift") return text.cashGift;
  if (concept === "withdrawal") return text.cashFromAccount;
  return concept;
}

export default async function MovementsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const params = await searchParams;
  return (
    <section className="grid gap-6">
      <h1 className="text-title font-semibold">{text.movementsTitle}</h1>
      {params.error ? <p className="text-sm text-danger">{params.error === "balance" ? text.errorBalance : params.error === "concept" ? text.errorConcept : text.errorDatabase}</p> : null}
      <form action={createMovementAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <Field label={text.movementsTitle}>
          <Select name="kind" defaultValue="expense">
            <option value="expense">{text.expense}</option>
            <option value="income">{text.income}</option>
          </Select>
        </Field>
        <Field label={text.account}>
          <Select name="accountId" required>
            {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </Select>
        </Field>
        <Field label={text.category}>
          <Select name="categoryId" required>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.kind === "expense" ? text.expense : text.income} · {category.key ? categoryName(category.key, text) : category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={text.concept} hint={text.conceptHint}><Input name="concept" required /></Field>
        <Field label={text.amount}><Input name="amount" inputMode="decimal" required /></Field>
        <Field label={text.when}><Input name="when" type="datetime-local" required /></Field>
        <Button type="submit">{text.save}</Button>
      </form>
      <ul className="grid gap-2">
        {data.movements.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-ink/10">
            <span className="min-w-0">
              <span className="block truncate font-medium">{conceptLabel(item.concept, text)}</span>
              <span className="text-ink/60">{item.accountName} · {new Intl.DateTimeFormat(moneyLocale(session.locale), { dateStyle: "short", timeStyle: "short" }).format(item.occurredAt)}</span>
            </span>
            <span className={item.direction === "out" ? "text-danger" : "text-pine"}>
              {item.direction === "out" ? "−" : "+"}{formatMoney(item.amount, session.locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
