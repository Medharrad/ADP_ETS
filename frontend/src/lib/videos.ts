// =============================================================================
// VIDÉOS D'EXERCICES — bibliothèque de démonstrations YouTube par type d'exercice.
// Source : liens_des_videos.csv (CRMEF Inezgane · BOUARGANE). Les vidéos sont
// regroupées par « type », chaque type correspondant à un axe du référentiel.
// =============================================================================

export interface ExerciseVideo {
  nom: string;
  type: string;
  url: string;
  /** Identifiant YouTube (embed) ; null si le lien n'est pas une URL YouTube. */
  youtubeId: string | null;
}

/** Extrait l'identifiant d'une URL YouTube (youtu.be, watch?v=, embed). */
function ytId(url: string): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = u.match(p);
    if (m) return m[1];
  }
  return null;
}

// Liste brute (nom, type, url) — lignes sans lien exclues.
const RAW: [string, string, string][] = [
  ["Étirement ischio-jambiers debout", "Souplesse des jambes", "https://youtu.be/wEuAv8wOPVo"],
  ["Étirement adducteurs assis", "Souplesse des jambes", "https://youtu.be/Knqm35JYdww"],
  ["Fente avant statique", "Souplesse des jambes", "https://youtu.be/k4VWW0-Pwxg"],
  ["Flexion tronc avec bâton", "Souplesse des jambes", "https://youtu.be/WUXD4kIz3jU"],
  ["Grand écart progressif", "Souplesse des jambes", "https://share.google/hQbNJnZPWdbxVNlJk"],
  ["Papillon adducteur", "Souplesse des jambes", "https://youtu.be/mwY3qvGo9J4"],
  ["Étirement ischio sol", "Souplesse des jambes", "https://youtu.be/U3CFUGNdXqg"],
  ["Fente basse dynamique", "Souplesse des jambes", "https://share.google/gCJbwCbNfEUVmwQ05"],
  ["Cobra stretch", "Souplesse du dos", "https://youtu.be/JDcdhTuycOI"],
  ["Extension dorsale superman", "Souplesse du dos", "https://youtu.be/u6URsk0OmTE"],
  ["Chat-vache", "Souplesse du dos", "https://youtu.be/SSDi30vN2hs"],
  ["Gainage ventral costal (Planche)", "Force du tronc", "https://www.youtube.com/watch?v=3QZlgJ40LfU"],
  ["Gainage latéral (Gauche / Droite)", "Force du tronc", "https://www.youtube.com/watch?v=pitOuJxdyI0"],
  ["Gainage dorsal (Pont fessier)", "Force du tronc", "https://www.youtube.com/watch?v=jk2x21Nz3CA"],
  ["Crunch abdominal contrôlé", "Force du tronc", "https://www.youtube.com/watch?v=RUNrHkbP4Pc"],
  ["Sit-ups complets", "Force du tronc", "https://www.youtube.com/watch?v=swOyWKk7Oko"],
  ["Pompes (genoux / complètes)", "Force des membres supérieurs", "https://www.youtube.com/watch?v=OQEzcv-lk_o"],
  ["Dips sur banc", "Force des membres supérieurs", "https://www.youtube.com/watch?v=ydYxBstpJkc"],
  ["Gainage bras tendus + touché d'épaules", "Force des membres supérieurs", "https://www.youtube.com/watch?v=Wobtf0ev-N4"],
  ["Marche de l'ours (Bear crawl)", "Force des membres supérieurs", "https://www.youtube.com/watch?v=3wecniBrxrY"],
  ["Squat au poids du corps", "Force des membres inférieurs", "https://www.youtube.com/watch?v=yZhgz6MOgAA"],
  ["Fentes avant dynamiques (alternées)", "Force des membres inférieurs", "https://www.youtube.com/watch?v=bR9syGmHXns"],
  ["La chaise (gainage quadriceps)", "Force des membres inférieurs", "https://www.youtube.com/watch?v=S4DxDSXiNqI"],
  ["Squat sauté (plyométrie)", "Force des membres inférieurs", "https://www.youtube.com/watch?v=18WlJ2Df22Q"],
  ["Extension mollets debout", "Force des membres inférieurs", "https://www.youtube.com/watch?v=HV7dsnvSpY8"],
];

export const VIDEOS: ExerciseVideo[] = RAW.map(([nom, type, url]) => ({
  nom,
  type: type.trim(),
  url,
  youtubeId: ytId(url),
}));

