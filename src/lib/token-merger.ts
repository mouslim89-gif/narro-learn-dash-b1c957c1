/**
 * Shared Kuromoji-output → reading-app-token merge logic.
 * Used by both the build-time script (scripts/generate-tokens.ts) and the
 * browser-side admin "recompute tokens" feature (src/lib/kuromoji-browser.ts).
 *
 * Keep this file dependency-free so it can be imported from Node or browser.
 */

export interface KToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  basic_form: string;
  reading: string;
}

export interface OutputToken {
  t: string;
  j: boolean;
  r?: string;
  b?: string;
  p?: string;
}

export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// Reading overrides for Kuromoji mistakes shared across all books.
export const READING_OVERRIDES: Record<string, string> = {
  '二人': 'ふたり',
  '或る': 'ある',
  '翁': 'おきな',
  '処': 'ところ',
  '蜻蛉': 'とんぼ',
  '桔梗': 'ききょう',
  '燈籠': 'とうろう',
  '灯ろう': 'とうろう',
  '炯眼': 'けいがん',
  '提灯': 'ちょうちん',
  '蚕': 'かいこ',
  '浴衣': 'ゆかた',
  '曲者': 'くせもの',
  '絵日傘': 'えひがさ',
  '空瓶': 'あきびん',
  '唖': 'おし',
  '黒土': 'くろつち',
  '窓外': 'そうがい',
  '焼野原': 'やけのはら',
  '焼け野原': 'やけのはら',
  '枯野': 'かれの',
  '枯れ野': 'かれの',
  '日ざし': 'ひざし',
  '透きとおる': 'すきとおる',
  '焼き焦げる': 'やきこげる',
  '焼け焦げる': 'やけこげる',
};

const CONTENT_POS = new Set(['名詞', '動詞', '形容詞', '形容動詞', '副詞', '連体詞', '接続詞', '感動詞', '接頭詞', 'フィラー']);

function isContentWord(kt: KToken): boolean { return CONTENT_POS.has(kt.pos); }
function isIndependent(kt: KToken): boolean {
  return kt.pos_detail_1 === '自立' || kt.pos_detail_1 === '一般' || kt.pos_detail_1 === '固有名詞'
    || kt.pos_detail_1 === '数' || kt.pos_detail_1 === 'サ変接続' || kt.pos_detail_1 === '副詞可能'
    || kt.pos_detail_1 === '代名詞' || kt.pos === '副詞' || kt.pos === '連体詞' || kt.pos === '接続詞'
    || kt.pos === '感動詞' || kt.pos === '接頭詞' || kt.pos === 'フィラー';
}
function isAuxiliary(kt: KToken): boolean { return kt.pos === '助動詞'; }
function isDependentVerb(kt: KToken): boolean {
  return kt.pos === '動詞' && (kt.pos_detail_1 === '非自立' || kt.pos_detail_1 === '接尾');
}
function isTeFormParticle(kt: KToken): boolean {
  return kt.pos === '助詞' && kt.pos_detail_1 === '接続助詞' && (kt.surface_form === 'て' || kt.surface_form === 'で');
}
function isParticle(kt: KToken): boolean { return kt.pos === '助詞'; }
function isPunctuation(kt: KToken): boolean { return kt.pos === '記号'; }

