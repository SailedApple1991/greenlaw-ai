# Quick Start Guide

## Setup Steps

1. **Open the project folder in your terminal:**
   ```bash
   cd C:\Users\ericw\CascadeProjects\greenlaw-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## What You'll See

- A clean, modern chat interface with an environmental law theme
- Pre-loaded example messages showing the reference system
- An interactive input field where you can type new messages
- Real-time responses from the simulated AI backend

## How It Works

### Chat Flow
1. Type a message in the input field
2. Press Enter or click the send button
3. Your message appears in the chat (green bubble on the right)
4. The AI processes your request via `/api/chat` route
5. Response appears with citations and references (white bubble on the left)

### Key Features

**References & Citations:**
- Hover over blue-highlighted text to see full reference details
- Each AI response includes a bibliography section at the bottom

**Interactive Elements:**
- Enter to send, Shift+Enter for new line
- Smooth animations for new messages
- Loading indicator while processing
- Auto-scroll to latest message

**Dark Mode Ready:**
- The interface supports dark mode (currently set to light mode)
- Toggle by changing the class in `app/layout.tsx`

## Next Steps

### Connect Real AI Backend

Edit `app/api/chat/route.ts` to integrate with:
- OpenAI GPT-4
- Anthropic Claude
- Custom RAG system for legal documents
- Other LLM providers

### Customize Styling

Edit `tailwind.config.ts` to change:
- Primary color (currently emerald green)
- Font family (currently Manrope)
- Border radius and spacing

### Add Features

Consider adding:
- Message persistence (localStorage or database)
- Export chat history
- Document upload for context
- User authentication
- Advanced search capabilities

## Troubleshooting

**Port already in use:**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Dependencies won't install:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
These are normal before `npm install`. Run the install command to resolve.

## Project Structure

```
greenlaw-ai/
├── app/
│   ├── api/chat/route.ts    # API endpoint for chat
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main chat interface
│   └── globals.css          # Global styles
├── components/
│   ├── Header.tsx           # App header
│   ├── ChatBubble.tsx       # Message bubbles
│   └── MessageInput.tsx     # Input field
└── public/                  # Static files
```

## Support

For issues or questions:
- Check the main README.md
- Review the code comments
- Inspect browser console for errors
