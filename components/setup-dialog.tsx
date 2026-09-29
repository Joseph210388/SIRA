import { AccountForm } from "@/components/account-form";
import { Button } from "@/components/ui/button";
import { saveCategoriesAction, setThemeAction } from "@/lib/finance/actions";
import { loadFinance } from "@/lib/finance/load";
import { categoryName, type Copy } from "@/lib/i18n";
import type { SetupStep } from "@/lib/setup";
import { themeIds } from "@/lib/theme";

export async function SetupDialog({
  step,
  text,
  userId,
  timeZone,
  error,
}: {
  step: SetupStep;
  text: Copy;
  userId: string;
  timeZone: string;
  error: string | null;
}) {
  const data = await loadFinance(userId, timeZone);
  const title = step === "account" ? text.setupAccount : step === "categories" ? text.setupCategories : text.setupTheme;
  const labels = {
    emerald: text.themeEmerald,
    crimson: text.themeCrimson,
    purple: text.themePurple,
    ocean: text.themeOcean,
    rose: text.themeRose,
  };
  const message = error === "balance" ? text.errorBalance : error === "generic" ? text.errorGeneric : error ? text.errorDatabase : null;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-xl gap-4 overflow-y-auto rounded-[1.75rem] bg-paper p-4 shadow-[0_16px_50px_rgba(8,28,21,0.18)] sm:p-6"
      >
        <h2 id="setup-title" className="text-title font-semibold">
          {title}
        </h2>
        {message ? <p className="text-sm text-danger">{message}</p> : null}
        {step === "account" ? (
          <AccountForm
            text={text}
            next="/"
            accounts={data.accounts.map((item) => ({ id: item.id, name: item.name, kind: item.kind }))}
            incomeOptions={data.categories.filter((item) => item.kind === "income" && item.key && item.key !== "other").map((item) => ({
              key: item.key ?? "",
              label: item.key ? categoryName(item.key, text) : item.name ?? "",
            }))}
          />
        ) : null}
        {step === "categories" ? (
          <form action={saveCategoriesAction} className="grid gap-2 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            {data.categories.filter((item) => item.key).map((item) => (
              <label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="category" value={item.id} className="h-4 w-4" />
                <span>{item.key ? categoryName(item.key, text) : item.name}</span>
                <span className="text-ink/50">{item.kind === "income" ? text.income : text.expense}</span>
              </label>
            ))}
            <Button type="submit">{text.save}</Button>
          </form>
        ) : null}
        {step === "theme" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {themeIds.map((theme) => (
              <form key={theme} action={setThemeAction}>
                <input type="hidden" name="theme" value={theme} />
                <input type="hidden" name="next" value="/" />
                <Button type="submit" className="w-full">{labels[theme]}</Button>
              </form>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
