import type { BookToken } from "@/data/book-tokens";

/**
 * Per-book token overrides — version simplifiée.
 *
 * Chaque règle est une string :  "match  =>  replace"
 *   - les tokens sont séparés par "|"
 *   - chaque token côté droit peut être enrichi avec :
 *        surface@reading           ex: "呑めそうな@のめそうな"
 *        surface@reading#base      ex: "呑めそうな@のめそうな#呑む"
 *        surface@reading#base:pos  ex: "呑めそうな@のめそうな#呑む:動詞/自立"
 *   - défaut : pos="名詞", j=true (japonais). Pour ponctuation, mets ":記号".
 *
 * Exemples :
 *   'sakura': [
 *     '桜の樹  =>  桜@さくら | の@の:助詞 | 樹@き',
 *     '呑め|そう|な  =>  呑めそうな@のめそうな#呑む:動詞/自立',
 *   ],
 *
 * Utilise '*' comme bookId pour appliquer à tous les livres.
 */
export const tokenOverrides: Record<string, string[]> = {
  // 'sakura': [
  //   '呑め|そう|な  =>  呑めそうな@のめそうな#呑む:動詞/自立',
  // ],
  "*": ["何|も  =>  何も"],
  urashima: ["りょう|し  =>  漁師@りょうし"],
};

// ─────────────────────────────────────────────────────────────
// Internals — pas besoin de toucher en dessous
// ─────────────────────────────────────────────────────────────

interface ParsedRule {
  match: string[];
  replace: BookToken[];
}

function parseToken(spec: string): BookToken {
  // surface@reading#base:pos
  let rest = spec.trim();
  let pos: string | undefined;
  let base: string | undefined;
  let reading: string | undefined;

  const colon = rest.indexOf(":");
  if (colon >= 0) {
    pos = rest.slice(colon + 1).trim();
    rest = rest.slice(0, colon);
  }
  const hash = rest.indexOf("#");
  if (hash >= 0) {
    base = rest.slice(hash + 1).trim();
    rest = rest.slice(0, hash);
  }
  const at = rest.indexOf("@");
  if (at >= 0) {
    reading = rest.slice(at + 1).trim();
    rest = rest.slice(0, at);
  }
  const surface = rest.trim();

  const tok: BookToken = { t: surface, j: pos !== "記号" };
  if (reading) tok.r = reading;
  if (base) tok.b = base;
  if (pos) tok.p = pos;
  else tok.p = "名詞";
  return tok;
}

function parseRule(rule: string): ParsedRule | null {
  const sep = rule.split("=>");
  if (sep.length !== 2) return null;
  const match = sep[0]
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const replace = sep[1]
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseToken);
  if (match.length === 0) return null;
  return { match, replace };
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
