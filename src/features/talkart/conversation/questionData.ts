import { ConversationQuestion, ConversationFlow } from '@/features/talkart/types'

// 夏祭りの思い出に関する質問データ
export const talkArtQuestions: ConversationQuestion[] = [
  {
    id: 'q1_atmosphere',
    text: 'あなたが思い出す夏祭りの雰囲気はどれに近いですか？',
    options: [
      '賑やかで活気に満ちた縁日の風景',
      '静かで幻想的な提灯の明かり',
      '懐かしくて温かい家族との時間'
    ],
    stepNumber: 1,
    timeLimit: 10
  },
  {
    id: 'q2_sound',
    text: '夏祭りで印象に残った音は何ですか？',
    options: [
      '太鼓の力強いリズム',
      '風鈴の涼しい音色',
      '人々の笑い声と話し声'
    ],
    stepNumber: 2,
    timeLimit: 10
  },
  {
    id: 'q3_food',
    text: '夏祭りの食べ物で一番思い出に残るのは？',
    options: [
      'かき氷の冷たい甘さ',
      '焼きそばの香ばしい匂い',
      'りんご飴の鮮やかな赤色'
    ],
    stepNumber: 3,
    timeLimit: 10
  },
  {
    id: 'q4_activity',
    text: '夏祭りで最も楽しかった思い出は？',
    options: [
      '金魚すくいに夢中になった時間',
      '花火を見上げた感動の瞬間',
      '浴衣を着て歩いた特別な気分'
    ],
    stepNumber: 4,
    timeLimit: 10
  },
  {
    id: 'q5_emotion',
    text: 'その夏祭りの思い出を一言で表すなら？',
    options: [
      '心躍る興奮と喜び',
      '穏やかな幸せと安らぎ',
      '切ない懐かしさと温もり'
    ],
    stepNumber: 5,
    timeLimit: 5
  }
]

export const conversationFlow: ConversationFlow = {
  questions: talkArtQuestions,
  maxDuration: 45, // 45秒制限
  timeoutBehavior: 'skip'
}