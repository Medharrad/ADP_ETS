"use client";

// =============================================================================
// DemoWalkthrough — démonstration guidée « Comment utiliser l'application »,
// accessible depuis l'écran de connexion (avant de se connecter). Étapes claires,
// chaque bouton / action documenté. Bilingue FR / AR (suit le sélecteur de langue).
// =============================================================================

import { useEffect, useState } from "react";
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

import { useI18n } from "@/lib/i18n";

interface StepContent {
  title: string;
  lines: string[];
}

interface Step {
  icon: LucideIcon;
  /** Capture d'écran de l'étape (dans /public/demo). Optionnelle. */
  img?: string;
  fr: StepContent;
  ar: StepContent;
}

const STEPS: Step[] = [
  {
    icon: UserPlus,
    img: "/demo/01-login.png",
    fr: {
      title: "Créez votre compte",
      lines: [
        "Onglet « Créer un compte » : saisissez votre e-mail et un mot de passe (6 caractères min.), puis « Créer le compte ».",
        "Déjà inscrit·e ? Restez sur « Connexion » et entrez vos identifiants.",
      ],
    },
    ar: {
      title: "أنشئ حسابك",
      lines: [
        "من تبويب « إنشاء حساب »: أدخل بريدك الإلكتروني وكلمة مرور (٦ أحرف على الأقل)، ثم « إنشاء الحساب ».",
        "لديك حساب؟ ابقَ على « تسجيل الدخول » وأدخل بياناتك.",
      ],
    },
  },
  {
    icon: GraduationCap,
    img: "/demo/02-dashboard.png",
    fr: {
      title: "Ajoutez une classe",
      lines: [
        "Sur le tableau de bord, cliquez « Nouvelle classe » et donnez un nom et un niveau.",
        "Pressé·e ? « ✨ Charger une classe de démonstration » crée une classe d'exemple.",
      ],
    },
    ar: {
      title: "أضف قسماً",
      lines: [
        "في لوحة القيادة، اضغط « قسم جديد » وأدخل الاسم والمستوى.",
        "في عجلة من أمرك؟ « ✨ تحميل قسم تجريبي » ينشئ قسماً نموذجياً.",
      ],
    },
  },
  {
    icon: FileSpreadsheet,
    img: "/demo/03-import.png",
    fr: {
      title: "Importez la liste depuis Massar",
      lines: [
        "Ouvrez la classe puis « 📋 Nouvelle évaluation — 6 tests ».",
        "Cliquez le bouton vert « Importer Excel » et choisissez le fichier Massar (.xlsx, .xls ou .csv).",
        "Les noms des élèves se remplissent automatiquement dans la grille.",
      ],
    },
    ar: {
      title: "استورد اللائحة من مسار",
      lines: [
        "افتح القسم ثم « 📋 تقييم جديد — ٦ اختبارات ».",
        "اضغط الزر الأخضر « استيراد Excel » واختر ملف مسار (.xlsx أو .xls أو .csv).",
        "تُملأ أسماء التلاميذ تلقائياً في الشبكة.",
      ],
    },
  },
  {
    icon: ClipboardList,
    img: "/demo/04-grille.png",
    fr: {
      title: "Saisissez les 6 tests",
      lines: [
        "Pour chaque élève, entrez le résultat brut (secondes / répétitions) de chaque test.",
        "La note /10 s'affiche sous la case, et le Total /60 + la Note /20 se calculent automatiquement.",
      ],
    },
    ar: {
      title: "أدخل الاختبارات الستة",
      lines: [
        "لكل تلميذ، أدخل النتيجة الخام (ثانية / تكرارات) لكل اختبار.",
        "تظهر النقطة /١٠ أسفل الخانة، ويُحسب المجموع /٦٠ والنقطة /٢٠ تلقائياً.",
      ],
    },
  },
  {
    icon: BarChart3,
    img: "/demo/05-analyse.png",
    fr: {
      title: "Analysez la classe",
      lines: [
        "Cliquez « 🔍 Analyser la classe ».",
        "Vous obtenez les profils (A/B/C), les lacunes, les moyennes par famille et le bilan de classe.",
      ],
    },
    ar: {
      title: "حلّل القسم",
      lines: [
        "اضغط « 🔍 تحليل القسم ».",
        "تحصل على الملامح (A/B/C)، والثغرات، والمعدلات حسب العائلة، وحصيلة القسم.",
      ],
    },
  },
  {
    icon: Target,
    img: "/demo/06-axes.png",
    fr: {
      title: "Choisissez les axes prioritaires",
      lines: [
        "Sélectionnez 3 à 4 axes, classés par pertinence selon vos données.",
        "« Paramétrer le cycle » : réglez le nombre de séances avec le curseur.",
      ],
    },
    ar: {
      title: "اختر المحاور ذات الأولوية",
      lines: [
        "اختر من ٣ إلى ٤ محاور، مرتّبة حسب الأهمية وفق معطياتك.",
        "« ضبط الدورة »: حدّد عدد الحصص بواسطة المؤشر.",
      ],
    },
  },
  {
    icon: CalendarRange,
    img: "/demo/07-planification.png",
    fr: {
      title: "Planification + vidéos d'exercices",
      lines: [
        "La planification génère les séances différenciées (groupes A/B/C, garçons/filles).",
        "Chaque exercice a un lien « ▶ vidéo » qui s'ouvre dans une fenêtre intégrée à l'app.",
      ],
    },
    ar: {
      title: "التخطيط + فيديوهات التمارين",
      lines: [
        "يولّد التخطيط الحصص المتمايزة (مجموعات A/B/C، ذكور/إناث).",
        "لكل تمرين رابط « ▶ فيديو » يُفتح في نافذة مدمجة داخل التطبيق.",
      ],
    },
  },
  {
    icon: Printer,
    img: "/demo/08-impression.png",
    fr: {
      title: "Imprimez, exportez, enregistrez",
      lines: [
        "Imprimez la grille ou le cycle, ou exportez en CSV.",
        "Enregistrez le diagnostic et le cycle pour suivre la progression dans le temps.",
      ],
    },
    ar: {
      title: "اطبع، صدّر، احفظ",
      lines: [
        "اطبع الشبكة أو الدورة، أو صدّرها بصيغة CSV.",
        "احفظ التشخيص والدورة لتتبّع التقدّم عبر الزمن.",
      ],
    },
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
  const content = lang === "ar" ? step.ar : step.fr;
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
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#2563EB]/30 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#2563EB] backdrop-blur transition hover:border-[#2563EB] hover:bg-[#EFF6FF]"
      >
        <PlayCircle className="h-4 w-4" />
        {ui.open}
        <span className="text-xs font-normal text-[#64748B]">· {ui.subtitle}</span>
      </button>

      {open && (
        <div
          dir={dir}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0C1E3C]/60 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#0C1E3C] to-[#1E3A8A] px-5 py-3 text-white">
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

            {/* Body (défilable) */}
            <div className="flex-1 overflow-y-auto">
              {step.img && <DemoImage src={step.img} alt={content.title} />}
              <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">
                    {i + 1} / {STEPS.length}
                  </div>
                  <h4 className="text-lg font-bold text-[#0C1E3C]">{content.title}</h4>
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {content.lines.map((line, k) => (
                  <li key={k} className="flex gap-2.5 text-sm leading-relaxed text-[#334155]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* Progress dots */}
              <div className="mt-6 flex justify-center gap-1.5">
                {STEPS.map((_, k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setI(k)}
                    aria-label={`${k + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      k === i ? "w-5 bg-[#2563EB]" : "w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]"
                    }`}
                  />
                ))}
              </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-6 py-3.5">
              <button
                type="button"
                onClick={() => (i === 0 ? close() : setI((v) => v - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-[#F1F5F9]"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#2563EB]/25 transition hover:brightness-105"
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

/** Capture d'écran de l'étape ; disparaît proprement si l'image est absente. */
function DemoImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setOk(false)}
        className="block max-h-[260px] w-full object-cover object-top"
      />
    </div>
  );
}
