import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Image src="/logo-mark.png" alt="LifeOS" width={36} height={36} className="h-9 w-9" priority />
          <span className="font-display text-lg font-bold tracking-tight">
            LifeOS
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
