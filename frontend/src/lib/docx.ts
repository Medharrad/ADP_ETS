// =============================================================================
// DOCX roster import. Reads the "Grille d'observation" Word template
// (Default_Grille.docx) and extracts the student grading grid:
//
//   N° | NOM PRÉNOM | 💪 FORCE | 🤸 SOUPLESSE | ⚖ ÉQUILIBRE | TOTAL /30 | OBS.
//
// A .docx is a ZIP holding word/document.xml. We unzip it in the browser with
// the native DecompressionStream (deflate-raw) — zero dependencies, works
// offline — then walk the WordprocessingML tables with DOMParser.
// =============================================================================

import { codeToScore } from "./calc";

export interface ParsedStudent {
  prenom: string;
  /** the three observable scores, null when missing/invalid */
  vs: [number | null, number | null, number | null];
  /** human-readable issues for this row (e.g. "Force manquante") */
  issues: string[];
  /** true when prénom + all three scores are present and valid */
  complete: boolean;
}

export interface ParseResult {
  students: ParsedStudent[];
  /** non-empty rows that were skipped (sub-header, BILAN row, etc.) */
  ignored: number;
  /** fatal problem — when set, `students` is empty */
  error?: string;
}

// -- ZIP container ------------------------------------------------------------

function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds);
  return new Response(stream).arrayBuffer().then((ab) => new Uint8Array(ab));
}

/** Read every entry of a .docx ZIP into an ordered name → decompressed-bytes
 *  map (insertion order matches the archive's central directory). */
async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const buf = new Uint8Array(buffer);
  const dv = new DataView(buffer);

  // Find the End Of Central Directory record (sig 0x06054b50), scanning back.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65536; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("Fichier .docx invalide (archive ZIP illisible).");

  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true); // start of central directory
  const entries = new Map<string, Uint8Array>();

  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break; // central dir header sig
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));

    // Local header lengths can differ from the central dir — re-read them.
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(dataStart, dataStart + compSize);
    entries.set(name, method === 0 ? data.slice() : await inflateRaw(data));

    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// -- Table extraction ---------------------------------------------------------

/** All text inside a <w:tc> cell, paragraphs joined by spaces, trimmed. */
function cellText(tc: Element): string {
  const out: string[] = [];
  const ts = tc.getElementsByTagName("w:t");
  for (let i = 0; i < ts.length; i++) out.push(ts[i].textContent ?? "");
  return out.join("").replace(/\s+/g, " ").trim();
}

/** Nearest ancestor with the given (namespaced) tag name, or null. */
function closestTag(el: Element, tag: string): Element | null {
  let p: Element | null = el.parentElement;
  while (p) {
    if (p.tagName === tag) return p;
    p = p.parentElement;
  }
  return null;
}

function rowCells(tr: Element): string[] {
  const cells: string[] = [];
  // Direct <w:tc> children only (avoid nested tables).
  for (let i = 0; i < tr.children.length; i++) {
    const c = tr.children[i];
    if (c.tagName === "w:tc") cells.push(cellText(c));
  }
  return cells;
}

const has = (s: string, ...needles: string[]) => {
  const up = s.toUpperCase();
  return needles.some((n) => up.includes(n));
};

