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

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
greenlaw-ai/
├── app/
│   ├── layout.tsx       # Root layout with fonts and metadata
│   ├── page.tsx         # Main chat interface with state management
│   └── globals.css      # Global styles and animations
├── components/
│   ├── Header.tsx       # App header with branding
│   ├── ChatBubble.tsx   # Individual chat message component
│   └── MessageInput.tsx # Chat input field with send functionality
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

### Adding AI Backend

To connect a real AI backend, modify the `handleSend` function in `app/page.tsx`:

```typescript
const handleSend = async (message: string) => {
  // Replace the setTimeout with your API call
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  const data = await response.json();
  // Process and add AI response to messages
};
```

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

## Future Enhancements

- [ ] Integration with AI/LLM backend
- [ ] Message history persistence
- [ ] Export chat transcripts
- [ ] Advanced search in legal documents
- [ ] Multi-language support
- [ ] Voice input support

## License

MIT
