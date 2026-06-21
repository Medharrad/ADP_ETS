"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  Eye,
  EyeOff,
  Languages,
  Lock,
  Mail,
  Sparkles,
  Target,
} from "lucide-react";

import { setToken } from "@/lib/auth";
import { login, register } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { DemoWalkthrough } from "@/components/demo-walkthrough";

const FEATURES = [
  { icon: Target, tkey: "auth.feat1" },
  { icon: ClipboardCheck, tkey: "auth.feat2" },
  { icon: CalendarRange, tkey: "auth.feat3" },
] as const;

export function AdpAuth({ initialMode = "sign-in" }: { initialMode?: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === "sign-up";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const fn = isSignUp ? register : login;
      const { token } = await fn(email, password);
      setToken(token);
      toast.success(isSignUp ? t("auth.created") : t("auth.welcome"));
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------- Brand panel ---------------- */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0C1E3C] via-[#15347a] to-[#1E3A8A] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#2563EB]/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#0EA5E9]/20 blur-3xl" />
          <div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-[#93C5FD]/10 blur-2xl" />
        </div>
        <svg
          className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-[#2563EB]"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden
        >
          {[180, 140, 100, 60].map((r, i) => (
            <circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              stroke="currentColor"
              strokeOpacity={0.14 + i * 0.06}
              strokeWidth={i === 0 ? 1 : 1.5}
              strokeDasharray={i % 2 ? "4 10" : undefined}
            />
          ))}
          <path
            d="M200 20 A180 180 0 0 1 380 200"
            stroke="#7DD3FC"
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] text-xl font-bold text-white shadow-lg shadow-[#2563EB]/30">
            G
          </span>
          <div>
            <div className="text-xl font-semibold tracking-wide">ADP-RM</div>
            <div className="text-[0.7rem] uppercase tracking-[0.2em] text-[#93C5FD]/90">
              ADP 2026 · RM6
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2563EB]/50 bg-white/5 px-3 py-1 text-xs font-medium text-[#93C5FD] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {t("auth.badge")}
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-[2.7rem]">
            {t("auth.headlineLead")}{" "}
            <span className="bg-gradient-to-r from-[#93C5FD] to-[#7DD3FC] bg-clip-text text-transparent">
              {t("auth.headlineAccent")}
            </span>
            .
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{t("auth.tagline")}</p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, tkey }) => (
              <li key={tkey} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-[#93C5FD] ring-1 ring-[#2563EB]/30">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm text-white/85">{t(tkey)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#93C5FD]/60">CRMEF Inezgane · BOUARGANE</p>
      </aside>

      {/* ---------------- Form panel ---------------- */}
      <section className="relative flex items-center justify-center overflow-hidden bg-[#F8FAFC] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[#0EA5E9]/10 blur-3xl" />

        <div className="relative w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:invisible">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0EA5E9] font-bold text-white">
                G
              </span>
              <span className="text-lg font-semibold text-[#0C1E3C]">ADP-RM</span>
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#64748B] backdrop-blur transition hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              <Languages className="h-3.5 w-3.5" />
              {t("lang.name")}
            </button>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-[0_24px_70px_-20px_rgba(37,99,235,0.30)] backdrop-blur-xl sm:p-9">
            <h2 className="text-2xl font-semibold text-[#0C1E3C]">
              {isSignUp ? t("auth.signup") : t("auth.signin")}
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {isSignUp ? t("auth.signupSub") : t("auth.signinSub")}
            </p>

            {/* segmented toggle */}
            <div className="relative mt-6 grid grid-cols-2 rounded-2xl bg-[#E2E8F0] p-1 text-sm font-semibold">
              <span
                className="absolute inset-y-1 rounded-xl bg-white shadow-sm transition-all duration-300 ease-out"
                style={{
                  insetInlineStart: isSignUp ? "50%" : "0.25rem",
                  insetInlineEnd: isSignUp ? "0.25rem" : "50%",
                }}
              />
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={`relative z-10 rounded-xl py-2 transition-colors ${
                  !isSignUp ? "text-[#0C1E3C]" : "text-[#64748B]"
                }`}
              >
                {t("auth.signin")}
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={`relative z-10 rounded-xl py-2 transition-colors ${
                  isSignUp ? "text-[#0C1E3C]" : "text-[#64748B]"
                }`}
              >
                {t("auth.signup")}
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#64748B]">
                  {t("auth.email")}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#2563EB]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 ps-10 pe-3 text-sm text-[#0C1E3C] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#64748B]">
                  {t("auth.password")}
                </label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#2563EB]" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? t("auth.passwordHint") : "••••••••"}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 ps-10 pe-10 text-sm text-[#0C1E3C] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[#64748B] transition hover:text-[#0C1E3C]"
                    aria-label={showPass ? t("auth.hide") : t("auth.show")}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:shadow-xl hover:shadow-[#2563EB]/30 hover:brightness-105 disabled:opacity-50"
              >
                {busy
                  ? t("auth.wait")
                  : isSignUp
                    ? t("auth.submitSignup")
                    : t("auth.submitSignin")}
                {!busy && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-[#64748B]">
            {isSignUp ? t("auth.haveAccount") + " " : t("auth.noAccount") + " "}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
              className="font-semibold text-[#2563EB] hover:underline"
            >
              {isSignUp ? t("auth.signin") : t("auth.signup")}
            </button>
          </p>

          {/* Démo guidée — accessible avant connexion */}
          <div className="mt-4">
            <DemoWalkthrough />
          </div>
        </div>
      </section>
    </main>
  );
}
