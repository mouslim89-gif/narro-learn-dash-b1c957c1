import * as kuromojiModule from 'kuromoji/build/kuromoji.js';

// The build/kuromoji.js is a UMD bundle. 
// In some environments, it might be on .default, in others directly on the module.
const kuromoji = (kuromojiModule as any).default || kuromojiModule;

type Tokenizer = any;

let tokenizer: Tokenizer | null = null;
let loadingPromise: Promise<Tokenizer> | null = null;

// unpkg is generally reliable for these files
const DICT_URL = 'https://unpkg.com/kuromoji@0.1.2/dict';

export async function getTokenizer(): Promise<Tokenizer> {
  if (tokenizer) return tokenizer;
  if (loadingPromise) return loadingPromise;

  console.log('Kuromoji: Starting initialization with dict path:', DICT_URL);
  
  loadingPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.error('Kuromoji: Initialization timed out after 10s');
      loadingPromise = null;
      reject(new Error('Kuromoji timeout'));
    }, 10000);

    try {
      const builder = kuromoji.builder ? kuromoji.builder({ dicPath: DICT_URL }) : null;
      
      if (!builder) {
        clearTimeout(timeout);
        console.error('Kuromoji: Builder not found in module', kuromoji);
        loadingPromise = null;
        reject(new Error('Builder not found'));
        return;
      }

      builder.build((err: any, _tokenizer: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error('Kuromoji: Builder error:', err);
          loadingPromise = null;
          reject(err);
          return;
        }
        console.log('Kuromoji: Successfully initialized');
        tokenizer = _tokenizer;
        resolve(_tokenizer);
      });
    } catch (e) {
      clearTimeout(timeout);
      console.error('Kuromoji: Initialization exception:', e);
      loadingPromise = null;
      reject(e);
    }
  });

  return loadingPromise;
}

export interface FuriganaToken {
  t: string; // text
  r?: string; // reading (hiragana)
}

function katakanaToHiragana(src: string): string {
  return src.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

export async function tokenizeToFurigana(text: string): Promise<FuriganaToken[]> {
  if (!text) return [];
  
  try {
    const t = await getTokenizer();
    const tokens = t.tokenize(text);

    const result = tokens.map((token: any) => {
      const surface = token.surface_form;
      const reading = token.reading;

      if (reading && reading !== '*' && surface !== reading) {
        const hiraganaReading = katakanaToHiragana(reading);
        if (/[\u4e00-\u9fff]/.test(surface)) {
          return { t: surface, r: hiraganaReading };
        }
      }
      return { t: surface };
    });

    console.log(`Kuromoji: Tokenized text (${text.slice(0, 10)}...):`, result);
    return result;
  } catch (err) {
    console.error('Kuromoji: Tokenization failed, using fallback:', err);
    return [{ t: text }];
  }
}

