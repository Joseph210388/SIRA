import { AccountForm } from "@/components/account-form";
import { DataTable } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { MovementForm } from "@/components/movement-form";
import { getSession } from "@/lib/auth/session";
import { loadLedger, parsePageSize } from "@/lib/finance/load";
import { categoryName, type Copy } from "@/lib/i18n";
import { appCopy } from "@/lib/i18n-db";
import { formatMoney, moneyLocale } from "@/lib/money";
import { parsePeriod } from "@/lib/period";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function conceptLabel(concept: string, text: Copy) {
  if (concept === "initial") return text.opening;
  if (concept === "gift") return text.cashGift;
  if (concept === "withdrawal") return text.cashFromAccount;
  return concept;
}

function movementError(code: string | undefined, text: Copy) {
  if (!code) return null;
  if (code === "balance") return text.errorBalance;
  if (code === "concept") return text.errorConcept;
  if (code === "generic") return text.errorGeneric;
  return text.errorDatabase;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; new?: string; form?: string; page?: string; size?: string; from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const params = await searchParams;
  const pageSize = parsePageSize(params.size);
  const requested = Number(params.page);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const period = parsePeriod(params.from, params.to, session.timezone);
  const data = await loadLedger(session.userId, page, pageSize, period, session.timezone);
  if (data.page !== page) {
    const query = new URLSearchParams({ page: String(data.page), size: String(pageSize) });
    if (!period.wholeMonth) {
      query.set("from", period.from);
      query.set("to", period.to);
    }
    redirect(`/accounts?${query}`);
  }
  const rangeQuery: Record<string, string> = period.wholeMonth ? {} : { from: period.from, to: period.to };
  const movementNotice = params.form === "movement" ? movementError(params.error, text) : null;
  const accountNotice = params.error && params.form !== "movement"
    ? (params.error === "balance" ? text.errorBalance : text.errorDatabase)
    : null;
  const when = new Intl.DateTimeFormat(moneyLocale(session.locale), { dateStyle: "short", timeStyle: "short" });
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-title font-semibold">{text.accountsTitle}</h1>
        <div className="grid gap-2 min-[480px]:grid-cols-2 lg:flex">
          <FormDialog label={text.newAccount} title={text.accountsTitle} closeLabel={text.close} openOnLoad={Boolean(accountNotice)}>
            {accountNotice ? <p className="text-sm text-danger">{accountNotice}</p> : null}
            <AccountForm
              text={text}
              next="/accounts"
              accounts={data.accounts.map((item) => ({ id: item.id, name: item.name, kind: item.kind }))}
              incomeOptions={data.categories.filter((item) => item.kind === "income" && item.key && item.key !== "other").map((item) => ({
                key: item.key ?? "",
                label: item.key ? categoryName(item.key, text) : item.name ?? "",
              }))}
            />
          </FormDialog>
          <FormDialog
            label={text.newMovement}
            title={text.newMovement}
            closeLabel={text.close}
            openOnLoad={params.new === "1" || Boolean(movementNotice)}
            signal="movement"
          >
            {movementNotice ? <p className="text-sm text-danger">{movementNotice}</p> : null}
            <MovementForm text={text} accounts={data.accounts} categories={data.categories} />
          </FormDialog>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.accounts.map((account) => (
          <li key={account.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <p className="font-medium">{account.name}</p>
            <p className="text-sm text-ink/70">{account.kind === "cash" ? text.kindCash : account.kind === "savings" ? text.kindSavings : text.kindCurrent}</p>
            <p>{formatMoney(account.balance, session.locale, session.currency)}</p>
          </li>
        ))}
      </ul>
      <h2 className="text-lg font-semibold">{text.movementsTitle}</h2>
      <DataTable
        headers={[text.when, text.concept, text.account, text.amount]}
        rows={data.movements.map((item) => ({
          id: item.id,
          cells: [
            when.format(item.occurredAt),
            conceptLabel(item.concept, text),
            item.accountName,
            <span key={item.id} className={item.direction === "out" ? "text-danger" : "text-pine"}>
              {item.direction === "out" ? "−" : "+"}{formatMoney(item.amount, session.locale, session.currency)}
            </span>,
          ],
        }))}
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        path="/accounts"
        keep={rangeQuery}
        empty={text.noMoves}
        perPage={text.perPage}
        previous={text.previousPage}
        next={text.nextPage}
      />
    </section>
  );
}
