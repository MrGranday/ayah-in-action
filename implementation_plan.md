# Ayah in Action — Exhaustive Implementation Plan

> **Mission:** Track how daily Quran ayahs translate into real-life change.  
> **Standard:** Every sentence, style token, feature, interaction, and non-functional requirement from the brief is captured below.  Any developer or AI reading this can reproduce the exact same product.

---

## 0. Pre-requisites & Environment Setup

### 0.1 API Access
1. Visit **https://api-docs.quran.foundation** → "Request Access".
2. In the access request mention: _hackathon_, _Ayah in Action_, usage of Content APIs + User APIs (collections, notes, streaks).
3. Obtain `client_id` and `client_secret`.
4. Store **only** in `.env.local` — **never commit this file**.

```env
# .env.local
QURAN_CLIENT_ID=your_client_id_here
QURAN_CLIENT_SECRET=your_client_secret_here
QF_ENV=prelive                            # change to "production" before submission
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 0.3 Confirmed Base URLs (from live docs)

| Environment | Auth Base | API Base |
|---|---|---|
| Pre-live | `https://prelive-oauth2.quran.foundation` | `https://apis-prelive.quran.foundation` |
| **Production** | `https://oauth2.quran.foundation` | `https://apis.quran.foundation` |

All User API calls path: `{apiBaseUrl}/auth/v1/...`  
Required headers on every call: `x-auth-token: <access_token>` + `x-client-id: <client_id>`

### 0.2 System Requirements
- Node.js ≥ 20 LTS
- npm ≥ 10
- Git initialized in `d:/projects/ayah-in-action`

---

## 1. Project Bootstrap

### 1.1 Scaffold Next.js 15

```bash
npx create-next-app@latest ./ \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

### 1.2 Install All Dependencies (One Command)

```bash
npm install \
  @quranjs/api \
  zustand \
  lucide-react \
  chart.js react-chartjs-2 \
  react-calendar-heatmap \
  jspdf html2canvas \
  @ducanh2912/next-pwa \
  class-variance-authority clsx tailwind-merge \
  zod \
  iron-session \
  nanoid \
  date-fns \
  framer-motion
```

```bash
# shadcn/ui scaffold
npx shadcn@latest init --base-color neutral --css-variables
# Then add individual components:
npx shadcn@latest add button badge card dialog select textarea separator tooltip progress tabs sheet
```

> **Why these?**
> - `iron-session` → HTTP-only cookie session (secure token storage — no JWT in localStorage).
> - `framer-motion` → Micro-animations (ayah "settles in" with fade + scale).
> - `date-fns` → Date formatting for the handwritten-stamp look.
> - `nanoid` → State/PKCE code verifier generation.
> - `zod` → Server Action input validation.

---

## 2. Complete File & Folder Structure

```
ayah-in-action/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx              ← Branded login page
│   │   │   └── layout.tsx                ← Auth-only layout (centered card)
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx              ← Daily anchor page (Server Component)
│   │   │   │   └── loading.tsx           ← Suspense skeleton
│   │   │   ├── history/
│   │   │   │   ├── page.tsx              ← All past logs list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          ← Single log detail
│   │   │   ├── impact/
│   │   │   │   ├── page.tsx              ← Dashboard with streaks + heatmap
│   │   │   │   └── loading.tsx
│   │   │   └── layout.tsx                ← App shell (sidebar nav)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts        ← Builds PKCE auth URL, redirects
│   │   │   │   ├── callback/route.ts     ← Exchanges code for tokens
│   │   │   │   ├── logout/route.ts       ← Clears session, redirects to /login
│   │   │   │   └── refresh/route.ts     ← Silent token refresh (called by middleware)
│   │   │   ├── ayah/
│   │   │   │   └── random/route.ts       ← Fetch random ayah (server-side, with SDK)
│   │   │   └── voice/
│   │   │       └── route.ts              ← (Optional) transcription endpoint
│   │   ├── manifest.ts                   ← PWA manifest (Next.js native)
│   │   ├── layout.tsx                    ← Root layout (fonts, providers, theme)
│   │   └── globals.css                   ← Full custom parchment + dark theme
│   ├── components/
│   │   ├── ui/                           ← shadcn/ui copies (customized)
│   │   ├── AyahCard.tsx                  ← Parchment ayah display
│   │   ├── LogForm.tsx                   ← Text + tags + voice log form
│   │   ├── VoiceRecorder.tsx             ← MediaRecorder + Web Speech API
│   │   ├── StreakHeatmap.tsx             ← react-calendar-heatmap wrapper
│   │   ├── ImpactStats.tsx               ← Stats cards + Chart.js charts
│   │   ├── DailyGreeting.tsx             ← "Assalamu alaikum, Ahmed…" banner
│   │   ├── NavSidebar.tsx                ← App nav with Lucide icons
│   │   ├── InstallPrompt.tsx             ← PWA install banner
│   │   ├── PdfExportButton.tsx           ← jsPDF + html2canvas trigger
│   │   ├── EmptyState.tsx                ← Poetic empty-state component
│   │   └── ThemeProvider.tsx             ← next-themes provider (dark mode)
│   ├── lib/
│   │   ├── quran-sdk.ts                  ← SDK client factory (singleton)
│   │   ├── api.ts                        ← All protected API calls (with headers)
│   │   ├── auth.ts                       ← Token management helpers
│   │   ├── session.ts                    ← iron-session config + types
│   │   └── utils.ts                      ← cn() helper + misc utilities
│   ├── stores/
│   │   ├── useAuthStore.ts               ← Auth user state (client-side)
│   │   ├── useAyahStore.ts               ← Current ayah + today's status
│   │   └── useUIStore.ts                 ← Theme, sidebar, modal state
│   ├── types/
│   │   ├── quran.ts                      ← Quran SDK type re-exports + extensions
│   │   ├── log.ts                        ← ApplicationLog type
│   │   └── auth.ts                       ← Session + user types
│   └── middleware.ts                     ← Auth guard + token refresh
├── public/
│   ├── icons/                            ← PWA icons (192, 512 png)
│   ├── fonts/                            ← (If manually hosting Amiri)
│   └── sw.js                             ← Manual service worker (offline cache)
├── .env.local                            ← Secrets (gitignored)
├── .gitignore                            ← Ensure .env.local is listed
├── next.config.ts                        ← next-pwa wrapper + config
└── tailwind.config.ts                    ← Custom design tokens
```

---

## 3. Design System & Theming (`globals.css` + `tailwind.config.ts`)

### 3.1 Color Palette (Exact Tokens)

| Token | Light Value | Dark Value | Usage |
|---|---|---|---|
| `--color-bg` | `#f8f1e3` | `#0f1117` | Page background (warm off-white) |
| `--color-surface` | `#efe8d6` | `#1a1f2e` | Cards, sidebar |
| `--color-parchment` | `#f5ead4` | `#1e2433` | AyahCard specific |
| `--color-emerald` | `#0a6650` | `#0d8c6c` | Primary brand (deep emerald) |
| `--color-gold` | `#d4a017` | `#e8b933` | Accent, streak icons |
| `--color-text-primary` | `#1c160f` | `#f0ebe0` | Main body text |
| `--color-text-muted` | `#7a6a50` | `#8a8070` | Secondary text |
| `--color-border` | `#dcd0b0` | `#2a3040` | Borders |

