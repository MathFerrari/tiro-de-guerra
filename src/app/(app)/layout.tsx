import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <AppShell userName={session.name} userRole={session.role}>
      {children}
    </AppShell>
  );
}
