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
      <div className="h-0.5 w-full bg-gradient-to-r from-[#2563EB] via-[#0EA5E9] to-[#2563EB]" />

      <div className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-base font-bold text-white shadow-md shadow-[#2563EB]/25">
              G
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold tracking-tight text-[#0C1E3C]">
                ADP-RM
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#64748B] sm:block">
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
                      ? "bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30"
                      : "text-[#475569] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              aria-label="Changer de langue"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("lang.name")}</span>
            </button>

            <span className="h-6 w-px bg-[#E2E8F0]" aria-hidden />

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#64748B] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
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
