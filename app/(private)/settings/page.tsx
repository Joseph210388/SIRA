import { saveSettingsAction, setCurrencyAction, setThemeAction } from "@/lib/finance/actions";
import { getSession } from "@/lib/auth/session";
import { Field, Select } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timezones } from "@/lib/countries";
import { loadFinance } from "@/lib/finance/load";
import { appCopy } from "@/lib/i18n-db";
import { isTheme, themeIds } from "@/lib/theme";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.mfa) redirect("/login");
  const text = await appCopy(session.locale);
  const data = await loadFinance(session.userId, session.timezone);
  const current = isTheme(session.theme) ? session.theme : "emerald";
  const labels = {
    emerald: text.themeEmerald,
    crimson: text.themeCrimson,
    purple: text.themePurple,
    ocean: text.themeOcean,
    rose: text.themeRose,
  };
  return (
    <section className="grid w-full max-w-3xl gap-6">
      <h1 className="text-title font-semibold">{text.settingsTitle}</h1>
      <div className="grid gap-3">
        <h2 className="text-base font-semibold">{text.themeTitle}</h2>
        <p className="text-sm text-ink/70">{text.themeHint}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {themeIds.map((theme) => (
            <form key={theme} action={setThemeAction}>
              <input type="hidden" name="theme" value={theme} />
              <button
                type="submit"
                aria-pressed={current === theme}
                className={`grid min-h-11 w-full gap-3 rounded-3xl bg-white p-4 text-left ${current === theme ? "ring-2 ring-pine" : "ring-1 ring-ink/10"}`}
              >
                <span className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <span key={index} className={`theme-swatch swatch-${theme}-${index}`} />
                  ))}
                </span>
                <span className="text-sm font-medium">{labels[theme]}</span>
              </button>
            </form>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <h2 className="text-base font-semibold">{text.currencyTitle}</h2>
        <p className="text-sm text-ink/70">{text.currencyHint}</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {([["EUR", "Euro"], ["USD", "Dólar"], ["GBP", "Libra"], ["PEN", "Sol"]] as const).map(([code, label]) => (
            <form key={code} action={setCurrencyAction}>
              <input type="hidden" name="currency" value={code} />
              <Button type="submit" className={`w-full ${session.currency === code ? "ring-2 ring-pine" : ""}`}>{label} · {code}</Button>
            </form>
          ))}
        </div>
      </div>
      <form action={saveSettingsAction} className="grid max-w-lg gap-3">
        <Field label={text.timezone}>
          <Select name="timezone" defaultValue={session.timezone}>
            {timezones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </Select>
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input name="reminder" type="checkbox" defaultChecked={data.reminder.enabled} className="h-4 w-4" />
          {text.reminder}
        </label>
        <Field label={text.reminderTime}>
          <Input name="localTime" type="time" defaultValue={data.reminder.localTime} required />
        </Field>
        <Button type="submit">{text.save}</Button>
      </form>
    </section>
  );
}
