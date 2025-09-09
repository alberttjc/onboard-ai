# Voice AI Onboarding Agent

A sophisticated voice-based onboarding assistant built with Next.js and Google's Gemini Live API. This application provides personalized, step-by-step guidance for setting up various SaaS products through natural voice interactions.

## ✨ Core Features

### 🎤 **Advanced Voice Interface**
- **Real-time Voice Chat** - Natural speech conversations with AI using Gemini Live API
- **Streaming Audio Responses** - Sub-2-second response times with live audio streaming
- **High-Quality Transcription** - Accurate speech-to-text with confidence scoring
- **Voice Activity Detection** - Automatic recording start/stop based on speech

### 🎯 **Multi-Product Onboarding System**
- **Product Selection Interface** - Choose from multiple SaaS products (Notion, Trello, Slack, Figma)
- **Guided Step-by-Step Flows** - Structured onboarding with progress tracking
- **Dynamic Conversation Context** - AI maintains awareness of current step and user progress
- **Validation & Error Recovery** - Smart validation of step completion with helpful error handling

### 🎭 **Intelligent Coaching Personalities**
- **Product-Specific AI Coaches** - Specialized personalities for each product (Notion expert, Trello organizer, etc.)
- **Adaptive Communication Styles** - Adjusts pace and detail level based on user needs
- **Contextual Help** - Provides relevant assistance based on current onboarding step

### 📊 **Advanced Analytics & Monitoring**
- **Real-time Performance Tracking** - Response time measurement and optimization
- **User Journey Analytics** - Completion rates, drop-off points, and success metrics
- **Voice Interaction Quality** - Transcription confidence and audio clarity monitoring
- **Session Management** - Pause, resume, restart functionality with state persistence

