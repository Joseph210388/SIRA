import { AccountForm } from "@/components/account-form";
import { getSession } from "@/lib/auth/session";
import { loadFinance } from "@/lib/finance/load";
import { categoryName } from "@/lib/i18n";
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
            <p>{formatMoney(account.balance, session.locale, session.currency)}</p>
          </li>
        ))}
      </ul>
      <AccountForm
        text={text}
        next="/accounts"
        accounts={data.accounts.map((item) => ({ id: item.id, name: item.name, kind: item.kind }))}
        incomeOptions={data.categories.filter((item) => item.kind === "income" && item.key && item.key !== "other").map((item) => ({
          key: item.key ?? "",
          label: item.key ? categoryName(item.key, text) : item.name ?? "",
        }))}
      />
    </section>
  );
}
