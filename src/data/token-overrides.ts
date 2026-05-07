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
    ["の", "の:::particle"],
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

function parseToken(s: string): BookToken {
  const punct = s.startsWith("!");
  if (punct) s = s.slice(1);
  const [t, r, b, pos] = s.split(":");
  const resolvedPos = pos ? (POS_ALIASES[pos.toLowerCase()] ?? pos) : undefined;
  const tok: BookToken = {
    t,
    j: !punct,
  };
  if (punct) tok.p = "記号";
  else if (resolvedPos) tok.p = resolvedPos;
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

export function applyTokenOverrides(bookId: string, tokens: BookToken[]): BookToken[] {
  const raw = [...(tokenOverrides[bookId] ?? []), ...(tokenOverrides["*"] ?? [])];
  if (raw.length === 0) return tokens;

  const rules = raw
    .map(parseRule)
    .filter((r): r is ParsedRule => r !== null)
    .sort((a, b) => b.match.length - a.match.length);
  if (rules.length === 0) return tokens;

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
      out.push(...matched.replace);
      i += matched.match.length;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out;
}
