// Common particles
const PARTICLES = new Set(['は','が','を','に','へ','で','と','も','の','か','よ','ね','な','だ','から','まで','より','など','って','けど','けれど','ので','のに','ても','でも','しか','だけ','ばかり','こそ',
]);

// Auxiliary/suffix patterns that should be split from the preceding verb te-form
// e.g. 食べている → 食べて + いる, 走っていました → 走って + いました
const TE_SUFFIXES = ['おりました','いました','ありました','おります','います','あります','おった','いった','おる','いる','ある','おり','いた','あった','いく','くる','みる','しまう','しまった','しまいました','ください','くださった','ほしい','もらう','もらった','もらいました','あげる','あげた','くれる','くれた',
];
const SORTED_TE_SUFFIXES = TE_SUFFIXES.sort((a, b) => b.length - a.length);

// Common verb/adj endings to include with kanji
const VERB_ENDINGS = ['しました','ました','ません','られる','られた','させる','させた','れました','りました','きました','しまう','しまった','なければ','なかった','ないで','なくて','そうです','ようです','みたいです','らしい','んでいました','んでいる','んでいた','んでしまう','んでしまった','っている','っていた','っていました','ってしまう','ってしまった','いている','いていた','った','んだ','んで','って','いて','いだ','して','ます','ない','たい','よう','える','める','れる','せる','てる','ける','ねる','べる','いた','した','った','おる','ある','まる','める','みる','もる','がる','さる','ざる','く','ぐ','す','つ','ぬ','ぶ','む','る','う','き','ぎ','し','ち','に','び','み','り','い','け','げ','せ','て','ね','べ','め','れ','え',
];

// Sort by length descending for greedy match
const SORTED_VERB_ENDINGS = VERB_ENDINGS.sort((a, b) => b.length - a.length);
const SORTED_PARTICLES = Array.from(PARTICLES).sort((a, b) => b.length - a.length);

const OKURIGANA_MAX = 8;

function isKanji(ch: string): boolean {
 const code = ch.charCodeAt(0);
 return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) || code === 0x3005;
}

function isHiragana(ch: string): boolean {
 const code = ch.charCodeAt(0);
 return code >= 0x3040 && code <= 0x309F;
}

function isKatakana(ch: string): boolean {
 const code = ch.charCodeAt(0);
 return code >= 0x30A0 && code <= 0x30FF;
}

function isPunctuation(ch: string): boolean {
 return'。、！？「」『』（）・…ー〜～\n\r\t'.includes(ch);
}

export interface TextToken {
 text: string;
 isJapanese: boolean;
}

/**
 * Try to split a token at a て-form boundary.
 * e.g. "食べている" → ["食べて", "いる"]
 * e.g. "走っていました" → ["走って", "いました"]
 */
function trySplitTeForm(token: string): string[] | null {
 // Look for て or で in the token (te-form markers)
 const tePositions: number[] = [];
 for (let j = 1; j < token.length; j++) {
 if (token[j] ==='て'|| token[j] ==='で') {
 tePositions.push(j);
 }
 }

 for (const tePos of tePositions) {
 const afterTe = token.slice(tePos + 1);
 for (const suffix of SORTED_TE_SUFFIXES) {
 if (afterTe === suffix) {
 return [token.slice(0, tePos + 1), suffix];
 }
 }
 }
 return null;
}

/**
 * Tokenize Japanese text into clickable word-like chunks.
 * Splits particles aggressively and handles て-form compound verbs.
 */
export function tokenize(text: string): TextToken[] {
 const tokens: TextToken[] = [];
 let i = 0;

 while (i < text.length) {
 const ch = text[i];

 if (isPunctuation(ch)) {
 tokens.push({ text: ch, isJapanese: false });
 i++;
 continue;
 }

 // Kanji block + okurigana (verb/adj endings)
 if (isKanji(ch)) {
 let end = i + 1;
 while (end < text.length && isKanji(text[end])) end++;

 // Try matching known verb endings first (greedy, longest match)
 const remaining = text.slice(end);
 let bestEnding ='';
 for (const ending of SORTED_VERB_ENDINGS) {
 if (remaining.startsWith(ending)) {
 bestEnding = ending;
 break;
 }
 }

 if (bestEnding) {
 end += bestEnding.length;
 } else {
 // Fallback: add trailing hiragana up to a particle or limit
 // を is ALWAYS a particle (never okurigana), split even at position 0
 const ALWAYS_PARTICLE = new Set(['を']);
 const SINGLE_PARTICLES = new Set(['は','が','を','に','へ','で','と','も','の','か','よ','ね']);
 let hiraCount = 0;
 while (end < text.length && isHiragana(text[end]) && hiraCount < OKURIGANA_MAX) {
 if (ALWAYS_PARTICLE.has(text[end])) break;
 if (SINGLE_PARTICLES.has(text[end]) && hiraCount > 0) break;
 const rem = text.slice(end);
 let isMultiParticle = false;
 for (const p of SORTED_PARTICLES) {
 if (p.length > 1 && rem.startsWith(p)) { isMultiParticle = true; break; }
 }
 if (isMultiParticle && hiraCount > 0) break;
 end++;
 hiraCount++;
 }
 }

 const rawToken = text.slice(i, end);

 // Try splitting て-form compounds: 食べている → 食べて + いる
 const teSplit = trySplitTeForm(rawToken);
 if (teSplit) {
 for (const part of teSplit) {
 tokens.push({ text: part, isJapanese: true });
 }
 } else {
 tokens.push({ text: rawToken, isJapanese: true });
 }

 i = end;
 continue;
 }

 // Pure hiragana
 if (isHiragana(ch)) {
 // Check for particle first
 let matched = false;
 for (const p of SORTED_PARTICLES) {
 if (text.startsWith(p, i)) {
 tokens.push({ text: p, isJapanese: true });
 i += p.length;
 matched = true;
 break;
 }
 }
 if (matched) continue;

 let end = i + 1;
 while (end < text.length && isHiragana(text[end])) {
 let isParticle = false;
 for (const p of SORTED_PARTICLES) {
 if (text.startsWith(p, end)) {
 isParticle = true;
 break;
 }
 }
 if (isParticle) break;
 end++;
 }
 tokens.push({ text: text.slice(i, end), isJapanese: true });
 i = end;
 continue;
 }

 // Katakana run
 if (isKatakana(ch)) {
 let end = i + 1;
 while (end < text.length && (isKatakana(text[end]) || text[end] ==='ー')) end++;
 tokens.push({ text: text.slice(i, end), isJapanese: true });
 i = end;
 continue;
 }

 // Non-Japanese
 tokens.push({ text: ch, isJapanese: false });
 i++;
 }

 return tokens;
}
