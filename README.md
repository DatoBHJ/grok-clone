# Groc.lol - xAI's Grok clone

This is an open source clone of xAI's Grok.
Made this just for fun. Don't sue me xAI.

**Important:** Groc is 100% unaffiliated with xAI.

Live Demo: [groc.lol](https://www.groc.lol)

## Preview

![Website Preview](https://github.com/DatoBHJ/grok-clone/blob/main/assets/preview.png?raw=true)

[Try Groc Now →](https://www.groc.lol)

## Features

- Youtube link access (Chat, summary, ...etc)
- Perplexity style Web search capabilities, searching both tweets and web pages.
- Image generation using FLUX.1 by Black Forest Labs
- Vision capabilities (chat with images)
- Rate limiting 
- Customizable LLM settings

## Tech Stack

- LLM Options:
  - Primary Chat: Choose between Grok-beta (xAI) or alternative models
  - Function Calling: Choose between Llama (Groq) or alternative models
- Web search: Serper
- Rate limiting: Upstash
- Image generation: FAL
- Framework: Next.js

## Setup

### Required API Keys

```bash
XAI_API_KEY=your_key 
GROQ_API_KEY=your_key
SERPER_API_KEY=your_key
FAL_KEY=your_key
```

### Optional Configuration

```bash
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Customization

- Rate limiting can be disabled by setting `useRateLimiting` to `false` in `/app/config.tsx`
- LLM providers can be configured in `/app/config.tsx`:
  - Choose different models for primary chat and function calling
  - Switch between providers (Groq, xAI, etc.)
- System prompts and parameters can be customized in `types/chat.ts`

## Development

```bash
# Install dependencies
npm install
# or
yarn install

# Run development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ☕ Support

If you find this project helpful:
- ⭐ Star this repo
- 🌐 Visit [groc.lol](https://www.groc.lol)
- ☕ [Buy me a coffee](https://buymeacoffee.com/KingBob)

## 📞 Contact

- 🐦 X: [@DatoBHJ](https://x.com/DatoBHJ)
- 📧 Email: datobhj@gmail.com
- 🌐 Website: [groc.lol](https://www.groc.lol)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.