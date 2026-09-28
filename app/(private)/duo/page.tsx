import { acceptInviteAction, toggleShareAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { InviteButton } from "@/components/invite-button";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadFinance } from "@/lib/finance/load";
import { appCopy } from "@/lib/i18n-db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DuoPage() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  return (
    <section className="grid gap-6">
      <h1 className="text-title font-semibold">{text.duoTitle}</h1>
      <p className="text-sm text-ink/80">{text.duoHint}</p>
      {data.partnerName ? <p className="rounded-xl bg-mist px-3 py-2 text-sm">{data.partnerName}</p> : null}
      {!data.hasSpace ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <InviteButton label={text.createCode} once={text.inviteOnce} />
          <form action={acceptInviteAction} className="grid gap-3">
            <Field label={text.code}><Input name="code" required autoCapitalize="characters" /></Field>
            <Button type="submit">{text.acceptCode}</Button>
          </form>
        </div>
      ) : (
        <ul className="grid gap-3">
          {data.accounts.map((account) => (
            <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <span>{account.name}{account.shared ? ` · ${text.shared}` : ""}</span>
              <form action={toggleShareAction}>
                <input type="hidden" name="accountId" value={account.id} />
                {account.shared ? <input type="hidden" name="shared" value="yes" /> : null}
                <Button type="submit" variant="ghost">{account.shared ? text.stopShare : text.share}</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
