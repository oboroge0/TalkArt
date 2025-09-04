// TalkArt Configuration
module.exports = {
  // Experience settings
  experience: {
    duration: 90, // seconds (60-90)
    phases: {
      start: 5,
      questions: 45,
      generation: 10,
      result: 30,
    },
  },

  // Question system configuration
  questionSystem: {
    // Use 'classic' for original 3-question system, 'multilayer' for new 4-axis system
    mode: 'multilayer',
    fallbackToClassic: true, // Auto fallback if multilayer fails
  },

  // Original question flow (maintained for stability)
  questions: [
    {
      id: 'festival_memory',
      text: '夏祭りの思い出で一番印象的だったものは？',
      options: ['花火と浴衣', '屋台とかき氷', 'お神輿と太鼓'],
    },
    {
      id: 'favorite_moment',
      text: 'どんな瞬間が心に残っていますか？',
      options: [
        '友達との楽しい時間',
        '家族との温かい思い出',
        '一人で感じた特別な瞬間',
      ],
    },
    {
      id: 'emotion',
      text: 'その時どんな気持ちでしたか？',
      options: [
        'ワクワクして楽しかった',
        '懐かしくて温かかった',
        '神秘的で心が震えた',
      ],
    },
  ],

  // New 4-axis multilayer question system
  multilayerQuestions: [
    {
      id: 'perspective',
      axis: 'composition', // Maps to prompt composition
      text: 'その夏祭りをどこから眺めていましたか？',
      options: [
        { value: 'front_view', label: '祭りの正面から' },
        { value: 'bridge_view', label: '橋の上から見下ろして' },
        { value: 'backstreet_view', label: '屋台の裏路地から静かに' },
      ],
    },
    {
      id: 'companion',
      axis: 'elements', // Maps to prompt elements
      text: '誰と一緒にその時間を過ごしていましたか？',
      options: [
        { value: 'with_friends', label: '友達と一緒に' },
        { value: 'with_family', label: '家族と一緒に' },
        { value: 'alone', label: '一人で' },
      ],
    },
    {
      id: 'impressive_element',
      axis: 'objects', // Maps to prompt main objects
      text: '一番心に残っているものは何ですか？',
      options: [
        { value: 'fireworks_yukata', label: '花火と浴衣姿' },
        { value: 'goldfish_scooping', label: '金魚すくいと屋台の賑わい' },
        { value: 'festival_music', label: 'お囃子と太鼓の音' },
      ],
    },
    {
      id: 'emotion_feeling',
      axis: 'mood', // Maps to prompt mood/atmosphere
      text: 'その瞬間、どんな気持ちが心に広がりましたか？',
      options: [
        { value: 'excited', label: 'ワクワクして心が躍った' },
        { value: 'nostalgic', label: '切なく懐かしい気持ちになった' },
        { value: 'peaceful', label: '静かで温かい気持ちに包まれた' },
      ],
    },
  ],

  // Art generation settings
  artGeneration: {
    style: 'summer_festival_watercolor',
    themes: ['japanese', 'festival', 'nostalgic', 'warm'],
    timeout: 10000, // 10 seconds
  },

  // Animation settings (minimal)
  animations: {
    fadeInDuration: 300, // ms
    fadeOutDuration: 300, // ms
    buttonHoverScale: 1.05,
  },

  // Audio settings
  audio: {
    completionSound: '/sounds/completion.mp3',
  },

  // Gallery settings
  gallery: {
    maxDisplayCount: 50,
    gridColumns: 5,
  },
}
