import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMovementAction } from "@/lib/finance/actions";
import { categoryName, type Copy } from "@/lib/i18n";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; kind: string; key: string | null; name: string | null };

export function MovementForm({
  text,
  accounts,
  categories,
}: {
  text: Copy;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  return (
    <form action={createMovementAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <Field label={text.movementsTitle}>
        <Select name="kind" defaultValue="expense">
          <option value="expense">{text.expense}</option>
          <option value="income">{text.income}</option>
        </Select>
      </Field>
      <Field label={text.account}>
        <Select name="accountId" required>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </Select>
      </Field>
      <Field label={text.category}>
        <Select name="categoryId" required>
          {categories.map((category) => (
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
  );
}
