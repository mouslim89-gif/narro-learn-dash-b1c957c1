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

// Momotaro - all levels use kanji
const momotaroSimplified = `昔々、ある所に、お爺さんとお婆さんが住んでいました。お爺さんは山へ行きました。お婆さんは川へ洗濯に行きました。お婆さんが川で洗濯をしていると、大きな桃が流れて来ました。お婆さんはその桃を拾って、家に持って帰りました。お爺さんとお婆さんが桃を切ると、中から男の子が出て来ました。二人はとても嬉しくて、その子を桃太郎と名付けました。桃太郎は大きくなりました。ある日、桃太郎は言いました。「鬼ヶ島へ行って、悪い鬼を退治します。」お爺さんとお婆さんは、きび団子を作ってくれました。`;

const momotaroIntermediate = `昔々、ある所に、お爺さんとお婆さんが住んでいました。お爺さんは山へ柴刈りに、お婆さんは川へ洗濯に行きました。お婆さんが川で洗濯をしていると、大きな桃がどんぶらこどんぶらこと流れてきました。お婆さんはその桃を拾って家に持って帰りました。その桃を割ると、中から元気な男の子が飛び出してきました。二人は大変喜んで、桃太郎と名付けました。桃太郎はすくすくと育ち、強い若者になりました。ある日、桃太郎は鬼ヶ島へ鬼退治に行くことを決意しました。お婆さんは日本一のきび団子を作ってくれました。道中、犬と猿と雉が仲間になりました。`;

const momotaroOriginal = `昔々、或る処に、翁と媼とが住んでおりました。翁は山へ柴刈りに、媼は川へ洗濯に参りました。媼が川辺にて洗い物をしておりますと、川上より大きな桃がどんぶらこどんぶらこと流れ来たりました。媼は其の桃を拾い上げ、家に持ち帰りました。翁と媼が桃を割りましたところ、中より元気な男児が飛び出して参りました。二人は大層喜び、桃太郎と名付けました。桃太郎は日に日に逞しく育ち、やがて立派な若者となりました。或る日、桃太郎は鬼ヶ島へ鬼征伐に赴くことを決意致しました。媼は日本一のきび団子を拵えてくれました。`;

// Tsuru no Ongaeshi
const tsuruSimplified = `昔、ある所に貧しい若者が住んでいました。ある冬の日、若者は雪の中で一羽の鶴を見つけました。鶴は罠に掛かっていました。若者は鶴を助けてあげました。その夜、美しい女の人が若者の家に来ました。「泊めてください」と女の人は言いました。若者は女の人を家に入れました。次の日から、女の人は機を織り始めました。「織っている間は、絶対に部屋を見ないでください」と女の人は言いました。女の人が織った布はとても美しくて、高い値段で売れました。`;

const tsuruIntermediate = `昔、ある所に貧しい若者が一人で暮らしていました。ある寒い冬の日のこと、若者は雪の降る野原で一羽の鶴が罠に掛かっているのを見つけました。若者は可哀想に思い、鶴を罠から解き放ってやりました。鶴は嬉しそうに空へ飛んで行きました。その晩のこと、若者の家の戸を叩く音がしました。戸を開けると、美しい娘が立っていました。「どうか一晩泊めてください」と娘は頼みました。若者は快く娘を迎え入れました。娘は機を織り始め、見事な反物を作りました。「織っている間は決して覗かないでください」と娘は約束させました。`;

const tsuruOriginal = `昔、或る処に貧しき若者が独り暮らしておりました。或る厳しき冬の日のこと、若者は雪降る野に一羽の鶴が罠に掛かり苦しんでおるのを見つけました。若者は不憫に思い、鶴を罠より解き放ちてやりました。鶴は歓喜の声を上げ、大空へと舞い上がりて行きました。其の晩のこと、若者の庵の戸を叩く者がありました。戸を開くれば、此の世のものとは思えぬほど美しき娘が佇んでおりました。「何卒一夜の宿をお貸しくださいませ」と娘は懇願致しました。若者は心よく娘を迎え入れました。`;

// Konbini Ningen
const konbiniSimplified = `私は毎日コンビニで働いています。朝六時に起きて、七時に店に着きます。制服を着ると、私は「コンビニの人間」になります。お客様が来ると、「いらっしゃいませ」と言います。商品を並べて、レジを打って、店を綺麗にします。これが私の毎日です。友達は言います。「普通の仕事を見つけなさい」と。でも、私にとってコンビニの仕事は普通です。私はここで十八年間働いています。結婚もしていません。子供もいません。それでも私は幸せです。`;

const konbiniIntermediate = `私は十八年間、同じコンビニで働き続けています。大学一年生の時にアルバイトを始めて以来、ずっとここにいます。制服に袖を通すと、私の体は自然にコンビニの店員として動き出します。「いらっしゃいませ」と声を出し、商品の陳列を確認し、賞味期限を点検する。その繰り返しが私の人生そのものです。周囲の人間は私を不思議がります。「いつまでコンビニで働くつもりなの」と聞かれるたびに、私は曖昧に微笑みます。彼らの言う「普通」が、私にはよく分かりません。`;

