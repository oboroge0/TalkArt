# TalkArt - 夏祭りの思い出アート生成システム

<p align="center">
  <img src="public/images/summer-festival-bg.jpg" alt="TalkArt" width="600">
</p>

<p align="center">
  AIとの対話を通じて、あなただけの夏祭りの思い出をアートに変換する体験型システム
</p>

## 🎨 概要

TalkArtは、VTuberキャラクターとの自然な対話を通じて、ユーザーの夏祭りの思い出を美しいAIアートワークに変換するインタラクティブなシステムです。質問に答えるだけで、AIがあなたの思い出を解釈し、世界に一つだけのアート作品を生成します。

## ✨ 主な機能

### 🗣️ インタラクティブな対話システム

- VTuberキャラクターがあなたの思い出を優しく聞き出します
- 3つの質問を通じて、思い出の要素を収集
- 自然な会話フローで緊張せずに体験できます

### 🖼️ AI アート生成

- OpenAI DALL-E 3を使用した高品質なアート生成
- あなたの思い出を反映した独自のアートワーク
- 夏祭りの雰囲気を大切にした温かみのある作品

### 📌 思い出の掲示板ギャラリー

- 手作り感あふれる掲示板スタイルのギャラリー
- 作品が飛んでいくアニメーション演出
- フィルター機能（すべて/今日/お気に入り）
- 他の人の思い出アートも楽しめる

### 🎵 没入感のある演出

- 完成時の特別な効果音
- ギャラリー操作時の紙の音
- 視覚と聴覚で楽しむ体験

## 🚀 クイックスタート

### 必要な環境

- Node.js 20.0.0以上
- npm 10.0.0以上
- OpenAI APIキー

### インストール手順

```bash
# リポジトリのクローン
git clone https://github.com/oboroge0/TalkArt.git
cd TalkArt

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
```

`.env`ファイルを編集して、必要なAPIキーを設定：

```
OPENAI_API_KEY=your_api_key_here
```

### 起動方法

```bash
# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、ホーム画面の「TalkArt」ボタンをクリックして体験を開始してください。

## 📖 使い方

1. **スタート画面**

   - 「スタート」ボタンを押して体験を開始

2. **対話フェーズ**

   - VTuberが3つの質問をします
   - 選択肢から思い出に近いものを選んでください
   - リラックスして楽しんでください！

3. **アート生成**

   - あなたの回答を基にAIがアートを生成
   - 約20-30秒お待ちください

4. **結果とギャラリー**
   - 生成されたアートを確認
   - ダウンロードやシェアが可能
   - ギャラリーで他の作品も楽しめます

## 🛠️ 技術スタック

- **ベースフレームワーク**: [AITuberKit](https://github.com/tegnike/aituber-kit) (Fork元)
- **フロントエンド**: Next.js 14.2.5, React 18.3.1, TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: OpenAI DALL-E 3 API
- **状態管理**: Zustand
- **アニメーション**: CSS Transitions, React Spring

## 📄 ライセンス

このプロジェクトは[AITuberKit](https://github.com/tegnike/aituber-kit)をフォークして開発されています。

- **非商用利用**: 自由に使用・修正・配布可能
- **商用利用**: AITuberKitの商用ライセンスが必要です

詳細は[LICENSE](LICENSE)ファイルをご確認ください。

## 🙏 謝辞

このプロジェクトは以下の素晴らしいプロジェクトに基づいて構築されています：

- **[AITuberKit](https://github.com/tegnike/aituber-kit)** by [@tegnike](https://github.com/tegnike)
  - VTuberとの対話システムの基盤を提供していただきました
  - 優れたアーキテクチャとコードベースに感謝します

## 🤝 貢献

バグ報告、機能提案、プルリクエストは大歓迎です！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📞 お問い合わせ

- Issues: [GitHub Issues](https://github.com/oboroge0/TalkArt/issues)
- 開発者: [@oboroge0](https://github.com/oboroge0)

---

**Made with ❤️ by oboroge0, Powered by AITuberKit**
