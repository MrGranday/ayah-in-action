# Ayah in Action

**Ayah in Action** is a comprehensive, AI-powered web application built with Next.js that helps users reflect on Quranic verses (Ayahs), track daily actions, and maintain a consistent spiritual habit. 

## 🌟 Key Features

- **Quranic Verse Integration**: Seamlessly fetch and display daily or random Ayahs using `@quranjs/api`.
- **AI-Powered Reflections**: Gain deeper insights and "pulses" tailored to the verse of the day using state-of-the-art AI. Supports multiple providers:
  - OpenAI
  - Anthropic (Claude)
  - Google Gemini
- **Action & Habit Tracking**: 
  - Log your daily reflections and actions.
  - Visualize your consistency with a **Streak Heatmap** (`react-calendar-heatmap`).
  - View your journey over time in the **Echo Timeline**.
  - Monitor overall progress in the **Impact Dashboard**.
- **Voice Memos (Whisper)**: Record your thoughts and reflections directly via your device's microphone.
- **Export & Share**: Generate and download beautiful PDF summaries of your reflections using `jspdf` and `html2canvas`.
- **Progressive Web App (PWA)**: Install the app directly on your mobile or desktop device for a native-like experience.
- **Modern UI/UX**: Fully responsive, dark/light mode support (`next-themes`), and smooth animations (`framer-motion`).
- **Quran.com Authentication**: Secure login flow using Quran.com's OAuth.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm**, **yarn**, **pnpm**, or **bun**

### 2. Installation
Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd ayah-in-action
npm install
# or yarn install / pnpm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory. Use the following template to configure your environment variables:

```env
# --- Environment Toggle ---
# Use 'prelive' for local development (pre-registered localhost redirect URIs)
# Use 'production' only for deployed production builds
QF_ENV=prelive

# --- Pre-Production (Test) ---
# Use these for full feature access (Auth + Notes) during local development
# The prelive OAuth client has http://localhost:3000/api/auth/callback registered
QURAN_CLIENT_ID=your_test_client_id
QURAN_CLIENT_SECRET=your_test_client_secret

# --- Production (Live) ---
# Switch QF_ENV=production and uncomment these when deploying to production
# QURAN_CLIENT_ID=your_live_client_id
# QURAN_CLIENT_SECRET=your_live_client_secret

# --- App Config ---
# Generate a secure random string for NEXTAUTH_SECRET
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> **Note**: AI API keys (OpenAI, Anthropic, Gemini) can be configured directly within the app via the API Settings page for customized usage.

### 4. Run the Development Server
Start the Next.js development server:

```bash
npm run dev
# or yarn dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 🛠️ Tech Stack & Scripts

**Core**: [Next.js 15 (App Router)](https://nextjs.org/) & React 19  
**Styling**: Tailwind CSS & `lucide-react` for icons  
**State Management**: Zustand  
**Authentication**: Custom integration with Quran.com OAuth via Iron Session  

### Available Scripts
- `npm run dev` - Starts the local development server.
- `npm run build` - Builds the application for production deployment.
- `npm run start` - Starts the production server using the compiled build.
- `npm run lint` - Runs ESLint to catch and fix code issues.

## 📦 Deployment
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new). When deploying, remember to switch the `QF_ENV` to `production` and provide the live `QURAN_CLIENT_ID` and `QURAN_CLIENT_SECRET`.
