export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-display text-base font-bold text-white">
            L
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            LifeOS
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
