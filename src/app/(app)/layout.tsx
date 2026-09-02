import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getT } from "@/lib/i18n";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = await getT();

  return (
    <div className="flex min-h-screen">
      <Sidebar t={t.nav} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto w-full min-w-0 max-w-5xl">{children}</div>
      </main>
      <MobileNav t={t} />
    </div>
  );
}
