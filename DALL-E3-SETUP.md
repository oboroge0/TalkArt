# DALL-E 3 API Setup for TalkArt

## 設定手順

### 1. OpenAI APIキーの取得
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. サインイン後、[API Keys](https://platform.openai.com/api-keys) ページへ
3. 「Create new secret key」をクリック
4. キーをコピー（一度しか表示されません）

### 2. 環境変数の設定
`.env` ファイルを編集：

```bash
# 既存のOpenAI設定を使用する場合
OPENAI_API_KEY="sk-..."

# または、TalkArt専用のキーを使用する場合
NEXT_PUBLIC_ART_API_KEY="sk-..."
NEXT_PUBLIC_ART_API_ENDPOINT="dalle3"
```

### 3. 料金について
- DALL-E 3 Standard: $0.040 / 画像（1024x1024）
- DALL-E 3 HD: $0.080 / 画像（1024x1024）

### 4. プロンプト最適化
TalkArtは以下の形式でプロンプトを生成します：
- 日本の夏祭りをテーマにした水彩画
- 回答に基づいた要素（花火、屋台、お神輿など）
- 感情的な雰囲気（楽しい、懐かしい、神秘的など）

### 5. API制限
- レート制限: 1分間に5リクエスト（Tier 1）
- 画像サイズ: 1024x1024, 1024x1792, 1792x1024
- スタイル: natural（リアル）, vivid（鮮やか）

### 6. トラブルシューティング
- APIキーが無効: キーの先頭に余分なスペースがないか確認
- 401エラー: APIキーが正しく設定されているか確認
- 429エラー: レート制限に達した（少し待ってリトライ）

## 使用方法
1. 開発サーバーを再起動: `npm run dev`
2. TalkArt体験を開始
3. 質問に回答すると、DALL-E 3でアートが生成されます