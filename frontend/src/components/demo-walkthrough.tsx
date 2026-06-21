"use client";

// =============================================================================
// DemoWalkthrough — visite guidée « Comment utiliser l'application ».
// Chaque étape reconstruit l'écran réel (thème clair/sombre) dans un cadre
// navigateur, avec un halo + un numéro ancré sur chaque bouton, et un panneau
// qui explique chaque action. Bilingue FR / AR (suit le sélecteur de langue).
// =============================================================================

import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  PlayCircle,
  Printer,
  Target,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";

import { useI18n, type Lang } from "@/lib/i18n";

// -- localisation helper ------------------------------------------------------
type L = { fr: string; ar: string };
const tx = (v: L, lang: Lang) => (lang === "ar" ? v.ar : v.fr);

interface Callout {
  n: number;
  fr: string;
  ar: string;
}

interface Step {
  icon: LucideIcon;
  title: L;
  callouts: Callout[];
  /** mock de l'écran réel ; reçoit la langue pour les libellés internes */
  screen: (lang: Lang) => ReactNode;
}

// -- small building blocks for the mock screens -------------------------------

/** Wraps a target with a pulsing highlight ring + a numbered badge. */
function Spot({
  n,
  children,
  className = "",
}: {
  n: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex ${className}`}>
      {children}
      <span className="pointer-events-none absolute -inset-1.5 rounded-xl ring-2 ring-[var(--c-primary)] animate-pulse" />
      <span className="pointer-events-none absolute -end-2 -top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-[var(--c-primary)] text-[10px] font-bold text-white shadow ring-2 ring-[var(--c-surface)]">
        {n}
      </span>
    </div>
  );
}

/** Faux browser chrome so the mock reads as a real screen. */
function Frame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-bg)] shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-[var(--c-border)] bg-[var(--c-border2)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ms-2 truncate rounded-md bg-[var(--c-surface)] px-2 py-0.5 text-[10px] text-[var(--c-muted)]">
          {url}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Reproduces the app top navigation. */
function AppBar({ lang }: { lang: Lang }) {
  return (
    <div className="mb-4 flex items-center gap-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-xs">
      <span className="font-bold text-[var(--c-primary)]">ADP-RM</span>
      <span className="text-[var(--c-muted)]">{tx({ fr: "Tableau de bord", ar: "لوحة القيادة" }, lang)}</span>
      <span className="hidden text-[var(--c-muted)] sm:inline">{tx({ fr: "Outil libre", ar: "أداة حرة" }, lang)}</span>
      <span className="ms-auto h-6 w-6 rounded-full bg-gradient-to-br from-[var(--c-primary)] to-[var(--c-accent)]" />
    </div>
  );
}

/** Reproduces the redesigned wizard header band (navy + eyebrow). */
function WizardBand({ lang }: { lang: Lang }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-[var(--c-ink)] px-4 py-3">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--c-accent-light)]">
        ADP 2026 · EPS
      </span>
      <div className="text-sm font-semibold text-white">
        {tx({ fr: "Outil d'aide à la décision pédagogique", ar: "أداة دعم القرار البيداغوجي" }, lang)}
      </div>
    </div>
  );
}

const btn =
  "rounded-lg bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] px-3 py-1.5 text-xs font-bold text-white";
const btnGreen =
  "rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-3 py-1.5 text-xs font-bold text-white";
const btnOutline =
  "rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--c-muted2)]";
const card = "rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-3 shadow-sm";

// -- the 8 steps --------------------------------------------------------------

const STEPS: Step[] = [
  {
    icon: UserPlus,
    title: { fr: "Créez votre compte", ar: "أنشئ حسابك" },
    callouts: [
      {
        n: 1,
        fr: "Onglet « Créer un compte » : saisissez votre e-mail et un mot de passe (6 caractères min.).",
        ar: "تبويب « إنشاء حساب »: أدخل بريدك الإلكتروني وكلمة مرور (٦ أحرف على الأقل).",
      },
      {
        n: 2,
        fr: "Cliquez « Créer le compte ». Déjà inscrit·e ? Restez sur « Connexion ».",
        ar: "اضغط « إنشاء الحساب ». لديك حساب؟ ابقَ على « تسجيل الدخول ».",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/login">
        <div className="mx-auto max-w-xs">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-[var(--c-border2)] p-1 text-center text-xs font-semibold">
            <span className="rounded-md py-1 text-[var(--c-muted)]">
              {tx({ fr: "Connexion", ar: "تسجيل الدخول" }, lang)}
            </span>
            <Spot n={1} className="w-full">
              <span className="block w-full rounded-md bg-[var(--c-surface)] py-1 text-[var(--c-primary)] shadow-sm">
                {tx({ fr: "Créer un compte", ar: "إنشاء حساب" }, lang)}
              </span>
            </Spot>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs text-[var(--c-faint)]">
              email@exemple.ma
            </div>
            <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-xs text-[var(--c-faint)]">
              ••••••••
            </div>
            <Spot n={2} className="w-full">
              <span className={`block w-full text-center ${btn}`}>
                {tx({ fr: "Créer le compte", ar: "إنشاء الحساب" }, lang)}
              </span>
            </Spot>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    icon: GraduationCap,
    title: { fr: "Ajoutez une classe", ar: "أضف قسماً" },
    callouts: [
      {
        n: 1,
        fr: "« Nouvelle classe » : donnez un nom et un niveau.",
        ar: "« قسم جديد »: أدخل الاسم والمستوى.",
      },
      {
        n: 2,
        fr: "Pressé·e ? « Charger une classe de démonstration » crée un exemple complet.",
        ar: "في عجلة؟ « تحميل قسم تجريبي » ينشئ مثالاً كاملاً.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/dashboard">
        <AppBar lang={lang} />
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--c-ink)]">
            {tx({ fr: "Mes classes", ar: "أقسامي" }, lang)}
          </span>
          <Spot n={1}>
            <span className={btn}>+ {tx({ fr: "Nouvelle classe", ar: "قسم جديد" }, lang)}</span>
          </Spot>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className={card}>
            <div className="text-xs font-bold text-[var(--c-ink)]">3ème B</div>
            <div className="text-[10px] text-[var(--c-muted)]">28 {tx({ fr: "élèves", ar: "تلميذ" }, lang)}</div>
          </div>
          <Spot n={2} className="w-full">
            <span className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-[var(--c-primary)]/40 bg-[var(--c-soft)] px-2 text-center text-[11px] font-semibold text-[var(--c-primary)]">
              ✨ {tx({ fr: "Classe de démonstration", ar: "قسم تجريبي" }, lang)}
            </span>
          </Spot>
        </div>
      </Frame>
    ),
  },
  {
    icon: FileSpreadsheet,
    title: { fr: "Importez la liste depuis Massar", ar: "استورد اللائحة من مسار" },
    callouts: [
      {
        n: 1,
        fr: "Ouvrez la classe puis « Nouvelle évaluation — 6 tests ».",
        ar: "افتح القسم ثم « تقييم جديد — ٦ اختبارات ».",
      },
      {
        n: 2,
        fr: "« Importer Excel » : choisissez le fichier Massar (.xlsx/.xls/.csv) — les noms se remplissent seuls.",
        ar: "« استيراد Excel »: اختر ملف مسار — تُملأ الأسماء تلقائياً.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/classes/3B">
        <AppBar lang={lang} />
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--c-ink)]">3ème B</span>
          <Spot n={1}>
            <span className={btn}>📋 {tx({ fr: "Nouvelle évaluation — 6 tests", ar: "تقييم جديد — ٦ اختبارات" }, lang)}</span>
          </Spot>
        </div>
        <div className={card}>
          <div className="mb-2 text-xs font-semibold text-[var(--c-muted2)]">
            {tx({ fr: "Liste de classe", ar: "لائحة القسم" }, lang)}
          </div>
          <Spot n={2}>
            <span className={btnGreen}>
              <FileSpreadsheet className="me-1 inline h-3 w-3" />
              {tx({ fr: "Importer Excel", ar: "استيراد Excel" }, lang)}
            </span>
          </Spot>
        </div>
      </Frame>
    ),
  },
  {
    icon: ClipboardList,
    title: { fr: "Saisissez les 6 tests", ar: "أدخل الاختبارات الستة" },
    callouts: [
      {
        n: 1,
        fr: "Entrez le résultat brut (secondes / répétitions) de chaque test, par élève.",
        ar: "أدخل النتيجة الخام (ثانية / تكرارات) لكل اختبار، لكل تلميذ.",
      },
      {
        n: 2,
        fr: "La note /10 s'affiche, et le Total /60 + la Note /20 se calculent automatiquement.",
        ar: "تظهر النقطة /١٠، ويُحسب المجموع /٦٠ والنقطة /٢٠ تلقائياً.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/.../evaluate">
        <WizardBand lang={lang} />
        <div className="overflow-hidden rounded-lg border border-[var(--c-border)] text-[11px]">
          <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))_auto] bg-[var(--c-ink)] text-white">
            {[tx({ fr: "Élève", ar: "تلميذ" }, lang), "T1", "T2", "T3", "/20"].map((h) => (
              <div key={h} className="px-2 py-1.5 text-center font-semibold">{h}</div>
            ))}
          </div>
          {[
            { n: "Amal", v: ["32", "8", "12"], note: "14.5" },
            { n: "Yassin", v: ["28", "6", "9"], note: "11.0" },
          ].map((r, ri) => (
            <div
              key={r.n}
              className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))_auto] items-center even:bg-[var(--c-soft)]"
            >
              <div className="px-2 py-1.5 font-medium text-[var(--c-ink)]">{r.n}</div>
              {r.v.map((val, vi) =>
                ri === 0 && vi === 0 ? (
                  <Spot key={vi} n={1} className="m-0.5">
                    <span className="block rounded border border-[var(--c-primary)] bg-[var(--c-surface)] px-2 py-1 text-center font-medium text-[var(--c-ink)]">
                      {val}
                    </span>
                  </Spot>
                ) : (
                  <div key={vi} className="px-2 py-1.5 text-center text-[var(--c-muted2)]">{val}</div>
                ),
              )}
              {ri === 0 ? (
                <Spot n={2} className="m-0.5">
                  <span className="block rounded px-2 py-1 text-center font-bold text-[var(--c-primary)]">
                    {r.note}
                  </span>
                </Spot>
              ) : (
                <div className="px-2 py-1.5 text-center font-bold text-[var(--c-primary)]">{r.note}</div>
              )}
            </div>
          ))}
        </div>
      </Frame>
    ),
  },
  {
    icon: BarChart3,
    title: { fr: "Analysez la classe", ar: "حلّل القسم" },
    callouts: [
      {
        n: 1,
        fr: "Cliquez « Analyser la classe ».",
        ar: "اضغط « تحليل القسم ».",
      },
      {
        n: 2,
        fr: "Vous obtenez les profils A/B/C, les lacunes, les moyennes et le bilan de classe.",
        ar: "تحصل على الملامح A/B/C، والثغرات، والمعدلات، وحصيلة القسم.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/.../evaluate">
        <WizardBand lang={lang} />
        <div className="mb-3">
          <Spot n={1}>
            <span className={btn}>🔍 {tx({ fr: "Analyser la classe", ar: "تحليل القسم" }, lang)}</span>
          </Spot>
        </div>
        <Spot n={2} className="w-full">
          <div className={`w-full ${card}`}>
            <div className="mb-2 text-xs font-semibold text-[var(--c-muted2)]">
              {tx({ fr: "Bilan de classe", ar: "حصيلة القسم" }, lang)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="rounded-lg bg-[var(--c-danger-bg)] py-2 text-[var(--c-danger)]">A · 9</div>
              <div className="rounded-lg bg-[var(--c-warn-bg)] py-2 text-[var(--c-warn-ink)]">B · 13</div>
              <div className="rounded-lg bg-[var(--c-success-bg)] py-2 text-[var(--c-success)]">C · 6</div>
            </div>
          </div>
        </Spot>
      </Frame>
    ),
  },
  {
    icon: Target,
    title: { fr: "Choisissez les axes prioritaires", ar: "اختر المحاور ذات الأولوية" },
    callouts: [
      {
        n: 1,
        fr: "Sélectionnez 3 à 4 axes, classés par pertinence selon vos données.",
        ar: "اختر من ٣ إلى ٤ محاور، مرتّبة حسب الأهمية وفق معطياتك.",
      },
      {
        n: 2,
        fr: "« Paramétrer le cycle » : réglez le nombre de séances avec le curseur.",
        ar: "« ضبط الدورة »: حدّد عدد الحصص بواسطة المؤشر.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/.../evaluate">
        <WizardBand lang={lang} />
        <Spot n={1} className="w-full">
          <div className="grid w-full grid-cols-2 gap-2 text-[11px]">
            {[
              { fr: "Gainage", ar: "تثبيت" },
              { fr: "Souplesse", ar: "مرونة" },
              { fr: "Équilibre", ar: "توازن" },
              { fr: "Force", ar: "قوة" },
            ].map((a, k) => (
              <div
                key={k}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  k < 3
                    ? "border-[var(--c-primary)] bg-[var(--c-soft)] font-semibold text-[var(--c-primary)]"
                    : "border-[var(--c-border)] text-[var(--c-muted)]"
                }`}
              >
                <span className={`h-3 w-3 rounded ${k < 3 ? "bg-[var(--c-primary)]" : "border border-[var(--c-border3)]"}`} />
                {tx(a, lang)}
              </div>
            ))}
          </div>
        </Spot>
        <div className="mt-3 flex items-center gap-2">
          <Spot n={2} className="flex-1">
            <div className="w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] p-2">
              <div className="mb-1 flex justify-between text-[10px] text-[var(--c-muted)]">
                <span>{tx({ fr: "Séances", ar: "حصص" }, lang)}</span>
                <span className="font-bold text-[var(--c-primary)]">8</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--c-border2)]">
                <div className="h-1.5 w-2/3 rounded-full bg-[var(--c-primary)]" />
              </div>
            </div>
          </Spot>
        </div>
      </Frame>
    ),
  },
  {
    icon: CalendarRange,
    title: { fr: "Planification + vidéos d'exercices", ar: "التخطيط + فيديوهات التمارين" },
    callouts: [
      {
        n: 1,
        fr: "La planification génère les séances différenciées (groupes A/B/C, garçons/filles).",
        ar: "يولّد التخطيط الحصص المتمايزة (مجموعات A/B/C، ذكور/إناث).",
      },
      {
        n: 2,
        fr: "Chaque exercice a un lien « ▶ vidéo » qui s'ouvre dans une fenêtre intégrée.",
        ar: "لكل تمرين رابط « ▶ فيديو » يُفتح في نافذة مدمجة.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/.../cycle">
        <div className="relative mb-3 overflow-hidden rounded-lg border-s-4 border-[var(--c-primary)] bg-[var(--c-ink)] px-3 py-2 text-xs font-semibold text-white">
          {tx({ fr: "Séquence 1 — Gainage", ar: "تسلسل ١ — تثبيت" }, lang)}
        </div>
        <Spot n={1} className="w-full">
          <div className="grid w-full grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
            <div className="rounded-lg bg-[var(--c-danger-bg)] py-2 text-[var(--c-danger)]">A · {tx({ fr: "Déb.", ar: "مبتدئ" }, lang)}</div>
            <div className="rounded-lg bg-[var(--c-warn-bg)] py-2 text-[var(--c-warn-ink)]">B · {tx({ fr: "Inter.", ar: "متوسط" }, lang)}</div>
            <div className="rounded-lg bg-[var(--c-success-bg)] py-2 text-[var(--c-success)]">C · {tx({ fr: "Av.", ar: "متقدم" }, lang)}</div>
          </div>
        </Spot>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-[11px]">
          <span className="text-[var(--c-ink)]">{tx({ fr: "Planche frontale", ar: "تثبيت أمامي" }, lang)}</span>
          <Spot n={2}>
            <span className="rounded-md bg-[var(--c-danger)] px-2 py-1 font-bold text-white">▶ {tx({ fr: "vidéo", ar: "فيديو" }, lang)}</span>
          </Spot>
        </div>
      </Frame>
    ),
  },
  {
    icon: Printer,
    title: { fr: "Imprimez, exportez, enregistrez", ar: "اطبع، صدّر، احفظ" },
    callouts: [
      {
        n: 1,
        fr: "Imprimez la grille ou le cycle, ou exportez en CSV.",
        ar: "اطبع الشبكة أو الدورة، أو صدّرها بصيغة CSV.",
      },
      {
        n: 2,
        fr: "Enregistrez le diagnostic et le cycle pour suivre la progression dans le temps.",
        ar: "احفظ التشخيص والدورة لتتبّع التقدّم عبر الزمن.",
      },
    ],
    screen: (lang) => (
      <Frame url="adp-rm.app/.../cycle">
        <WizardBand lang={lang} />
        <div className={`${card} flex flex-wrap items-center gap-2`}>
          <Spot n={1}>
            <span className={btnOutline}>🖨 {tx({ fr: "Imprimer", ar: "طباعة" }, lang)}</span>
          </Spot>
          <Spot n={1}>
            <span className={btnOutline}>💾 Export CSV</span>
          </Spot>
          <Spot n={2} className="ms-auto">
            <span className={btn}>💾 {tx({ fr: "Enregistrer le cycle", ar: "حفظ الدورة" }, lang)}</span>
          </Spot>
        </div>
      </Frame>
    ),
  },
];