### 3.2 Typography

```typescript
// src/app/layout.tsx — font imports via next/font/google
import { Inter } from 'next/font/google';
import { Amiri } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});
```

- **Body/UI text:** `font-inter` (Inter)
- **Arabic ayah text:** `font-amiri` (Amiri — "gorgeous and readable")
- **Arabic fallback:** `Scheherazade New` (referenced in CSS `font-family` stack as fallback)
- **Direction:** Arabic text rendered with `dir="rtl"` attribute on the verse `<p>` element

### 3.3 Parchment Texture (AyahCard)

```css
/* globals.css */
.parchment {
  background-color: var(--color-parchment);
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(212, 160, 23, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(10, 102, 80, 0.04) 0%, transparent 40%),
    url("data:image/svg+xml,%3Csvg xmlns='...' width='200' height='200'%3E...%3C/svg%3E");
  border: 1px solid var(--color-border);
  box-shadow:
    inset 0 0 60px rgba(138, 77, 15, 0.08),
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}
```

### 3.4 Micro-Animations

```css
/* Ayah "settles in" — gentle fade + scale */
@keyframes ayahSettle {
  0%   { opacity: 0; transform: scale(0.97) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.ayah-enter {
  animation: ayahSettle 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Category chip hover */
.tag-chip {
  transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}
.tag-chip:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(10,102,80,0.2); }
.tag-chip.selected { background-color: var(--color-emerald); color: white; }

/* Save button press */
.btn-save:active { transform: scale(0.98); }
```

### 3.5 Dark Mode

```css
/* globals.css - automatic dark mode via prefers-color-scheme */
:root { /* light values */ }
@media (prefers-color-scheme: dark) {
  :root { /* dark values override */ }
}
/* Also supports manual toggle via data-theme="dark" attribute */
[data-theme="dark"] { /* same dark values */ }
```

### 3.6 Tailwind Config Extensions

```typescript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      amiri: ['var(--font-amiri)', 'Scheherazade New', 'serif'],
    },
    colors: {
      emerald: { DEFAULT: '#0a6650', dark: '#0d8c6c' },
      gold: { DEFAULT: '#d4a017', dark: '#e8b933' },
      parchment: '#f8f1e3',
    },
    animation: {
      'ayah-settle': 'ayahSettle 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
      'fade-in': 'fadeIn 0.3s ease-out forwards',
    },
  },
}
```

---

## 4. Authentication (OAuth2 — Confidential Client with PKCE)

### 4.1 Iron-Session Config (`src/lib/session.ts`)

```typescript
import { SessionOptions } from 'iron-session';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;  // Unix timestamp
  user?: {
    sub: string;
    name: string;
    email: string;
    picture?: string;
  };
  codeVerifier?: string;  // PKCE — cleared after callback
}

export const sessionOptions: SessionOptions = {
  password: process.env.NEXTAUTH_SECRET!,
  cookieName: 'ayah-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};
```

### 4.2 Route: `/api/auth/login` (GET)

**Flow:**
1. Generate PKCE `code_verifier` (32 random bytes → base64url).
2. SHA-256 hash → base64url `code_challenge`.
3. Generate `state` (16 random bytes → hex) — CSRF protection.
4. Generate `nonce` (16 random bytes → hex) — **required** when requesting `openid`.
5. Save `{ code_verifier, state, nonce }` in iron-session cookie **before** redirect.
6. Build auth URL (use `prelive-oauth2` in dev, `oauth2` in prod):
   ```
   {authBaseUrl}/oauth2/auth
   ?response_type=code
   &client_id={QURAN_CLIENT_ID}
   &redirect_uri={CALLBACK_URL}
   &scope=openid offline_access user collection
   &state={state}
   &nonce={nonce}
   &code_challenge={code_challenge}
   &code_challenge_method=S256
   ```
7. `redirect()` user to this URL.

### 4.3 Route: `/api/auth/callback` (GET)

**Flow:**
1. Extract `code` + `state` from query params.
2. Validate `state` matches value in session (CSRF). Reject if mismatch.
3. POST to `{authBaseUrl}/oauth2/token` using **HTTP Basic Auth** (confidential client):
   ```
   Content-Type: application/x-www-form-urlencoded
   Authorization: Basic base64(client_id:client_secret)

   grant_type=authorization_code
   &code={code}
   &redirect_uri={CALLBACK_URL}
   &code_verifier={code_verifier_from_session}
   ```
4. Parse response: `{ access_token, refresh_token, id_token, expires_in, scope }`.
5. Decode `id_token` JWT (no signature verification needed for display — use `jwt.decode()`). Extract `sub`, `name`, `email`, `picture`.
6. **Validate `nonce`** in `id_token` matches the nonce stored in session.
7. Save tokens + user to iron-session; clear `code_verifier` + `nonce` + `state`.
8. `redirect('/dashboard')`.

### 4.4 Route: `/api/auth/logout` (POST)

1. Call Quran Foundation revoke endpoint (if available).
2. `session.destroy()`.
3. `redirect('/login')`.

### 4.5 Route: `/api/auth/refresh` (POST)

1. Take `refresh_token` from session.
2. POST to `{authBaseUrl}/oauth2/token` with HTTP Basic Auth:
   ```
   grant_type=refresh_token
   &refresh_token={refresh_token}
   ```