/** Parse a .docx roster file. Never throws — errors land in `result.error`. */
export async function parseStudentsDocx(buffer: ArrayBuffer): Promise<ParseResult> {
  let xml: string;
  try {
    if (typeof DecompressionStream === "undefined") {
      return {
        students: [],
        ignored: 0,
        error: "Votre navigateur ne sait pas lire les fichiers .docx (mise à jour requise).",
      };
    }
    const entries = await readZipEntries(buffer);
    const docXml = entries.get("word/document.xml");
    if (!docXml) throw new Error("word/document.xml introuvable dans le fichier .docx.");
    xml = new TextDecoder("utf-8").decode(docXml);
  } catch (e) {
    return {
      students: [],
      ignored: 0,
      error: e instanceof Error ? e.message : "Lecture du fichier .docx impossible.",
    };
  }

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    return { students: [], ignored: 0, error: "Document Word illisible (XML corrompu)." };
  }

  // Find the grading grid: the table whose header row names NOM + FORCE.
  const tables = Array.from(doc.getElementsByTagName("w:tbl"));
  let grid: { rows: Element[]; header: string[]; headerIdx: number } | null = null;

  for (const tbl of tables) {
    const rows = Array.from(tbl.getElementsByTagName("w:tr")).filter(
      (tr) => closestTag(tr, "w:tbl") === tbl,
    );
    for (let i = 0; i < rows.length; i++) {
      const c = rowCells(rows[i]);
      if (c.some((x) => has(x, "NOM")) && c.some((x) => has(x, "FORCE"))) {
        grid = { rows, header: c, headerIdx: i };
        break;
      }
    }
    if (grid) break;
  }

  if (!grid) {
    return {
      students: [],
      ignored: 0,
      error: "Tableau des élèves introuvable. Utilisez le modèle « Default_Grille.docx ».",
    };
  }

  // Resolve columns from the header labels.
  const col = (...needles: string[]) =>
    grid!.header.findIndex((h) => has(h, ...needles));
  const nameCol = col("NOM", "PRÉNOM", "PRENOM");
  const fCol = col("FORCE");
  const sCol = col("SOUPLESSE");
  const eCol = col("ÉQUIL", "EQUIL");

  if (nameCol === -1 || fCol === -1 || sCol === -1 || eCol === -1) {
    return {
      students: [],
      ignored: 0,
      error: "Colonnes du tableau non reconnues (Nom / Force / Souplesse / Équilibre).",
    };
  }

  const students: ParsedStudent[] = [];
  let ignored = 0;
  const labels = ["Force", "Souplesse", "Équilibre"] as const;

  for (let i = grid.headerIdx + 1; i < grid.rows.length; i++) {
    const cells = rowCells(grid.rows[i]);
    const prenom = (cells[nameCol] ?? "").trim();

    // Skip the sub-header ("Ecrire la note…"), the BILAN CLASSE summary row
    // (its marker sits in another column), and any row without a real name.
    const rowText = cells.join(" ");
    if (
      !prenom ||
      has(rowText, "BILAN") ||
      has(prenom, "ECRIRE", "NOM PRÉNOM", "NOM PRENOM", "MOY.")
    ) {
      if (cells.some((c) => c)) ignored++;
      continue;
    }

    const vs = [
      codeToScore(cells[fCol] ?? ""),
      codeToScore(cells[sCol] ?? ""),
      codeToScore(cells[eCol] ?? ""),
    ] as [number | null, number | null, number | null];

    const issues: string[] = [];
    vs.forEach((v, k) => {
      if (v === null) issues.push(`${labels[k]} manquante`);
      else if (v < 0 || v > 10) {
        issues.push(`${labels[k]} hors 0–10`);
        vs[k] = null;
      }
    });

    students.push({ prenom, vs, issues, complete: issues.length === 0 });
  }

  return { students, ignored };
}

// =============================================================================
// DOCX generation — fill the template grille with a class roster.
// We edit word/document.xml in place (names into the grid, scores cleared) and
// re-zip every entry. Output is deflate-compressed (method 8) via the native
// CompressionStream — still zero-dependency, still offline.
// =============================================================================

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs);
  return new Response(stream).arrayBuffer().then((ab) => new Uint8Array(ab));
}

