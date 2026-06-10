"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Lightweight i18n: French (default) + Arabic with RTL. Covers the app chrome
// (auth, header, dashboard, settings). The pedagogical wizard / référentiel stays
// in French by design — it mirrors the official ADP 2026 framework.

export type Lang = "fr" | "ar";

type Dict = Record<string, string>;

const FR: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.tool": "Outil libre",
  "nav.settings": "Paramètres",
  "nav.logout": "Déconnexion",
  "lang.name": "العربية",

  "auth.signin": "Connexion",
  "auth.signup": "Créer un compte",
  "auth.signinSub": "Accédez à vos classes et cycles.",
  "auth.signupSub": "Pour les enseignant·e·s d'EPS.",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.passwordHint": "6 caractères minimum",
  "auth.submitSignin": "Se connecter",
  "auth.submitSignup": "Créer le compte",
  "auth.wait": "Veuillez patienter…",
  "auth.haveAccount": "Déjà un compte ?",
  "auth.noAccount": "Pas encore de compte ?",
  "auth.tagline":
    "Renforcement Musculaire & Souplesse · ADP 2026. Diagnostiquez votre classe, ciblez les axes prioritaires et générez un cycle différencié (garçons/filles) — sans note.",
  "auth.badge": "Outil sans note — Renforcement Musculaire & Souplesse",
  "auth.headlineLead": "Décidez avec",
  "auth.headlineAccent": "clarté",
  "auth.feat1": "Diagnostic Force · Souplesse · Équilibre, sans note",
  "auth.feat2": "Axes prioritaires classés par pertinence",
  "auth.feat3": "Planification différenciée du cycle",
  "auth.emailPlaceholder": "nom@exemple.ma",
  "auth.show": "Afficher le mot de passe",
  "auth.hide": "Masquer le mot de passe",
  "auth.welcome": "Bienvenue",
  "auth.created": "Compte créé",
  "auth.error": "Une erreur est survenue",

  "dash.title": "Tableau de bord",
  "dash.subtitle": "Vos classes, diagnostics et cycles de Renforcement Musculaire & Souplesse.",
  "dash.classes": "Classes",
  "dash.students": "Élèves",
  "dash.diagnostics": "Diagnostics",
  "dash.cycles": "Cycles",
  "dash.myClasses": "Mes classes",
  "dash.loading": "Chargement…",
  "dash.noClasses": "Aucune classe pour l'instant. Créez-en une pour démarrer un diagnostic.",
  "dash.demo": "✨ Charger une classe de démonstration",
  "dash.newClass": "Nouvelle classe",
  "dash.name": "Nom / Groupe",
  "dash.level": "Niveau",
  "dash.create": "Créer la classe",
  "dash.creating": "Création…",
  "dash.recentCycles": "Cycles récents",
  "dash.noCycles": "Aucun cycle enregistré.",
  "dash.lastDiag": "Dernier diagnostic",

  "niveau.manage": "Gérer les niveaux",
  "niveau.createFirst": "Créez votre premier niveau",
  "niveau.title": "Gérer les niveaux",
  "niveau.subtitle":
    "Créez vos propres niveaux pour les réutiliser à la création d'une classe.",
  "niveau.mine": "Mes niveaux",
  "niveau.addPlaceholder": "Ex : 6ème année",
  "niveau.add": "Ajouter",
  "niveau.adding": "Ajout…",
  "niveau.empty": "Aucun niveau personnalisé pour l'instant.",
  "niveau.done": "Terminé",
  "niveau.added": "Niveau ajouté",
  "niveau.deleted": "Niveau supprimé",
  "niveau.exists": "Ce niveau existe déjà.",
  "niveau.addFail": "Échec de l'ajout du niveau.",
  "niveau.deleteFail": "Échec de la suppression du niveau.",
  "niveau.close": "Fermer",
};

