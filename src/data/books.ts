import { konbiniChapters } from './books/konbini-ningen';
import {
  kumoSimplified,
  kumoIntermediate,
  kumoOriginal,
  kumoSimplifiedParts,
  kumoIntermediateParts,
  kumoOriginalParts,
  kumoAnchors,
} from './books/kumo-no-ito';
import { rashomonSimplified, rashomonIntermediate, rashomonOriginal } from './books/rashomon';
import {
  merosuSimplified,
  merosuIntermediate,
  merosuOriginal,
  merosuSimplifiedParts,
  merosuIntermediateParts,
  merosuOriginalParts,
  merosuAnchors,
} from './books/hashire-merosu';
import {
  lemonSimplified,
  lemonIntermediate,
  lemonOriginal,
  lemonSimplifiedParts,
  lemonIntermediateParts,
  lemonOriginalParts,
  lemonAnchors,
} from './books/lemon';
import { hanaSimplified, hanaIntermediate, hanaOriginal } from './books/hana';
import { matsuSimplified, matsuIntermediate, matsuOriginal } from './books/matsu';
import {
  asaSimplified,
  asaIntermediate,
  asaOriginal,
  asaSimplifiedParts,
  asaIntermediateParts,
  asaOriginalParts,
  asaAnchors,
} from './books/asa';
import { gyofukukiSimplified, gyofukukiIntermediate, gyofukukiOriginal } from './books/gyofukuki';
import { sakuraSimplified, sakuraIntermediate, sakuraOriginal } from './books/sakura';
import { urashimaSimplified, urashimaIntermediate, urashimaOriginal } from './books/urashima';

export type Difficulty = 'simplified' | 'intermediate' | 'original';
export type Genre = 'folk-tales' | 'fiction' | 'sci-fi' | 'slice-of-life' | 'horror';

export interface Chapter {
  id: string;
  title: string;
  content: Record<Difficulty, string>;
}

/**
 * Per-difficulty audio metadata. A book can have audio for some difficulties only.
 *
 * To add audio for a book:
 *  1. Convert your audio to MP3 192kbps:
 *       ffmpeg -i input.wav -b:a 192k -ac 1 output.mp3
 *  2. Upload to Cloud Storage at: book-audio/{bookId}/{difficulty}.mp3
 *  3. Get the public URL and approximate duration (in seconds).
 *  4. Add the entry below in the book's `audio` field, e.g.:
 *       audio: { simplified: { durationSec: 920 } }
 *  5. The first user to play it triggers automatic sentence-timestamp generation
 *     via ElevenLabs Scribe (cached in DB + IndexedDB for everyone after that).
 */
export interface BookAudioVariant {
  /** Approximate total duration in seconds (informational; real value comes from <audio> metadata). */
  durationSec: number;
}

export type BookAudio = Partial<Record<Difficulty, BookAudioVariant>>;

export interface Book {
  id: string;
  titleJp: string;
  titleEn: string;
  author: string;
  genre: Genre;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  coverColor: string;
  readingTimeMin: number;
  synopsis: string;
  audio?: BookAudio;
  /**
   * Single-chapter content. Required for books WITHOUT a `chapters` array.
   * For multi-chapter books this is auto-derived from the first chapter (used as fallback).
   */
  content: Record<Difficulty, string>;
  /** Optional list of chapters. Presence of this field switches the BookDetail UI to chapter mode. */
  chapters?: Chapter[];
  /**
   * Optional narrative parts (synchronized across difficulties). When present,
   * `parts[difficulty].join("\n\n")` must equal `content[difficulty]` byte-for-byte.
   * `anchors[i]` is the English title of part i; same length as each parts array.
   */
  parts?: Record<Difficulty, string[]>;
  anchors?: string[];
}

/** True if the book has audio for at least one difficulty. */
export function hasAnyAudio(book: Book): boolean {
  return !!book.audio && Object.keys(book.audio).length > 0;
}

/** True if the book is split into multiple chapters. */
export function hasChapters(book: Book): boolean {
  return Array.isArray(book.chapters) && book.chapters.length > 0;
}

/** True if the book is split into multiple narrative parts (shared anchors across difficulties). */
export function hasParts(book: Book): boolean {
  return !!book.parts && !!book.anchors && book.anchors.length > 0;
}

