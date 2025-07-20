# TalkArt システム技術仕様書 v2.0 (シンプル版・演出込み)

## 1. システム概要

### 1.1 コンセプト
AITuberKitをベースに、最小限の追加開発で「AI絵師との対話で夏祭りの思い出を絵にする」体験を提供。シンプルながら記憶に残る演出で来場者を魅了します。

### 1.2 基本要件
- **開発期間**: 2-3週間（演出含む）
- **予算**: 最小限（API利用料のみ）
- **運用**: 展示期間中のみ（1-7日間）
- **体験時間**: 1人あたり90-120秒

## 2. 技術スタック（演出対応版）

| 要素 | 技術 | 演出での活用 |
|------|------|-------------|
| **ベース** | AITuberKit | Live2Dキャラの表情・モーション |
| **フロントエンド** | Next.js + Tailwind CSS | レスポンシブアニメーション |
| **アニメーション** | CSS + Framer Motion (軽量) | 滑らかな画面遷移 |
| **音響** | Web Audio API | 効果音・BGM制御 |
| **エフェクト** | Canvas API (軽量) | パーティクル・描画演出 |

## 3. 演出フロー詳細

### 3.1 体験の流れと演出

```
┌─────────────────────────────────────────────────┐
│ 1. アイドル状態（0秒）                           │
│   - BGM: 祭囃子（ループ・小音量）                │
│   - 背景: 提灯がゆらゆら揺れるCSS animation      │
│   - キャラ: 「始める」ボタンを見つめる           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. 対話開始（0-45秒）                           │
│   - SE: 風鈴の音                                │
│   - キャラ: お辞儀アニメーション                 │
│   - 背景: 徐々に夏祭りの雰囲気に変化            │
│   - ボタン: バウンスインで登場                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. 生成中（45-55秒）                            │
│   - BGM: テンポアップ                           │
│   - キャラ: 筆を持って描く仕草                  │
│   - Canvas: 筆跡エフェクト（描画プレビュー）    │
│   - プログレス: 和紙が徐々に染まる演出          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. 完成演出（55-70秒）                          │
│   - SE: 花火の音                                │
│   - 画像: 和紙から浮かび上がる演出              │
│   - パーティクル: 金粉が舞う                    │
│   - キャラ: 喜びのリアクション                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. 共有・ギャラリー追加（70-90秒）              │
│   - QR: スライドインで登場                      │
│   - 画像: ギャラリーへ飛んでいくアニメーション  │
│   - SE: 風鈴の余韻                             │
└─────────────────────────────────────────────────┘
```

### 3.2 キャラクター演出仕様

```javascript
// キャラクターの感情表現マッピング
const CHARACTER_MOTIONS = {
  idle: {
    expression: "normal",
    motion: "idle_loop",
    duration: -1  // ループ
  },
  greeting: {
    expression: "smile",
    motion: "bow",
    duration: 2000,
    voice: "こんにちは！夏祭りの思い出を一緒に絵にしましょう"
  },
  thinking: {
    expression: "thinking",
    motion: "hand_on_chin",
    duration: -1
  },
  drawing: {
    expression: "concentrated",
    motion: "drawing_motion",
    duration: -1,
    props: ["brush"]  // 筆を表示
  },
  complete: {
    expression: "joy",
    motion: "jump",
    duration: 1500,
    voice: "素敵な思い出の絵が完成しました！"
  }
};
```

### 3.3 視覚演出の実装

#### 3.3.1 背景演出（CSS only）
```css
/* 提灯の揺れ */
@keyframes lantern-sway {
  0%, 100% { transform: rotate(-2deg) translateY(0); }
  50% { transform: rotate(2deg) translateY(-5px); }
}

/* 花火パーティクル（完成時） */
.firework-particle {
  animation: firework-burst 1.5s ease-out forwards;
}

@keyframes firework-burst {
  0% { 
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  100% { 
    transform: translate(var(--x), var(--y)) scale(1);
    opacity: 0;
  }
}
```

#### 3.3.2 描画プレビュー演出
```javascript
// Canvas APIで筆跡エフェクト（軽量実装）
function drawBrushStroke(ctx, progress) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  
  // プログレスに応じて筆跡を描画
  const path = getStrokePath(progress);
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  
  path.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  
  ctx.stroke();
}
```

### 3.4 音響演出仕様

```javascript
// 音響管理（Web Audio API）
const SOUND_ASSETS = {
  bgm: {
    festival: '/sounds/festival_loop.mp3',  // 30秒ループ
    volume: 0.3
  },
  se: {
    windChime: '/sounds/wind_chime.mp3',
    brush: '/sounds/brush_stroke.mp3',
    firework: '/sounds/firework.mp3',
    complete: '/sounds/complete.mp3'
  }
};

// フェードイン・アウト処理
async function crossFadeBGM(from, to, duration = 1000) {
  const fadeSteps = 20;
  const stepDuration = duration / fadeSteps;
  
  for (let i = 0; i <= fadeSteps; i++) {
    from.volume = 0.3 * (1 - i / fadeSteps);
    to.volume = 0.3 * (i / fadeSteps);
    await sleep(stepDuration);
  }
}
```

## 4. 画面構成と演出タイミング

### 4.1 対話画面レイアウト