### 📹 **Multi-Modal Support**
- **Camera Integration** - Show objects, documents, or gestures during onboarding
- **Screen Sharing** - Share your screen for technical guidance
- **Text Chat Fallback** - Alternative input method when voice isn't available
- **Mobile Responsive** - Full functionality on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- [Google AI API key](https://makersuite.google.com/app/apikey) with Live API access

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/voice-onboarding-agent.git
cd voice-onboarding-agent

# Install dependencies
npm install

# Configure API key
cp .env.example .env.local
# Edit .env.local and add: NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_key_here

# Start development server
npm run dev
```

### First Use
1. Open [http://localhost:3000](http://localhost:3000)
2. Allow microphone permissions when prompted
3. Select a product for onboarding (Notion, Trello, etc.)
4. Click "Start Onboarding" and begin speaking naturally!

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  • Product Selection UI    • Onboarding Progress Tracker   │
│  • Voice Interface         • Real-time Analytics Dashboard │
│  • Multi-modal Controls    • Session Management            │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                 Onboarding System Core                      │
├─────────────────────────────────────────────────────────────┤
│  • OnboardingManager       • Product-Specific Flows       │
│  • Conversation Context    • Progress Tracking             │
│  • Analytics Collection    • Error Recovery                │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    AI & Audio Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│  • Gemini Live API         • Audio Processing              │
│  • Custom AI Personalities • Voice Activity Detection      │
│  • Context-Aware Responses • Real-time Streaming           │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure
```
📦 voice-onboarding-agent/
├── 📁 app/                     # Next.js app router pages
├── 📁 components/              # React components
│   ├── interface/              # Main UI components  
│   ├── onboarding/            # Onboarding-specific components
│   └── ui/                    # Reusable UI components
├── 📁 contexts/               # React context providers
├── 📁 lib/                    # Core application logic
│   ├── onboarding/           # Onboarding system
│   │   ├── base-flow.ts      # Abstract onboarding flow
│   │   ├── notion-flow.ts    # Notion-specific implementation
│   │   ├── trello-flow.ts    # Trello-specific implementation
│   │   └── onboarding-manager.ts # Central orchestration
│   ├── analytics/            # Analytics and monitoring
│   ├── types/               # TypeScript type definitions
│   └── audio/              # Audio processing utilities
├── 📁 prompts/                # AI personality prompts
│   └── onboarding/           # Product-specific coach prompts
└── 📁 hooks/                  # Custom React hooks
```

## 🎭 Available Onboarding Coaches

### 📝 **Notion Coach**
- **Personality**: Patient, supportive teacher who celebrates every win
- **Specialty**: Explains blocks, databases, and workspace organization
- **Approach**: Step-by-step building from basics to advanced features
- **Estimated Time**: 20 minutes

### 📋 **Trello Coach** 
- **Personality**: Organized project manager focused on visual workflows
- **Specialty**: Kanban methodology and visual project management
- **Approach**: Systematic workflow design with real-world examples
- **Estimated Time**: 15 minutes

### 💬 **Slack Coach** *(Coming Soon)*
- **Personality**: Team communication expert
- **Specialty**: Channel organization and collaboration features
- **Estimated Time**: 12 minutes

### 🎨 **Figma Coach** *(Coming Soon)*
- **Personality**: Creative design mentor
- **Specialty**: Design collaboration and prototyping
- **Estimated Time**: 25 minutes

## 🔧 Configuration & Customization

### Environment Variables
```env
# Required
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_api_key_here

# Optional Analytics (if using external services)
NEXT_PUBLIC_GA_MEASUREMENT_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_POSTHOG_KEY=POSTHOG_KEY
```

### Audio Settings
The application automatically optimizes audio settings but you can customize:
```typescript
// In lib/audio-recorder.ts
const SAMPLE_RATE = 16000;  // Optimal for Gemini Live API
const AUDIO_FORMAT = 'PCM16'; // Required format
const BUFFER_SIZE = 4096;   // Balance between latency and stability
```

### Adding New Product Flows
1. **Create Flow Implementation**:
   ```typescript
   // lib/onboarding/your-product-flow.ts
   export class YourProductFlow extends BaseOnboardingFlow {
     // Implement required methods
   }
   ```

2. **Add Product Definition**:
   ```typescript
   // In onboarding-manager.ts
   {
     id: 'your-product',
     name: 'Your Product',
     description: 'Product description',
     category: 'Category',
     estimatedTime: 15,
     difficulty: 'easy',
     icon: '🔧',
     color: '#FF6B6B'
   }
   ```

3. **Create Coach Prompt**:
   ```markdown
   <!-- prompts/onboarding/your-product-coach.md -->
   You are an expert [Product] onboarding coach...
   ```

## 📊 Analytics & Monitoring

### Built-in Analytics
- **User Journey Tracking**: Complete funnel analysis from product selection to completion
- **Performance Metrics**: Response times, error rates, and system performance
- **Voice Quality Metrics**: Transcription accuracy and audio clarity scores
- **Engagement Analytics**: Session duration, interaction patterns, pause/resume behavior

### External Integrations
Supports integration with:
- Google Analytics 4
- PostHog
- Mixpanel
- Custom analytics endpoints

### Performance Monitoring
```typescript
// Access real-time metrics
const metrics = onboardingManager.getPerformanceMetrics();
console.log('Average Response Time:', metrics.averageResponseTime);
console.log('Completion Rates:', metrics.completionRates);
console.log('Drop-off Points:', metrics.dropoffAnalysis);
```

## 🔒 Security & Privacy

### Data Handling
- **Voice Data**: Processed in real-time, not stored permanently
- **Conversation History**: Limited to 50 most recent turns per session
- **User Progress**: Stored locally in browser session
- **Analytics**: Anonymized and aggregated metrics only

### Security Features
- **API Key Protection**: Environment-based configuration
- **HTTPS Only**: Secure communication for all API calls
- **Browser Permissions**: Explicit microphone/camera permission requests
- **No Personal Data Storage**: No personal information stored on servers

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_key_here
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Audio Streaming**: Optimized buffer sizes for minimal latency
- **Memory Management**: Automatic cleanup of conversation history
- **CDN Ready**: Static assets optimized for CDN deployment

## 🧪 Testing & Development

### Running Tests
```bash
# Unit tests
npm run test

# Performance testing
npm run perf:check

# Bundle analysis
npm run build:analyze
```

### Development Features
- **Hot Reload**: Real-time code updates during development
- **Debug Console**: Built-in logging and debugging tools
- **Analytics Dashboard**: Real-time metrics visualization
- **Error Boundary**: Graceful error handling and recovery

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push and create a Pull Request

### Adding New Products
1. Implement the onboarding flow class extending `BaseOnboardingFlow`
2. Create the product-specific coach prompt in `prompts/onboarding/`
3. Add the product to the available products list in `onboarding-manager.ts`
4. Test the complete flow end-to-end
5. Update documentation and submit PR

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Enforced code quality and consistency
- **Prettier**: Automated code formatting
- **Conventional Commits**: Structured commit messages

## 📈 Roadmap

### Upcoming Features
- **Multi-language Support**: Onboarding in multiple languages
- **Advanced Analytics Dashboard**: Real-time metrics visualization
- **Custom Flow Builder**: Visual editor for creating new onboarding flows
- **Integration APIs**: Webhooks and API endpoints for external integrations
- **Mobile App**: React Native companion app
- **Voice Cloning**: Personalized AI coach voices

### Product Expansions
- **CRM Platforms**: Salesforce, HubSpot onboarding
- **Development Tools**: GitHub, Jira, Confluence setup
- **Design Tools**: Sketch, Adobe Creative Suite guidance
- **Business Tools**: Accounting software, email marketing platforms

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Community support and questions in GitHub Discussions

### Common Issues
- **Microphone Not Working**: Ensure HTTPS and browser permissions
- **API Key Issues**: Verify key is active and has Live API access
- **Performance Issues**: Check network connection and browser compatibility

### Browser Compatibility
- **Chrome**: 90+ (Recommended)
- **Safari**: 14+
- **Firefox**: 88+
- **Edge**: 90+

---

**Built with ❤️ for better user onboarding experiences**

Transform complex product setups into conversational, guided experiences that users actually enjoy. The future of onboarding is voice-first, AI-powered, and delightfully human.