/** Default chapter id used for single-chapter books (mirrors DB default). */
export const DEFAULT_CHAPTER_ID = 'main';

/** Parse a part chapterId (`part-N`, 1-indexed). Returns 0-indexed idx, or null. */
export function parsePartId(chapterId: string | undefined): number | null {
  if (!chapterId) return null;
  const m = /^part-(\d+)$/.exec(chapterId);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  return idx >= 0 ? idx : null;
}

/** Build a part chapterId from a 0-indexed part number. */
export function partChapterId(partIdx: number): string {
  return `part-${partIdx + 1}`;
}

/** Get the content for a given chapter / part (or main content otherwise). */
export function getChapterContent(book: Book, chapterId: string | undefined, difficulty: Difficulty): string {
  // Part-based books: chapterId of the form `part-N`.
  const partIdx = parsePartId(chapterId);
  if (partIdx !== null && book.parts) {
    const arr = book.parts[difficulty];
    if (arr && arr[partIdx] !== undefined) return arr[partIdx];
  }
  if (book.chapters && chapterId && chapterId !== DEFAULT_CHAPTER_ID) {
    const ch = book.chapters.find((c) => c.id === chapterId);
    if (ch) return ch.content[difficulty];
  }
  return book.content[difficulty];
}

/** Build the (bookId, chapterId) lookup key used for tokens / grammar / progress. */
export function chapterKey(bookId: string, chapterId?: string): string {
  if (!chapterId || chapterId === DEFAULT_CHAPTER_ID) return bookId;
  return `${bookId}__${chapterId}`;
}


export const genreLabels: Record<Genre, string> = {
  'folk-tales': 'Folk Tales',
  'fiction': 'Fiction',
  'sci-fi': 'Sci-Fi',
  'slice-of-life': 'Slice of Life',
  'horror': 'Horror',
};

export const difficultyConfig: Record<Difficulty, { label: string; description: string; color: string }> = {
  simplified: { label: 'Simplified', description: 'Common kanji, simple grammar', color: 'hsl(168, 50%, 35%)' },
  intermediate: { label: 'Intermediate', description: 'More kanji, moderate complexity', color: 'hsl(36, 60%, 45%)' },
  original: { label: 'Original', description: 'Full original Japanese text', color: 'hsl(0, 50%, 42%)' },
};

export const jlptColors: Record<string, string> = {
  N5: 'hsl(168, 50%, 35%)',
  N4: 'hsl(200, 55%, 42%)',
  N3: 'hsl(36, 60%, 45%)',
  N2: 'hsl(20, 60%, 45%)',
  N1: 'hsl(0, 50%, 42%)',
};

// A, Aki - Dazai Osamu
const aAkiSimplified = `ある詩人が秋について書いたノートを開きました。そこには短い言葉がたくさん書いてありました。
「とんぼ、すきとおる」と書いてあります。秋になると、とんぼの体が弱くなって、日の光に透けて見えるそうです。
「秋は夏の焼け残り」とも書いてあります。夏の終わりに残ったものが秋なのです。
「夏はシャンデリア、秋は灯ろう」と書いてあります。
「コスモス、悲しい」とも書いてあります。
ある日、詩人はそば屋で昔の写真を見ました。地震の後の町の写真でした。焼けた野原に、女の人がたった一人で座っていました。詩人はその女の人をとても可哀想に思いました。胸が苦しくなりました。今でも秋にコスモスを見ると、同じ気持ちになります。
「秋は夏と同じ時に来る」と書いてあります。
夏の中に、秋がもう静かに隠れています。でも、人は暑さに気づきません。よく聞くと、夏に虫が鳴いています。庭を見ると、ききょうの花も咲いています。とんぼも夏の虫です。柿の実も夏のうちにできています。
秋はずるい悪魔です。夏のうちに準備をしています。家族が「夏休みに海へ行こう」と楽しそうに話しているのを見ると、詩人は少し悲しくなります。秋がもう来ているからです。
「窓の外、庭の黒い土の上を、ぼろぼろの秋のちょうが歩いています。とても強くて、死にません」と書いてあります。詩人はこれを書いた時、とても苦しかったです。
「捨てられた海」とも書いてあります。
秋の海に行ったことがありますか。砂に破れた傘が落ちています。提灯も捨てられています。海は赤く濁っています。
「飛行機は秋が一番いい」と書いてあります。秋の会話を聞いて書いたようです。
最後に、農家、絵本、秋の蚕、火事、お寺、いろいろな言葉が書いてあります。`;

