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
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--c-ink)] via-[var(--c-primary2)] to-[var(--c-primary-ink)] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[var(--c-primary)]/30 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[var(--c-accent)]/20 blur-3xl" />
          <div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-[var(--c-accent-light)]/10 blur-2xl" />
        </div>
        <svg
          className="pointer-events-none absolute -right-24 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 text-[var(--c-primary)]"
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
            stroke="var(--c-accent2)"
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-accent)] text-xl font-bold text-white shadow-lg shadow-[var(--c-primary)]/30">
            G
          </span>
          <div>
            <div className="text-xl font-semibold tracking-wide">ADP-RM</div>
            <div className="text-[0.7rem] uppercase tracking-[0.2em] text-[var(--c-accent-light)]/90">
              ADP 2026 · RM6
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-primary)]/50 bg-[var(--c-surface)]/5 px-3 py-1 text-xs font-medium text-[var(--c-accent-light)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {t("auth.badge")}
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight xl:text-[2.7rem]">
            {t("auth.headlineLead")}{" "}
            <span className="bg-gradient-to-r from-[var(--c-accent-light)] to-[var(--c-accent2)] bg-clip-text text-transparent">
              {t("auth.headlineAccent")}
            </span>
            .
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{t("auth.tagline")}</p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, tkey }) => (
              <li key={tkey} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--c-surface)]/5 text-[var(--c-accent-light)] ring-1 ring-[var(--c-primary)]/30">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm text-white/85">{t(tkey)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[var(--c-accent-light)]/60">CRMEF Inezgane · BOUARGANE</p>
      </aside>

      {/* ---------------- Form panel ---------------- */}
      <section className="relative flex items-center justify-center overflow-hidden bg-[var(--c-bg)] p-5 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--c-primary)]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[var(--c-accent)]/10 blur-3xl" />

        <div className="relative w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:invisible">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-accent)] font-bold text-white">
                G
              </span>
              <span className="text-lg font-semibold text-[var(--c-ink)]">ADP-RM</span>
            </div>
            <button
              type="button"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] backdrop-blur transition hover:border-[var(--c-primary)] hover:text-[var(--c-primary)]"
            >
              <Languages className="h-3.5 w-3.5" />
              {t("lang.name")}
            </button>
          </div>

          <div className="rounded-3xl border border-white/70 bg-[var(--c-surface)]/80 p-7 shadow-[0_24px_70px_-20px_rgba(37,99,235,0.30)] backdrop-blur-xl sm:p-9">
            <h2 className="text-2xl font-semibold text-[var(--c-ink)]">
              {isSignUp ? t("auth.signup") : t("auth.signin")}
            </h2>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              {isSignUp ? t("auth.signupSub") : t("auth.signinSub")}
            </p>

            {/* segmented toggle */}
            <div className="relative mt-6 grid grid-cols-2 rounded-2xl bg-[var(--c-border)] p-1 text-sm font-semibold">
              <span
                className="absolute inset-y-1 rounded-xl bg-[var(--c-surface)] shadow-sm transition-all duration-300 ease-out"
                style={{
                  insetInlineStart: isSignUp ? "50%" : "0.25rem",
                  insetInlineEnd: isSignUp ? "0.25rem" : "50%",
                }}
              />
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className={`relative z-10 rounded-xl py-2 transition-colors ${
                  !isSignUp ? "text-[var(--c-ink)]" : "text-[var(--c-muted)]"
                }`}
              >
                {t("auth.signin")}
              </button>
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className={`relative z-10 rounded-xl py-2 transition-colors ${
                  isSignUp ? "text-[var(--c-ink)]" : "text-[var(--c-muted)]"
                }`}
              >
                {t("auth.signup")}
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--c-muted)]">
                  {t("auth.email")}
                </label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-muted)] transition-colors group-focus-within:text-[var(--c-primary)]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] py-2.5 ps-10 pe-3 text-sm text-[var(--c-ink)] outline-none transition focus:border-[var(--c-primary)] focus:ring-4 focus:ring-[var(--c-primary)]/15"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--c-muted)]">
                  {t("auth.password")}
                </label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-muted)] transition-colors group-focus-within:text-[var(--c-primary)]" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? t("auth.passwordHint") : "••••••••"}
                    className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] py-2.5 ps-10 pe-10 text-sm text-[var(--c-ink)] outline-none transition focus:border-[var(--c-primary)] focus:ring-4 focus:ring-[var(--c-primary)]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] transition hover:text-[var(--c-ink)]"
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
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] py-3 text-sm font-bold text-white shadow-lg shadow-[var(--c-primary)]/25 transition hover:shadow-xl hover:shadow-[var(--c-primary)]/30 hover:brightness-105 disabled:opacity-50"
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

          <p className="mt-5 text-center text-xs text-[var(--c-muted)]">
            {isSignUp ? t("auth.haveAccount") + " " : t("auth.noAccount") + " "}
            <button
              type="button"
              onClick={() => setMode(isSignUp ? "sign-in" : "sign-up")}
              className="font-semibold text-[var(--c-primary)] hover:underline"
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
