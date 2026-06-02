import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { db } from "./db";
import { decryptSecret } from "./crypto";

// =============================================================================
// AI assist — optional, powered by each teacher's own Anthropic API key.
// Three rule-based-grounded helpers: summarise a diagnostic, justify decisions,
// enrich session content. Model per claude-api skill default: claude-opus-4-8.
// =============================================================================

const MODEL = "claude-opus-4-8";

/** Thrown to map AI failures onto HTTP responses in the route handlers. */
export class AiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Read + decrypt a teacher's stored API key. Returns null when none set. */
export function getUserApiKey(userId: number): string | null {
  const row = db
    .prepare("SELECT anthropic_key_enc FROM users WHERE id = ?")
    .get(userId) as { anthropic_key_enc: string | null } | undefined;
  if (!row?.anthropic_key_enc) return null;
  try {
    return decryptSecret(row.anthropic_key_enc);
  } catch {
    return null;
  }
}

// Stable, cacheable system grounding — the tool's philosophy + référentiel frame.
const SYSTEM = `Tu es un assistant pédagogique pour des enseignant·e·s d'EPS (Éducation Physique et Sportive) au Maroc, spécialisé en Gymnastique Artistique, dans le cadre du dispositif DI-GYM / ADP 2026.

Contexte de l'outil :
- 3 observables : OBS-01 (Posture et tonicité globale en appui), OBS-02 (Gabarit moteur du renversement — ATR/Roulade), OBS-03 (Composition et liaisons entre éléments). Chacun noté sur 10.
- Profils : A = débutant (<4,5), B = intermédiaire (4,5–7,5), C = avancé (≥7,5).
- L'outil est SANS NOTE : il aide la décision, il ne juge pas. La décision finale revient toujours à l'enseignant.

Règles de réponse :
- Réponds en français, dans un registre professionnel et concret, adapté à des enseignant·e·s.
- Sois bref et directement exploitable (pas de préambule du type « Voici… »).
- Reste fidèle au cadre ci-dessus ; n'invente pas de barème.
- N'utilise pas de Markdown lourd ; des puces simples « - » sont acceptables.`;

async function runClaude(apiKey: string, userText: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
    });
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      throw new AiError("Clé API Anthropic invalide. Vérifiez-la dans les paramètres.", 400);
    }
    if (e instanceof Anthropic.RateLimitError) {
      throw new AiError("Limite de requêtes atteinte. Réessayez dans un instant.", 429);
    }
    if (e instanceof Anthropic.APIError) {
      throw new AiError(`Erreur du service IA (${e.status ?? "?"}).`, 502);
    }
    throw new AiError("Échec de l'appel au service IA.", 502);
  }
}

// -- Prompt builders ----------------------------------------------------------

export interface SummaryInput {
  classe?: string;
  niveau?: string | null;
  total: number;
  counts: { A: number; B: number; C: number };
  moyClasse: number;
  moyObservables: [number, number, number];
  decision: string;
}

export function runSummary(apiKey: string, d: SummaryInput) {
  const text = `Rédige un court bilan de classe (4 à 6 phrases) que l'enseignant pourra coller dans un rapport.

Données :
- Classe : ${d.classe || "—"}${d.niveau ? ` (${d.niveau})` : ""}
- Effectif : ${d.total} élèves
- Répartition des profils : A=${d.counts.A}, B=${d.counts.B}, C=${d.counts.C}
- Moyenne de classe : ${d.moyClasse.toFixed(1)}/10
- Moyennes par observable : OBS-01=${d.moyObservables[0].toFixed(1)}, OBS-02=${d.moyObservables[1].toFixed(1)}, OBS-03=${d.moyObservables[2].toFixed(1)}
- Décision dominante détectée : ${d.decision}

Mets en évidence les points forts, les lacunes collectives et l'orientation pédagogique. Termine en rappelant que la décision finale revient à l'enseignant.`;
  return runClaude(apiKey, text);
}

export interface JustifyInput {
  axes: { id: number; titre: string; pertinence: number }[];
  counts: { A: number; B: number; C: number };
  total: number;
}

export function runJustify(apiKey: string, d: JustifyInput) {
  const axesStr = d.axes
    .map((a) => `- Axe ${a.id} : ${a.titre} (${a.pertinence}% d'élèves concernés)`)
    .join("\n");
  const text = `Pour chacun des axes prioritaires sélectionnés ci-dessous, rédige 1 à 2 phrases de justification pédagogique fondée sur les données de la classe (pourquoi cet axe, pour quel public). C'est destiné au rapport de l'enseignant.

Classe : ${d.total} élèves (A=${d.counts.A}, B=${d.counts.B}, C=${d.counts.C}).
Axes choisis :
${axesStr}

Présente une justification par axe, préfixée par « Axe N — ».`;
  return runClaude(apiKey, text);
}

export interface EnrichInput {
  axeTitre: string;
  niveau: "A" | "B" | "C";
  consigne: string;
  critere: string;
}

export function runEnrich(apiKey: string, d: EnrichInput) {
  const labels = { A: "débutants", B: "intermédiaires", C: "avancés" };
  const text = `Propose 3 variantes ou progressions d'exercice concrètes pour enrichir la situation d'apprentissage suivante, destinées au groupe ${d.niveau} (${labels[d.niveau]}) en Gymnastique Artistique.

Axe : ${d.axeTitre}
Consigne actuelle : ${d.consigne}
Critère de réussite : ${d.critere}

Donne 3 variantes sous forme de puces « - », chacune avec un objectif d'apprentissage clair et réalisable en séance. Garde la même intention pédagogique.`;
  return runClaude(apiKey, text);
}
