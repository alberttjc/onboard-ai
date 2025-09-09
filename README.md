# Gemini Voice Next.js

A responsive web application for real-time voice and video conversations with Google's Gemini Live API. Built with Next.js for performance and natural AI interactions.

## ✨ Features

- 🎤 **Real-time Voice Chat** - Natural speech conversations with AI
- 📹 **Camera Integration** - Show objects, documents, or gestures
- 🖥️ **Screen Sharing** - Share your screen for technical support
- 💬 **Text Chat** - Fallback text communication
- 🎭 **Custom AI Personalities** - Pre-built prompts for different roles
- 📱 **Mobile Responsive** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Google AI API key](https://makersuite.google.com/app/apikey)

### Installation

```bash
# Clone and install
git clone https://github.com/alberttjc/gemini-voice-nextjs.git
cd gemini-voice-nextjs
npm install

# Configure API key
cp .env.example .env.local
# Edit .env.local and add: NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_key_here

# Start development server
npm run dev
```

### First Use
1. Open [http://localhost:3000](http://localhost:3000)
2. Enter your API key in the console panel (gear icon)
3. Click "Connect" and start talking!

## 🎭 AI Personalities

The `prompts/` folder contains ready-to-use AI templates:

- **`receptionist.md`** - Medical receptionist for appointments
- Create your own by adding `.md` files with system instructions

**Usage:** Copy prompt content → Paste into "System Instructions" → Connect

## 🏗️ Project Structure

```
📦 gemini-voice-nextjs/
├── 📁 app/              # Next.js pages
├── 📁 components/       # React components
│   ├── interface/       # Main UI components
│   └── ui/             # Reusable components
├── 📁 contexts/        # State management
├── 📁 lib/             # Core libraries
├── 📁 prompts/         # 🎭 AI personality templates
└── 📁 hooks/           # Custom React hooks
```

## ⚙️ Configuration

### Environment Variables
```env
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_api_key_here
```

### App Settings (Console Panel)
- **Model Selection** - Choose Gemini version
- **System Instructions** - Set AI personality
- **Audio/Video** - Toggle voice and camera features

### Browser Permissions
- **Microphone** - Required for voice chat
- **Camera** - Optional for visual interactions
- **Screen Share** - Optional for screen assistance

## 🎨 Creating Custom Prompts

```markdown
# Example Custom Prompt
You are a helpful [role] who [characteristics].

PERSONALITY:
- [Trait 1]
- [Trait 2]

BEHAVIOR:
- [How to respond]
- [Communication style]
```

---