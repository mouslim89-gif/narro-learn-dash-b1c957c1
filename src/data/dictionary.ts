export interface DictionaryEntry {
 id: string;
 word: string;
 reading: string;
 romaji: string;
 translation: string;
 example: string;
 exampleTranslation: string;
}

export const dictionary: DictionaryEntry[] = [
 { id:'1', word:'桃', reading:'もも', romaji:'momo', translation:'Peach', example:'大きな桃が流れてきた。', exampleTranslation:'A large peach came floating down.'},
 { id:'2', word:'山', reading:'やま', romaji:'yama', translation:'Mountain', example:'お爺さんは山へ行きました。', exampleTranslation:'The old man went to the mountain.'},
 { id:'3', word:'川', reading:'かわ', romaji:'kawa', translation:'River', example:'川で洗濯をしました。', exampleTranslation:'She did laundry at the river.'},
 { id:'4', word:'家', reading:'いえ', romaji:'ie', translation:'House / Home', example:'家に帰りましょう。', exampleTranslation:"Let's go home."},
 { id:'5', word:'食べる', reading:'たべる', romaji:'taberu', translation:'To eat', example:'朝ごはんを食べる。', exampleTranslation:'To eat breakfast.'},
 { id:'6', word:'飲む', reading:'のむ', romaji:'nomu', translation:'To drink', example:'お茶を飲む。', exampleTranslation:'To drink tea.'},
 { id:'7', word:'行く', reading:'いく', romaji:'iku', translation:'To go', example:'学校に行く。', exampleTranslation:'To go to school.'},
 { id:'8', word:'来る', reading:'くる', romaji:'kuru', translation:'To come', example:'友達が来る。', exampleTranslation:'A friend is coming.'},
 { id:'9', word:'見る', reading:'みる', romaji:'miru', translation:'To see / look', example:'映画を見る。', exampleTranslation:'To watch a movie.'},
 { id:'10', word:'聞く', reading:'きく', romaji:'kiku', translation:'To listen / ask', example:'音楽を聞く。', exampleTranslation:'To listen to music.'},
 { id:'11', word:'書く', reading:'かく', romaji:'kaku', translation:'To write', example:'手紙を書く。', exampleTranslation:'To write a letter.'},
 { id:'12', word:'読む', reading:'よむ', romaji:'yomu', translation:'To read', example:'本を読む。', exampleTranslation:'To read a book.'},
 { id:'13', word:'話す', reading:'はなす', romaji:'hanasu', translation:'To speak', example:'日本語を話す。', exampleTranslation:'To speak Japanese.'},
 { id:'14', word:'大きい', reading:'おおきい', romaji:'ookii', translation:'Big / Large', example:'大きい犬がいる。', exampleTranslation:'There is a big dog.'},
 { id:'15', word:'小さい', reading:'ちいさい', romaji:'chiisai', translation:'Small / Little', example:'小さい猫が好き。', exampleTranslation:'I like small cats.'},
 { id:'16', word:'新しい', reading:'あたらしい', romaji:'atarashii', translation:'New', example:'新しい本を買った。', exampleTranslation:'I bought a new book.'},
 { id:'17', word:'古い', reading:'ふるい', romaji:'furui', translation:'Old', example:'この建物は古い。', exampleTranslation:'This building is old.'},
 { id:'18', word:'人', reading:'ひと', romaji:'hito', translation:'Person / People', example:'あの人は先生です。', exampleTranslation:'That person is a teacher.'},
 { id:'19', word:'男', reading:'おとこ', romaji:'otoko', translation:'Man / Male', example:'男の子が走っている。', exampleTranslation:'A boy is running.'},
 { id:'20', word:'女', reading:'おんな', romaji:'onna', translation:'Woman / Female', example:'女の人が歌っている。', exampleTranslation:'A woman is singing.'},
 { id:'21', word:'水', reading:'みず', romaji:'mizu', translation:'Water', example:'水を飲みたい。', exampleTranslation:'I want to drink water.'},
 { id:'22', word:'火', reading:'ひ', romaji:'hi', translation:'Fire', example:'火を消してください。', exampleTranslation:'Please put out the fire.'},
 { id:'23', word:'風', reading:'かぜ', romaji:'kaze', translation:'Wind', example:'今日は風が強い。', exampleTranslation:'The wind is strong today.'},
 { id:'24', word:'花', reading:'はな', romaji:'hana', translation:'Flower', example:'花がきれいです。', exampleTranslation:'The flowers are beautiful.'},
 { id:'25', word:'空', reading:'そら', romaji:'sora', translation:'Sky', example:'空が青い。', exampleTranslation:'The sky is blue.'},
 { id:'26', word:'猫', reading:'ねこ', romaji:'neko', translation:'Cat', example:'猫が寝ている。', exampleTranslation:'The cat is sleeping.'},
 { id:'27', word:'犬', reading:'いぬ', romaji:'inu', translation:'Dog', example:'犬と散歩する。', exampleTranslation:'To walk with the dog.'},
 { id:'28', word:'魚', reading:'さかな', romaji:'sakana', translation:'Fish', example:'魚を釣った。', exampleTranslation:'I caught a fish.'},
 { id:'29', word:'鳥', reading:'とり', romaji:'tori', translation:'Bird', example:'鳥が飛んでいる。', exampleTranslation:'A bird is flying.'},
 { id:'30', word:'友達', reading:'ともだち', romaji:'tomodachi', translation:'Friend', example:'友達と遊ぶ。', exampleTranslation:'To play with friends.'},
];

// Map for quick lookup from word text
export const wordLookup: Record<string, DictionaryEntry> = {};
dictionary.forEach(entry => {
 wordLookup[entry.word] = entry;
 wordLookup[entry.reading] = entry;
});