```
┌─────────────────────────────────────┐
│  背景: 夏祭り（提灯・屋台）          │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    AI絵師キャラクター       │    │
│  │    (Live2D)                │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  「質問テキスト」                   │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 選択1 │ │ 選択2 │ │ 選択3 │      │
│  └─────┘ └─────┘ └─────┘      │
│                                     │
│  プログレス: ●●○○○               │
└─────────────────────────────────────┘
```

### 4.2 画面遷移演出

```javascript
// Framer Motionを使った軽量アニメーション
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

// ボタンの登場演出
const buttonAnimation = {
  initial: { scale: 0, opacity: 0 },
  animate: (i) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 200
    }
  })
};
```

### 4.3 生成完了演出シーケンス

```javascript
// 完成演出のタイムライン
const revealSequence = async (imageUrl) => {
  // 1. 画面を暗転
  await fadeToBlack(0.5);
  
  // 2. 和紙テクスチャ表示
  showPaperTexture();
  
  // 3. 墨が染み込むように画像表示
  await revealImage(imageUrl, {
    effect: 'ink-bleed',
    duration: 2000
  });
  
  // 4. 花火パーティクル
  triggerFireworks(30); // 30個のパーティクル
  
  // 5. キャラクターリアクション
  await character.play('complete');
  
  // 6. QRコード表示
  await showQRCode({ animation: 'slide-up' });
};
```

## 5. ギャラリー画面演出

### 5.1 リアルタイム追加演出

```javascript
// 新作品がギャラリーに追加される演出
const addToGallery = (newArtwork) => {
  // 1. 対話画面から飛んでくるアニメーション
  const flyingImage = createFlyingElement(newArtwork);
  
  // 2. 放物線を描いて移動
  animateParabola(flyingImage, {
    from: { x: window.innerWidth / 2, y: 0 },
    to: galleryPosition,
    duration: 1500
  });
  
  // 3. 着地時に波紋エフェクト
  createRippleEffect(galleryPosition);
  
  // 4. 既存作品が場所を空ける
  rearrangeGallery({ animation: 'smooth' });
};
```

### 5.2 ギャラリー画面の演出

```
┌─────────────────────────────────────┐
│  タイトル: みんなの夏祭りの思い出    │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │作品1│ │作品2│ │作品3│ │作品4│   │
│  └────┘ └────┘ └────┘ └────┘   │
│     ↑ホバーで拡大・ゆらゆら         │
│                                     │
│  リアルタイムカウンター              │
│  「本日: 42作品」                   │
└─────────────────────────────────────┘
```

## 6. 実装の優先順位（コスト考慮）

### 6.1 必須演出（Phase 1: 1週間）
1. キャラクターの基本モーション
2. ボタンの登場アニメーション
3. 画像表示の基本演出
4. BGMループ再生

### 6.2 推奨演出（Phase 2: +3日）
1. 生成中の筆跡プレビュー
2. 完成時の花火エフェクト
3. ギャラリー追加アニメーション
4. 効果音の追加

### 6.3 オプション演出（時間があれば）
1. 背景の時間変化（夕方→夜）
2. 季節の花びらパーティクル
3. キャラクターの衣装変化
4. 作品の「いいね」エフェクト

## 7. パフォーマンス最適化

### 7.1 演出の軽量化
```javascript
// requestAnimationFrameでスムーズな60fps
const animationLoop = (callback) => {
  let lastTime = 0;
  const loop = (currentTime) => {
    const deltaTime = currentTime - lastTime;
    if (deltaTime > 16) { // 60fps
      callback(deltaTime);
      lastTime = currentTime;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

// CSS animationを優先使用
.use-gpu {
  will-change: transform;
  transform: translateZ(0); /* GPU acceleration */
}
```

### 7.2 アセット最適化
- 音声: MP3 128kbps（十分な品質）
- 画像: WebP形式、適切な圧縮
- アニメーション: CSS優先、JSは最小限

## 8. 演出用アセットリスト

### 8.1 必要な素材
```
/public/
├── sounds/
│   ├── festival_loop.mp3      (30秒, 500KB)
│   ├── wind_chime.mp3         (2秒, 50KB)
│   ├── brush_stroke.mp3       (1秒, 30KB)
│   └── firework.mp3          (3秒, 100KB)
├── images/
│   ├── paper_texture.webp     (50KB)
│   ├── lantern.svg           (5KB)
│   └── firework_particle.svg  (2KB)
└── fonts/
    └── sawarabi-mincho.woff2  (Googleフォント)
```

### 8.2 フリー素材の活用
- 効果音: 効果音ラボ（商用利用可）
- BGM: DOVA-SYNDROME（フリーBGM）
- テクスチャ: 自作またはCC0素材

## 9. デバッグ用演出制御

```javascript
// 開発時の演出スキップ機能
const DEBUG_SETTINGS = {
  skipAnimations: false,
  animationSpeed: 1.0,  // 0.5で倍速
  muteSound: false,
  showFPS: true
};

// URLパラメータで制御
// ?debug=1&skipAnim=1&speed=2
```

## 10. 展示での注意点

### 10.1 音量バランス
- BGM: 30%（会話の邪魔にならない）
- SE: 50%（アクセント）
- 音声: 70%（聞き取りやすく）

### 10.2 演出タイミング
- 混雑時は演出を一部スキップ
- 体験者の反応を見て調整
- 子供向けに演出を強化オプション

これで、シンプルな技術スタックを維持しながら、印象的な演出を実現できる仕様になりました。CSSアニメーションを中心に、必要最小限のJavaScriptで豊かな体験を提供します。