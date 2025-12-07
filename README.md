# GreenLaw AI

An interactive environmental law and policy assistant built with Next.js, React, and TypeScript.

## Features

- 🌿 **Modern UI**: Clean, accessible design with dark mode support
- 💬 **Interactive Chat**: Real-time chat interface with smooth animations
- 📚 **Legal References**: In-line citations with tooltips and full bibliography
- ⚡ **Next.js 14**: Built with the latest App Router architecture
- 🎨 **Tailwind CSS**: Responsive design with custom theming
- 📱 **Mobile-First**: Optimized for all screen sizes

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Python 3.8+ (for FastAPI backend with RAGFlow)
- RAGFlow instance (optional, for RAG-powered responses)

### Installation

#### Frontend (Next.js)

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables (create `.env.local`):

```env
# Option 1: Use FastAPI backend with RAGFlow (recommended)
USE_FASTAPI_BACKEND=true
FASTAPI_BACKEND_URL=http://localhost:8000

# Option 2: Use Gemini API directly
GOOGLE_API_KEY=your_gemini_api_key
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Backend (FastAPI + RAGFlow)

1. Navigate to backend directory:

```bash
cd backend
```

2. Create virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables (copy `env.example` to `.env`):

```bash
cp env.example .env
```

Edit `.env` with your RAGFlow configuration:

```env
RAGFLOW_API_KEY=your_ragflow_api_key_here
RAGFLOW_BASE_URL=http://localhost:9380
RAGFLOW_CHAT_ID=your_chat_assistant_id_here
PORT=8000
```

5. Run the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

## Project Structure

```
greenlaw-ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts  # Next.js API route (calls FastAPI or Gemini)
│   ├── layout.tsx        # Root layout with fonts and metadata
│   ├── page.tsx          # Main chat interface with state management
│   └── globals.css       # Global styles and animations
├── backend/
│   ├── main.py           # FastAPI backend server
│   ├── requirements.txt  # Python dependencies
│   ├── env.example       # Environment variables template
│   └── README.md        # Backend setup instructions
├── components/
│   ├── Header.tsx       # App header with branding
│   ├── ChatBubble.tsx   # Individual chat message component
│   └── MessageInput.tsx # Chat input field with send functionality
├── lib/
│   ├── llm.ts           # Gemini API integration
│   └── parseCitations.ts # Citation parsing utilities
├── public/              # Static assets
└── tailwind.config.ts   # Tailwind configuration
```

## Key Components

### ChatBubble
Displays individual messages with support for:
- User and assistant message styling
- In-line reference tooltips
- Full citation sections
- Smooth entrance animations

### MessageInput
Handles user input with:
- Enter to send, Shift+Enter for newline
- Send button with disabled states
- Loading state support

### Message Interface
```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
  citation?: string;
}
```

## Customization

### Colors
Edit `tailwind.config.ts` to customize the color scheme:
- `primary`: Main brand color (emerald green)
- `background-light`: Light mode background
- `background-dark`: Dark mode background

### Backend Integration

The project supports two backend options:

#### Option 1: FastAPI + RAGFlow (Recommended for RAG)

1. Set up RAGFlow instance and get API credentials
2. Configure backend `.env` file (see [backend/README.md](backend/README.md))
3. Start FastAPI server: `cd backend && uvicorn main:app --reload`
4. Set `USE_FASTAPI_BACKEND=true` in frontend `.env.local`

This provides RAG-powered responses with document references.

#### Option 2: Direct Gemini API

1. Get Google Gemini API key
2. Set `GOOGLE_API_KEY` in `.env.local`
3. Leave `USE_FASTAPI_BACKEND` unset or set to `false`

The Next.js API route (`app/api/chat/route.ts`) automatically routes to the configured backend.

## Building for Production

```bash
npm run build
npm run start
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Google Material Symbols
- **Font**: Manrope

## Backend Architecture

```
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│ Next.js API │
│  /api/chat  │
└──────┬──────┘
       │
       ├──► FastAPI Backend (if USE_FASTAPI_BACKEND=true)
       │    └──► RAGFlow API
       │
       └──► Gemini API (fallback/default)
```

## Future Enhancements

### ✅ Completed
- [x] Integration with AI/LLM backend (Gemini)
- [x] FastAPI backend with RAGFlow support
- [x] Message history persistence (localStorage)
- [x] Clear chat functionality

### 🚀 High Priority
- [ ] **Document upload and management** - Core knowledge base feature
- [ ] **Streaming responses** - Real-time AI replies
- [ ] **Multi-turn conversation context** - Maintain conversation history
- [ ] **Export chat transcripts** - PDF/Markdown export
- [ ] **Chat history list** - Manage multiple conversations

### 🎨 Medium Priority
- [ ] **Search functionality** - Search conversations and documents
- [ ] **Citation source links** - Click to view original documents
- [ ] **Feedback mechanism** - Like/dislike responses
- [ ] **Dark mode toggle** - Theme switching
- [ ] **Document preview** - View knowledge base documents

### 📋 Full Roadmap
See [FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md) for complete feature list and implementation priorities.

## License

MIT