3. Update session with new `access_token` + `expires_at`.
4. **Refresh stampede guard:** use a module-level `Promise` lock per session so only one refresh runs at a time.
5. Return 200 with new token. On failure, return 401 (triggers re-login).

### 4.6 Middleware (`src/middleware.ts`)

```typescript
// Protects all (app) routes
// Checks session.expiresAt — triggers refresh if < 5 minutes remaining
// Redirects to /login if no valid session
// Allows /api/auth/*, /, /login, static assets through without auth
```

---

## 5. Quran SDK Setup (`src/lib/quran-sdk.ts`)

```typescript
import { createClient } from '@quranjs/api';

// Singleton for public content API (Client Credentials)
let _client: ReturnType<typeof createClient> | null = null;

export function getQuranClient() {
  if (_client) return _client;
  _client = createClient(); // uses QURAN_CLIENT_ID/SECRET from env via SDK
  return _client;
}
```

### Config helper (`src/lib/qf-config.ts`) — mirrors exact doc pattern

```typescript
const ENV = process.env.QF_ENV === 'production' ? 'production' : 'prelive';

export const qfConfig = {
  env: ENV,
  clientId: process.env.QURAN_CLIENT_ID!,
  clientSecret: process.env.QURAN_CLIENT_SECRET!,
  authBaseUrl: ENV === 'production'
    ? 'https://oauth2.quran.foundation'
    : 'https://prelive-oauth2.quran.foundation',
  apiBaseUrl: ENV === 'production'
    ? 'https://apis.quran.foundation'
    : 'https://apis-prelive.quran.foundation',
};
```

---

## 6. Protected API Helper (`src/lib/api.ts`)

All calls from Server Components / Server Actions use this module. Base URL comes from `qfConfig.apiBaseUrl`.

```typescript
import { qfConfig } from './qf-config';

async function userApiFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${qfConfig.apiBaseUrl}/auth/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': accessToken,
      'x-client-id': qfConfig.clientId,
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// --- Notes API (PRIMARY storage for logs) ---
// POST /auth/v1/notes
export async function addApplicationNote(
  accessToken: string,
  payload: {
    body: string;           // min 6, max 10000 chars — our log text + metadata JSON
    ranges: string[];       // e.g. ["2:153-2:153"]
    attachedEntities?: Array<{
      entityId: string;     // e.g. "ayah-in-action"
      entityType: 'reflection';
      entityMetadata?: Record<string, unknown>; // categories, voiceTranscript etc.
    }>;
  }
) {
  return userApiFetch('/notes', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// GET /auth/v1/notes — paginated, sorted newest first
export async function getAllNotes(
  accessToken: string,
  cursor?: string,
  limit = 20
) {
  const params = new URLSearchParams({ first: String(limit), ...(cursor ? { after: cursor } : {}) });
  return userApiFetch(`/notes?${params}`, accessToken);
}

// GET /auth/v1/notes?verseKey={key} — notes for a specific verse
export async function getNotesByVerse(verseKey: string, accessToken: string) {
  return userApiFetch(`/notes/verse/${verseKey}`, accessToken);
}

// PATCH /auth/v1/notes/{id}
export async function updateNote(id: string, body: string, accessToken: string) {
  return userApiFetch(`/notes/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

// DELETE /auth/v1/notes/{id}
export async function deleteNote(id: string, accessToken: string) {
  return userApiFetch(`/notes/${id}`, accessToken, { method: 'DELETE' });
}

