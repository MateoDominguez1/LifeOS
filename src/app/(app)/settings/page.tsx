import { auth } from "@/lib/auth/auth";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getT } from "@/lib/i18n";
import { logoutAction } from "./actions";

export default async function SettingsPage() {
  const [session, { locale, t }] = await Promise.all([auth(), getT()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">{t.settings.title}</h1>

      <Card>
        <CardLabel>{t.settings.account}</CardLabel>
        <div className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-ink">{session?.user?.name || "—"}</span>
          <span className="text-ink-soft">{session?.user?.email}</span>
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <CardLabel>{t.settings.theme}</CardLabel>
          <p className="mt-1 text-sm text-ink-soft">{t.settings.themeDescription}</p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <CardLabel>{t.settings.language}</CardLabel>
          <p className="mt-1 text-sm text-ink-soft">{t.settings.languageDescription}</p>
        </div>
        <LanguageSwitcher current={locale} />
      </Card>

      <Card>
        <CardLabel>{t.settings.session}</CardLabel>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="secondary">
            {t.nav.logout}
          </Button>
        </form>
      </Card>
    </div>
  );
}
