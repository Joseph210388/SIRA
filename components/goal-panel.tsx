"use client";

import { Field } from "@/components/field";
import { FormDialog } from "@/components/form-dialog";
import { Tooltip } from "@/components/tooltip";
import { GoalForm } from "@/components/goal-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToGoalAction } from "@/lib/finance/actions";
import type { Copy } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { ChevronDown, Info, PiggyBank, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type GoalItem = { id: string; name: string; balance: number; target: number };

function Stamps({ filled }: { filled: number }) {
  return (
    <div className="grid grid-cols-5 justify-items-center gap-2">
      {Array.from({ length: 25 }, (_, index) => {
        const on = index < filled;
        return (
          <span
            key={index}
            className={`flex h-9 w-9 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${on ? "bg-mist text-pine" : "bg-white text-ink/30 ring-1 ring-ink/10"}`}
          >
            <PiggyBank className="h-4 w-4" aria-hidden />
          </span>
        );
      })}
    </div>
  );
}

export function GoalPanel({
  goals,
  text,
  locale,
  currency,
  initialId,
  createNotice,
  addNotice,
}: {
  goals: GoalItem[];
  text: Copy;
  locale: string;
  currency: string;
  initialId: string | null;
  createNotice: string | null;
  addNotice: string | null;
}) {
  const money = (value: number) => formatMoney(value, locale, currency);
  const starting = goals.find((item) => item.id === initialId) ?? goals[0];
  const [goalId, setGoalId] = useState(starting?.id ?? "");
  const goal = goals.find((item) => item.id === goalId) ?? starting;
  const ratio = goal && goal.target > 0 ? Math.min(100, (goal.balance / goal.target) * 100) : 0;
  const filled = goal && goal.target > 0 ? Math.round((goal.balance / goal.target) * 25) : 0;
  const left = Math.max(0, 25 - Math.min(25, filled));
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function openCreate() {
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("sira-open-form", { detail: "goal-create" }));
  }

  if (!goal) {
    return (
      <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10 sm:p-5">
        <div className="grid justify-items-center gap-3 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mist text-pine">
            <PiggyBank className="h-7 w-7" aria-hidden />
          </span>
          <p className="text-sm text-ink/70">{text.noGoals}</p>
          <FormDialog label={text.createNewGoal} title={text.goalsTitle} closeLabel={text.close} openOnLoad={Boolean(createNotice)} triggerClassName="w-full bg-mist text-pine hover:bg-mist">
            {createNotice ? <p className="text-sm text-danger">{createNotice}</p> : null}
            <GoalForm text={text} next="/" />
          </FormDialog>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-ink/10 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div ref={menuRef} className="relative min-w-0">
          <button
            type="button"
            className="inline-flex min-h-11 max-w-full items-center gap-1 text-left text-xl text-pine"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="truncate">{goal.name}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {menuOpen ? (
            <div className="absolute left-0 z-20 mt-1 w-[min(18rem,calc(100vw-4rem))] overflow-hidden rounded-2xl bg-white py-1 shadow-[0_12px_40px_rgba(20,39,31,0.12)] ring-1 ring-ink/10" role="menu">
              {goals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className={`block min-h-11 w-full truncate px-3 text-left text-sm ${item.id === goal.id ? "font-medium text-pine" : "text-ink"}`}
                  onClick={() => {
                    setGoalId(item.id);
                    setMenuOpen(false);
                  }}
                >
                  {item.name}
                </button>
              ))}
              <button type="button" role="menuitem" className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-pine" onClick={openCreate}>
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {text.addGoal}
              </button>
            </div>
          ) : null}
        </div>
        <Tooltip content={text.stampTip}>
          <span className="inline-flex shrink-0 items-center justify-center text-ink/45">
            <Info className="h-4 w-4" aria-hidden />
            <span className="sr-only">{text.stampHelp}</span>
          </span>
        </Tooltip>
      </div>
      <p className="mt-1 text-sm text-ink/70">{money(goal.balance)} / {money(goal.target)}</p>
      <div className="mt-3 rounded-2xl bg-paper p-3">
        <Stamps filled={Math.max(0, Math.min(25, filled))} />
      </div>
      <FormDialog label={text.addGoal} title={text.goalsTitle} closeLabel={text.close} hideTrigger signal="goal-create" openOnLoad={Boolean(createNotice)}>
        {createNotice ? <p className="text-sm text-danger">{createNotice}</p> : null}
        <GoalForm text={text} next="/" />
      </FormDialog>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60">
        <span>{left} {text.stampsLeft}</span>
        <span>{Math.round(ratio)}%</span>
      </div>
      <div className="mt-4">
        <FormDialog label={text.contributeThis} title={text.contributeThis} closeLabel={text.close} openOnLoad={Boolean(addNotice)} triggerClassName="w-full bg-mist text-pine hover:bg-mist">
          {addNotice ? <p className="text-sm text-danger">{addNotice}</p> : null}
          <form action={addToGoalAction} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <input type="hidden" name="goalId" value={goal.id} />
            <Field label={text.contributeAmount}><Input name="amount" inputMode="decimal" required /></Field>
            <Button type="submit">{text.contributeThis}</Button>
          </form>
        </FormDialog>
      </div>
    </article>
  );
}
