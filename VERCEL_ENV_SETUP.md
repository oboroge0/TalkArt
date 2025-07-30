# Vercel 環境変数設定ガイド

## 必要な環境変数

TalkArtで画像生成を有効にするには、以下の環境変数をVercelに設定する必要があります：

### OpenAI API設定
- `OPENAI_API_KEY`: OpenAI APIキー（DALL-E 3を使用するため必須）

### 設定方法

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables に移動
4. 以下を追加:
   - Key: `OPENAI_API_KEY`
   - Value: あなたのOpenAI APIキー
   - Environment: Production, Preview, Development すべてにチェック

### 確認方法

設定後、Vercelのデプロイログで以下を確認できます：
- `API Configuration` のログで `hasApiKey: true` が表示される
- 画像生成時に実際のURLが返される

### トラブルシューティング

1. **画像が生成されない場合**
   - Vercelのログで `API Configuration` を確認
   - `hasApiKey: false` の場合は環境変数が正しく設定されていない

2. **100バイトの小さなファイルが保存される場合**
   - APIキーが設定されていない（プレースホルダー画像が使用されている）
   - OpenAI APIのクォータまたは課金の問題

3. **DALL-E 3 エラー**
   - APIキーの権限を確認
   - OpenAIダッシュボードで課金状況を確認