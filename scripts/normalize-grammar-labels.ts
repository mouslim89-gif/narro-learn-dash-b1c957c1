// Normalizes grammar note pattern/meaning/tip across src/data/book-grammar.ts:
// - Standardizes slot labels (plain form → Dictionary form, te-form → Te-form, etc.)
// - Capitalizes first letter of pattern, meaning, tip
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "src/data/book-grammar.ts";
const src = readFileSync(PATH, "utf8");

// Parse: extract the JS object literal after `export const bookGrammar: ... = ` up to the final `};`
const marker = "export const bookGrammar: Record<string, Record<string, GrammarNote[][]>> = ";
const idx = src.indexOf(marker);
if (idx < 0) throw new Error("marker not found");
const head = src.slice(0, idx + marker.length);
const tail = src.slice(idx + marker.length);
// tail ends with `};\n` (object literal terminator). Strip trailing `;` to JSON.parse.
const endIdx = tail.lastIndexOf("};");
const objLiteral = tail.slice(0, endIdx + 1); // includes `}`
const data = JSON.parse(objLiteral);

const labelMap: [RegExp, string][] = [
  [/\bplain\s*non[-\s]?past\b/gi, "Dictionary form"],
  [/\bplain\s*form\b/gi, "Dictionary form"],
  [/\bdictionary\s*form\b/gi, "Dictionary form"],
  [/\bjisho[-\s]?(form|kei)\b/gi, "Dictionary form"],
  [/\bplain\s*past\b/gi, "Plain past"],
  [/\bta[-\s]?form\b/gi, "Plain past"],
  [/\bplain\s*negative\b/gi, "Plain negative"],
  [/\bte[-\s]?form\b/gi, "Te-form"],
  [/\bmasu[-\s]?stem\b/gi, "Masu-stem"],
  [/\bverb[-\s]*stem\b/gi, "Stem"],
  [/\bi[-\s]?adjective\s*stem\b/gi, "I-adjective stem"],
  [/\bi[-\s]?adjective\b/gi, "I-adjective"],
  [/\bna[-\s]?adjective\s*stem\b/gi, "Na-adjective stem"],
  [/\bna[-\s]?adjective\b/gi, "Na-adjective"],
  [/\bvolitional\s*form\b/gi, "Volitional form"],
  [/\bvolitional\b/gi, "Volitional form"],
  [/\bverb[-\s]*conditional\b/gi, "Conditional form"],
  [/\bconditional\s*form\b/gi, "Conditional form"],
  [/\bba[-\s]?form\b/gi, "Conditional form"],
  [/\bpotential\s*form\b/gi, "Potential form"],
  [/\bpassive\s*form\b/gi, "Passive form"],
  [/\bcausative\s*form\b/gi, "Causative form"],
  [/\bimperative\s*form\b/gi, "Imperative form"],
  [/\bnoun\b/g, "Noun"],
  [/\bclause\b/gi, "Clause"],
  [/\bVolitional form form\b/gi, "Volitional form"],
];

const rashomonJPMap: [RegExp, string][] = [
  [/^(動詞の辞書形|動詞（辞書形）|動詞辞書形|辞書形)\s*(\+|＋)/, "Dictionary form +"],
  [/^(動詞のて形|動詞て形|て形)\s*(\+|＋)/, "Te-form +"],
  [/^(動詞のた形|た形|動詞た形)\s*(\+|＋)/, "Plain past +"],
  [/^(動詞の意向形|動詞意向形|（意向形）|意向形)\s*(\+|＋)/, "Volitional form +"],
  [/^(動詞の連用形|連用形|（動詞ます形）|ます形)\s*(\+|＋)/, "Masu-stem +"],
  [/^(動詞のない形|ない形)\s*(\+|＋)/, "Plain negative +"],
  [/^(動詞のば形|ば形)\s*(\+|＋)/, "Conditional form +"],
  [/^い形容詞（いを除く）\s*(\+|＋)/, "I-adjective +"],
  [/^い形容詞 de い除く\s*(\+|＋)/, "I-adjective +"],
  [/^（い形容詞）\s*(\+|＋)/, "I-adjective +"],
  [/^な形容詞\s*(\+|＋)/, "Na-adjective +"],
  [/^（な形容詞）\s*(\+|＋)/, "Na-adjective +"],
  [/^(名詞・動詞・形容詞|名詞・動詞|名詞)\s*(\+|＋)/, "Noun +"],
  [/^(疑問詞|（疑問詞）)\s*(\+|＋)/, "Question word +"],
];

