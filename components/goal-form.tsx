import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveGoalAction } from "@/lib/finance/actions";
import type { Copy } from "@/lib/i18n";

export function GoalForm({ text, next }: { text: Copy; next: "/" | "/goals" }) {
  return (
    <form action={saveGoalAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <input type="hidden" name="next" value={next} />
      <Field label={text.goalName}><Input name="name" required /></Field>
      <Field label={text.goalTarget}><Input name="amount" inputMode="decimal" required /></Field>
      <Field label={text.goalStart} hint={text.goalStartHint}><Input name="saved" inputMode="decimal" placeholder="0" /></Field>
      <Field label={text.goalDate}><Input name="targetDate" type="date" /></Field>
      <Button type="submit">{text.save}</Button>
    </form>
  );
}
