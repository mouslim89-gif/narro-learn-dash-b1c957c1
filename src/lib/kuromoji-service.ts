import * as kuromoji from 'kuromoji';

// More robust access to the builder
const getBuilder = () => {
  if ((kuromoji as any).builder) return (kuromoji as any).builder;
  if ((kuromoji as any).default && (kuromoji as any).default.builder) return (kuromoji as any).default.builder;
  return null;
};

type Tokenizer = any;

let tokenizer: Tokenizer | null = null;
let loadingPromise: Promise<Tokenizer> | null = null;

// Use a reliable CDN for the dictionaries (must end with a slash)
const DICT_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

export async function getTokenizer(): Promise<Tokenizer> {
  if (tokenizer) return tokenizer;
  if (loadingPromise) return loadingPromise;

  console.log('Initializing Kuromoji tokenizer with dict path:', DICT_URL);
  loadingPromise = new Promise((resolve, reject) => {
    try {
      const builder = getBuilder();
      if (!builder) {
        throw new Error('Kuromoji builder not found in module');
      }
      builder({ dicPath: DICT_URL }).build((err: any, _tokenizer: any) => {
        if (err) {
          console.error('Kuromoji builder error details:', err);
          loadingPromise = null;
          reject(err);
          return;
        }
        console.log('Kuromoji tokenizer successfully initialized');
        tokenizer = _tokenizer;
        resolve(_tokenizer);
      });
    } catch (e) {
      console.error('Kuromoji initialization caught exception:', e);
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

    return tokens.map((token) => {
      const surface = token.surface_form;
      const reading = token.reading;

      // Kuromoji provides reading in Katakana, we convert to Hiragana
      // Only provide reading if it's different from the surface and contains kanji
      if (reading && reading !== '*' && surface !== reading) {
        const hiraganaReading = katakanaToHiragana(reading);
        // Basic check to see if the surface has kanji (otherwise reading is redundant)
        if (/[\u4e00-\u9fff]/.test(surface)) {
          return { t: surface, r: hiraganaReading };
        }
      }

      return { t: surface };
    });
  } catch (err) {
    console.error('Kuromoji tokenization failed:', err);
    // Return a single token with the full text as fallback
    return [{ t: text }];
  }
}
