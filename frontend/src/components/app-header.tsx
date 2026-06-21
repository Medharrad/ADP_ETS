"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Languages,
  LayoutDashboard,
  LogOut,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { clearToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard" as const, icon: LayoutDashboard },
  { href: "/outil", key: "nav.tool" as const, icon: SlidersHorizontal },
  { href: "/settings", key: "nav.settings" as const, icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useI18n();

  function logout() {
    clearToken();
    toast.success("✓");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50">
      {/* gradient accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--c-primary)] via-[var(--c-accent)] to-[var(--c-primary)]" />

      <div className="border-b border-[var(--c-border)] bg-[var(--c-surface)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-accent)] text-base font-bold text-white shadow-md shadow-[var(--c-primary)]/25">
              G
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-tight text-[var(--c-ink)]">
                ADP-RM
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--c-muted)] sm:block">
                ADP 2026
              </span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="mx-auto flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--c-primary)] text-white shadow-sm shadow-[var(--c-primary)]/30"
                      : "text-[var(--c-muted2)] hover:bg-[var(--c-soft)] hover:text-[var(--c-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--c-muted2)] transition hover:border-[var(--c-primary)] hover:text-[var(--c-primary)]"
              aria-label="Changer de langue"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("lang.name")}</span>
            </button>

            <ThemeToggle />

            <span className="h-6 w-px bg-[var(--c-border)]" aria-hidden />

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] transition hover:bg-[var(--c-danger-bg)] hover:text-[var(--c-danger)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