// --- Bookmarks (optional — save verse for quick return) ---
// Collections left available but not primary storage
export async function getCollections(accessToken: string) {
  return userApiFetch('/collections', accessToken);
}
```

---

## 7. Zustand Stores (`src/stores/`)

### 7.1 `useAuthStore.ts`
```typescript
interface AuthState {
  user: { sub: string; name: string; email: string; picture?: string } | null;
  isLoading: boolean;
  setUser: (user: AuthState['user']) => void;
  clearUser: () => void;
}
```
> **Note:** Initialized from a `/api/auth/me` endpoint call in a client `useEffect` in the root layout, hydrated from the iron-session on server.

### 7.2 `useAyahStore.ts`
```typescript
interface AyahState {
  currentAyah: ProcessedVerse | null;
  hasLoggedToday: boolean;
  todayLogText: string;
  selectedCategories: string[];
  voiceNoteBlob: Blob | null;
  voiceTranscript: string;
  setCurrentAyah: (ayah: ProcessedVerse) => void;
  setSelectedCategories: (cats: string[]) => void;
  setVoiceNote: (blob: Blob, transcript: string) => void;
  clearLogForm: () => void;
}
```

### 7.3 `useUIStore.ts`
```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setTheme: (t: UIState['theme']) => void;
  toggleSidebar: () => void;
  setInstallPromptEvent: (e: BeforeInstallPromptEvent) => void;
}
// Uses persist middleware for theme preference
```

---

## 8. API Route: Random Ayah (`/api/ayah/random`)

This wraps the Quran SDK on the server to prevent client_secret exposure.

```typescript
// GET /api/ayah/random
// Uses getQuranClient() (client_credentials — no user token needed)
// Returns: { verse_key, text_uthmani, translation, tafsir_snippet, audio_url, chapter_name }
// Caches result per user per day (using Next.js unstable_cache with revalidate: 86400)
```

---

## 9. Page: Login (`/login`)

**Design:**
- Centered on the screen over a full-page soft emerald gradient background.
- A glassmorphism card (`backdrop-blur-md`, semi-transparent white/dark surface).
- App logo: custom SVG crescent/mosque line art (subtle, not cartoonish) — drawn in SVG, inline in the component.
- App name: **"Ayah in Action"** in Inter bold.
- Arabic subtitle: **"القرآن منهج حياة"** (The Quran is a way of life) in Amiri font.
- One large button: **"Login with Quran.com"** — deep emerald, hover transitions.
- On click: `window.location.href = '/api/auth/login'`.
- Footer: small text "Your data lives in your Quran.com account — secure and private."

---

## 10. Component: `AyahCard.tsx`

**Full specification:**
- Renders on `/dashboard` below the daily greeting.
- Wraps in `.parchment` CSS class (texture, border, shadows).
- **Top row:** Chapter name + verse number badge (gold background).
- **Arabic text:** Large (text-3xl / text-4xl), `font-amiri`, `dir="rtl"`, centered. Line height generous for readability.
- **Translation:** Smaller (text-base), `font-inter`, `text-muted`, left-to-right.
- **Tafsir snippet:** Italic, even smaller (text-sm), muted, with a thin left border in emerald.
- **Audio player:** Custom styled `<audio>` element or a tiny React component with play/pause Lucide icon + progress bar.
- **Copy button:** Lucide `Copy` icon bottom-right. On click: copies Arabic + translation to clipboard. Shows `CheckCheck` icon for 2 seconds.
- **Entry animation:** `className="ayah-enter"` — triggers the `ayahSettle` keyframe on mount.
- **Framer Motion variant:**
  ```typescript
  <motion.div
    initial={{ opacity: 0, scale: 0.97, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
  ```

---

## 11. Component: `DailyGreeting.tsx`

```typescript
// Reads user name from useAuthStore
// Renders: "Assalamu alaikum, {name}." — with the name in gold/emerald color
// Below: "Here is today's ayah to carry with you."
// Date displayed in handwritten-stamp style:
//   format(new Date(), "EEEE, d MMMM yyyy") → "Wednesday, 9 April 2025"
//   Styled with a slightly rotated, sepia-toned inline block (CSS transform: rotate(-1deg))
```

---

## 12. Component: `LogForm.tsx`

This is **the heart of the app** — exactly as the brief states.

**Full specification:**

```
┌────────────────────────────────────────────────────────────┐
│  Today this ayah helped me when…                            │
│  [Textarea — placeholder: "Be honest. Even one moment       │
│   counts." — max 500 chars — shows char counter]            │
├────────────────────────────────────────────────────────────┤
│  How did it apply?  (multi-select chips)                    │
│  [Patience] [Gratitude] [Family] [Work]                     │
│  [Anger] [Honesty] [Kindness] [Reflection]                  │
│  [Sabr] [Tawakkul]  ← 10 total options                      │
├────────────────────────────────────────────────────────────┤
│  🎙️ Add a Voice Note  (optional, 30 sec max)               │
│  [VoiceRecorder component]                                  │
├────────────────────────────────────────────────────────────┤
│        [Save Application ✓]                                 │
└────────────────────────────────────────────────────────────┘
```

**Category chips (exact 10, fixed list — no additions):**
`Patience`, `Gratitude`, `Family`, `Work`, `Anger`, `Honesty`, `Kindness`, `Reflection`, `Sabr`, `Tawakkul`

**Chip selected state (explicit CSS):**
```css
/* Unselected */
.tag-chip { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-muted); }
/* Selected — bold emerald fill */
.tag-chip.selected { background: var(--color-emerald); color: #fff; border-color: var(--color-emerald); font-weight: 600; }
/* Hover on unselected */
.tag-chip:not(.selected):hover { border-color: var(--color-emerald); color: var(--color-emerald); transform: translateY(-1px); }
```
All 10 chips are always visible in a wrapping flex row — never hidden, never paginated.

**Behavior:**
- Multi-select toggle: clicking a selected chip de-selects it.
- At least 1 category required before save (UI enforces via disabled state).
- Textarea: 1–500 chars. In-form label: _"Today this ayah helped me when…"_ (above the textarea, not as placeholder).
- `placeholder="Be honest. Even one moment counts."` inside textarea.
- Char counter shown bottom-right of textarea (e.g., `43 / 500`).
- **Toast library: `sonner`** (`npm i sonner`) — lightweight, accessible, styled to match parchment palette.
- "Save Application" button:
  - Disabled until: `text.length > 0 && categories.length > 0`.
  - On click: calls Server Action `saveApplicationLog`.
  - Shows loading spinner (Lucide `Loader2` with `animate-spin`) during save.
  - On success: `toast.success('Saved! 🌙 Application logged.')` + canvas-confetti burst + `setHasLoggedToday(true)` in Zustand.
  - On **401 error**: `toast.error('Session expired — logging you in again.')` → `window.location.href = '/api/auth/login'` after 1.5 s.
  - On other errors: `toast.error('Could not save. Tap to retry.')` with retry action in toast.
- If `hasLoggedToday === true`: Form transitions to a **soft reflection state** (not hidden completely):
  - Show the **previously submitted log summary** for today at the top:
    - Verse badge + first 120 chars of the log text + category chips (read-only, smaller)
    - Light parchment-tinted card with a subtle green left border
    - Label: _"Your reflection for today"_
  - Below the summary, show the poetic confirmation line:
    > _"You've already applied this ayah today. Come back tomorrow for a new one. MashaAllah."_
  - Keep a smaller, muted **"Edit today's log"** link that re-opens the form pre-filled (calls `updateNote` on save instead of `addApplicationNote`).
  - This approach encourages rereading one's own reflection without blocking a correction.

---

## 13. Server Action: `saveApplicationLog`

```typescript
// src/app/actions/log.ts
'use server'

import { z } from 'zod';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { revalidatePath } from 'next/cache';
import { addApplicationNote, postActivityDay } from '@/lib/api';
import { sessionOptions } from '@/lib/session';

const LogSchema = z.object({
  verseKey: z.string().regex(/^\d+:\d+$/),  // e.g. "2:153"
  logText: z.string().min(1).max(490),       // leaves room for metadata in body
  categories: z.array(z.string()).min(1).max(10),
  voiceTranscript: z.string().max(1500).optional(),
});

export async function saveApplicationLog(formData: unknown) {
  const parsed = LogSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  const { verseKey, logText, categories, voiceTranscript } = parsed.data;
  const session = await getIronSession(await cookies(), sessionOptions);
  if (!session.accessToken) return { success: false, error: 'Not authenticated' };

  // Build note body — human-readable with a JSON block for reliable machine parsing.
  // Parsing rule: everything before the first `\n<!--aia` line is logText.
  // The JSON block between <!--aia--> markers is the structured payload.
  const meta = JSON.stringify({
    v: 1,                          // schema version for future migrations
    app: 'ayah-in-action',
    verseKey,
    categories,
    voiceTranscript: voiceTranscript ?? null,
    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD in local time
  });
  const noteBody = `${logText}\n<!--aia\n${meta}\naia-->`;
  // Minimum body is 6 chars — logText validation (min 1 char) + marker guarantees this.

  // Parsing on read (src/lib/note-parser.ts):
  // const match = note.body.match(/<!--aia\n({.*?})\naia-->/s);
  // const { categories, voiceTranscript, verseKey } = match ? JSON.parse(match[1]) : {};
  // const logText = note.body.split('\n<!--aia')[0].trim();
  //
  // Edge cases that MUST be tested before shipping:
  //   1. Multiline logText (newlines within user text — split('\n<!--aia')[0] handles correctly)
  //   2. Emojis in logText / voiceTranscript (JSON.stringify/parse handles natively; no extra escaping)
  //   3. Very long voiceTranscript (>1500 chars after trim — schema cap enforces this on write)
  //   4. Missing metadata block (note pre-dates app, or created outside the app) →
  //      match returns null → destructure empty object → all fields undefined → render gracefully
  //   5. Malformed JSON inside marker (corruption) → JSON.parse throws → catch → treat as no-metadata
  //   6. Body that contains '<!--aia' literally in user text → extremely unlikely but guard:
  //      test by checking that the full marker pattern (newline + json line + newline) matches
  // Wrap all parsing in a try/catch returning safe defaults: { logText: body, categories: [], verseKey: '' }

  // verseKey "2:153" → range format "2:153-2:153"
  const [chapter, ayahNum] = verseKey.split(':');
  const range = `${chapter}:${ayahNum}-${chapter}:${ayahNum}`;

  // Filter future "all apps for this verse" queries by entityId = verseKey (e.g. "2:153")
  const result = await addApplicationNote(session.accessToken, {
    body: noteBody,
    ranges: [range],
    attachedEntities: [{
      entityId: verseKey,            // ← use verseKey so /notes/verse/{key} naturally groups them
      entityType: 'reflection',
      entityMetadata: {
        categories,
        voiceTranscript: voiceTranscript ?? null,
        verseKey,
        appVersion: '1.0',
      },
    }],
  });

  // Bonus: fire activity-day endpoint with type QURAN so the user gets a small
  // official Quran.com streak bump. Non-blocking — wrap in try/catch so a
  // failure here never blocks the main log from being returned as success.
  try {
    await postActivityDay(session.accessToken, {
      type: 'QURAN',
      seconds: 60,                // minimal plausible reading time
      mushafId: 1,               // Standard Uthmani
      ranges: [range],           // same range used for the note
    });
  } catch {
    // Silently ignore — streak bonus is best-effort
  }

  revalidatePath('/dashboard');
  revalidatePath('/impact');
  revalidatePath('/history');
  return { success: true, noteId: result.data?.id };
}
```

> **`postActivityDay` in `api.ts`:** `POST {apiBaseUrl}/auth/v1/activity-days` with body `{ type, seconds, mushafId, ranges }`. Same `userApiFetch` helper. Required scopes already included in auth flow.

---

## 14. Component: `VoiceRecorder.tsx`

**Full specification (client component):**

```
State machine: idle → requesting-permission → recording → transcribing → done → error

[idle]            → Button: 🎙️ "Add Voice Note"
[requesting]      → "Checking microphone…" (spinner)
[recording]       → Animated waveform bars + timer "0:23 / 0:30"
                    Red pulsing record indicator
                    "Stop Recording" button
[transcribing]    → "Transcribing…" (pulse animation)
[done]            → Audio playback preview (<audio> tag)
                    Transcript text block (editable textarea to correct errors)
                    "Re-record" link
[error]           → Error message + retry
```

**Technical implementation:**
1. Check `navigator.mediaDevices` availability. If absent (HTTP or blocked), immediately transition to `[error]` with message: _"Microphone not available. You can type your reflection instead."_ — **no crash**.
2. `navigator.mediaDevices.getUserMedia({ audio: true })` wrapped in try/catch:
   - `NotAllowedError` → transition to `[permission-denied]` state, show: _"Mic access denied. Enable it in browser settings or type your note."_
   - `NotFoundError` → show: _"No microphone found on this device."_
   - All other errors → generic `[error]` state with retry button.
3. `new MediaRecorder(stream, { mimeType: bestMimeType() })` where:
   ```typescript
   function bestMimeType() {
     const types = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'];
     return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
   }
   ```
4. Collect chunks in `ondataavailable`. Auto-stop via `setTimeout(stop, 30_000)`.
5. On stop: `new Blob(chunks, { type: mimeType })` → object URL for `<audio>` preview.
6. **Auto-transcribe with Web Speech API (optional, non-blocking):**
   ```typescript
   const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
   if (SR) {
     const recognition = new SR();
     recognition.continuous = true;
     recognition.interimResults = false;
     recognition.lang = 'en-US';
     recognition.onresult = (e: any) => {
       const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
       setTranscript(t);
     };
     recognition.start(); // runs parallel to MediaRecorder
   }
   // If SR unavailable: transcript stays empty, transition to [done] with empty transcript
   // User sees the editable transcript textarea — they can type manually.
   ```
7. Transcript saved as editable `<textarea>`. Blob stored in `useAyahStore`.
8. Blob → base64 only if needed for submission (`reader.readAsDataURL(blob)`).
9. **Cleanup on unmount:** call `stream.getTracks().forEach(t => t.stop())` to release the mic indicator in browser chrome.

**Waveform animation (CSS only — no library):**
```css
.waveform-bar {
  width: 3px; border-radius: 2px;
  background: var(--color-emerald);
  animation: waveformPulse 0.8s ease-in-out infinite alternate;
}
.waveform-bar:nth-child(2) { animation-delay: 0.1s; }
.waveform-bar:nth-child(3) { animation-delay: 0.2s; }
/* etc – 7 bars total */
```

---

## 15. Page: Dashboard (`/dashboard`)

**Full layout spec:**

```
┌─────────────────────────────────────────────────┐
│ NavSidebar (left, collapsible on mobile)         │
│                                                  │
│  ┌─── DailyGreeting ──────────────────────────┐  │
│  │  "Assalamu alaikum, Ahmed."                 │  │
│  │  "Wednesday, 9 April 2025"                  │  │
│  └──────────────────────────────────────────── ┘  │
│                                                   │
│  ┌─── AyahCard ───────────────────────────────┐   │
│  │  [parchment texture]                        │   │
│  │  Surah Al-Baqarah 2:153 (badge)             │   │
│  │  Arabic text (Amiri, large, RTL)            │   │
│  │  Translation (Inter, smaller)               │   │
│  │  Tafsir snippet (italic, emerald border)    │   │
│  │  [▶ Play Audio]        [⧉ Copy Ayah]        │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌─── LogForm ────────────────────────────────┐   │
│  │  [Textarea + Category chips + VoiceRec]    │   │
│  │  [Save Application button]                 │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  [Need a different ayah? →] link (fetches new)    │
└─────────────────────────────────────────────────── ┘
```

**Data flow:**
- Dashboard `page.tsx` is a **Server Component**.
- Fetches random ayah via `/api/ayah/random` using the SDK.
  - **Caching:** `unstable_cache` with `revalidate: 86400` (one day). Cache key includes `userId` so each user gets a consistent daily ayah, not a globally shared one.
  - **"New Ayah" button:** Client component `<NewAyahButton />` calls a Server Action that calls `revalidateTag('daily-ayah-' + userId)` then `router.refresh()`. Bypasses cache on demand. Shown as a subtle link: _"Need a different ayah? Try another →"_.
- Fetches recent notes (`getAllNotes`, limit 50) server-side.
- Passes `hasLoggedToday = hasLoggedOnDate(notes, today)` as a prop.
- Passes serialized notes array to seed `useAyahStore` (for streak + hasLoggedToday in client).
- Renders `<LogForm hasLoggedToday={hasLoggedToday} />` or the confirmation state accordingly.
- Uses `<Suspense fallback={<LoadingSkeleton />}>` for both the ayah fetch and notes fetch.

---

## 16. Page: Impact Dashboard (`/impact`)

**Full layout spec:**

```
┌─────────── Top Banner ─────────────────────────────────┐
│  🔥 Current Application Streak: 14 days               │
│  "You've applied the Quran 47 times this month"        │
│  [Progress bar: 47/60 monthly goal]                   │
└────────────────────────────────────────────────────────┘

┌─────────── Calendar Heatmap ───────────────────────────┐
│  [90-day grid, squares colored by log count]          │
│  Color scale: empty (#e8e0d0) → light (#a8d5c2)       │
│                             → dark (#0a6650)          │
│  Tooltip on hover: "3 applications on Apr 7"          │
└────────────────────────────────────────────────────────┘

┌─── Stats Cards (row of 3) ────────────────────────────┐
│  [Total Logged: 47] [Top Category: Patience]          │
│  [Longest Streak: 21 days]                            │
└────────────────────────────────────────────────────────┘

┌─── Charts ────────────────────────────────────────────┐
│  Left: Doughnut — Top 5 categories breakdown          │
│  Right: Bar — Weekly logs for last 4 weeks            │
└────────────────────────────────────────────────────────┘

[📄 Export My Quran Journal] button (top-right of page)
```

**Streak implementation (Q1 resolved — local computation from Notes API):**

Since the QF streak API only supports `QURAN` activity type, application streaks are computed locally:

```typescript
// src/lib/streak.ts

/** Normalize a Date to local YYYY-MM-DD (avoids UTC-shift bugs on the boundary) */
const toLocalDate = (d: Date) => d.toLocaleDateString('en-CA'); // → "2025-04-09"

/** Filter helper — only our app's notes (body contains the <!--aia marker) */
export function isAyahInActionNote(note: { body: string }) {
  return note.body.includes('<!--aia');
}

export function computeAppStreak(notes: Array<{ createdAt: string; body: string }>): number {
  const appNotes = notes.filter(isAyahInActionNote);

  // Unique local dates, sorted descending (newest first)
  const dates = [...new Set(
    appNotes.map(n => toLocalDate(new Date(n.createdAt)))
  )].sort().reverse();

  if (dates.length === 0) return 0;

  const today = toLocalDate(new Date());

  // Streak requires logging on today OR yesterday (grace: don't break streak at midnight)
  if (dates[0] !== today && dates[0] !== toLocalDate(new Date(Date.now() - 86400000))) {
    return 0; // most recent log is older than yesterday — streak is already broken
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break; // gap found
  }
  return streak;
}

/** Used by dashboard to show/hide LogForm without a separate API call */
export function hasLoggedOnDate(notes: Array<{ createdAt: string; body: string }>, date: string): boolean {
  return notes.filter(isAyahInActionNote).some(
    n => toLocalDate(new Date(n.createdAt)) === date
  );
}
```

**`hasLoggedToday` data flow (no extra API call):**
1. Dashboard Server Component fetches recent notes (`getAllNotes`, limit 50).
2. Passes through `hasLoggedOnDate(notes, toLocalDate(new Date()))` → boolean prop.
3. Passed into `<LogForm hasLoggedToday={...} />`.
4. On successful save: Zustand `useAyahStore.setHasLoggedToday(true)` for instant UI update without re-fetch.

**Details:**
- Streak banner: prominently styled, fire emoji, emerald gradient background.
- "You've applied the Quran X times this month" — computed by filtering notes where `createdAt` is within the current calendar month.
- Heatmap values: built by grouping notes by date → `{ date, count }` array.
- Heatmap: `react-calendar-heatmap`, 90-day range, custom classForValue mapping green gradient.
- Stats cards: shadcn `<Card>`, with Lucide icons (Flame, Tag, Trophy).
- Charts: `react-chartjs-2` Doughnut + Bar, custom colors matching design system.
- All charts: `'use client'` with dynamic import (`ssr: false`) for SSR safety.
- **Chart.js registration** done once in `lib/chartjs.ts` module to avoid re-registration.

---

## 17. Component: `PdfExportButton.tsx`

**Full spec:**

```typescript
'use client'

// 1. Attach a ref to a hidden <div id="journal-print-area">
// 2. The print area contains:
//    - App logo + "My Quran Journal" title
//    - User name + export date
//    - For each log entry:
//        - Ayah (Arabic + translation)
//        - Date (handwritten-stamp style)
//        - Log text
//        - Category tags
//        - Voice transcript (if any)
//    - Styled like a REAL printed diary page

// 3. On button click:
const handleExport = async () => {
  const element = document.getElementById('journal-print-area')!;
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
  heightLeft -= 297; // A4 height in mm
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= 297;
  }
  pdf.save(`quran-journal-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
```

**PDF visual design (journal-print-area):**
- Page background: parchment color (#f8f1e3).
- Header: logo + "My Quran Journal" in Amiri.
- Each entry: bordered box, date in sepia stamp look, Arabic text in Amiri, body text in Inter.
- Footer: "Generated by Ayah in Action — ayahinaction.app".

---

## 18. Page: History (`/history`)

**Full spec:**

```
┌─── Filters bar ────────────────────────────────────────┐
│  [Search by text]  [Filter by category ▾]  [Date ▾]   │
└────────────────────────────────────────────────────────┘

┌─── Log list ───────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐  │
│  │  Apr 7, 2025   Surah Al-Baqarah 2:153            │  │
│  │  "This ayah helped me stay patient when..."       │  │
│  │  [Patience] [Work]                                │  │
│  │  [▶ Voice] if voice exists                        │  │
│  └──────────────────────────────────────────────────┘  │
│  (repeat for all logs, paginated 10 per page)          │
└────────────────────────────────────────────────────────┘
```

**Click behavior:**
- Opens a `<Sheet>` (shadcn slide-over panel) from the right.
- Shows full AyahCard + user's log text + voice playback + edit option.
- Edit updates the collection item via a Server Action.

**Empty state:**
> _"No applications yet… the first one always feels special."_ — exact phrasing from brief.
> Illustrated with the custom SVG crescent icon.

---

## 19. Component: `StreakHeatmap.tsx`

```typescript
'use client';
import dynamic from 'next/dynamic';
const CalendarHeatmap = dynamic(() => import('react-calendar-heatmap'), { ssr: false });
import 'react-calendar-heatmap/dist/styles.css'; // import then override

// Props: values: Array<{ date: string; count: number }>
// startDate: 90 days ago
// endDate: today
// classForValue: maps count to CSS class
//   0       → 'color-empty'
//   1       → 'color-scale-1'  (#c6e9da)
//   2-3     → 'color-scale-2'  (#6ec9a2)
//   4+      → 'color-scale-3'  (#0a6650)
// showWeekdayLabels: true
// tooltipDataAttrs: { 'data-tip': `${value.count} applications on ${value.date}` }
```

CSS overrides for custom colors go in `globals.css`.

---

## 20. Component: `NavSidebar.tsx`

```
[Logo + App Name]

Navigation:
  [🏠 Dashboard]   → /dashboard
  [📜 History]     → /history
  [📊 Impact]      → /impact

Bottom:
  [User avatar + name]
  [⚙️ Settings] (theme toggle)
  [→ Logout]

Footer badge (pinned to very bottom of sidebar):
  [🟢 Connected to Quran.com ✓]
```

**Design:**
- Fixed left sidebar on desktop (240px wide).
- On mobile: collapses to icon-only (60px) or hidden, toggleable with hamburger.
- `NavLink` component highlights active route with emerald left border + tinted background.
- Icons: Lucide (`Home`, `ScrollText`, `BarChart3`, `LogOut`, `Settings`).
- Custom SVG crescent/mosque icon as the app logo mark (hand-drawn line art style, not cartoonish).
- **"Connected to Quran.com" badge** (pinned bottom of sidebar):
  - Small pill: `🟢 Connected to Quran.com ✓`
  - Styled: `font-size: 0.7rem`, muted emerald text, dotted border, rounded-full
  - Tooltip on hover: _"Your logs are stored securely in your Quran.com account"_
  - On mobile (icon-only mode): shows only the 🟢 dot
  - Links to `https://quran.com` on click (opens new tab)

---

## 21. PWA Setup

### 21.1 `app/manifest.ts` (Native Next.js 15)

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ayah in Action',
    short_name: 'Ayah',
    description: 'Track how Quran ayahs change your daily life',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8f1e3',
    theme_color: '#0a6650',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/screenshots/dashboard.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
    ],
  };
}
```

### 21.2 `@ducanh2912/next-pwa` Configuration (`next.config.ts`)

```typescript
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // disable in dev to avoid noise
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.quran\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'quran-api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.qurancdn\.com\/.*/,  // Audio CDN
      handler: 'CacheFirst',
      options: {
        cacheName: 'quran-audio-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 604800 },
      },
    },
  ],
})({
  // Next.js config here
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
});

