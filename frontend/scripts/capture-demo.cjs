// Capture des screenshots de la démo guidée. Lance un chromium headless,
// crée un compte + données de démo, et photographie chaque écran clé.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3210";
const OUT = path.join(__dirname, "..", "public", "demo");

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("✓", name);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    deviceScaleFactor: 1,
    locale: "fr-FR",
  });
  const page = await ctx.newPage();

  // 1) Login
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "01-login.png");

  // Compte + jeton
  const email = `demo${Date.now()}@adp.ma`;
  const reg = await page.request.post(BASE + "/api/auth/register", {
    data: { email, password: "demo123456" },
  });
  const { token } = await reg.json();
  const auth = { Authorization: "Bearer " + token };
  await ctx.addInitScript((t) => localStorage.setItem("speedapp_token", t), token);

  // Données de démo
  const seed = await page.request.post(BASE + "/api/seed", { headers: auth });
  const { classId } = await seed.json();

  // 2) Tableau de bord
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await shot(page, "02-dashboard.png");

  // Page d'évaluation (grille 6 tests, roster pré-rempli)
  await page.goto(BASE + `/classes/${classId}/evaluate`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 3) Import Massar — ouvrir le panneau
  try {
    await page.getByRole("button", { name: /Importer Excel/i }).click();
    await page.waitForTimeout(700);
    await shot(page, "03-import.png");
    // refermer
    await page.getByRole("button", { name: /Importer Excel/i }).click();
    await page.waitForTimeout(300);
  } catch (e) {
    console.log("! 03-import:", e.message);
  }

  // Remplir les 6 tests pour montrer notes + Total/60 + Note/20
  try {
    const inputs = page.locator('input[inputmode="decimal"]');
    const n = await inputs.count();
    const vals = [25, 12, 6, 12, 9, 7]; // un set crédible par test
    for (let k = 0; k < n; k++) {
      await inputs.nth(k).fill(String(vals[k % 6]));
    }
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "04-grille.png");
  } catch (e) {
    console.log("! 04-grille:", e.message);
  }

  // 5) Analyse
  try {
    await page.getByRole("button", { name: /Analyser la classe/i }).click();
    await page.waitForTimeout(1400);
    // placer le tableau de résultats en haut de l'écran
    await page.evaluate(() => {
      const h = [...document.querySelectorAll("h2")].find((e) =>
        (e.textContent || "").includes("Tableau individuel"),
      );
      if (h) h.scrollIntoView({ block: "start" });
      window.scrollBy(0, -20);
    });
    await page.waitForTimeout(500);
    await shot(page, "05-analyse.png");
  } catch (e) {
    console.log("! 05-analyse:", e.message);
  }

  // 6) Axes prioritaires
  try {
    await page.getByRole("button", { name: /Axes prioritaires/i }).click();
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "06-axes.png");
  } catch (e) {
    console.log("! 06-axes:", e.message);
  }

  // Récupérer un cycle existant (créé par le seed)
  let cycleId = null;
  try {
    const cd = await page.request.get(BASE + `/api/classes/${classId}`, { headers: auth });
    const detail = await cd.json();
    cycleId = detail.cycles && detail.cycles[0] && detail.cycles[0].id;
  } catch (e) {
    console.log("! cycle lookup:", e.message);
  }

  // 7) Planification + vidéos (page cycle enregistré)
  if (cycleId) {
    try {
      await page.goto(BASE + `/classes/${classId}/cycle/${cycleId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      // ouvrir une vidéo pour montrer la modale
      const playBtn = page.getByRole("button", { name: /vidéo/i }).first();
      if (await playBtn.count()) {
        await playBtn.click();
        await page.waitForTimeout(1500);
      }
      await shot(page, "07-planification.png");
      await page.keyboard.press("Escape").catch(() => {});
    } catch (e) {
      console.log("! 07-planification:", e.message);
    }

    // 8) Impression / export — haut de la page cycle avec les boutons
    try {
      await page.goto(BASE + `/classes/${classId}/cycle/${cycleId}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, "08-impression.png");
    } catch (e) {
      console.log("! 08-impression:", e.message);
    }
  }

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
