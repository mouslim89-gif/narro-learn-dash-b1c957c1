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

export const books: Book[] = [
  {
    id: 'momotaro',
    titleJp: '桃太郎',
    titleEn: 'Momotaro',
    author: 'Japanese Folklore',
    genre: 'folk-tales',
    jlptLevel: 'N5',
    coverColor: '#8B4513',
    readingTimeMin: 8,
    synopsis: 'The classic tale of a boy born from a peach who goes on a quest to defeat demons with his animal friends.',
    hasAudio: true,
    content: { simplified: momotaroSimplified, intermediate: momotaroIntermediate, original: momotaroOriginal },
  },
  {
    id: 'tsuru-no-ongaeshi',
    titleJp: '鶴の恩返し',
    titleEn: 'The Grateful Crane',
    author: 'Japanese Folklore',
    genre: 'folk-tales',
    jlptLevel: 'N4',
    coverColor: '#2F4F4F',
    readingTimeMin: 12,
    synopsis: 'A poor man saves a crane, which later returns in human form to repay his kindness by weaving beautiful cloth.',
    hasAudio: false,
    content: { simplified: tsuruSimplified, intermediate: tsuruIntermediate, original: tsuruOriginal },
  },
  {
    id: 'konbini-ningen',
    titleJp: 'コンビニ人間',
    titleEn: 'Convenience Store Woman',
    author: 'Murata Sayaka',
    genre: 'fiction',
    jlptLevel: 'N3',
    coverColor: '#4A4A6A',
    readingTimeMin: 25,
    synopsis: 'A woman finds meaning and identity working at a convenience store, challenging societal expectations.',
    hasAudio: true,
    content: { simplified: konbiniSimplified, intermediate: konbiniIntermediate, original: konbiniOriginal },
  },
  {
    id: 'ginga-tetsudo',
    titleJp: '銀河鉄道の夜',
    titleEn: 'Night on the Galactic Railroad',
    author: 'Miyazawa Kenji',
    genre: 'sci-fi',
    jlptLevel: 'N2',
    coverColor: '#1B2838',
    readingTimeMin: 30,
    synopsis: 'Two boys embark on a dreamlike journey across the Milky Way aboard a mysterious train.',
    hasAudio: false,
    content: { simplified: gingaSimplified, intermediate: gingaIntermediate, original: gingaOriginal },
  },
  {
    id: 'yoru-cafe',
    titleJp: '夜のカフェ',
    titleEn: 'Night Café',
    author: 'Tanaka Yuki',
    genre: 'slice-of-life',
    jlptLevel: 'N4',
    coverColor: '#5D4037',
    readingTimeMin: 15,
    synopsis: 'A cozy late-night café where lonely souls find unexpected connections over coffee and conversation.',
    hasAudio: true,
    content: { simplified: yoruSimplified, intermediate: yoruIntermediate, original: yoruOriginal },
  },
  {
    id: 'yami-no-koe',
    titleJp: '闇の声',
    titleEn: 'Voices in the Dark',
    author: 'Suzuki Ren',
    genre: 'horror',
    jlptLevel: 'N1',
    coverColor: '#1A1A2E',
    readingTimeMin: 20,
    synopsis: 'Strange whispers echo through an abandoned school, drawing a curious student deeper into its dark history.',
    hasAudio: false,
    content: { simplified: yamiSimplified, intermediate: yamiIntermediate, original: yamiOriginal },
  },
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
    hasAudio: true,
    content: { simplified: aAkiSimplified, intermediate: aAkiIntermediate, original: aAkiOriginal },
  },
];
