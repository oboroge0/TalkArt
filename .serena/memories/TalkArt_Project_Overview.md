# TalkArt プロジェクト概要

## プロジェクトの基本情報
- **名称**: TalkArt - 夏祭りの思い出アート生成システム
- **ベース**: AITuberKitをベースに構築
- **目的**: VTuberキャラクターとの対話を通じて、ユーザーの夏祭りの思い出をAIアートワークに変換する

## 主要機能
1. **対話型体験** (60-90秒)
   - 3つの質問でユーザーの思い出を収集
   - VTuberキャラクターによる自然な対話

2. **AIアート生成**
   - DALL-E 3による高品質なアート生成
   - 夏祭りテーマの水彩画風スタイル

3. **ギャラリー機能**
   - 手作り掲示板風のデザイン
   - リアルタイム更新とアニメーション
   - フィルター機能（全て/今日/お気に入り）

4. **音声効果**
   - 完成音、紙の音などの効果音
   - VOICEVOXによる音声通知（設定による）

## 技術構成
- **フレームワーク**: Next.js 14.2.5, React 18.3.1
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データ保存**: LocalStorage（DBなし）
- **リアルタイム**: Server-Sent Events (SSE)

## プロジェクト構造
- `/src/components/talkArt*` - UI コンポーネント
- `/src/features/talkart/` - ビジネスロジック
- `/src/pages/api/talkart/` - API エンドポイント
- `/talkart.config.js` - 設定ファイル

## 環境変数
- `NEXT_PUBLIC_TALKART_MODE="true"` - TalkArtモード有効化
- `NEXT_PUBLIC_ART_API_KEY` - OpenAI APIキー（必須）