const UI = {
  fr: {
    open: "Voir la démo guidée",
    subtitle: "8 étapes — 2 min",
    heading: "Comment utiliser l'application",
    prev: "Précédent",
    next: "Suivant",
    start: "Commencer",
    skip: "Passer",
    close: "Fermer",
  },
  ar: {
    open: "شاهد العرض التوضيحي",
    subtitle: "٨ خطوات — دقيقتان",
    heading: "كيفية استخدام التطبيق",
    prev: "السابق",
    next: "التالي",
    start: "ابدأ",
    skip: "تخطّي",
    close: "إغلاق",
  },
} as const;

export function DemoWalkthrough() {
  const { lang, dir } = useI18n();
  const ui = UI[lang];
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  const last = i === STEPS.length - 1;
  const step = STEPS[i];
  const Icon = step.icon;

  function close() {
    setOpen(false);
    setI(0);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--c-primary)]/30 bg-[var(--c-surface)]/70 px-4 py-2.5 text-sm font-semibold text-[var(--c-primary)] backdrop-blur transition hover:border-[var(--c-primary)] hover:bg-[var(--c-soft)]"
      >
        <PlayCircle className="h-4 w-4" />
        {ui.open}
        <span className="text-xs font-normal text-[var(--c-muted)]">· {ui.subtitle}</span>
      </button>

      {open && (
        <div
          dir={dir}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--c-ink)]/60 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[var(--c-surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[var(--c-ink)] to-[var(--c-primary-ink)] px-5 py-3 text-white">
              <h3 className="text-sm font-semibold">{ui.heading}</h3>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label={ui.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body : écran reconstruit + explications */}
            <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0 self-center">{step.screen(lang)}</div>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--c-soft)] text-[var(--c-primary)]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-[var(--c-primary)]">
                      {i + 1} / {STEPS.length}
                    </div>
                    <h4 className="text-lg font-bold text-[var(--c-ink)]">{tx(step.title, lang)}</h4>
                  </div>
                </div>

                <ul className="mt-4 space-y-3">
                  {step.callouts.map((c) => (
                    <li key={c.n} className="flex gap-3 text-sm leading-relaxed text-[var(--c-muted3)]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--c-primary)] text-[10px] font-bold text-white">
                        {c.n}
                      </span>
                      <span>{tx({ fr: c.fr, ar: c.ar }, lang)}</span>
                    </li>
                  ))}
                </ul>

                {/* Progress dots */}
                <div className="mt-auto flex justify-center gap-1.5 pt-6">
                  {STEPS.map((_, k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setI(k)}
                      aria-label={`${k + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        k === i ? "w-5 bg-[var(--c-primary)]" : "w-1.5 bg-[var(--c-border3)] hover:bg-[var(--c-faint)]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--c-border)] px-6 py-3.5">
              <button
                type="button"
                onClick={() => (i === 0 ? close() : setI((v) => v - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--c-muted)] transition hover:bg-[var(--c-border2)]"
              >
                {i === 0 ? (
                  ui.skip
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {ui.prev}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => (last ? close() : setI((v) => v + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary2)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[var(--c-primary)]/25 transition hover:brightness-105"
              >
                {last ? (
                  ui.start
                ) : (
                  <>
                    {ui.next} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