const aAkiIntermediate = `本職の詩人ともなれば、いつどんな注文があるかわからない。だから常に詩材の準備をしておくのである。
「秋について」という注文が来れば、「ア」の引き出しを開いて、愛、青、赤、アキ、いろいろのノートの中から、あきの部のノートを選び出し、落ち着いてそのノートを調べるのである。
「とんぼ、透き通る」と書いてある。秋になると、とんぼもひ弱く、肉体は死んで、精神だけがふらふら飛んでいる様子を指して言っているらしい。とんぼのからだが、秋の日ざしに透き通って見える。
「秋は夏の焼け残りさ」と書いてある。焦土である。
「夏はシャンデリア、秋は灯ろう」とも書いてある。
「コスモス、無残」と書いてある。
いつか郊外のそば屋で、ざるそばを待っている間に、古い雑誌を開いて見て、その中に大震災の写真があった。一面の焼け野原で、浴衣を着た女が、たった一人、疲れてしゃがんでいた。私は胸が焼け焦げるほどに、そのみじめな女を恋した。悲惨と情熱とは裏表のものらしい。息が止まるほどに苦しかった。枯れ野のコスモスに行き逢うと、私は同じ痛みを感じる。
「秋は夏と同時にやって来る」と書いてある。
夏の中に、秋がこっそり隠れて、もう来ているのだが、人は炎熱にだまされて、それを見破ることができない。耳を澄まして注意していると、夏になると同時に虫が鳴いているし、庭に気をくばっていると、ききょうの花も夏になるとすぐ咲いている。とんぼだって、もともと夏の虫だし、柿も夏のうちにちゃんと実を結んでいる。
秋は、ずるい悪魔だ。夏のうちに全部、身支度をととのえて、せせら笑ってしゃがんでいる。家の者が、夏を喜び海へ行こうか山へ行こうかなど、はしゃいで言っているのを見ると、ふびんに思う。もう秋が夏と一緒に忍び込んで来ているのに。
「窓の外、庭の黒土をバサバサ這いずり回っている醜い秋のちょうを見る。並はずれてたくましいから、死なずに居る」と書いてある。これを書いた時、私は大変苦しかった。
「捨てられた海」と書いてある。
秋の海水浴場に行ってみたことがあるか。なぎさに破れた絵日傘が打ち寄せられ、歓楽の跡、日の丸の提灯も捨てられ、紙くず、レコードの破片、海は薄赤く濁って、どたりどたりと波打っていた。
「飛行機は、秋が一番いいのですよ」これも秋の会話を盗み聞きして、そのまま書きとめておいたものらしい。
その他、農家。絵本。秋と兵隊。秋の蚕。火事。けむり。お寺。ごたごた一杯書かれてある。`;