/** Re-assemble a ZIP (method 8) from an ordered name → bytes map. */
async function writeZip(entries: Map<string, Uint8Array>): Promise<Blob> {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, data] of entries) {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const comp = await deflateRaw(data);

    const lh = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(lh.buffer);
    ldv.setUint32(0, 0x04034b50, true); // local file header sig
    ldv.setUint16(4, 20, true); // version needed
    ldv.setUint16(8, 8, true); // method = deflate
    ldv.setUint16(12, 0x21, true); // mod date (1980-01-01)
    ldv.setUint32(14, crc, true);
    ldv.setUint32(18, comp.length, true);
    ldv.setUint32(22, data.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    lh.set(nameBytes, 30);
    chunks.push(lh, comp);

    const ch = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(ch.buffer);
    cdv.setUint32(0, 0x02014b50, true); // central dir header sig
    cdv.setUint16(4, 20, true); // version made by
    cdv.setUint16(6, 20, true); // version needed
    cdv.setUint16(10, 8, true); // method
    cdv.setUint16(14, 0x21, true); // mod date
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, comp.length, true);
    cdv.setUint32(24, data.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true); // local header offset
    ch.set(nameBytes, 46);
    central.push(ch);

    offset += lh.length + comp.length;
  }

  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true); // EOCD sig
  edv.setUint16(8, entries.size, true); // records on this disk
  edv.setUint16(10, entries.size, true); // total records
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, offset, true); // central dir offset

  return new Blob([...chunks, ...central, eocd] as BlobPart[], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/** Direct <w:tc> child elements of a row. */
function rowCellEls(tr: Element): Element[] {
  const cells: Element[] = [];
  for (let i = 0; i < tr.children.length; i++) {
    const c = tr.children[i];
    if (c.tagName === "w:tc") cells.push(c);
  }
  return cells;
}

/** Write text into a cell's first <w:t>, clearing any others. No-op for an
 *  empty cell with no <w:t> (used to leave score cells blank). */
function setCellText(tc: Element, text: string) {
  const ts = tc.getElementsByTagName("w:t");
  if (ts.length === 0) return;
  ts[0].textContent = text;
  for (let i = 1; i < ts.length; i++) ts[i].textContent = "";
}

export interface GrilleStudent {
  prenom: string;
}

/** Fetch the bundled blank template and return a grille filled with `roster`. */
export async function buildGrilleBlob(roster: GrilleStudent[]): Promise<Blob> {
  const res = await fetch("/Default_Grille.docx");
  if (!res.ok) throw new Error("Modèle introuvable");
  return generateGrilleDocx(await res.arrayBuffer(), roster);
}

/**
 * Produce a filled grille (.docx) from the template and a class roster. Each
 * numbered student row gets a name (scores left blank for hand-grading); rows
 * beyond the roster are blanked; a roster longer than the template extends it
 * by cloning the last row. Returns a downloadable Blob.
 */
export async function generateGrilleDocx(
  template: ArrayBuffer,
  roster: GrilleStudent[],
): Promise<Blob> {
  const entries = await readZipEntries(template);
  const docXml = entries.get("word/document.xml");
  if (!docXml) throw new Error("Modèle .docx invalide (document.xml manquant).");

  const doc = new DOMParser().parseFromString(
    new TextDecoder("utf-8").decode(docXml),
    "application/xml",
  );
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Modèle Word illisible (XML corrompu).");
  }

  // Locate the grid + header (same heuristic as the importer).
  let allRows: Element[] = [];
  let headerRow = -1;
  for (const tbl of Array.from(doc.getElementsByTagName("w:tbl"))) {
    const rows = Array.from(tbl.getElementsByTagName("w:tr")).filter(
      (tr) => closestTag(tr, "w:tbl") === tbl,
    );
    for (let i = 0; i < rows.length; i++) {
      const c = rowCells(rows[i]);
      if (c.some((x) => has(x, "NOM")) && c.some((x) => has(x, "FORCE"))) {
        allRows = rows;
        headerRow = i;
        break;
      }
    }
    if (headerRow > -1) break;
  }
  if (headerRow === -1) throw new Error("Tableau des élèves introuvable dans le modèle.");

  const header = rowCells(allRows[headerRow]);
  const col = (...needles: string[]) => header.findIndex((h) => has(h, ...needles));
  const nameCol = col("NOM", "PRÉNOM", "PRENOM");
  const fCol = col("FORCE");
  const sCol = col("SOUPLESSE");
  const eCol = col("ÉQUIL", "EQUIL");

  // Numbered student rows = rows after the header whose first cell is an integer.
  const dataRows = allRows
    .slice(headerRow + 1)
    .filter((tr) => /^\d+$/.test((rowCells(tr)[0] ?? "").trim()));
  if (dataRows.length === 0) throw new Error("Lignes d'élèves introuvables dans le modèle.");

  const tbody = dataRows[0].parentNode!;
  let lastRow: Element = dataRows[dataRows.length - 1];

  const writeRow = (tr: Element, index: number, prenom: string) => {
    const cells = rowCellEls(tr);
    if (cells[0]) setCellText(cells[0], String(index + 1)); // N°
    if (nameCol > -1 && cells[nameCol]) setCellText(cells[nameCol], prenom);
    for (const ci of [fCol, sCol, eCol]) {
      if (ci > -1 && cells[ci]) setCellText(cells[ci], ""); // blank score
    }
  };

  const total = Math.max(roster.length, dataRows.length);
  for (let i = 0; i < total; i++) {
    const prenom = i < roster.length ? roster[i].prenom : "";
    if (i < dataRows.length) {
      writeRow(dataRows[i], i, prenom);
    } else {
      const clone = lastRow.cloneNode(true) as Element;
      tbody.insertBefore(clone, lastRow.nextSibling);
      writeRow(clone, i, prenom);
      lastRow = clone;
    }
  }

  let out = new XMLSerializer().serializeToString(doc);
  // XMLSerializer drops the XML declaration — Word expects it back.
  if (!out.startsWith("<?xml")) {
    out = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n' + out;
  }
  entries.set("word/document.xml", new TextEncoder().encode(out));
  return writeZip(entries);
}
