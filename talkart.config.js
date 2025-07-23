// TalkArt Configuration
module.exports = {
  // Experience settings
  experience: {
    duration: 90, // seconds (60-90)
    phases: {
      start: 5,
      questions: 45,
      generation: 10,
      result: 30
    }
  },
  
  // Question flow
  questions: [
    {
      id: 'festival_memory',
      text: '夏祭りの思い出で一番印象的だったものは？',
      options: [
        '花火と浴衣',
        '屋台とかき氷', 
        'お神輿と太鼓'
      ]
    },
    {
      id: 'favorite_moment',
      text: 'どんな瞬間が心に残っていますか？',
      options: [
        '友達との楽しい時間',
        '家族との温かい思い出',
        '一人で感じた特別な瞬間'
      ]
    },
    {
      id: 'emotion',
      text: 'その時どんな気持ちでしたか？',
      options: [
        'ワクワクして楽しかった',
        '懐かしくて温かかった',
        '神秘的で心が震えた'
      ]
    }
  ],
  
  // Art generation settings
  artGeneration: {
    style: 'summer_festival_watercolor',
    themes: ['japanese', 'festival', 'nostalgic', 'warm'],
    timeout: 10000 // 10 seconds
  },
  
  // Animation settings (minimal)
  animations: {
    fadeInDuration: 300, // ms
    fadeOutDuration: 300, // ms
    buttonHoverScale: 1.05
  },
  
  // Audio settings
  audio: {
    completionSound: '/sounds/completion.mp3'
  },
  
  // Gallery settings
  gallery: {
    maxDisplayCount: 50,
    gridColumns: 5
  }
};