const aAkiOriginal = `本職の詩人ともなれば、いつどんな注文があるか、わからないから、常に詩材の準備をして置くのである。
「秋について」という注文が来れば、よし来た、と「ア」の部の引き出しを開いて、愛、青、赤、アキ、いろいろのノオトがあって、そのうちの、あきの部のノオトを選び出し、落ちついてそのノオトを調べるのである。
　トンボ。スキトオル。と書いてある。
　秋になると、蜻蛉も、ひ弱く、肉体は死んで、精神だけがふらふら飛んでいる様子を指して言っている言葉らしい。蜻蛉のからだが、秋の日ざしに、透きとおって見える。
　秋ハ夏ノ焼ケ残リサ。と書いてある。焦土である。
　夏ハ、シャンデリヤ。秋ハ、燈籠。とも書いてある。
　コスモス、無残。と書いてある。
　いつか郊外のおそばやで、ざるそば待っている間に、食卓の上の古いグラフを開いて見て、そのなかに大震災の写真があった。一面の焼野原、市松の浴衣着た女が、たったひとり、疲れてしゃがんでいた。私は、胸が焼き焦げるほどにそのみじめな女を恋した。おそろしい情慾をさえ感じました。悲惨と情慾とはうらはらのものらしい。息がとまるほどに、苦しかった。枯野のコスモスに行き逢うと、私は、それと同じ痛苦を感じます。秋の朝顔も、コスモスと同じくらいに私を瞬時窒息させます。
　秋ハ夏ト同時ニヤッテ来ル。と書いてある。
　夏の中に、秋がこっそり隠れて、もはや来ているのであるが、人は、炎熱にだまされて、それを見破ることが出来ぬ。耳を澄まして注意をしていると、夏になると同時に、虫が鳴いているのだし、庭に気をくばって見ていると、桔梗の花も、夏になるとすぐ咲いているのを発見するし、蜻蛉だって、もともと夏の虫なんだし、柿も夏のうちにちゃんと実を結んでいるのだ。
　秋は、ずるい悪魔だ。夏のうちに全部、身支度をととのえて、せせら笑ってしゃがんでいる。僕くらいの炯眼の詩人になると、それを見破ることができる。家の者が、夏をよろこび海へ行こうか、山へ行こうかなど、はしゃいで言っているのを見ると、ふびんに思う。もう秋が夏と一緒に忍び込んで来ているのに。秋は、根強い曲者である。
　怪談ヨロシ。アンマ。モシ、モシ。マネク、ススキ。アノ裏ニハキット墓地ガアリマス。路問エバ、オンナ唖ナリ、枯野原。
　よく意味のわからぬことが、いろいろ書いてある。何かのメモのつもりであろうが、僕自身にも書いた動機が、よくわからぬ。
　窓外、庭ノ黒土ヲバサバサ這イズリマワッテイル醜キ秋ノ蝶ヲ見ル。並ハズレテ、タクマシキガ故ニ、死ナズ在リヌル。決シテ、ハカナキ態ニハ非ズ。と書かれてある。
　これを書きこんだときは、私は大へん苦しかった。いつ書きこんだか、私は決して忘れない。けれども、今は言わない。
　捨テラレタ海。と書かれてある。
　秋の海水浴場に行ってみたことがありますか。なぎさに破れた絵日傘が打ち寄せられ、歓楽の跡、日の丸の提灯も捨てられ、かんざし、紙屑、レコオドの破片、牛乳の空瓶、海は薄赤く濁って、どたりどたりと浪打っていた。
　緒方サンニハ、子供サンガアッタネ。秋ニナルト、肌ガカワイテ、ナツカシイワネ。飛行機ハ、秋ガ一バンイイノデスヨ。
　これもなんだか意味がよくわからぬが、秋の会話を盗み聞きして、そのまま書きとめて置いたものらしい。
　また、こんなのも、ある。芸術家ハ、イツモ、弱者ノ友デアッタ筈ナノニ。
　ちっとも秋に関係ない、そんな言葉まで、書かれてあるが、或いはこれも、「季節の思想」といったようなわけのものかも知れない。
　その他、農家。絵本。秋ト兵隊。秋ノ蚕。火事。ケムリ。オ寺。ごたごた一ぱい書かれてある。`;

// --- Konbini Ningen — derive book-level content from chapter 1 (used as fallback) ---
const konbiniCh1 = konbiniChapters[0];

