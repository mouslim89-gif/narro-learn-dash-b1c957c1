import type { BookToken } from '@/data/book-tokens';
import type { Rule } from '@/data/token-overrides';

const POS_TO_ALIAS: Record<string, string> = {
  助詞: 'particle',
  動詞: 'verb',
  形容詞: 'adj',
  名詞: 'noun',
  副詞: 'adv',
  助動詞: 'aux',
  表現: 'expr',
  接続詞: 'conj',
  感動詞: 'interj',
  代名詞: 'pronoun',
};

/**
 * Convention used by encodeReplacement:
 *  - tok.p === undefined  → POS omitted from rule (engine keeps original POS via fallback)
 *  - tok.p === '' (empty) → POS omitted (same as undefined)
 *  - tok.p === '<value>'  → emit alias or raw value
 *  - tok.j === false      → prefix '!' (punctuation)
 */
function encodeReplacement(tok: BookToken): string {
  const punct = tok.j === false;
  const t = tok.t;
  const r = tok.r ?? '';
  const b = tok.b ?? '';
  const pRaw = tok.p;
  let p = '';
  if (pRaw && pRaw.trim().length > 0) {
    p = POS_TO_ALIAS[pRaw] ?? pRaw;
  }
  const parts = [t, r, b, p];
  while (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
  return (punct ? '!' : '') + parts.join(':');
}

export function tokensToRule(matched: BookToken[], replacement: BookToken[]): Rule {
  const matchStr = matched.map((m) => m.t).join('|');
  const replaceStrs = replacement.map(encodeReplacement);
  return [matchStr, ...replaceStrs];
}

export function formatRule(rule: Rule): string {
  return '[' + rule.map((s) => JSON.stringify(s)).join(', ') + ']';
}

export function formatRulesBlock(rules: Rule[], scope: string): string {
  if (rules.length === 0) return `// (no rules for "${scope}")`;
  const header = scope === '*'
    ? `// Paste inside tokenOverrides["*"]:`
    : `// Paste inside tokenOverrides["${scope}"]:`;
  const lines = rules.map((r) => '  ' + formatRule(r) + ',');
  return [header, ...lines].join('\n');
}
