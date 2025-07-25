# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

TalkArtは、夏祭りの記憶を基にしたインタラクティブなAIアーティストシステムです。AITuberKitをベースに構築され、来場者がAIキャラクターとの対話を通じて個人的な夏祭りの思い出をアートワークに変換する90-120秒の没入体験を提供します。Live2Dキャラクターアニメーション、リアルタイムアート生成、コミュニティギャラリーを特徴としています。

## よく使うコマンド

### 開発

```bash
npm run dev         # 開発サーバーを起動 (http://localhost:3000)
npm run build       # 本番用ビルド
npm run start       # 本番サーバーを起動
npm run desktop     # Electronデスクトップアプリとして実行
```

### テスト・品質

```bash
npm test           # すべてのテストを実行
npm run lint       # ESLintを実行
```

### セットアップ

```bash
npm install        # 依存関係をインストール（Node.js 20.0.0+、npm 10.0.0+が必要）
cp .env.example .env  # 環境変数を設定
```

## アーキテクチャ

### 技術スタック

- **フレームワーク**: Next.js 14.2.5 + React 18.3.1
- **言語**: TypeScript 5.0.2（strictモード）
- **スタイリング**: Tailwind CSS 3.4.14
- **状態管理**: Zustand 4.5.4
- **テスト**: Jest + React Testing Library
- **アニメーション**: CSS transforms + framer-motion
- **音響**: Web Audio API

### 体験フロー（4フェーズ）

1. **START**: アイドル状態、祭り背景音楽、開始ボタン
2. **QUESTIONS**: AI質問とユーザー3択回答（5ステップ、45秒以内）
3. **GENERATION**: アート生成（10秒以内）、キャラクター描画モーション
4. **RESULT**: アート表示、QRコード共有、ギャラリー追加

### 主なディレクトリ

- `/src/components/talkart/` - TalkArt特有のReactコンポーネント
- `/src/features/talkart/` - 体験フロー、アート生成、ギャラリー機能
- `/src/stores/talkart/` - TalkArt用状態管理
- `/src/pages/api/talkart/` - アート生成API、ギャラリーAPI
- `/public/talkart/` - 祭り背景、音響ファイル、Live2Dアセット

### 核心コンポーネント

1. **ExperienceFlowManager**: 4フェーズの体験タイムライン制御
2. **TalkArtForm**: 質問と3択回答のUI（既存Form component置換）
3. **ArtGenerationPipeline**: 対話内容からアート生成の処理フロー
4. **GallerySystem**: リアルタイムギャラリー更新と表示
5. **AnimationSystem**: CSS transitionとLoading spinner
6. **AudioManager**: 完了音とWeb Audio API管理

### AIとアート生成

- **対話処理**: `/src/features/talkart/conversation/` - 質問フロー、回答収集
- **アート生成**: `/src/features/talkart/generation/` - AI画像生成API統合
- **ギャラリー**: `/src/features/talkart/gallery/` - 作品保存、表示、リアルタイム更新

## 開発ガイドライン

### 新規機能実装時のルール

**重要**: 新規機能（コンポーネント、API、機能）を実装した後は、必ずlintチェックと自動修正を実行してから次の作業に進む

```bash
# 新規機能実装完了後に実行
npm run lint        # ESLintチェック
npm run lint:fix    # 自動修正
```

このルールにより以下を確保：
- コードスタイルの一貫性
- TypeScriptエラーの早期発見
- React Hooksの依存関係問題の解決
- Prettierによる自動フォーマット

## 開発ガイドライン

### TalkArt特有のルール

- **体験時間制限**: 各フェーズに明確な時間制限を設ける（45秒会話、10秒生成）
- **最小限のアニメーション**: CSS fade transition（0.3s）、button hover（scale 1.05）のみ
- **パフォーマンス優先**: 60fps維持、GPU acceleration使用、アセット圧縮
- **エラー処理**: 優雅な復旧、会話再開、フォールバックアート提供

### UI/UX設計原則

- **没入感**: 祭り雰囲気の背景音楽、提灯の揺れエフェクト
- **直感的操作**: 3択ボタン、明確な進行インジケーター
- **即座のフィードバック**: キャラクターリアクション、音響効果
- **コミュニティ感**: ギャラリー表示、リアルタイム作品追加

### 言語ファイル更新ルール

- **言語ファイルの更新は日本語（`/locales/ja/`）のみ行う**
- TalkArt特有の文言は`/locales/ja/talkart.json`に集約
- 祭り関連の用語、感情表現を重視

### テスト

- **体験フローテスト**: 90-120秒の完全体験シナリオ
- **パフォーマンステスト**: 60fps維持、メモリ使用量監視
- **クロスブラウザテスト**: モバイル対応、タッチ操作
- **負荷テスト**: 同時ギャラリー閲覧、連続アート生成

### 環境変数

TalkArt特有の必要な環境変数:

```bash
# AI画像生成API
OPENAI_API_KEY=your_openai_key
STABILITY_API_KEY=your_stability_key

# ギャラリー機能
GALLERY_STORAGE_URL=your_storage_url
GALLERY_CDN_URL=your_cdn_url

# QRコード共有
SHARE_BASE_URL=https://your-domain.com

# パフォーマンス監視
VERCEL_ANALYTICS_ID=your_analytics_id
```

## 実装タスクと要件

### コア要件（Requirements Document参照）

1. **Requirement 1**: AI対話フロー（45秒以内、5ステップ、3択回答）
2. **Requirement 2**: 視覚・音響効果（祭り音楽、風鈴、花火音）
3. **Requirement 3**: 高速アート生成（10秒以内、QRコード共有）
4. **Requirement 4**: コミュニティギャラリー（リアルタイム更新）
5. **Requirement 5**: パフォーマンス（60fps、同時利用対応）
6. **Requirement 6**: 管理機能（設定調整、使用統計）
7. **Requirement 7**: 迅速開発（AITuberKit基盤、2-3週間）

### 実装優先度（Implementation Plan参照）

**Phase 1 (高優先度)**: 
- ギャラリーボード強化
- アニメーション追加  
- Vercelデプロイ対応

**Phase 2 (中優先度)**:
- AI選択肢生成システム
- パフォーマンス最適化

**Phase 3 (低優先度)**:
- 最終統合とテスト

### デプロイと監視

- **本番環境**: Vercel deployment
- **パフォーマンス**: Core Web Vitals 90+
- **監視**: エラー率1%以下、モバイル表示3秒以内
- **分析**: 作品生成数、ギャラリー閲覧数、QRコード利用率

## ライセンスについて

- TalkArtシステムは展示・体験用途で設計
- 商用利用には別途ライセンスが必要
- AIアート生成には各APIプロバイダーの利用規約が適用
- キャラクターモデルの利用には個別のライセンスが必要

---

**重要**: このシステムは展示環境での連続使用を想定しており、安定性とパフォーマンスが最優先事項です。機能追加時は必ず体験時間とパフォーマンスへの影響を検証してください。