const AR: Dict = {
  "nav.dashboard": "لوحة القيادة",
  "nav.tool": "الأداة الحرة",
  "nav.settings": "الإعدادات",
  "nav.logout": "تسجيل الخروج",
  "lang.name": "Français",

  "auth.signin": "تسجيل الدخول",
  "auth.signup": "إنشاء حساب",
  "auth.signinSub": "ادخل إلى أقسامك ودوراتك.",
  "auth.signupSub": "لأساتذة التربية البدنية والرياضية.",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.passwordHint": "٦ أحرف على الأقل",
  "auth.submitSignin": "تسجيل الدخول",
  "auth.submitSignup": "إنشاء الحساب",
  "auth.wait": "يرجى الانتظار…",
  "auth.haveAccount": "لديك حساب بالفعل؟",
  "auth.noAccount": "ليس لديك حساب بعد؟",
  "auth.tagline":
    "التقوية العضلية والمرونة · ADP 2026. شخّص قسمك، حدّد المحاور ذات الأولوية، وولّد دورة متمايزة (ذكور/إناث) — بدون نقطة.",
  "auth.badge": "أداة بدون نقطة — التقوية العضلية والمرونة",
  "auth.headlineLead": "قرّر بكل",
  "auth.headlineAccent": "وضوح",
  "auth.feat1": "تشخيص القوة · المرونة · التوازن، بدون نقطة",
  "auth.feat2": "محاور ذات أولوية مرتّبة حسب الأهمية",
  "auth.feat3": "تخطيط متمايز للدورة",
  "auth.emailPlaceholder": "name@example.ma",
  "auth.show": "إظهار كلمة المرور",
  "auth.hide": "إخفاء كلمة المرور",
  "auth.welcome": "مرحباً بك",
  "auth.created": "تم إنشاء الحساب",
  "auth.error": "حدث خطأ",

  "dash.title": "لوحة القيادة",
  "dash.subtitle": "أقسامك وتشخيصاتك ودورات التقوية العضلية والمرونة.",
  "dash.classes": "الأقسام",
  "dash.students": "التلاميذ",
  "dash.diagnostics": "التشخيصات",
  "dash.cycles": "الدورات",
  "dash.myClasses": "أقسامي",
  "dash.loading": "جارٍ التحميل…",
  "dash.noClasses": "لا يوجد قسم بعد. أنشئ قسماً لبدء التشخيص.",
  "dash.demo": "✨ تحميل قسم تجريبي",
  "dash.newClass": "قسم جديد",
  "dash.name": "الاسم / المجموعة",
  "dash.level": "المستوى",
  "dash.create": "إنشاء القسم",
  "dash.creating": "جارٍ الإنشاء…",
  "dash.recentCycles": "الدورات الأخيرة",
  "dash.noCycles": "لا توجد دورة مسجّلة.",
  "dash.lastDiag": "آخر تشخيص",

  "niveau.manage": "إدارة المستويات",
  "niveau.createFirst": "أنشئ مستواك الأول",
  "niveau.title": "إدارة المستويات",
  "niveau.subtitle": "أنشئ مستوياتك الخاصة لإعادة استعمالها عند إنشاء قسم.",
  "niveau.mine": "مستوياتي",
  "niveau.addPlaceholder": "مثال: السنة السادسة",
  "niveau.add": "إضافة",
  "niveau.adding": "جارٍ الإضافة…",
  "niveau.empty": "لا يوجد مستوى مخصّص بعد.",
  "niveau.done": "تم",
  "niveau.added": "تمت إضافة المستوى",
  "niveau.deleted": "تم حذف المستوى",
  "niveau.exists": "هذا المستوى موجود بالفعل.",
  "niveau.addFail": "تعذّرت إضافة المستوى.",
  "niveau.deleteFail": "تعذّر حذف المستوى.",
  "niveau.close": "إغلاق",
};

const DICTS: Record<Lang, Dict> = { fr: FR, ar: AR };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof FR) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      (localStorage.getItem("adp_lang") as Lang | null)) || null;
    if (stored === "fr" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (typeof window !== "undefined") localStorage.setItem("adp_lang", lang);
  }, [lang]);

  const value: I18nValue = {
    lang,
    setLang: setLangState,
    t: (key) => DICTS[lang][key as string] ?? DICTS.fr[key as string] ?? (key as string),
    dir: lang === "ar" ? "rtl" : "ltr",
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback (e.g. outside provider) — French, no-op toggle.
    return {
      lang: "fr",
      setLang: () => {},
      t: (key) => FR[key as string] ?? (key as string),
      dir: "ltr",
    };
  }
  return ctx;
}
