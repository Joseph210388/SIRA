"use client";

import { createAccountAction } from "@/lib/finance/actions";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Copy } from "@/lib/i18n";
import { useState } from "react";

type Source = { id: string; name: string; kind: string };
type IncomeOption = { key: string; label: string };

export function AccountForm({
  text,
  accounts,
  incomeOptions,
  next,
}: {
  text: Copy;
  accounts: Source[];
  incomeOptions: IncomeOption[];
  next: string;
}) {
  const [family, setFamily] = useState<"bank" | "cash">("bank");
  const [origin, setOrigin] = useState("already");
  const sources = accounts.filter((item) => item.kind !== "cash");
  const canMove = sources.length > 0;

  function changeFamily(value: "bank" | "cash") {
    setFamily(value);
    setOrigin("already");
  }

  const showSource = (family === "bank" && origin === "transfer" && canMove) || (family === "cash" && origin === "withdrawal" && canMove);
  const showIncome = family === "bank" && origin === "income";

  return (
    <form action={createAccountAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <input type="hidden" name="next" value={next} />
      <Field label={text.accountName}><Input name="name" required maxLength={40} /></Field>
      <Field label={text.accountType}>
        <Select name="family" value={family} onChange={(event) => changeFamily(event.target.value === "cash" ? "cash" : "bank")}>
          <option value="bank">{text.kindBank}</option>
          <option value="cash">{text.kindCash}</option>
        </Select>
      </Field>
      {family === "bank" ? (
        <Field label={text.bankKind}>
          <Select name="bankKind" defaultValue="current">
            <option value="current">{text.kindCurrent}</option>
            <option value="savings">{text.kindSavings}</option>
          </Select>
        </Field>
      ) : null}
      <Field label={text.opening}><Input name="amount" inputMode="decimal" required defaultValue="0" /></Field>
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">{text.moneyOrigin}</legend>
        {family === "bank" ? (
          <>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="already" checked={origin === "already"} onChange={() => setOrigin("already")} />{text.bankAlready}</label>
            {canMove ? <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="transfer" checked={origin === "transfer"} onChange={() => setOrigin("transfer")} />{text.bankTransfer}</label> : null}
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="income" checked={origin === "income"} onChange={() => setOrigin("income")} />{text.bankIncome}</label>
          </>
        ) : (
          <>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="already" checked={origin === "already"} onChange={() => setOrigin("already")} />{text.cashAlready}</label>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="gift" checked={origin === "gift"} onChange={() => setOrigin("gift")} />{text.cashGift}</label>
            {canMove ? <label className="flex min-h-11 items-center gap-2"><input type="radio" name="origin" value="withdrawal" checked={origin === "withdrawal"} onChange={() => setOrigin("withdrawal")} />{text.cashFromAccount}</label> : null}
          </>
        )}
      </fieldset>
      {showSource ? (
        <Field label={text.sourceAccount}>
          <Select name="sourceId" defaultValue={sources[0]?.id ?? ""}>
            {sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>
      ) : null}
      {showIncome ? (
        <Field label={text.incomeSource}>
          <Select name="incomeKey" defaultValue={incomeOptions[0]?.key ?? "salary"}>
            {incomeOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </Select>
        </Field>
      ) : null}
      <Button type="submit">{text.save}</Button>
    </form>
  );
}