/** Type de vidéo associé à chaque axe du référentiel (RM-01 … RM-06). */
const AXE_VIDEO_TYPE: Record<number, string> = {
  1: "Force du tronc",
  2: "Force des membres supérieurs",
  3: "Force des membres inférieurs",
  4: "Souplesse des jambes",
  5: "Souplesse du dos",
  // Axe 6 (équilibre) : aucune vidéo fournie.
};

// -- Correspondance exercice (référentiel) → vidéo YouTube ---------------------
// Chaque exercice des listes exG/exF reçoit une vidéo : celles du CSV quand elles
// correspondent, sinon une vidéo trouvée par recherche YouTube. La correspondance
// se fait par mot-clé inclus dans le nom de l'exercice (insensible accents/casse).

function norm(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Ordre = du plus spécifique au plus générique (première correspondance gagnante).
const EXERCISE_MATCHES: [string, string][] = [
  // Équilibre & coordination
  ["arabesque", "0F3YYeKBoE8"],
  ["unipodal", "9ZgHBDzPr7c"],
  ["marche sur ligne", "1c5edgKxtok"],
  ["enchainement equilibre", "1c5edgKxtok"],
  ["posture gymnique", "0F3YYeKBoE8"],
  ["proprioception", "MTi3jdtWYpU"],
  // Souplesse des jambes
  ["ischio jambiers debout", "wEuAv8wOPVo"],
  ["ischio sol", "U3CFUGNdXqg"],
  ["adducteurs assis", "Knqm35JYdww"],
  ["papillon", "mwY3qvGo9J4"],
  ["fente avant statique", "k4VWW0-Pwxg"],
  ["fente basse", "sOiI4kPgGA4"],
  ["flexion tronc", "WUXD4kIz3jU"],
  ["grand ecart", "SdltgVDEPmM"],
  // Souplesse du dos
  ["cobra", "JDcdhTuycOI"],
  ["extension dorsale", "u6URsk0OmTE"],
  ["superman", "u6URsk0OmTE"],
  ["chat", "SSDi30vN2hs"],
  ["ondulation", "3P5f9bXukQk"],
  ["roue", "UKqLPwXEkaQ"],
  ["pont fessier", "jk2x21Nz3CA"],
  ["pont", "usyrUMFhLUc"],
  // Force du tronc
  ["planche laterale", "pitOuJxdyI0"],
  ["planche ventrale", "3QZlgJ40LfU"],
  ["mountain climbers", "hq_0YlyfqGM"],
  ["hollow", "0yPin8hSc8o"],
  ["gainage dynamique bras", "Wobtf0ev-N4"],
  ["dead bug", "4XLEnwUr1d8"],
  ["crunch", "RUNrHkbP4Pc"],
  ["sit up", "swOyWKk7Oko"],
  // Force des membres supérieurs
  ["maintien atr", "H3JRaep2lUE"],
  ["atr assiste", "-uqsm0wHhgY"],
  ["appuis statiques", "Wobtf0ev-N4"],
  ["pompes", "OQEzcv-lk_o"],
  ["dips", "ydYxBstpJkc"],
  ["bear crawl", "3wecniBrxrY"],
  // Force des membres inférieurs
  ["sauts explosifs", "18WlJ2Df22Q"],
  ["squat saute", "18WlJ2Df22Q"],
  ["squat", "yZhgz6MOgAA"],
  ["nordic", "mYfTCoOoX74"],
  ["step up", "0I76rnOH_1k"],
  ["fentes laterales", "apsp_uuXZTU"],
  ["fente laterale", "apsp_uuXZTU"],
  ["fentes avant", "bR9syGmHXns"],
  ["chaise", "S4DxDSXiNqI"],
  ["mollets", "HV7dsnvSpY8"],
];

/** Identifiant YouTube de la vidéo de démonstration d'un exercice (ou null). */
export function videoForExercise(label: string): string | null {
  const n = norm(label);
  for (const [kw, id] of EXERCISE_MATCHES) {
    if (n.includes(kw)) return id;
  }
  return null;
}

/** Vidéos d'exercices correspondant à un axe (dédupliquées). */
export function videosForAxe(axeId: number): ExerciseVideo[] {
  const type = AXE_VIDEO_TYPE[axeId];
  if (!type) return [];
  const seen = new Set<string>();
  return VIDEOS.filter((v) => {
    if (v.type !== type) return false;
    const key = v.youtubeId ?? v.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