export default nextConfig;
```

### 21.3 `InstallPrompt.tsx`

```typescript
'use client';
// Captures 'beforeinstallprompt' event
// Stores in useUIStore.installPromptEvent
// Renders a dismissible bottom banner:
//   "📲 Add Ayah in Action to your home screen"
//   [Install] [Dismiss]
// On [Install]: deferredPrompt.prompt() → waits for userChoice → logs result
// Persists dismiss state in localStorage (don't show again for 30 days)
```

### 21.4 Offline Fallback

- Last fetched ayah stored in `localStorage` via `useAyahStore` persist middleware.
- If network fails, show the cached ayah with a subtle "📡 Offline mode — showing last ayah" badge.
- Logs composed offline are saved to `localStorage` queue → synced on reconnect via `navigator.onLine` listener.

---

## 22. Types (`src/types/`)

### `quran.ts`
```typescript
export interface ProcessedVerse {
  verse_key: string;            // "2:153"
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;         // Arabic text
  translation: string;          // English translation text
  tafsir_snippet: string;       // Short tafsir (first 200 chars)
  audio_url: string;            // Recitation audio URL
  chapter_name_arabic: string;  // "البقرة"
  chapter_name_english: string; // "Al-Baqarah"
}
```

### `log.ts`
```typescript
export const CATEGORIES = [
  'Patience', 'Gratitude', 'Family', 'Work',
  'Anger', 'Honesty', 'Kindness', 'Reflection',
  'Sabr', 'Tawakkul'
] as const;

