"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/actions/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/militares", label: "Militares" },
  { href: "/escalas", label: "Escalas" },
  { href: "/calendario", label: "Calendário" },
  { href: "/solicitacoes", label: "Solicitações" },
];

export function AppShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-military-gray">
      {/* Sidebar - desktop */}
      <aside className="hidden w-56 flex-col bg-military-dark text-white md:flex">
        <SidebarContent pathname={pathname} onNavigate={() => {}} userRole={userRole} />
      </aside>

      {/* Sidebar - mobile (overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-56 flex-col bg-military-dark text-white">
            <SidebarContent pathname={pathname} onNavigate={() => setMenuOpen(false)} userRole={userRole} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="text-military-green-dark md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <h1 className="text-base font-semibold text-military-green-dark md:text-lg">
              Tiro de Guerra
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="hidden sm:inline">
              {userName} · {userRole === "ADMIN" ? "Administrador" : "Usuário"}
            </span>
            <form action={logout}>
              <button type="submit" className="font-medium text-military-green-mid hover:underline">
                Sair
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  userRole,
}: {
  pathname: string;
  userRole: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="px-6 py-5 text-xl font-bold tracking-wide text-military-green-light">TG</div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.filter(link => userRole !== "ADMIN").map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-military-green-mid text-white"
                  : "text-gray-300 hover:bg-military-green-dark hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
