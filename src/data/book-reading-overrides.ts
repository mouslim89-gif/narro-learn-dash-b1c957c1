/**
 * Per-book kanji → reading overrides.
 *
 * Kuromoji sometimes gets readings wrong for rare kanji, proper nouns, or
 * archaic forms (common in classical/Meiji-era literature). This map lets us
 * hand-fix those per book. Keys are surface forms; values are hiragana readings.
 *
 * Only add MULTI-CHAR entries. Single-kanji readings are context-dependent —
 * let Kuromoji handle those unless you really need to force a specific reading.
 *
 * Applied in `scripts/generate-tokens.ts` after Kuromoji tokenization.
 */
export const bookReadingOverrides: Record<string, Record<string, string>> = {
  'kumo-no-ito': {
    '一部始終': 'いちぶしじゅう',
    '三途': 'さんず',
    '人数': 'にんず',
    '何気': 'なにげ',
    '嘆息': 'たんそく',
    '地獄': 'じごく',
    '地獄谷': 'じごくだに',
    '始終': 'しじゅう',
    '容子': 'ようす',
    '御佇': 'おたたず',
    '御足': 'おみあし',
    '御釈迦様': 'おしゃかさま',
    '数限': 'かずかぎり',
    '極楽': 'ごくらく',
    '水晶': 'すいしょう',
    '泥棒': 'どろぼう',
    '無暗': 'むやみ',
    '犍陀多': 'かんだた',
    '独楽': 'こま',
    '白蓮': 'しらはす',
    '眼鏡': 'めがね',
    '瞬間': 'しゅんかん',
    '純白': 'じゅんぱく',
    '絶間': 'たえま',
    '罪人': 'ざいにん',
    '翡翠': 'ひすい',
    '肝腎': 'かんじん',
    '自分': 'じぶん',
    '莫迦': 'ばか',
    '蓮池': 'はすいけ',
    '蜘蛛': 'くも',
    '責苦': 'せめく',
    '逆落': 'さかおと',
    '釈迦様': 'しゃかさま',
    '金色': 'きんいろ',
    '銀色': 'ぎんいろ',
    '頓着': 'とんじゃく',
  },
};