export type Category = typeof CATEGORIES[number];

export interface ApplicationLog {
  id: string;
  verseKey: string;
  logText: string;
  categories: Category[];
  voiceTranscript?: string;
  voiceNoteUrl?: string;
  createdAt: string; // ISO date
  collectionItemId: string; // Quran Foundation collection item ID
}
```

### `auth.ts`
```typescript
export interface AppUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export interface AppSession {
  user?: AppUser;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}
```

---

## 23. Empty States (`EmptyState.tsx`)

All empty states are poetic. Exact text from the brief:

| Location | Text |
|---|---|
| History (no logs) | _"No applications yet… the first one always feels special."_ |
| Impact (no data) | _"Start logging to see your journey take shape."_ |
| History search (no results) | _"Nothing found. Perhaps it's time to create that memory."_ |
| Voice (no mic) | _"Your voice notes will appear here once you record one."_ |

Each empty state includes:
- The custom SVG crescent/mosque logo (smaller, muted).
- Soft, centered layout.
- Optionally a CTA button.

---

## 24. SEO & Metadata

```typescript
// app/layout.tsx root metadata
export const metadata: Metadata = {
  title: { default: 'Ayah in Action', template: '%s | Ayah in Action' },
  description: 'Track how Quran ayahs transform your daily life. Log real-life applications, build streaks, and see your Quran journey grow.',
  keywords: ['Quran', 'Islamic app', 'Quran application', 'Muslim life tracker', 'ayah journal'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ayahinaction.app',
    siteName: 'Ayah in Action',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a6650' },
    { media: '(prefers-color-scheme: dark)', color: '#0d8c6c' },
  ],
};

