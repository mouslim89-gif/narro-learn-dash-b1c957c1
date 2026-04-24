/**
 * Build-time script: tokenize all book texts with Kuromoji
 * Run: npx tsx scripts/generate-tokens.ts
 */
import kuromoji from 'kuromoji';
import * as path from 'path';
import * as fs from 'fs';
import { bookReadingOverrides } from '../src/data/book-reading-overrides';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const booksPath = path.resolve(__dirname, '../src/data/books.ts');
const booksSource = fs.readFileSync(booksPath, 'utf-8');

type Difficulty = 'simplified' | 'intermediate' | 'original';

interface BookContent {
  id: string;
  content: Record<Difficulty, string>;
}

function extractBookContents(): BookContent[] {
  const books: BookContent[] = [];
  const varPattern = /const\s+(\w+)\s*=\s*`([^`]*)`/g;
  const vars: Record<string, string> = {};
  let match;
  while ((match = varPattern.exec(booksSource)) !== null) {
    vars[match[1]] = match[2];
  }
  const bookPattern = /id:\s*'([^']+)'[\s\S]*?content:\s*\{\s*simplified:\s*(\w+)\s*,\s*intermediate:\s*(\w+)\s*,\s*original:\s*(\w+)\s*\}/g;
  while ((match = bookPattern.exec(booksSource)) !== null) {
    const [, id, simpVar, intVar, origVar] = match;
    books.push({
      id,
      content: {
        simplified: vars[simpVar] || '',
        intermediate: vars[intVar] || '',
        original: vars[origVar] || '',
      }
    });
  }
  return books;
}

interface KToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  basic_form: string;
  reading: string;
}

interface OutputToken {
  t: string;     // text
  j: boolean;    // isJapanese
  r?: string;    // reading (hiragana)
  b?: string;    // baseForm (dictionary form)
  p?: string;    // pos
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// Reading overrides for known Kuromoji mistakes
const READING_OVERRIDES: Record<string, string> = {
  '二人': 'ふたり',
  '或る': 'ある',
  '翁': 'おきな',
  '処': 'ところ',
  // A, Aki - Dazai
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

function isContentWord(kt: KToken): boolean {
  return CONTENT_POS.has(kt.pos);
}

function isIndependent(kt: KToken): boolean {
  return kt.pos_detail_1 === '自立' || kt.pos_detail_1 === '一般' || kt.pos_detail_1 === '固有名詞'
    || kt.pos_detail_1 === '数' || kt.pos_detail_1 === 'サ変接続' || kt.pos_detail_1 === '副詞可能'
    || kt.pos_detail_1 === '代名詞' || kt.pos === '副詞' || kt.pos === '連体詞' || kt.pos === '接続詞'
    || kt.pos === '感動詞' || kt.pos === '接頭詞' || kt.pos === 'フィラー';
}

function isAuxiliary(kt: KToken): boolean {
  return kt.pos === '助動詞';
}

function isDependentVerb(kt: KToken): boolean {
  return kt.pos === '動詞' && (kt.pos_detail_1 === '非自立' || kt.pos_detail_1 === '接尾');
}

function isTeFormParticle(kt: KToken): boolean {
  return kt.pos === '助詞' && kt.pos_detail_1 === '接続助詞' && (kt.surface_form === 'て' || kt.surface_form === 'で');
}

function isParticle(kt: KToken): boolean {
  return kt.pos === '助詞';
}

function isPunctuation(kt: KToken): boolean {
  return kt.pos === '記号';
}

/**
 * Merge Kuromoji morphemes into word-level tokens suitable for a reading app.
 * 
 * Strategy:
 * - An independent content word starts a new group
 * - Following auxiliaries (助動詞), dependent verbs (非自立), and te-form particles merge into the group
 * - Regular particles (は、が、を...) stay standalone
 * - Punctuation stays standalone
 */
function mergeTokens(kTokens: KToken[], bookOverrides: Record<string, string> = {}): OutputToken[] {
  const result: OutputToken[] = [];
  let i = 0;

  while (i < kTokens.length) {
    const kt = kTokens[i];

    // Punctuation / symbols → standalone non-Japanese
    if (isPunctuation(kt)) {
      result.push({ t: kt.surface_form, j: false });
      i++;
      continue;
    }

    // Regular particle → standalone Japanese
    if (isParticle(kt) && !isTeFormParticle(kt)) {
      result.push({
        t: kt.surface_form,
        j: true,
        r: kt.reading && kt.reading !== '*' ? katakanaToHiragana(kt.reading) : undefined,
        p: '助詞',
      });
      i++;
      continue;
    }

    // Content word (independent) → start a group, merge following dependents
    if (isContentWord(kt) && isIndependent(kt)) {
      // Apply reading overrides for known Kuromoji mistakes (book-specific takes priority)
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
        
        // Merge auxiliaries (ます, た, ない, etc.)
        if (isAuxiliary(next)) {
          text += next.surface_form;
          if (next.reading && next.reading !== '*') reading += next.reading;
          j++;
          continue;
        }
        
        // Merge dependent verbs (いる in ている)
        if (isDependentVerb(next)) {
          text += next.surface_form;
          if (next.reading && next.reading !== '*') reading += next.reading;
          j++;
          continue;
        }
        
        // Merge te-form particle + following dependent verb/auxiliary
        if (isTeFormParticle(next) && j + 1 < kTokens.length && (isDependentVerb(kTokens[j+1]) || isAuxiliary(kTokens[j+1]))) {
          text += next.surface_form;
          if (next.reading && next.reading !== '*') reading += next.reading;
          j++;
          continue;
        }
        
        // Merge te-form particle after adjective (嬉しくて → 嬉しい)
        if (isTeFormParticle(next) && kt.pos === '形容詞') {
          text += next.surface_form;
          if (next.reading && next.reading !== '*') reading += next.reading;
          j++;
          continue;
        }
        
        // Merge suffix nouns (接尾)
        if (next.pos === '名詞' && next.pos_detail_1 === '接尾') {
          text += next.surface_form;
          if (next.reading && next.reading !== '*') reading += next.reading;
          j++;
          continue;
        }

        // Merge compound nouns like きび+団子
        if (next.pos === '名詞' && next.pos_detail_1 === '一般' && kt.pos === '名詞' && text.length <= 3) {
          const compound = text + next.surface_form;
          if (compound === 'きび団子') {
            text = compound;
            if (next.reading && next.reading !== '*') reading += next.reading;
            j++;
            continue;
          }
        }
        
        break;
      }
      
      // Apply reading overrides for merged surface form (book-specific takes priority)
      const mergedOverride = bookOverrides[text] ?? READING_OVERRIDES[text];
      if (mergedOverride) {
        reading = mergedOverride;
      }

      const token: OutputToken = {
        t: text,
        j: true,
        p: pos,
      };
      if (reading) token.r = katakanaToHiragana(reading);
      if (baseForm !== text) token.b = baseForm;
      
      result.push(token);
      i = j;
      continue;
    }

    // Standalone auxiliary or dependent (rare at sentence start) → just output
    if (isAuxiliary(kt) || isDependentVerb(kt) || isContentWord(kt)) {
      const token: OutputToken = {
        t: kt.surface_form,
        j: true,
      };
      if (kt.reading && kt.reading !== '*') token.r = katakanaToHiragana(kt.reading);
      if (kt.basic_form && kt.basic_form !== '*' && kt.basic_form !== kt.surface_form) token.b = kt.basic_form;
      if (kt.pos !== '*') token.p = kt.pos;
      result.push(token);
      i++;
      continue;
    }

    // Te-form particle not followed by dependent verb → standalone
    if (isTeFormParticle(kt)) {
      result.push({ t: kt.surface_form, j: true, r: kt.surface_form, p: '助詞' });
      i++;
      continue;
    }

    // Fallback
    result.push({ t: kt.surface_form, j: false });
    i++;
  }

  // Post-process: merge known compound words that Kuromoji splits incorrectly
  return postMergeCompounds(result);
}

/** Merge adjacent tokens that form known compound words */
function postMergeCompounds(tokens: OutputToken[]): OutputToken[] {
  const COMPOUNDS: Record<string, { reading: string; pos: string }> = {
    'きび団子': { reading: 'きびだんご', pos: '名詞/一般' },
  };

  const result: OutputToken[] = [];
  let i = 0;
  while (i < tokens.length) {
    let merged = false;
    // Try merging 2-3 consecutive tokens
    for (let len = 3; len >= 2; len--) {
      if (i + len > tokens.length) continue;
      const combined = tokens.slice(i, i + len).map(t => t.t).join('');
      if (COMPOUNDS[combined]) {
        const { reading, pos } = COMPOUNDS[combined];
        result.push({ t: combined, j: true, r: reading, p: pos });
        i += len;
        merged = true;
        break;
      }
    }
    if (!merged) {
      result.push(tokens[i]);
      i++;
    }
  }
  return result;
}

async function main() {
  const books = extractBookContents();
  console.log(`Found ${books.length} books`);

  const dictPath = path.resolve(__dirname, '../node_modules/kuromoji/dict');
  const tokenizer = await new Promise<any>((resolve, reject) => {
    kuromoji.builder({ dicPath: dictPath }).build((err: Error | null, t: any) => {
      if (err) reject(err);
      else resolve(t);
    });
  });
  console.log('Kuromoji loaded');

  const allTokens: Record<string, Record<string, OutputToken[]>> = {};

  for (const book of books) {
    allTokens[book.id] = {};
    const bookOverrides = bookReadingOverrides[book.id] ?? {};
    for (const diff of ['simplified', 'intermediate', 'original'] as Difficulty[]) {
      const text = book.content[diff];
      if (!text) continue;

      const kTokens: KToken[] = tokenizer.tokenize(text);
      const merged = mergeTokens(kTokens, bookOverrides);
      allTokens[book.id][diff] = merged;
      console.log(`  ${book.id}/${diff}: ${kTokens.length} morphemes → ${merged.length} tokens`);
    }
  }

  // Output
  const outputPath = path.resolve(__dirname, '../src/data/book-tokens.ts');
  const output = `// Auto-generated by scripts/generate-tokens.ts using Kuromoji
// Do not edit manually - regenerate with: npx tsx scripts/generate-tokens.ts

export interface BookToken {
  /** surface text */
  t: string;
  /** is Japanese content (not punctuation) */
  j: boolean;
  /** reading in hiragana */
  r?: string;
  /** base/dictionary form (only if different from surface) */
  b?: string;
  /** part of speech (e.g. "動詞/自立", "形容詞/自立") */
  p?: string;
}

export const bookTokens: Record<string, Record<string, BookToken[]>> = ${JSON.stringify(allTokens, null, 0)};
`;

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\nWritten to ${outputPath} (${(Buffer.byteLength(output) / 1024).toFixed(0)} KB)`);
  
  // Print some sample merged tokens for verification
  const sample = allTokens['momotaro']['simplified'].slice(0, 30);
  console.log('\nSample (momotaro/simplified first 30 tokens):');
  for (const t of sample) {
    const parts = [t.t];
    if (t.r) parts.push(`[${t.r}]`);
    if (t.b) parts.push(`→${t.b}`);
    if (t.p) parts.push(`(${t.p})`);
    if (!t.j) parts.push('(punct)');
    console.log('  ' + parts.join(' '));
  }
}

main().catch(console.error);
