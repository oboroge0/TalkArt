# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AITuberKit is a web application toolkit for creating interactive AI characters with VTuber capabilities. It supports multiple AI providers, character models (VRM/Live2D), and voice synthesis engines.

## Common Commands

### Development

```bash
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build for production
npm run start       # Start production server
npm run desktop     # Run as Electron desktop app
```

### Testing & Quality

```bash
npm test           # Run all tests
npm run lint       # Run ESLint
```

### Setup

```bash
npm install        # Install dependencies (requires Node.js 20.0.0+, npm 10.0.0+)
cp .env.example .env  # Configure environment variables
```

## Architecture

### Tech Stack

- **Framework**: Next.js 14.2.5 with React 18.3.1
- **Language**: TypeScript 5.0.2 (strict mode)
- **Styling**: Tailwind CSS 3.4.14
- **State**: Zustand 4.5.4
- **Testing**: Jest with React Testing Library

### Key Directories

- `/src/components/` - React components (VRM viewer, Live2D, chat UI)
- `/src/features/` - Core logic (chat, voice synthesis, messages)
- `/src/pages/api/` - Next.js API routes
- `/src/stores/` - Zustand state management
- `/public/` - Static assets (models, backgrounds)

### AI Integration Points

- **Chat**: `/src/features/chat/` - Factory pattern for multiple providers
- **Voice**: `/src/features/messages/synthesizeVoice*.ts` - 13 TTS engines
- **Models**: VRM (3D) in `/src/features/vrmViewer/`, Live2D (2D) support

### Important Patterns

1. **AI Provider Factory**: `aiChatFactory.ts` manages different LLM providers with dynamic attribute-based model management via `/src/features/constants/aiModels.ts`
2. **Message Queue**: `speakQueue.ts` handles TTS playback sequentially with dynamic model attribute checking for multimodal support
3. **WebSocket**: Real-time features in `/src/utils/WebSocketManager.ts`
4. **i18n**: Multi-language support via `next-i18next`

## Development Guidelines

### From .cursorrules

- Maintain existing UI/UX design without unauthorized changes
- Don't upgrade package versions without explicit approval
- Check for duplicate implementations before adding features
- Follow the established directory structure
- API clients should be centralized in `app/lib/api/client.ts`

### Testing

- Place tests in `__tests__` directories
- Mock canvas for Node.js environment (already configured)
- Run specific tests with Jest pattern matching

### Environment Variables

Required API keys vary by features used (OpenAI, Google, Azure, etc.). Check `.env.example` for all available options.

## License Considerations

- Custom license from v2.0.0+
- Free for non-commercial use
- Commercial license required for business use
- Character model usage requires separate licensing

## TalkArt Project Specific Rules

### Implementation Reports

When completing a task, **ALWAYS** create an implementation report in markdown format:

- Save location: `/Users/nekozilla/Desktop/Programing/TalkArt/implementation-reports/`
- File naming: `task-XX-feature-name.md` (e.g., `task-07-completion-sound.md`)
- Create report immediately after task completion
- Include:
  - Overview of what was implemented
  - Implementation details
  - Technical decisions
  - User experience considerations
  - Testing notes
  - File changes
  - Next steps

## Git Hooks Configuration

### Pre-commit Hook
プロジェクトのコード品質を保つため、コミット前に以下の処理を自動実行する：

1. **Lint修正** (`npm run lint:fix`)
   - コードフォーマットを自動修正
   - 修正されたファイルを自動でステージング

2. **ビルドチェック** (`npm run build`)
   - TypeScriptの型エラーをチェック
   - ビルドが失敗した場合はコミットを中止

### フック設定
`.husky/pre-commit` ファイルで設定されており、以下の処理が実行される：
- ESLintによるコード整形
- TypeScriptのコンパイルチェック
- エラーがある場合はコミットをブロック

## 開発履歴

### 2025-08-25 - ロゴ機能とポートレート形式対応

#### 実装内容
1. **ロゴ合成機能の完全実装**
   - Supabase保存済み画像へのロゴ合成方式に変更
   - ギャラリー表示時に動的にロゴを右下角に合成
   - モーダル詳細表示時も同様にロゴ付き画像を表示
   - ロゴサイズ調整（最終的に30%で決定）
   - 生成時のロゴ処理を削除してCORS問題を回避

2. **縦長ポートレート形式対応**
   - DALL-E 3 出力サイズを `1024x1024` から `1024x1792` に変更
   - プロンプトを縦長構図用に最適化（上下余白を削減）
   - ギャラリーサムネイルを縦長に調整（180×200、カード240高）
   - グリッドレイアウトエンジンを縦長フォーマット対応

#### 技術的変更
- **ファイル変更**:
  - `src/components/talkArtGalleryCanvas.tsx`: ロゴ合成とUI調整
  - `src/pages/api/talkart/generate.ts`: 出力サイズ変更
  - `src/features/talkart/artGenerator.ts`: プロンプト最適化、ロゴ処理削除
  - `src/features/talkart/galleryLayoutEngine.ts`: グリッド調整

- **ロゴ合成仕様**:
  - 位置: 右下角（マージンなし）
  - サイズ: 画像幅の30%
  - 透明度: 85%
  - 影効果: なし（位置精度優先）

#### 解決した問題
1. CORS制限によるDALL-E画像への直接ロゴ合成失敗
2. React Konva `Image`コンポーネントとブラウザネイティブ`Image`の名前衝突
3. 縦長画像生成時の上下余白問題
4. ギャラリー表示での正方形レイアウト制限
