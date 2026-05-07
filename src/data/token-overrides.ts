import type { BookToken } from "@/data/book-tokens";

/**
 * Per-book token overrides — format ultra-court.
 *
 * Chaque règle est un tableau : [match, ...replace]
 *   - match : "a|b|c"  (les tokens du texte à matcher, séparés par "|")
 *   - replace : "surface:reading:base:pos"  (reading, base et pos optionnels)
 *       · surface : ce qui s'affiche dans le texte
 *       · reading : furigana (kana)
 *       · base    : ce que le dictionnaire ira chercher
 *       · pos     : nature grammaticale — alias acceptés :
 *                   particle, verb, adj, noun, adv, aux, expr, conj, interj, pronoun
 *                   (ou directement le POS Kuromoji : 助詞, 動詞, 形容詞, …)
 *   - Pour la ponctuation : préfixe "!" → "!。"
 *   - Pour sauter un champ, laisse-le vide. Ex : "に:::particle"
 *
 * Exemples :
 *   ["何|も", "何も:なにも"]                     // 2 tokens → 1 token
 *   ["お",    "お:お:御"]                        // affiché "お", dico cherche "御"
 *   ["に",    "に:::particle"]                   // force POS particule
 *   ["桜|の|樹", "桜:さくら", "の", "樹:き"]      // multi-tokens en sortie
 *
 * Utilise '*' comme bookId pour appliquer à tous les livres.
 */
export type Rule = [match: string, ...replace: string[]];

export const tokenOverrides: Record<string, Rule[]> = {
  "*": [
    ["何|も", "何も:なにも"],
    ["お", "お:お:御"],
    ["いつ|まで|も", "いつまでも"],
    ["に", "に:::particle"],
    ["の", "の:の::particle"],
    ["で|ある", "である::である"],
  ],
  urashima: [["りょう|し", "りょうし:りょうし:漁師"]],
};

// ─────────────────────────────────────────────────────────────
// Internals — pas besoin de toucher en dessous
// ─────────────────────────────────────────────────────────────

const POS_ALIASES: Record<string, string> = {
  particle: "助詞",
  verb: "動詞",
  adj: "形容詞",
  noun: "名詞",
  adv: "副詞",
  aux: "助動詞",
  expr: "表現",
  conj: "接続詞",
  interj: "感動詞",
  pronoun: "代名詞",
};

interface ParsedToken extends BookToken {
  __posOmitted?: boolean;
  __rOmitted?: boolean;
  __bOmitted?: boolean;
}

function parseToken(s: string): ParsedToken {
  const punct = s.startsWith("!");
  if (punct) s = s.slice(1);
  const [t, r, b, pos] = s.split(":");
  const resolvedPos = pos ? (POS_ALIASES[pos.toLowerCase()] ?? pos) : undefined;
  const posOmitted = !punct && !resolvedPos;
  const rOmitted = !r;
  const bOmitted = !b;
  const tok: ParsedToken = {
    t,
    j: !punct,
    p: punct ? "記号" : (resolvedPos ?? "名詞"),
  };
  if (posOmitted) tok.__posOmitted = true;
  if (rOmitted) tok.__rOmitted = true;
  if (bOmitted) tok.__bOmitted = true;
  if (r) tok.r = r;
  if (b) tok.b = b;
  return tok;
}

interface ParsedRule {
  match: string[];
  replace: BookToken[];
}

function parseRule(rule: Rule): ParsedRule | null {
  const [matchStr, ...replaceStrs] = rule;
  const match = matchStr
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (match.length === 0 || replaceStrs.length === 0) return null;
  return { match, replace: replaceStrs.map(parseToken) };
}

/** Apply an arbitrary list of raw Rule arrays to a token stream. */
export function applyRules(rawRules: Rule[], tokens: BookToken[]): BookToken[] {
  if (rawRules.length === 0) return tokens;
  const rules = rawRules
    .map(parseRule)
    .filter((r): r is ParsedRule => r !== null)
    .sort((a, b) => b.match.length - a.match.length);
  if (rules.length === 0) return tokens;
  return runRules(rules, tokens);
}

export function applyTokenOverrides(bookId: string, tokens: BookToken[]): BookToken[] {
  const raw = [...(tokenOverrides[bookId] ?? []), ...(tokenOverrides["*"] ?? [])];
  if (raw.length === 0) return tokens;

  const rules = raw
    .map(parseRule)
    .filter((r): r is ParsedRule => r !== null)
    .sort((a, b) => b.match.length - a.match.length);
  if (rules.length === 0) return tokens;
  return runRules(rules, tokens);
}

function runRules(rules: ParsedRule[], tokens: BookToken[]): BookToken[] {

  const out: BookToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    let matched: ParsedRule | null = null;
    for (const r of rules) {
      if (i + r.match.length > tokens.length) continue;
      let ok = true;
      for (let k = 0; k < r.match.length; k++) {
        if (tokens[i + k].t !== r.match[k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        matched = r;
        break;
      }
    }
    if (matched) {
      // For replacement tokens whose fields were omitted in the rule, inherit
      // them from the first matched token. This makes "Auto" preserve the
      // original Kuromoji info (POS, reading, base form).
      const src = tokens[i];
      for (const rt of matched.replace) {
        const anyRt = rt as ParsedToken;
        const { __posOmitted, __rOmitted, __bOmitted, ...clean } = anyRt;
        const merged: BookToken = { ...clean };
        if (__posOmitted && src?.p) merged.p = src.p;
        if (__rOmitted && src?.r) merged.r = src.r;
        if (__bOmitted && src?.b) merged.b = src.b;
        out.push(merged);
      }
      i += matched.match.length;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out;
}