export function mergeTokens(kTokens: KToken[], bookOverrides: Record<string, string> = {}): OutputToken[] {
  const result: OutputToken[] = [];
  let i = 0;
  while (i < kTokens.length) {
    const kt = kTokens[i];
    if (isPunctuation(kt)) { result.push({ t: kt.surface_form, j: false }); i++; continue; }
    if (isParticle(kt) && !isTeFormParticle(kt)) {
      result.push({
        t: kt.surface_form, j: true,
        r: kt.reading && kt.reading !== '*' ? katakanaToHiragana(kt.reading) : undefined,
        p: '助詞',
      });
      i++; continue;
    }
    if (isContentWord(kt) && isIndependent(kt)) {
      const overrideReading = bookOverrides[kt.surface_form] ?? READING_OVERRIDES[kt.surface_form];
      let text = kt.surface_form;
      let reading = overrideReading
        ? katakanaToHiragana(overrideReading)
        : (kt.reading && kt.reading !== '*' ? kt.reading : '');
      const baseForm = kt.basic_form && kt.basic_form !== '*' ? kt.basic_form : kt.surface_form;
      const pos = kt.pos + (kt.pos_detail_1 !== '*' ? '/' + kt.pos_detail_1 : '');
      let j = i + 1;
      while (j < kTokens.length) {
        const next = kTokens[j];
        if (isAuxiliary(next)) { text += next.surface_form; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue; }
        if (isDependentVerb(next)) { text += next.surface_form; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue; }
        if (isTeFormParticle(next) && j + 1 < kTokens.length && (isDependentVerb(kTokens[j+1]) || isAuxiliary(kTokens[j+1]))) {
          text += next.surface_form; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue;
        }
        if (isTeFormParticle(next) && kt.pos === '形容詞') {
          text += next.surface_form; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue;
        }
        if (next.pos === '名詞' && next.pos_detail_1 === '接尾') {
          text += next.surface_form; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue;
        }
        if (next.pos === '名詞' && next.pos_detail_1 === '一般' && kt.pos === '名詞' && text.length <= 3) {
          const compound = text + next.surface_form;
          if (compound === 'きび団子') {
            text = compound; if (next.reading && next.reading !== '*') reading += next.reading; j++; continue;
          }
        }
        break;
      }
      const mergedOverride = bookOverrides[text] ?? READING_OVERRIDES[text];
      if (mergedOverride) reading = mergedOverride;
      const token: OutputToken = { t: text, j: true, p: pos };
      if (reading) token.r = katakanaToHiragana(reading);
      if (baseForm !== text) token.b = baseForm;
      result.push(token);
      i = j; continue;
    }
    if (isAuxiliary(kt) || isDependentVerb(kt) || isContentWord(kt)) {
      const token: OutputToken = { t: kt.surface_form, j: true };
      if (kt.reading && kt.reading !== '*') token.r = katakanaToHiragana(kt.reading);
      if (kt.basic_form && kt.basic_form !== '*' && kt.basic_form !== kt.surface_form) token.b = kt.basic_form;
      if (kt.pos !== '*') token.p = kt.pos;
      result.push(token); i++; continue;
    }
    if (isTeFormParticle(kt)) {
      result.push({ t: kt.surface_form, j: true, r: kt.surface_form, p: '助詞' }); i++; continue;
    }
    result.push({ t: kt.surface_form, j: false });
    i++;
  }
  return postMergeCompounds(result, bookOverrides);
}

function postMergeCompounds(tokens: OutputToken[], bookOverrides: Record<string, string> = {}): OutputToken[] {
  const BASE_COMPOUNDS: Record<string, { reading: string; pos: string }> = {
    'きび団子': { reading: 'きびだんご', pos: '名詞/一般' },
  };
  const compounds: Record<string, { reading: string; pos: string }> = { ...BASE_COMPOUNDS };
  for (const [surface, reading] of Object.entries(bookOverrides)) {
    if (surface.length >= 2 && !compounds[surface]) {
      compounds[surface] = { reading, pos: '名詞/一般' };
    }
  }
  const result: OutputToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    let merged = false;
    for (let len = 5; len >= 2; len--) {
      if (i + len > tokens.length) continue;
      const combined = tokens.slice(i, i + len).map(t => t.t).join('');
      if (compounds[combined]) {
        const { reading, pos } = compounds[combined];
        result.push({ t: combined, j: true, r: reading, p: pos });
        i += len; merged = true; break;
      }
    }
    if (!merged) { result.push(tokens[i]); i++; }
  }
  return splitNumerics(result);
}

const NUMERIC_KANJI_READINGS: Record<string, string> = {
  '一': 'いち', '二': 'に', '三': 'さん', '四': 'よん', '五': 'ご',
  '六': 'ろく', '七': 'なな', '八': 'はち', '九': 'きゅう', '十': 'じゅう',
  '百': 'ひゃく', '千': 'せん', '万': 'まん', '億': 'おく', '兆': 'ちょう',
  '〇': 'れい', '零': 'れい',
};
const NUMERIC_CHARS = new Set(Object.keys(NUMERIC_KANJI_READINGS).concat('０１２３４５６７８９0123456789'.split('')));

function splitNumerics(tokens: OutputToken[]): OutputToken[] {
  const out: OutputToken[] = [];
  for (const tok of tokens) {
    const isNumericPos = tok.p?.includes('数');
    if (!tok.j || !isNumericPos || tok.t.length <= 1) { out.push(tok); continue; }
    let split = 0;
    while (split < tok.t.length && NUMERIC_CHARS.has(tok.t[split])) split++;
    if (split <= 1 && split === tok.t.length) { out.push(tok); continue; }
    const numericPart = tok.t.slice(0, split);
    const rest = tok.t.slice(split);
    if (numericPart.length > 1) {
      for (const ch of numericPart) out.push({ t: ch, j: true, r: NUMERIC_KANJI_READINGS[ch] ?? ch, p: '名詞/数' });
    } else if (numericPart.length === 1) {
      out.push({ t: numericPart, j: true, r: NUMERIC_KANJI_READINGS[numericPart] ?? numericPart, p: '名詞/数' });
    }
    if (rest) out.push({ t: rest, j: true, p: '名詞/接尾' });
  }
  return out;
}