const rashomonFullPatternMap: Record<string, string> = {
  "～ていました": "Te-form + いる",
  "～ている": "Te-form + いる",
  "～てある": "Te-form + ある",
  "～てあります": "Te-form + ある",
  "～てしまう": "Te-form + しまう",
  "～てしまった": "Te-form + しまう",
  "～てくる": "Te-form + くる",
  "～ていく": "Te-form + いく",
  "～ておく": "Te-form + おく",
  "～と (conditional)": "Dictionary form + と",
  "～と、～": "Dictionary form + と",
  "～と": "Dictionary form + と",
  "～たら": "Plain past + ら",
  "もし～たら、～だろう": "Plain past + ら",
  "～ば": "Conditional form + ば",
  "～ばいい": "Conditional form + ばいい",
  "～なくていい": "Plain negative + くていい",
  "～てもいい": "Te-form + もいい",
  "～な (禁止)": "Dictionary form + な (prohibition)",
  "～な（禁止）": "Dictionary form + な (prohibition)",
  "～な": "Dictionary form + な (prohibition)",
  "～だな": "Dictionary form + な (prohibition)",
  "～ながら": "Masu-stem + ながら",
  "～始める": "Masu-stem + 始める",
  "～はじめる": "Masu-stem + 始める",
  "～込む": "Masu-stem + 込む",
  "～去る（～さる）": "Masu-stem + 去る",
  "～つめる（上りつめる）": "Masu-stem + つめる",
  "～たい": "Masu-stem + たい",
  "～たがる": "I-adjective + がる",
  "～がる": "I-adjective + がる",
  "～がる / ～がって": "I-adjective + がる",
  "～くなる / ～になる": "I-adjective + くなる / Na-adjective + になる",
  "（い形容詞）～くなる / （な形容詞）～になる": "I-adjective + くなる / Na-adjective + になる",
  "～ようになる": "Dictionary form + ようになる",
  "～（意向形）とおもう": "Volitional form + と思う",
  "～（意向形）と思う": "Volitional form + と思う",
  "（意向形）＋と思う": "Volitional form + と思う",
  "～と思う": "Volitional form + と思う",
  "～ようとする": "Volitional form + とする",
  "動詞意向形 ＋ とする": "Volitional form + とする",
  "～ほど": "Noun + ほど",
  "～ほど / ～ほどの": "Noun + ほど",
  "～ほど / ～ほど～ない": "Noun + ほど",
  "名詞・動詞 ＋ ほど": "Noun + ほど",
  "～ばかり": "Dictionary form + ばかり",
  "～ばかりか / ～ばかりでなく": "Dictionary form + ばかりか",
  "～ばかりである / ～のみである": "Dictionary form + ばかりである",
  "～はず": "Dictionary form + はず",
  "～はずだ": "Dictionary form + はず",
  "～はずです": "Dictionary form + はず",
  "～はず（～筈）": "Dictionary form + はず",
  "～はずだ / ～はずである": "Dictionary form + はず",
  "～つもりだ": "Dictionary form + つもり",
  "～かもしれない": "Dictionary form + かもしれない",
  "～らしい": "Dictionary form + らしい",
  "～ようだ": "Dictionary form + ようだ",
  "～ようです": "Dictionary form + ようだ",
  "～のような / ～のように": "Noun + のような",
  "～ように": "Dictionary form + ように",
  "～ように（気をつける）": "Dictionary form + ように",
  "～そうです (hearsay)": "Dictionary form + そうだ (hearsay)",
  "～そうだ": "Dictionary form + そうだ (hearsay)",
  "～そうなものだ": "Dictionary form + そうなものだ",
  "動詞の連用形 ＋ そうだ ＞ いそうだ": "Masu-stem + そうだ",
  "～られそう / ～れそう": "Masu-stem + そう",
  "～ために": "Dictionary form + ために",
  "～ため": "Dictionary form + ために",
  "～のに": "Dictionary form + のに",
  "～のだ / ～んだ": "Dictionary form + のだ",
  "～の (nominalizer)": "Dictionary form + の",
  "～の（を・は・が）": "Dictionary form + の",
  "～の（名詞化）": "Dictionary form + の",
  "～のは": "Clause + のは",
  "～ことがある": "Plain past + ことがあります",
  "～ことにする": "Dictionary form + ことにする",
  "～という事": "Noun + という + Noun",
  "Noun + という + Noun": "Noun + という + Noun",
  "～ぬ": "Plain negative + ぬ",
  "～ぬ（～ず）": "Plain negative + ぬ",
  "～ず（に）": "Plain negative + ずに",
  "～ずに": "Plain negative + ずに",
  "～ねば (ならぬ)": "Plain negative + ねばならぬ",
  "～ねば (ならぬ / ならぬ)": "Plain negative + ねばならぬ",
  "～なさい": "Masu-stem + なさい",
  "～なんて": "Clause + なんて",
  "なんて～（だ）": "Clause + なんて",
  "～なければ": "Plain negative + ければ",
  "～ないと": "Plain negative + と",
  "～せる / ～させる": "Causative form + せる / させる",
  "～れる / ～られる": "Passive form + れる / られる",
  "～や～など": "Noun + や〜など",
  "～以上（は）": "Noun + 以上（は）",
  "～にほかならない": "Noun + にほかならない",
  "～あげくに / ～あげくの": "Noun + あげくに",
  "～よりほかに（仕方がない）": "Noun + よりほかに（仕方がない）",
  "～に従って": "Noun + に従って",
  "～に対する": "Noun + に対する",
  "～と言ってもいい": "Clause + と言ってもいい",
  "～と言うまでもない": "Clause + は言うまでもない",
  "～は言うまでもない": "Clause + は言うまでもない",
  "～は云うまでもない": "Clause + は言うまでもない",
  "～がゆえに (～が故に)": "Clause + がゆえに",
  "～ともなれば / ～ともなると": "Noun + ともなれば",
  "～せいか": "Clause + せいか",
  "～まい / ～まいか": "Dictionary form + まい",
  "～べからざる": "Dictionary form + べからざる",
  "～なり / ～たなり": "Plain past + なり",
  "～体 (てい) だ": "Noun + 体 (てい) だ",
  "～であろう / ～だろう": "Dictionary form + であろう",
  "～だろう": "Dictionary form + だろう",
  "～かかる / ～かかった": "Masu-stem + かかる",
  "～かかかる / ～かかった": "Masu-stem + かかる",
  "～ねば": "Plain negative + ねば",
  "～たことであろう / ～たであろう": "Plain past + ことであろう",
  "～たことであろう / ～たであろ": "Plain past + ことであろう",
  "なぜかというと ～ からだ": "Clause + からだ",
  "～からだ": "Clause + からだ",
  "～からだ / ～からです": "Clause + からだ",
  "～て (接続)": "Te-form + (connective)",
  "動詞た形 + 名詞": "Plain past + Noun",
  "～を": "Noun + を",
  "～の中に": "Noun + のの中に",
  "～とか～とか": "Noun + とか〜とか",
  "～よう (Volitional form)": "Volitional form",
};

