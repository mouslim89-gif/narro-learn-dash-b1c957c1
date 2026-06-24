import kuromoji from 'kuromoji';

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

let tokenizer: Tokenizer | null = null;
let loadingPromise: Promise<Tokenizer> | null = null;

const DICT_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict';

export async function getTokenizer(): Promise<Tokenizer> {
  if (tokenizer) return tokenizer;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DICT_URL }).build((err, _tokenizer) => {
      if (err) {
        loadingPromise = null;
        reject(err);
        return;
      }
      tokenizer = _tokenizer;
      resolve(_tokenizer);
    });
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
  try {
    const t = await getTokenizer();
    const tokens = t.tokenize(text);

    return tokens.map((token) => {
      const surface = token.surface_form;
      const reading = token.reading;

      // Only provide reading if it's different from the surface and contains kanji
      // Kuromoji provides reading in Katakana, we convert to Hiragana
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
    return [{ t: text }];
  }
}
