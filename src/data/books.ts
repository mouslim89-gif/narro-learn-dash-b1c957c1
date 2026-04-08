export type Difficulty = 'simplified' | 'intermediate' | 'original';
export type Genre = 'folk-tales' | 'fiction' | 'sci-fi' | 'slice-of-life' | 'horror';

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
  hasAudio: boolean;
  content: Record<Difficulty, string>;
}

export const genreLabels: Record<Genre, string> = {
  'folk-tales': '📜 Folk Tales',
  'fiction': '📖 Fiction',
  'sci-fi': '🚀 Sci-Fi',
  'slice-of-life': '🌸 Slice of Life',
  'horror': '👻 Horror',
};

export const difficultyConfig: Record<Difficulty, { label: string; emoji: string; color: string }> = {
  simplified: { label: 'Simplified', emoji: '🟢', color: 'hsl(168, 72%, 40%)' },
  intermediate: { label: 'Intermediate', emoji: '🟡', color: 'hsl(45, 90%, 55%)' },
  original: { label: 'Original', emoji: '🔴', color: 'hsl(0, 75%, 55%)' },
};

export const jlptColors: Record<string, string> = {
  N5: 'hsl(168, 72%, 40%)',
  N4: 'hsl(200, 80%, 50%)',
  N3: 'hsl(45, 90%, 55%)',
  N2: 'hsl(25, 90%, 58%)',
  N1: 'hsl(0, 75%, 55%)',
};

const sampleSimplified = `むかしむかし、あるところに、おじいさんとおばあさんがいました。おじいさんはやまへしばかりに、おばあさんはかわへせんたくにいきました。おばあさんがかわでせんたくをしていると、おおきなももがどんぶらこどんぶらこと、ながれてきました。おばあさんはそのももをひろって、いえにもってかえりました。`;

const sampleIntermediate = `昔々、ある所に、お爺さんとお婆さんが住んでいました。お爺さんは山へ柴刈りに、お婆さんは川へ洗濯に行きました。お婆さんが川で洗濯をしていると、大きな桃がどんぶらこどんぶらこと流れてきました。お婆さんはその桃を拾って家に持って帰りました。その桃を割ると、中から元気な男の子が飛び出してきました。`;

const sampleOriginal = `昔々、或る処に、翁と媼とが住んでおりました。翁は山へ柴刈りに、媼は川へ洗濯に参りました。媼が川辺にて洗い物をしておりますと、川上より大きな桃がどんぶらこどんぶらこと流れ来たりました。媼は其の桃を拾い上げ、家に持ち帰りました。翁と媼が桃を割りましたところ、中より元気な男児が飛び出して参りました。二人は大層喜び、桃太郎と名付けました。`;

export const books: Book[] = [
  {
    id: 'momotaro',
    titleJp: '桃太郎',
    titleEn: 'Momotaro',
    author: 'Japanese Folklore',
    genre: 'folk-tales',
    jlptLevel: 'N5',
    coverColor: 'hsl(340, 80%, 65%)',
    readingTimeMin: 8,
    synopsis: 'The classic tale of a boy born from a peach who goes on a quest to defeat demons with his animal friends.',
    hasAudio: true,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
  {
    id: 'tsuru-no-ongaeshi',
    titleJp: '鶴の恩返し',
    titleEn: 'The Grateful Crane',
    author: 'Japanese Folklore',
    genre: 'folk-tales',
    jlptLevel: 'N4',
    coverColor: 'hsl(200, 70%, 60%)',
    readingTimeMin: 12,
    synopsis: 'A poor man saves a crane, which later returns in human form to repay his kindness by weaving beautiful cloth.',
    hasAudio: false,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
  {
    id: 'konbini-ningen',
    titleJp: 'コンビニ人間',
    titleEn: 'Convenience Store Woman',
    author: 'Murata Sayaka',
    genre: 'fiction',
    jlptLevel: 'N3',
    coverColor: 'hsl(260, 60%, 58%)',
    readingTimeMin: 25,
    synopsis: 'A woman finds meaning and identity working at a convenience store, challenging societal expectations.',
    hasAudio: true,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
  {
    id: 'ginga-tetsudo',
    titleJp: '銀河鉄道の夜',
    titleEn: 'Night on the Galactic Railroad',
    author: 'Miyazawa Kenji',
    genre: 'sci-fi',
    jlptLevel: 'N2',
    coverColor: 'hsl(230, 70%, 45%)',
    readingTimeMin: 30,
    synopsis: 'Two boys embark on a dreamlike journey across the Milky Way aboard a mysterious train.',
    hasAudio: false,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
  {
    id: 'yoru-cafe',
    titleJp: '夜のカフェ',
    titleEn: 'Night Café',
    author: 'Tanaka Yuki',
    genre: 'slice-of-life',
    jlptLevel: 'N4',
    coverColor: 'hsl(30, 80%, 55%)',
    readingTimeMin: 15,
    synopsis: 'A cozy late-night café where lonely souls find unexpected connections over coffee and conversation.',
    hasAudio: true,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
  {
    id: 'yami-no-koe',
    titleJp: '闇の声',
    titleEn: 'Voices in the Dark',
    author: 'Suzuki Ren',
    genre: 'horror',
    jlptLevel: 'N1',
    coverColor: 'hsl(280, 40%, 25%)',
    readingTimeMin: 20,
    synopsis: 'Strange whispers echo through an abandoned school, drawing a curious student deeper into its dark history.',
    hasAudio: false,
    content: { simplified: sampleSimplified, intermediate: sampleIntermediate, original: sampleOriginal },
  },
];