// Per-page metadata:
// /dashboard: "Your Daily Ayah | Ayah in Action"
// /history:   "My Quran Journal | Ayah in Action"
// /impact:    "My Impact Dashboard | Ayah in Action"
```

---

## 25. Accessibility

- All interactive elements: `aria-label`, `role` where needed.
- Color contrast ratio ≥ 4.5:1 for all text (verified against WCAG AA).
- Voice recorder: `aria-live="polite"` region for status updates.
- Form: `aria-required`, `aria-describedby` for error messages.
- Keyboard navigation: Tab order logical, focus visible (custom focus ring in emerald).
- Arabic text: `lang="ar"` attribute on the verse container.

---

## 26. Performance Checklist

- Server Components for all data-fetching pages (dashboard, history, impact).
- Client components only where interactivity needed (LogForm, VoiceRecorder, Charts, Heatmap).
- `next/image` for all images.
- `next/font` for all fonts (no external CSS load).
- Dynamic imports with `ssr: false` for: `react-calendar-heatmap`, `chart.js`, `html2canvas`, `jspdf`.
- Streaming with `<Suspense>` on dashboard ayah fetch.
- API responses cached with `unstable_cache` where appropriate.
- Bundle analyzer: `@next/bundle-analyzer` configured to verify no bloat.

---

## 27. Build Timeline (Phased)

| Phase | Days | What Gets Built |
|---|---|---|
| **Phase 1** | 1–2 | Auth (login, callback, logout, refresh, session), route protection, Quran SDK init, random ayah endpoint, Dashboard page (AyahCard + greeting) |
| **Phase 2** | 3 | LogForm + category chips + Server Action (save to collection + streak), VoiceRecorder component |
| **Phase 3** | 1 | Impact page (heatmap + charts + streak banner + stats cards) |
| **Phase 4** | 1 | History page (list + search + filter + slide-over detail + edit) |
| **Phase 5** | 1–2 | PDF export, PWA (manifest + service worker + install prompt), Offline support, dark mode polish |
| **Phase 6** | 0.5 | Micro-animations (Framer Motion), empty states, SEO metadata, accessibility audit |
| **Phase 7** | 0.5 | Demo video recording, README, final polish |

**Total: 5–7 days to submission-ready MVP.**

---

## 28. Judging Criteria Coverage

| Criterion | How This App Covers It |
|---|---|
| **Massive Impact** | Unique in Muslim tech: turns Quran reading into *measurable* daily life change — no other app does this |
| **API Usage (Content)** | `@quranjs/api` for random verse, translation, tafsir, audio |
| **API Usage (User)** | Collections, personalized notes, streak endpoints — full user data integration |
| **Innovative UX** | Parchment texture, micro-animations, voice notes, handwritten date stamps, poetic empty states |
| **Clean Code** | Feature-scoped structure, Server Components + Server Actions, Zod validation, TypeScript throughout |

---

## 29. Resolved Design Decisions

| # | Question | Resolution |
|---|---|---|
| Q1 | Streak API support? | **No custom endpoint exists.** Streaks computed locally from Notes API data using `computeAppStreak()`. See §16 for full implementation. |
| Q2 | Collections metadata support? | **No.** Use **Notes API** instead. Log stored as structured `body` text + `attachedEntities[].entityMetadata` (supports free-form object). Verse linked via `ranges` field. |
| Q3 | Web Speech API Firefox gap? | **Acceptable.** Transcription is optional. Graceful fallback: transcript area stays empty, user can type manually. |
| Q4 | Deployment target? | **Vercel.** Required for PWA install (needs HTTPS). See §31. |

## 31. Vercel Deployment

### 31.1 Steps
1. Push repo to GitHub.
2. Import project in Vercel dashboard.
3. Set all env vars from `.env.local` in Vercel project settings.
4. Change `QF_ENV=production` in Vercel env vars.
5. Add production callback URL to QF OAuth client: `https://your-app.vercel.app/api/auth/callback`.
6. Deploy. Vercel auto-builds on every push to `main`.