export const books: Book[] = [
  {
    id: 'a-aki',
    titleJp: 'ア、秋',
    titleEn: 'A, Autumn',
    author: 'Dazai Osamu',
    genre: 'fiction',
    jlptLevel: 'N1',
    coverColor: '#B85C2A',
    readingTimeMin: 12,
    synopsis: "A poet flips through his notebook of autumn impressions — a transparent dragonfly, an abandoned beach, a stubborn butterfly crawling on black earth. Dazai's brief, melancholic meditation on a season that 'hides inside summer'.",
    audio: {
      // Stored at: book-audio/a-aki/simplified.mp3 (MP3 mono 24kHz, ~146s)
      simplified: { durationSec: 146 },
    },
    content: { simplified: aAkiSimplified, intermediate: aAkiIntermediate, original: aAkiOriginal },
  },
  {
    id: 'konbini-ningen',
    titleJp: 'コンビニ人間',
    titleEn: 'Convenience Store Woman',
    author: 'Sayaka Murata',
    genre: 'slice-of-life',
    jlptLevel: 'N1',
    coverColor: '#2A8C5F',
    readingTimeMin: 90,
    synopsis: "Keiko Furukura has worked at the Smile Mart for eighteen years. While society pressures her to pursue 'normal' goals — marriage, a career — she finds her sense of self only in the rhythms of the convenience store. A sharp, deadpan novel about conformity, identity, and the quiet defiance of choosing your own way of being human.",
    content: konbiniCh1.content, // Fallback content = chapter 1
    chapters: konbiniChapters,
  },
  {
    id: 'kumo-no-ito',
    titleJp: '蜘蛛の糸',
    titleEn: 'The Spider\u2019s Thread',
    author: 'Akutagawa Ryūnosuke',
    genre: 'fiction',
    jlptLevel: 'N2',
    coverColor: '#6B4F8F',
    readingTimeMin: 10,
    synopsis: "A Buddhist parable by Akutagawa. One morning in paradise, the Buddha lowers a single spider's thread into hell to save Kandata, a murderer who once spared the life of a spider. As Kandata climbs, other sinners follow him up the thread — and his reaction decides his fate. A short, luminous meditation on selfishness and compassion.",
    content: { simplified: kumoSimplified, intermediate: kumoIntermediate, original: kumoOriginal },
    parts: { simplified: kumoSimplifiedParts, intermediate: kumoIntermediateParts, original: kumoOriginalParts },
    anchors: kumoAnchors,
  },
  {
    id: 'rashomon',
    titleJp: '羅生門',
    titleEn: 'Rashōmon',
    author: 'Akutagawa Ryūnosuke',
    genre: 'fiction',
    jlptLevel: 'N1',
    coverColor: '#8B2E2E',
    readingTimeMin: 12,
    synopsis: "A masterless servant takes shelter from the rain under the crumbling Rashōmon gate, debating whether to starve or turn to crime. Climbing into the tower among the abandoned dead, he confronts an old woman pulling hair from a corpse — and what she says will tip his decision. Akutagawa's celebrated study of survival, morality, and the thin line between victim and villain.",
    content: { simplified: rashomonSimplified, intermediate: rashomonIntermediate, original: rashomonOriginal },
  },
  {
    id: 'hashire-merosu',
    titleJp: '走れメロス',
    titleEn: 'Run, Melos!',
    author: 'Dazai Osamu',
    genre: 'fiction',
    jlptLevel: 'N2',
    coverColor: '#C8956D',
    readingTimeMin: 25,
    synopsis: "Melos, a simple shepherd, is condemned to death after attempting to kill a paranoid tyrant. Granted three days to attend his sister's wedding, he leaves his best friend behind as hostage — and must race back through floods, bandits, and his own despair to save him. Dazai's celebrated tale of friendship, trust, and the impossible weight of a promise.",
    content: { simplified: merosuSimplified, intermediate: merosuIntermediate, original: merosuOriginal },
    parts: { simplified: merosuSimplifiedParts, intermediate: merosuIntermediateParts, original: merosuOriginalParts },
    anchors: merosuAnchors,
  },
  {
    id: 'lemon',
    titleJp: '檸檬',
    titleEn: 'Lemon',
    author: 'Kajii Motojirō',
    genre: 'fiction',
    jlptLevel: 'N2',
    coverColor: '#E8C547',
    readingTimeMin: 12,
    synopsis: "A young man weighed down by illness, debt, and an unnameable malaise wanders the back streets of Kyoto. A single lemon at a fruit stand transfigures his mood — and at the Maruzen bookstore, he leaves it perched atop a tower of art books, imagining it as a bright yellow bomb. Kajii's luminous Taishō-era prose poem on beauty, melancholy, and small acts of mischief.",
    content: { simplified: lemonSimplified, intermediate: lemonIntermediate, original: lemonOriginal },
    parts: { simplified: lemonSimplifiedParts, intermediate: lemonIntermediateParts, original: lemonOriginalParts },
    anchors: lemonAnchors,
  },
  {
    id: 'hana',
    titleJp: '鼻',
    titleEn: 'The Nose',
    author: 'Akutagawa Ryūnosuke',
    genre: 'fiction',
    jlptLevel: 'N3',
    coverColor: '#C97B5C',
    readingTimeMin: 10,
    synopsis: "Zenchi Naigu, an aging monk, is tormented by his absurdly long nose — fifteen centimeters of dangling sausage that hangs past his chin. Trying every remedy he can find, he finally succeeds in shrinking it. But the relief he expected turns into something stranger: those who once pitied him now openly laugh. Akutagawa's wry, compassionate parable on vanity, pity, and the secret cruelty of human kindness.",
    content: { simplified: hanaSimplified, intermediate: hanaIntermediate, original: hanaOriginal },
  },
  {
    id: 'matsu',
    titleJp: '待つ',
    titleEn: 'Waiting',
    author: 'Dazai Osamu',
    genre: 'fiction',
    jlptLevel: 'N4',
    coverColor: '#7A9BB8',
    readingTimeMin: 6,
    synopsis: "Every day, a twenty-year-old woman walks from the market to a small train station. She buys a ticket, sits on a cold bench, and waits. She doesn't know who she is waiting for — not a husband, not a lover, not a friend — only that she cannot stop. Dazai's brief, haunting wartime monologue on longing, loneliness, and the shape of an unnamed hope.",
    content: { simplified: matsuSimplified, intermediate: matsuIntermediate, original: matsuOriginal },
  },
  {
    id: 'asa',
    titleJp: '朝',
    titleEn: 'Morning',
    author: 'Dazai Osamu',
    genre: 'fiction',
    jlptLevel: 'N3',
    coverColor: '#E8A87C',
    readingTimeMin: 11,
    synopsis: "After a night of heavy drinking, Dazai's narrator collapses in the room of a young woman about to be married — not his lover, just someone he's promised her mother to look after. As a candle burns down in the darkness during a power cut, he counts the minutes between his desire and the dawn, hoping one of them will give out before the other. A short, wry, painfully honest sketch of weakness, restraint, and the saving grace of morning light.",
    content: { simplified: asaSimplified, intermediate: asaIntermediate, original: asaOriginal },
    parts: { simplified: asaSimplifiedParts, intermediate: asaIntermediateParts, original: asaOriginalParts },
    anchors: asaAnchors,
  },
  {
    id: 'gyofukuki',
    titleJp: '魚服記',
    titleEn: 'The Fish Tale',
    author: 'Dazai Osamu',
    genre: 'fiction',
    jlptLevel: 'N3',
    coverColor: '#5B7B8C',
    readingTimeMin: 10,
    synopsis: "Deep in a northern mountain, thirteen-year-old Suwa lives alone with her charcoal-burning father by a roaring waterfall. After a winter night when her drunken father becomes something monstrous, she flees into the blizzard and throws herself into the freezing pool — only to wake transformed, weightless, and finally free. Dazai's earliest masterpiece: a brutal folk tale that slips quietly into the miraculous.",
    content: { simplified: gyofukukiSimplified, intermediate: gyofukukiIntermediate, original: gyofukukiOriginal },
  },
  {
    id: 'sakura',
    titleJp: '桜の樹の下には',
    titleEn: 'Under the Cherry Tree',
    author: 'Kajii Motojirō',
    genre: 'fiction',
    jlptLevel: 'N2',
    coverColor: '#E8B4C8',
    readingTimeMin: 7,
    synopsis: "\"Bodies are buried beneath the cherry trees!\" Kajii's narrator confides his strange revelation to a friend: only the imagined corpses rotting underground could explain why the blossoms bloom with such unbearable beauty. A short, hallucinatory prose poem in which horror and rapture become indistinguishable.",
    content: { simplified: sakuraSimplified, intermediate: sakuraIntermediate, original: sakuraOriginal },
  },
  {
    id: 'urashima',
    titleJp: '浦島太郎',
    titleEn: 'Urashima Tarō',
    author: 'Kusuyama Masao',
    genre: 'fiction',
    jlptLevel: 'N4',
    coverColor: '#4A90B8',
    readingTimeMin: 9,
    synopsis: "A kind young fisherman saves a turtle from cruel children and is rewarded with a journey to the Dragon Palace beneath the waves, where Princess Otohime hosts him in a paradise of eternal seasons. Three carefree years later he returns home — only to discover that three hundred years have passed on land, and the small lacquered box the princess gave him holds a final, devastating gift.",
    content: { simplified: urashimaSimplified, intermediate: urashimaIntermediate, original: urashimaOriginal },
  },
];