const konbiniOriginal = `私は十八年間に亘り、同一のコンビニエンスストアにて勤務し続けている。大学一年次にアルバイトとして採用されて以来、此の場所を離れたことがない。制服に袖を通す刹那、私の肉体は自律的にコンビニの店員として稼働し始める。「いらっしゃいませ」と発声し、商品の陳列を精査し、賞味期限を逐一確認する。此の反復が私の存在意義そのものである。周囲の人間は私を奇異の目で見る。「何時までコンビニで働き続けるつもりなのか」と問われる度に、私は曖昧な微笑を浮かべるのみである。`;

// Ginga Tetsudo
const gingaSimplified = `ジョバンニは丘の上に一人で座っていました。空には星がたくさん光っていました。突然、不思議な汽車が現れました。ジョバンニは汽車に乗りました。隣の席にはカムパネルラが座っていました。「どこへ行くの？」とジョバンニは聞きました。窓の外には銀河が広がっていました。白い星の砂が川のように流れていました。二人は不思議な旅を続けました。`;

const gingaIntermediate = `ジョバンニは丘の上の草に寝転んで、暗い空に輝く無数の星を眺めていました。すると突然、目の前に不思議な汽車が姿を現しました。銀色に光る車体は、まるで星屑で出来ているようでした。ジョバンニが車内に足を踏み入れると、親友のカムパネルラが既に座っていました。「僕たちはどこへ行くんだろう」とジョバンニは呟きました。窓の外には天の川が壮大に広がり、白銀の星々が河のように流れていました。`;

const gingaOriginal = `ジョバンニは丘の頂の草叢に身を横たえ、漆黒の蒼穹に燦然と輝く無数の星辰を凝視しておりました。すると忽然として、眼前に一輛の不可思議なる汽車が出現致しました。銀色に燦めく車体は、恰も星屑にて鋳造されたかの如くでありました。ジョバンニが車内に足を踏み入れますと、畏友カムパネルラが既に着席しておりました。「我々は一体何処へ赴くのであろう」とジョバンニは独語致しました。車窓の彼方には天の川が壮大に展開し、白銀の星辰が大河の如く流転しておりました。`;

// Yoru Cafe
const yoruSimplified = `夜の十時を過ぎると、この小さなカフェは静かになります。私はカウンターの中でコーヒーを淹れています。今夜の客は三人です。窓際の席に座っている女性は、毎週金曜日に来ます。いつも同じ本を読んでいます。角の席の男性は初めての客です。何か悩みがあるようです。「温かいものはいかがですか」と私は声を掛けました。彼は少し微笑んで、「カフェオレをお願いします」と答えました。`;

const yoruIntermediate = `夜の十時を回ると、この路地裏の小さなカフェは独特の静寂に包まれます。私はカウンターの内側で、丁寧にコーヒー豆を挽いています。豆の香りが店内に漂うと、客たちの表情が僅かに和らぐのが見えます。窓際の常連の女性は、毎週金曜日の夜にやって来ます。彼女はいつも同じ文庫本を開いていますが、頁はほとんど進んでいません。きっと本を読むためではなく、この空間に身を置くために来ているのでしょう。角の暗がりの席に、見慣れない男性が一人座っています。`;

const yoruOriginal = `夜の十時を回る頃、此の路地裏に佇む小さなカフェは独特の静謐に包まれます。私はカウンターの内側にて、入念に珈琲豆を挽いております。芳醇な豆の香気が店内に漂い始めると、客人たちの面持ちが僅かに和らぐのが窺えます。窓際の常連の女性は、毎週金曜の晩に足を運んで参ります。彼女は常に同じ文庫本を繙いておりますが、頁は殆ど捲られておりません。恐らく読書の為ではなく、此の空間に身を委ねる為に来ているのでありましょう。`;

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

// Yami no Koe
const yamiSimplified = `放課後の学校は静かでした。田中美咲は忘れ物を取りに、旧校舎へ向かいました。古い廊下を歩いていると、どこかから声が聞こえました。「助けて…」と小さな声が言いました。美咲は立ち止まりました。声は音楽室から聞こえてきます。扉を開けると、部屋は暗くて何も見えませんでした。「誰かいますか」と美咲は呼びかけました。返事はありませんでした。しかし、冷たい風が頬を撫でました。`;

const yamiIntermediate = `放課後の旧校舎は不気味な静寂に包まれていました。田中美咲は忘れ物を取りに来ただけのはずでした。しかし、古びた廊下を歩き始めた瞬間から、何かが違うと感じていました。空気が重く、まるで水の中を歩いているようでした。すると、微かな声が耳に届きました。「助けて…ここから出して…」声は壁の中から響いているようでした。美咲の心臓が激しく鼓動し始めました。声は音楽室の方角から聞こえてきます。恐る恐る扉に手を掛けると、錆びた蝶番が不快な音を立てました。`;

const yamiOriginal = `放課後の旧校舎は、常軌を逸した静謐に覆われておりました。田中美咲は忘却した教科書を回収する為だけに、此の場所を訪れた筈でありました。然るに、古色蒼然たる廊下に一歩を踏み出した刹那より、何物かが根本的に異なることを直感しておりました。大気は異様に重く、恰も水中を跋渉しているかの如き圧迫感がありました。其の時、微かなる声音が鼓膜に到達致しました。「救って…此処から解放して…」其の声は壁中より反響しているかの如くでありました。美咲の心臓は激しく脈動し始めました。`;

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
