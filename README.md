# TalkArt - AI Summer Festival Memory Artist

TalkArt is an interactive AI artist system that creates personalized summer festival memory artwork through conversational interaction. Built on AITuberKit, it provides a 60-90 second immersive experience.

## Project Setup

### Prerequisites
- Node.js 20.0.0+
- npm 10.0.0+

### Installation

1. Clone AITuberKit (already done)
```bash
git clone https://github.com/tegnike/aituber-kit.git
```

2. Install dependencies (already done)
```bash
cd aituber-kit
npm install
```

3. Configure environment (already done)
```bash
cp .env.example .env
```

4. Start development server
```bash
npm run dev
```

Access the application at: http://localhost:3000

## Project Structure

- `/aituber-kit/` - Base AITuberKit framework
- `/talkart.config.js` - TalkArt-specific configuration
- `/.kiro/specs/` - Project specifications and documentation

## Next Steps

1. Customize AITuberKit UI for TalkArt experience (Task 2)
2. Build question flow system (Task 3)
3. Implement minimal animations (Task 4)
4. Create art generation integration (Task 5)

## Configuration

See `talkart.config.js` for experience settings, question flow, and animation parameters.