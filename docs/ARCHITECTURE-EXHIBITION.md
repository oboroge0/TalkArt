# 🎨 TalkArt AIアートシステム アーキテクチャ

## AIなんでも展示会 - システム構成図

### 📌 システム概要
TalkArtは、ユーザーの回答から AI（DALL-E 3 + GPT-4）を使って夏祭りをテーマにしたアートワークと詩を生成するインタラクティブシステムです。

---

## 🔄 処理フロー（5つのフェーズ）

### 1️⃣ **ユーザー入力フェーズ**
ユーザーが4軸の質問に回答

#### 主要関数
- `TalkArtForm` - メインコンポーネント
- `useQuestionFlow()` - 質問フロー管理
- `handleAnswerSelection()` - 回答処理

#### 4軸システム
```
構図（composition）: 視点・アングル
要素（elements）: 一緒にいる人
オブジェクト（objects）: 印象的なもの
感情（mood）: その時の気持ち
```

---

### 2️⃣ **AI処理フェーズ**
AIによる画像と詩の生成

#### 主要関数
- `ArtGenerator.generateArtwork()` - 統括処理
- `generateMultilayerPrompt()` - プロンプト生成
- `/api/talkart/generate` - DALL-E 3画像生成
- `/api/talkart/generate-poetry` - GPT-4詩生成

#### 処理詳細
```javascript
// プロンプト生成例
"夏祭りの夜、祭りの正面から、友達と一緒に、
花火と浴衣姿、ワクワクして心が躍った、
アニメスタイル、縦長ポートレート"
```

---

### 3️⃣ **画像合成フェーズ**
Canvas APIによる詩とロゴの埋め込み

#### 主要関数
- `ArtworkComposer.composeArtwork()` - 合成統括
- `addPoetryOverlay()` - 詩の配置（左上、画像幅の2/3）
- `addLogoOverlay()` - ロゴ配置（右下）

#### Canvas処理
```javascript
// 詩の配置
ctx.fillStyle = 'rgba(0, 0, 0, 0.8)' // 黒背景
ctx.fillRect(20, 20, width * 0.67, 120) // 左上に配置

// テキスト描画
ctx.font = '24px Noto Sans JP'
ctx.fillStyle = 'white'
ctx.textAlign = 'left'
```

---

### 4️⃣ **保存フェーズ**
Supabaseへのデータ保存

#### 主要関数
- `supabaseArtStorage.saveArtwork()` - DB保存
- `uploadImage()` - 画像アップロード
- `generateShareCode()` - 共有コード生成

#### 保存データ構造
```typescript
{
  id: string,
  image_url: string,           // 元画像URL
  composite_image_url: string,  // 合成済み画像（base64）
  prompt: string,              // 使用したプロンプト
  poetry: {                    // 生成された詩
    poem: string,
    metadata: {...}
  },
  responses: Array,            // ユーザー回答
  session_id: string,
  created_at: Date
}
```

---

### 5️⃣ **表示フェーズ**
結果表示とギャラリー

#### 主要関数
- `TalkArtResult` - 結果表示画面
- `TalkArtGalleryCanvas` - インタラクティブギャラリー
- `ArtworkImageModal` - 詳細表示モーダル

#### 表示機能
- QRコード生成（共有用）
- ダウンロード機能
- リアルタイム合成（既存作品の詩追加）
- Konvaによるインタラクティブ表示

---

## 🛠 技術スタック

### フロントエンド
- **React** + **TypeScript** - UIフレームワーク
- **Next.js** - フルスタックフレームワーク
- **Tailwind CSS** - スタイリング
- **React Konva** - Canvasライブラリ

### AI/API
- **OpenAI DALL-E 3** - 画像生成
- **OpenAI GPT-4** - 詩生成
- **Canvas API** - 画像合成

### バックエンド
- **Supabase** - データベース + ストレージ
- **PostgreSQL** - データ永続化
- **Next.js API Routes** - サーバーレス関数

---

## 💡 システムの特徴

### 🎭 4軸多層質問システム
従来の単純な選択肢から、4つの独立した軸での回答収集へ進化

### 🤖 AI協調動作
DALL-E 3とGPT-4が連携し、視覚と言語の両面から作品を生成

### 🎨 リアルタイム合成
HTML5 Canvasを使用した動的な詩とロゴの埋め込み

### 📝 3行詩生成
展示会向けに最適化された、簡潔で印象的な詩の自動生成

### 💾 クラウド保存
Supabaseによる永続的な作品保存と共有機能

### 🖼️ インタラクティブギャラリー
React Konvaによる滑らかなアニメーションと操作性

---

## 📊 データフロー図

```
ユーザー入力
    ↓
4軸回答データ
    ↓
[並列処理]
    ├→ DALL-E 3（画像生成）
    └→ GPT-4（詩生成）
    ↓
Canvas合成処理
    ↓
Supabase保存
    ↓
ギャラリー表示
```

---

## 🚀 パフォーマンス最適化

1. **タイムアウト管理**: 60秒のタイムアウト設定で安定動作
2. **エラーハンドリング**: フォールバック詩生成機能
3. **プロキシ処理**: CORS回避のための画像プロキシ
4. **リアルタイム合成**: 既存作品への詩追加対応

---

## 📝 展示会での説明ポイント

1. **AIの協調**: 2つのAIモデルが協力して作品を創造
2. **個人化**: 4軸の回答から個人に最適化された作品生成
3. **技術統合**: Web技術とAIの融合による新しい体験
4. **永続性**: 作品がクラウドに保存され、いつでもアクセス可能

---

*AIなんでも展示会 2024 - TalkArt Project*