### 31.2 `vercel.json` (optional)
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

### 31.3 Middleware: ensure service worker files pass through
```typescript
// src/middleware.ts — allow list
const PUBLIC = ['/login', '/api/auth', '/manifest', '/sw.js', '/icons', '/_next', '/favicon'];
export function middleware(req: NextRequest) {
  if (PUBLIC.some(p => req.nextUrl.pathname.startsWith(p))) return NextResponse.next();
  // ... auth check
}
```

---

## 30. Verification Plan

### Automated
- `npm run build` — must succeed with 0 errors.
- `npm run lint` — 0 ESLint warnings.
- TypeScript: `tsc --noEmit` — 0 type errors.

### Manual
1. Login flow: click "Login with Quran.com" → OAuth redirect → callback → lands on /dashboard with user name shown.
2. Ayah display: correct Arabic text, translation, tafsir, audio plays.
3. Log: fill text + select categories + record 15-second voice note → Save → toast appears → log shows in history.
4. Impact: streak increments, heatmap cell for today colored, chart updates.
5. History: log appears in list, filter by category works, slide-over shows full detail.
6. PDF: downloads with journal content, date formatted correctly.
7. PWA: install prompt appears on mobile Chrome, app installs successfully.
8. Offline: disconnect network → last ayah still visible → log composed → reconnects and syncs.
9. Dark mode: switch to dark → all colors switch correctly, no contrast issues.
10. Mobile: full responsive check on 390px viewport.