function normalizeRashomon(pattern: string): string {
  // 1. Check full pattern map first
  if (rashomonFullPatternMap[pattern]) {
    return rashomonFullPatternMap[pattern];
  }

  let out = pattern;

  // 2. Try prefix replacements
  for (const [re, rep] of rashomonJPMap) {
    if (re.test(out)) {
      out = out.replace(re, rep);
      break;
    }
  }

  // 3. Generic cleaning
  out = out.replace(/＋/g, "+");
  // Normalize spacing around +
  if (out.includes("+")) {
    const parts = out.split("+");
    out = parts.map((p) => p.trim()).join(" + ");
  }

  return out;
}

function normalize(s: string, book: string, key: string): string {
  if (!s) return s;
  let out = s;

  // Apply special Rashomon normalization to "pattern" field only
  if (book === "rashomon" && key === "pattern") {
    out = normalizeRashomon(out);
  }

  for (const [re, rep] of labelMap) out = out.replace(re, rep);

  // cleanup double Volitional form form
  out = out.replace(/\bVolitional form form\b/gi, "Volitional form");

  // capitalize first letter (skip if starts with non-letter like ～ or 〜 or Japanese)
  const first = out.charAt(0);
  if (/[a-z]/.test(first)) out = first.toUpperCase() + out.slice(1);
  return out;
}

let count = 0;
for (const book of Object.keys(data)) {
  for (const diff of Object.keys(data[book])) {
    const parts = data[book][diff];
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (!Array.isArray(part)) continue;
      for (const note of part) {
        for (const k of ["pattern", "meaning", "tip"] as const) {
          if (typeof note[k] === "string") {
            const n = normalize(note[k], book, k);
            if (n !== note[k]) {
              count++;
              note[k] = n;
            }
          }
        }
      }
    }
  }
}

const newObj = JSON.stringify(data);
writeFileSync(PATH, head + newObj + ";\n");
console.log(`Normalized ${count} fields.`);
