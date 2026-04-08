import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/producers");

  return (
    <div className="min-h-screen bg-butter">
      <nav className="bg-white border-b border-card-border/40 px-6 py-3 flex items-center gap-6">
        <Link href="/" className="text-[14px] font-bold text-cherry" style={{ fontFamily: "Georgia, serif" }}>
          Winebob
        </Link>
        <span className="text-[10px] font-bold text-white bg-cherry/80 px-2 py-0.5 rounded-[4px] uppercase tracking-wider">Admin</span>
        <div className="flex items-center gap-4 ml-4">
          <Link href="/admin/producers" className="text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors">Producers</Link>
          <Link href="/admin/experiences" className="text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors">Experiences</Link>
        </div>
        <div className="ml-auto text-[11px] text-muted">{session.user.email}</div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
