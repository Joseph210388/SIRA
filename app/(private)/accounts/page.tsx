import { createAccountAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { Field, Notice, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadFinance } from "@/lib/finance/load";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney } from "@/lib/money";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const params = await searchParams;
  return (
    <section className="grid gap-6">
      <h1 className="text-title font-semibold">{text.accountsTitle}</h1>
      {params.error ? <p className="text-sm text-danger">{params.error === "balance" ? text.errorBalance : text.errorDatabase}</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.accounts.map((account) => (
          <li key={account.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <p className="font-medium">{account.name}</p>
            <p className="text-sm text-ink/70">{account.kind === "cash" ? text.kindCash : account.kind === "savings" ? text.kindSavings : text.kindCurrent}</p>
            <p>{formatMoney(account.balance, session.locale)}</p>
          </li>
        ))}
      </ul>
      <form action={createAccountAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <Field label={text.accountName}><Input name="name" required /></Field>
        <Field label={text.account}>
          <Select name="kind" defaultValue="current">
            <option value="current">{text.kindCurrent}</option>
            <option value="savings">{text.kindSavings}</option>
            <option value="cash">{text.kindCash}</option>
          </Select>
        </Field>
        <Field label={text.opening}><Input name="amount" inputMode="decimal" required defaultValue="0" /></Field>
        <fieldset className="grid gap-2 text-sm">
          <legend className="font-medium">{text.kindCash}</legend>
          <label className="flex min-h-11 items-center gap-2"><input type="radio" name="cashOrigin" value="already" defaultChecked />{text.cashAlready}</label>
          <label className="flex min-h-11 items-center gap-2"><input type="radio" name="cashOrigin" value="gift" />{text.cashGift}</label>
          <label className="flex min-h-11 items-center gap-2"><input type="radio" name="cashOrigin" value="withdrawal" />{text.cashFromAccount}</label>
        </fieldset>
        <Field label={text.sourceAccount}>
          <Select name="sourceId" defaultValue={data.accounts[0]?.id ?? ""}>
            {data.accounts.filter((item) => item.kind !== "cash").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>
        <Notice>{text.cashFromAccount}</Notice>
        <Button type="submit">{text.save}</Button>
      </form>
    </section>
  );
}
