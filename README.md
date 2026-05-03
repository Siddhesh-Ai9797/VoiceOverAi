# VoiceOverAI — AI-Powered Video Dubbing

Dub any video into 22 languages with AI-powered transcription, translation, voice synthesis and lip sync.

Built by: Siddhesh Patil — MS Computer Science, DePaul University, Chicago

---

## What is VoiceOverAI?

VoiceOverAI is a full-stack SaaS product that lets anyone upload a video and get it dubbed into any language using a fully automated AI pipeline. Built from scratch in a single session using Next.js, FastAPI, and state-of-the-art AI APIs.

---

## Features

- Video upload — drag and drop any video up to 2GB (MP4, MOV, AVI, MKV, WEBM)
- 22 languages — Hindi, Tamil, Telugu, Bengali, Marathi, Spanish, French, German, Japanese, Mandarin, Korean, Arabic
- Voice synthesis — ElevenLabs multilingual TTS
- Voice cloning — matches the original speaker's voice (Pro plan)
- Transcription — OpenAI Whisper v3 (industry-leading accuracy)
- Translation — DeepL API (better than Google Translate for long-form content)
- Video composition — FFmpeg merges dubbed audio back into original video
- Auth — email and password sign up and sign in with NextAuth.js and JWT
- Payments — Stripe subscriptions at $29, $99, and $299 per month
- Dashboard — real job history per user stored in SQLite
- Protected routes — proxy middleware redirects unauthenticated users

---

## AI Pipeline

Every dubbing job runs through this 7-step pipeline:

Step 1 — Video upload
Step 2 — FFmpeg extracts audio track (WAV, 16kHz mono)
Step 3 — OpenAI Whisper v3 transcribes speech to text
Step 4 — DeepL API translates transcript (timestamp-aware)
Step 5 — ElevenLabs synthesizes dubbed speech in target language
Step 6 — FFmpeg composes final video (original frames + dubbed audio)
Step 7 — Download ready

---

## Tech Stack

### Frontend
- Next.js 16 with App Router — React framework with server components
- TypeScript — type safety across the entire codebase
- Tailwind CSS v4 — utility-first styling
- NextAuth.js beta — authentication and JWT sessions
- Stripe.js — payment processing and subscription billing
- Plus Jakarta Sans and Fira Code — display and mono fonts

### Backend
- FastAPI — high-performance Python API server
- Uvicorn — ASGI server for FastAPI
- OpenAI Whisper v3 — state-of-the-art speech transcription
- DeepL API — high-quality neural machine translation
- ElevenLabs — voice synthesis and voice cloning
- FFmpeg 8.1 — audio extraction and video composition
- SQLite with better-sqlite3 — user and job persistence
- bcryptjs — secure password hashing

### Infrastructure
- Vercel — frontend deployment
- Railway — Python backend deployment
- AWS S3 — cloud video storage
- Stripe — subscription billing

---

## Project Structure

voiceoverai/
    src/
        app/
            page.tsx                  homepage — upload UI
            dashboard/
                page.tsx              server component — fetches real jobs
                DashboardClient.tsx   client component — renders job table
            pricing/page.tsx          stripe pricing plans
            signin/page.tsx           sign in page
            signup/page.tsx           sign up page
            success/page.tsx          post-payment success screen
            not-found.tsx             custom 404 page
            api/
                auth/[...nextauth]/   nextauth route handlers
                dub/route.ts          POST — video upload and job creation
                jobs/[id]/route.ts    GET  — job status polling
                checkout/route.ts     POST — stripe checkout session
                signup/route.ts       POST — user registration
                webhook/route.ts      POST — stripe payment webhook
        components/
            Navbar.tsx                navigation bar with auth state
            DropZone.tsx              drag and drop video upload
            LanguagePicker.tsx        12-language selection grid
            PipelineStatus.tsx        live animated processing screen
            SessionProvider.tsx       nextauth session context wrapper
        lib/
            auth.ts                   nextauth config with sqlite
            auth.config.ts            edge-safe auth config for proxy
            db.ts                     sqlite helpers for users and jobs
            api.ts                    frontend API call functions
            constants.ts              languages list and pipeline steps
        proxy.ts                      route protection middleware
    backend/
        main.py                       fastapi app and all endpoints
        pipeline.py                   ai pipeline orchestrator
        models.py                     pydantic data models
        requirements.txt              python package list
    .env.local                        api keys — never committed
    next.config.ts                    next.js configuration
    README.md                         this file

---

## Local Development

### Prerequisites

- macOS or Linux or Windows WSL
- Node.js 20 or higher
- Python 3.11 or higher
- FFmpeg 8 or higher
- Git

### 1. Clone the repo

git clone https://github.com/YOUR_USERNAME/voiceoverai.git
cd voiceoverai

### 2. Install frontend dependencies

npm install

### 3. Set up the Python backend

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

### 4. Configure environment variables

Create a .env.local file in the root folder with these keys:

OPENAI_API_KEY=sk-proj-...
DEEPL_API_KEY=your-deepl-key:fx
ELEVENLABS_API_KEY=sk_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AUTH_SECRET=your-random-32-char-secret
NEXTAUTH_URL=http://localhost:3000

### 5. Run both servers

Terminal 1 — Frontend:
npm run dev

Terminal 2 — Backend:
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

### 6. Open the app

Go to http://localhost:3000

---

## Pricing Plans

Starter — $29 per month — 30 minutes — standard voice — 5 languages
Pro     — $99 per month — 3 hours — voice cloning — 22 languages — lip sync
Studio  — $299 per month — unlimited — all features — API access

---

## Roadmap

- AWS S3 cloud storage for video files
- LatentSync lip sync powered by GPU
- Real voice cloning via ElevenLabs Creator plan
- Google and GitHub OAuth sign in
- Usage-based billing per minute
- SRT subtitle file export
- Batch processing API
- Mobile app with React Native

---

## About the Builder

Built by Siddhesh Patil, MS Computer Science student at DePaul University, Chicago.

Background: Machine Learning, Computer Vision, NLP, RAG pipelines, LangGraph agents, FastAPI, Next.js, AWS.

Previous experience: AI intern at Innova Analytics — built fault detection models on industrial sensor data, anomaly detection pipelines, and computer vision systems.

This entire product — dev environment setup, UI design system, AI pipeline, authentication, payments — was built from scratch in a single focused session.

---

## License

MIT — free to fork, build on, and ship.