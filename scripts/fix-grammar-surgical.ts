
import fs from 'fs';

const filePath = 'src/data/book-grammar.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Manual translations for a-aki (the most obvious ones)
const translations = [
  {
    jp: "誰がしたかではなく、ある人の行動の結果に焦点を当てる他動詞と一緒に使われます。",
    en: "Used with transitive verbs to focus on the result of an action rather than the actor."
  },
  {
    jp: "意識的な行動の結果として残っている状態を表します。",
    en: "Represents a state that remains as a result of a conscious action."
  },
  {
    jp: "自然の法則、機械（ボタンを押す）、または定められた一連の出来事にこれを使用してください。",
    en: "Use this for natural laws, machines (pressing buttons), or a fixed sequence of events."
  },
  {
    jp: "Aが起きると、Bが自然に、または必然的に続きます。",
    en: "When A happens, B follows naturally or inevitably."
  },
  {
    jp: "情報が別の情報源から聞かれたり読まれたりしたことを示します（伝聞）。",
    en: "Indicates that information was heard or read from another source (hearsay)."
  },
  {
    jp: "「～そうです」 (looks like) とは異なり、伝聞の「～そうです」は常に辞書形（普通形）が続きます。",
    en: "Unlike 'looks like', hearsay 'sou desu' always follows the dictionary (plain) form."
  },
  {
    jp: "「～に思う」を使うと、感情的な反応や主観的な視点を示唆することがよくあります。",
    en: "Using 'ni omou' often suggests an emotional reaction or subjective viewpoint."
  },
  {
    jp: "本能的にある考えや感情を抱くこと。",
    en: "To have a certain thought or feeling instinctively."
  },
  {
    jp: "ある状態や状況が続いている間。",
    en: "While a certain state or situation continues."
  },
  {
    jp: "今しないと機会がなくなることをしばしば示唆します（例：夏のうちに）。",
    en: "Often suggests that if not done now, the opportunity will be lost (e.g., 'while it's summer')."
  },
  {
    jp: "グループ2の動詞（る動詞）では、「る」を「よう」に置き換えます。グループ1の動詞（う動詞）では、「う」の音を「お」に変えて「う」を追加します。",
    en: "For group 2 verbs (ru-verbs), replace 'ru' with 'you'. For group 1 (u-verbs), change the 'u' sound to 'o' and add 'u'."
  },
  {
    jp: "「～しよう」という形は、意思や勧誘を表すのに使われます。",
    en: "The volitional form expresses intention or an invitation."
  },
  {
    jp: "見る、聞く、待つなどの直接的な知覚を伴う動詞が続く場合は、「こと」ではなく「の」を使用します。",
    en: "Use 'no' instead of 'koto' when followed by verbs of direct perception like seeing, hearing, or waiting."
  },
  {
    jp: "動詞を名詞化して、行動を名詞や目的語に変えます。",
    en: "Nominalizes a verb, turning an action into a noun or object."
  },
  {
    jp: "証拠に基づいた論理的な推測を示唆しており、「～のようだ」や「～のように見える」と似ています。",
    en: "Suggests a logical inference based on evidence, similar to 'it seems like'."
  },
  {
    jp: "話し手が観察したことに基づく推測や外見を表します。",
    en: "Expresses a guess or appearance based on what the speaker observed."
  },
  {
    jp: "準備の側面に焦点を当てています。後での準備のために今何かをするという意味です。",
    en: "Focuses on preparation. Doing something now for later readiness."
  },
  {
    jp: "前もって、または将来の使用のために何かをすること。",
    en: "Doing something in advance or for future use."
  },
  {
    jp: "動詞の場合、語尾の「う」の音を「え」に変えて「ば」を追加します。論理的な結果を表すことがよくあります。",
    en: "For verbs, change the final 'u' sound to 'e' and add 'ba'. Often expresses a logical consequence."
  },
  {
    jp: "接続詞の「もし～ならば」または「～の時」。",
    en: "The conjunction 'if' or 'when'."
  },
  {
    jp: "～のようだ / ～と聞いた（証拠に基づいた推測を示す）。",
    en: "Seems like / heard that (indicates inference based on evidence)."
  },
  {
    jp: "推測の根拠はあるが、100%確信があるわけではない場合に使用します。",
    en: "Used when there is a basis for a guess but not 100% certainty."
  },
  {
    jp: "例を挙げることで、状態や感情の程度を説明するために使用されます。",
    en: "Used to explain the extent of a state or feeling by giving an example."
  },
  {
    jp: "～の程度まで / ～ほど（非常に）。",
    en: "To the extent of / as much as (very)."
  },
  {
    jp: "～の時/もし～ならば（自然な、または必然的な結果が続く）。",
    en: "When/if (followed by a natural or inevitable result)."
  },
  {
    jp: "この文脈では、行動を起こしたときに自然に起こる何かの発見を示します。",
    en: "In this context, it indicates a discovery that happens naturally when an action is taken."
  },
  {
    jp: "～にもかかわらず / ～なのに（しばしば文末で後悔や不満を示す）。",
    en: "Despite / even though (often shows regret or dissatisfaction at the end of a sentence)."
  },
  {
    jp: "文の最後に来る場合、「そうであってほしい」または「状況にもかかわらず」といった意味合いをしばしば含みます。",
    en: "When at the end of a sentence, it often implies 'I wish it were so' or 'despite the situation'."
  },
  {
    jp: "～ということになると / ～が～になると（特別な地位や階級を強調する）。",
    en: "When it comes to / once someone becomes... (emphasizes special status or rank)."
  },
  {
    jp: "これは、期待が自然に変わる高位の地位や重要な状況に使用されます。",
    en: "Used for high-ranking positions or important situations where expectations naturally change."
  }
];

for (const t of translations) {
  content = content.split(t.jp).join(t.en);
}

// Add more translations for other books if needed
// Or use a more general regex for any remaining Japanese in meaning/tip
// For now, this covers a-aki which is the one the user saw.

fs.writeFileSync(filePath, content);
console.log("Applied surgical translations to book-grammar.ts");
