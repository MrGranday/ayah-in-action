# Ayah in Action

![Ayah in Action Logo](https://img.shields.io/badge/Ayah%20in%20Action-AI%20Quran%20Reflection-10b981?style=for-the-badge&logo=next.js&logoColor=white)

**Ayah in Action** is a comprehensive, AI-powered web application built with Next.js that helps users reflect on Quranic verses (Ayahs), track daily actions, and maintain a consistent spiritual habit. By bridging the gap between passive reading and active engagement, the app leverages cutting-edge LLMs to translate ancient wisdom into actionable, modern-day insights tailored to both personal history and global community trends.

---

## 🌟 Core Features & Functionality

### 1. The Dashboard & Ayah Card
The central hub for daily reflection.
- **Daily & Random Ayahs:** Fetches verses seamlessly using `@quranjs/api`.
- **Bilingual Display:** Renders beautiful Uthmani Arabic script alongside localized translations.
- **Audio Recitation:** Integrated audio player for listening to the verse.
- **Shuffle Functionality:** Powered by the `ShuffleAyahButton` to randomly explore the Quran.

### 2. The Ummah Pulse (AI Reflections)
A highly sophisticated semantic AI engine that generates personalized insights.
- **Dynamic Context Merging:** `generatePulse.ts` fetches trending reflections from the global community feed (`/quran-reflect/v1/posts/feed`) and merges them with the user's private Bookmarks and Notes.
- **Multi-Model Support:** Users can generate these "Pulses" using their choice of AI providers:
  - **OpenAI** (GPT-4o)
  - **Anthropic** (Claude 3.5 Sonnet)
  - **Google Gemini** (Gemini 2.0 Flash)
  - **Groq** (Llama 3.3 70B)
  - **HuggingFace** (Llama 3 70B Instruct)
- **ScriptGuard Validation:** Ensures AI outputs adhere strictly to the chosen language constraints without dialectal or script contamination (`scriptGuard.ts`).

### 3. The Whisper (Voice & Semantic Guidance)
A dual-purpose guidance and logging system.
- **Life Whisper (`LifeWhisper.tsx`):** Users can type or speak a "challenge" they are facing. The `suggestAyahFromChallenge` server action uses AI semantic search to find a Quranic verse that addresses their specific emotional or practical struggle.
- **Voice Memos (`VoiceRecorder.tsx`):** Users can record their thoughts directly via microphone, allowing for frictionless, conversational reflection journaling (`generateWhisper.ts`).

### 4. Action & Habit Tracking
Turning reflection into physical reality.
- **The Journal (`LogForm.tsx`):** A clean interface for users to type their daily reflections and the specific "actions" they are taking based on a verse.
- **Echo Timeline (`EchoTimeline.tsx` & `HistoryClient.tsx`):** A chronological feed of all past reflections, allowing users to scroll back through their spiritual journey. The `generateEcho.ts` action can optionally synthesize insights from past logs.

### 5. Impact Dashboard
Visualizing consistency to build lasting habits.
- **Streak Heatmap (`StreakHeatmap.tsx`):** A GitHub-style contribution graph (via `react-calendar-heatmap`) showing daily engagement over the year.
- **Progress Metrics (`ImpactStats.tsx`):** Displays total actions taken, consecutive days logged, and overall application usage.

### 6. The Atelier (Settings)
A dedicated environment for the user to configure their AI experience.
- **API Key Management (`ApiKeySettings.tsx`):** Users natively input and store their API keys (OpenAI, Anthropic, Gemini, Groq, HF) locally/securely to power the AI features.
- **Model Selection:** Seamlessly switch between different LLMs depending on preference for speed, cost, or reasoning depth.
- **Scope Doctor (`ScopeDoctor.tsx`):** A diagnostic tool to ensure auth and API scopes are correctly configured.

### 7. Export & Share
- **PDF Generation (`PdfExportButton.tsx`):** Uses `jspdf` and `html2canvas` to render the user's reflection timeline into a beautifully formatted, downloadable PDF document.

### 8. Progressive Web App (PWA)
- **Native Experience:** Powered by `@ducanh2912/next-pwa`. The `InstallPrompt.tsx` component guides users to install the app directly to their mobile iOS/Android home screens or Desktop for offline caching and a native feel.

---

## 🌍 Global Language Ecosystem

Ayah in Action is built for the global Ummah. It doesn't just translate text; it adapts the entire AI personality, Tafsir sources, and typography based on the selected language. 

Controlled via `src/config/languageConfig.ts`, the app supports 11 distinct profiles:
- **English (`en`)**: Uses *Inter* font, Tafsir Ibn Kathir (Abridged).
- **Arabic (`ar`)**: Full RTL support, *Noto Naskh Arabic*, strict Fusha (Modern Standard Arabic) LLM enforcement.
- **Urdu (`ur`)**: RTL support, *Noto Nastaliq Urdu* font, Tafheem e Qur'an translation.
- **Bengali (`bn`)**, **Russian (`ru`)**, **Turkish (`tr`)**, **Indonesian (`id`)**, **Persian (`fa`)**, **French (`fr`)**, **Spanish (`es`)**, **Simplified Chinese (`zh`)**.

Each language configures:
- Exact HTML direction (`ltr` vs `rtl`).
- Specialized LLM contamination warnings (e.g., instructing the AI not to use Roman Urdu or dialectal Arabic).
- Eastern numeral support where applicable.

---

## 🏗️ Component Architecture (`src/components/`)

- `ApiKeySettings.tsx`: Form for managing LLM provider keys.
- `AyahCard.tsx`: The primary UI for displaying verses, translations, and audio.
- `DailyGreeting.tsx`: Personalized, time-aware user greetings.
- `EchoTimeline.tsx`: The visual feed of the user's reflection history.
- `EmptyState.tsx`: Reusable UI for states with no data.
- `HistoryClient.tsx`: The main wrapper for the History page.
- `ImpactDashboard.tsx` & `ImpactStats.tsx`: Wrappers for data visualization.
- `InstallPrompt.tsx`: PWA installation banner logic.
- `LandingPage.tsx`: The animated hero and marketing entry point.
- `LanguagePicker.tsx`: Dropdown to switch the global language context.
- `LifeWhisper.tsx`: The floating action interface for semantic Ayah suggestions.
- `LogForm.tsx`: The reflection input and submission form.
- `NavSidebar.tsx`: The primary application navigation (Desktop sidebar / Mobile bottom bar).
- `PdfExportButton.tsx`: Handles PDF snapshot generation.
- `ScopeDoctor.tsx`: Debugging interface for authentication scopes.
- `ShuffleAyahButton.tsx`: Triggers random Ayah fetching.
- `StreakHeatmap.tsx`: Wraps the calendar heatmap visualization.
- `ThemeProvider.tsx`: Wraps the app for next-themes (Dark/Light mode).
- `VoiceRecorder.tsx`: The microphone integration for audio notes.

---

## 💾 State Management & Data Flow

The application relies heavily on **Zustand** (`src/stores/`) for lightweight, global client-side state:

1. `useAuthStore.ts`: Manages the user session, Quran.com access tokens, and auth status.
2. `useAyahStore.ts`: Holds the currently displayed Ayah, loading states for "The Whisper", and manages the transition when a new Ayah is shuffled or suggested.
3. `useLanguageStore.ts`: The central source of truth for the active language (`isoCode`) and its associated typography/RTL configuration.
4. `useUIStore.ts`: Controls global UI states like mobile sidebar toggles and loading overlays.

---

## 🔌 API Routes & Server Actions

All AI and data fetching logic is encapsulated in Next.js Server Actions (`src/app/actions/`) to protect API keys and ensure fast execution.

- `generatePulse.ts`: The core AI engine. Fetches community trends, fetches user bookmarks/notes, constructs dynamic prompts, and streams back customized reflections from the selected LLM.
- `generateWhisper.ts`: Handles the "Life Whisper" semantic search, mapping a user's typed/spoken challenge to a relevant Quranic verse.
- `generateAtelier.ts`: (Experimental) Potential action for deeper, workspace-level AI generation.
- `generateEcho.ts`: Synthesizes past logs into a thematic overview.
- `globalUmma.ts`: Interfaces with the public Quran.com or QuranReflect APIs for community data.
- `log.ts`: Server-side validation and database submission for user journal entries.

---

## 🛠️ Tech Stack & Integrations

- **Core Framework**: [Next.js 15 (App Router)](https://nextjs.org/) & React 19
- **Styling & UI**: Tailwind CSS v4, Framer Motion (for cinematic animations), Lucide React (Icons).
- **Authentication**: `iron-session` paired with custom Quran.com OAuth.
- **State**: Zustand.
- **AI SDKs**: `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`.
- **Quran Data**: `@quranjs/api`.
- **Visuals**: `react-calendar-heatmap` (activity), `chart.js` & `react-chartjs-2` (metrics), `canvas-confetti` (gamification).

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

### 2. Installation
Clone the repository and install the dependencies:

```bash
git clone https://github.com/MrGranday/ayah-in-action.git
cd ayah-in-action
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Use 'prelive' for local dev, 'production' for live builds
QF_ENV=prelive

# Quran.com OAuth Client IDs
QURAN_CLIENT_ID=your_test_client_id
QURAN_CLIENT_SECRET=your_test_client_secret

# App Config
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> **Note**: AI API keys (OpenAI, Anthropic, Gemini, Groq, HF) are configured directly within the app via **The Atelier** Settings page.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment
Deploy easily using the [Vercel Platform](https://ayah-in-action.vercel.app/). When deploying, switch `QF_ENV` to `production` and provide your live `QURAN_CLIENT_ID` and `QURAN_CLIENT_SECRET`.
