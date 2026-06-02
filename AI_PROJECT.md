# AI_PROJECT.md

> **Project:** PetCare (a.k.a. `petcare-app`)
> **Last analyzed:** 2026-06-02
> **Audience:** Future AI assistants performing code work in this repository.

---

## 1. Project Overview

PetCare is a cross-platform mobile application built with **React Native (Expo SDK 54)** that helps pet owners manage their pets' profiles, health records, expenses, and reminders from a single timeline-based dashboard.

The codebase is a **TypeScript** Expo Router v6 application backed by **Supabase** (Auth + Postgres + Storage). The UI uses **NativeWind v4** (Tailwind for React Native) and supports a **light/dark theme**.

The app is currently a functional MVP: every screen renders, data is persisted remotely, and the full create / read / update / delete lifecycle works for pets, events, and reminders. There are no automated tests, no CI, no push notifications, and no offline cache.

---

## 2. Business Purpose

- Provide a single dashboard for owners of one or more pets.
- Centralize pet metadata (breed, age, weight, gender, status, photo).
- Log day-to-day events that affect a pet's wellbeing: feeding, expenses, medication, vaccines, and symptoms.
- Track pet health over time (next vaccine due, active medications, last vet visit).
- Track pet-related expenses by month and category.
- Schedule and complete one-time or recurring reminders per pet.
- Reduce context switching by surfacing a chronological timeline on the home screen.

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Expo | ~54.0.33 |
| Framework | React Native | 0.81.5 |
| UI | React | 19.1.0 |
| Language | TypeScript | ~5.9.2 (strict) |
| Routing | Expo Router | ~6.0.23 |
| Styling | NativeWind + Tailwind CSS | ^4.2.3 / ^3.4.19 |
| Animation | react-native-reanimated / worklets | ^4.1.0 / ^0.5.0 |
| State | React Context API (no Redux/Zustand) | — |
| Backend | Supabase (`@supabase/supabase-js`) | ^2.105.4 |
| Auth persistence | `@react-native-async-storage/async-storage` | 2.2.0 |
| Image picking | `expo-image-picker`, `expo-image-manipulator` | ~17.0.11 / ~14.0.8 |
| File I/O | `expo-file-system` (legacy) | ~19.0.22 |
| Deep links | `expo-linking` | ~8.0.12 |
| Date/time | `@react-native-community/datetimepicker` | 8.4.4 |
| Keyboard | `react-native-keyboard-aware-scroll-view` | ^0.9.5 |
| Icons | `@expo/vector-icons` | ^15.0.3 |

> **Pin policy:** the project pins Expo-managed packages to minor versions (`~`) to stay within SDK 54.

---

## 4. Folder Structure Summary

```
petcare-app/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root: providers, deep-link handler, auth gate
│   ├── add-event.tsx             # Modal: create / edit a pet event
│   ├── add-pet.tsx               # Modal: create a new pet
│   ├── add-reminder.tsx          # Modal: create a reminder
│   ├── edit-pet.tsx              # Modal: edit / delete a pet
│   ├── (auth)/                   # Auth flow group (headerless Stack)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (tabs)/                   # Main app tabs (Tabs navigator)
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Home: timeline, pet switcher, quick actions
│   │   ├── health.tsx            # Health summary + filtered timeline
│   │   ├── expenses.tsx          # Monthly expense tracker
│   │   ├── reminders.tsx         # Upcoming / recurring / completed
│   │   └── profile.tsx           # User info, pets grid, settings
│   └── components/               # Reusable UI shared across screens
│       ├── EventActionModal.tsx  # Slide-up modal: edit/delete an event
│       └── PetAvatar.tsx         # Image w/ fallback icon
├── context/
│   ├── PetContext.tsx            # { pets, selectedPet, refreshPets, petsLoading }
│   └── ThemeContext.tsx          # { theme, isDark, toggleTheme, setTheme }
├── lib/
│   ├── supabase.ts               # Singleton Supabase client (AsyncStorage)
│   └── storage.ts                # uploadPetPhoto / deletePetPhoto helpers
├── types/
│   └── index.ts                  # Pet, PetEvent, Reminder, EventType
├── assets/                       # Icons, splash, Google logo
├── app.json                      # Expo config (slug: petcare-app, scheme: petcare)
├── package.json                  # Scripts: start, android, ios, web
├── tsconfig.json                 # Extends expo/tsconfig.base, strict: true
├── tailwind.config.js            # NativeWind preset, darkMode: "class", dark.* tokens
├── babel.config.js               # babel-preset-expo + nativewind/babel
├── metro.config.js               # withNativeWind wrapper
├── global.css                    # @tailwind directives
├── declarations.d.ts             # declare module "*.css"
├── index.ts                      # expo-router/entry entrypoint
└── .env                          # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY (committed)
```

**Important nuance:** shared components live under `app/components/`, **not** at the project root. The Tailwind `content` glob (`tailwind.config.js`) is set to `./app/**/*.{js,jsx,ts,tsx}` and `./components/**/*.{js,jsx,ts,tsx}` — the second glob currently matches nothing because there is no root `components/` folder.

---

## 5. Authentication Flow

- **Provider:** Supabase Auth with email + password.
- **Client config** (`lib/supabase.ts`): uses `@react-native-async-storage` as the auth storage backend; `autoRefreshToken`, `persistSession`, and `detectSessionInUrl: false` are enabled.
- **Signup:** `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` — the `full_name` is stored in `user.user_metadata`.
- **Login:** `supabase.auth.signInWithPassword({ email, password })`.
- **Logout:** `supabase.auth.signOut()` (called from `app/(tabs)/profile.tsx`).
- **Password recovery (forgot → reset):**
  1. User submits email on `forgot-password.tsx` → `supabase.auth.resetPasswordForEmail(email, { redirectTo: "petcare://reset-password" })`.
  2. Supabase emails a link that deep-links into the app via the `petcare://` scheme (declared in `app.json`).
  3. `app/_layout.tsx` listens to `Linking.addEventListener("url", …)` and `Linking.getInitialURL()`.
  4. The handler supports **both** PKCE (`?code=…`) and **implicit** (`#access_token=…&refresh_token=…`) flows, then routes the user to `/(auth)/reset-password`.
  5. The reset screen calls `supabase.auth.updateUser({ password })`, then signs the user out and routes them back to login.
- **Google sign-in:** uses `supabase.auth.signInWithOAuth({ provider: "google" })` via the `useGoogleAuth()` hook (`lib/googleAuth.ts`). Both `login.tsx` and `signup.tsx` call `handleGoogleSignIn` on button press. Supabase handles the OAuth flow and redirects back to the app via the `petcare://` deep link scheme. The deep link handler in `app/_layout.tsx` extracts tokens from the URL fragment and calls `setSession()`. **Requires a development build** (not Expo Go).
- **Auth gating** (`app/_layout.tsx`): a `useEffect` redirects unauthenticated users to `/(auth)/login` and authenticated users away from `/(auth)/*` to `/(tabs)`. A `PASSWORD_RECOVERY` flag short-circuits the redirect during recovery.
- **Loading state:** while `supabase.auth.getSession()` resolves, the app shows a full-screen `ActivityIndicator`.

---

## 6. Database Overview

The project uses Supabase Postgres. Schema is implied by the code; **no migration files or ERD are committed in the repo**.

### Table: `pets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users.id` |
| `name` | text | required |
| `breed` | text | optional |
| `age_years` | number | parsed float |
| `weight_kg` | number | parsed float |
| `gender` | text | `"Male" \| "Female"` |
| `photo_url` | text | optional, Supabase Storage URL |
| `status` | text | `"Healthy" \| "Sick" \| "Under Medication"` |
| `created_at` | timestamptz | default now |

### Table: `events`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `pet_id` | uuid | FK → `pets.id` |
| `user_id` | uuid | FK → `auth.users.id` |
| `type` | text | one of `EventType` |
| `timestamp` | timestamptz | event date/time |
| `metadata` | jsonb | type-specific payload (see below) |
| `created_at` | timestamptz | |

**`EventType` union** (`types/index.ts`): `"expense" | "feeding" | "medication" | "vaccine" | "symptom"`.

**`metadata` shape (informal schema):**
- `feeding`: `{ food_type, quantity, unit, time, notes }`
- `expense`: `{ category, amount, description, notes, date }`
- `medication`: `{ name, dose, notes }`
- `vaccine`: `{ name, next_due, notes }`  ⚠ `next_due` is captured as a free-text string in `add-event.tsx`
- `symptom`: `{ name, severity, notes }` — `severity` ∈ `{ "Mild", "Moderate", "Severe" }`

### Table: `reminders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users.id` |
| `pet_id` | uuid | FK → `pets.id` |
| `title` | text | |
| `type` | text | `general \| medication \| vaccine \| feeding \| grooming` |
| `due_date` | timestamptz | |
| `is_completed` | bool | |
| `completed_at` | timestamptz \| null | |
| `is_recurring` | bool | |
| `recurrence` | text \| null | free-text description (e.g. `"Every day at 8:00 AM"`) |
| `is_active` | bool | toggle for recurring reminders |
| `created_at` | timestamptz | |

### Storage
- **Bucket:** `pet-photos`
- **Path pattern:** `${userId}/${petId}/${timestamp}.jpg`
- **Public access:** `getPublicUrl` is used → bucket must be public-read.

### Implied RLS / Security
- All reads/writes are scoped by `user_id` in the client (`eq("user_id", user.id)`). **RLS policies are not in this repo** — they must be configured in Supabase.

---

## 7. API Integrations

| Integration | Purpose | Where |
|---|---|---|
| Supabase Auth | Login, signup, password recovery, session | `lib/supabase.ts`, all `(auth)/*` |
| Supabase Postgres (`pets`, `events`, `reminders`) | All CRUD | contexts + every tab |
| Supabase Storage (`pet-photos` bucket) | Pet photos upload/delete | `lib/storage.ts`, used by `add-pet.tsx` & `edit-pet.tsx` |
| `expo-image-picker` | Pick photo from library | `add-pet.tsx`, `edit-pet.tsx` |
| `expo-image-manipulator` | Crop to square + resize to 600×600 + compress | `add-pet.tsx` |
| `expo-file-system` (legacy) | Read local file as base64 → `Uint8Array` for upload | `lib/storage.ts` |
| `expo-linking` | Deep-link receiver for password recovery | `app/_layout.tsx` |
| `react-native-url-polyfill` | Required for `URL` / `URLSearchParams` in RN | imported in `lib/supabase.ts` |

No third-party REST APIs, no analytics, no crash reporting, no payment processing, no push notification provider.

---

## 8. Main Features

- **Multi-pet management** — create, view, edit, delete pets with photos.
- **Event timeline** — single chronological feed on the Home tab; tap an event to edit or delete.
- **5 event types:** feeding, expense, medication, vaccine, symptom (with type-specific metadata).
- **Quick actions** — Home tab exposes a one-tap row to log each of the 5 event types.
- **Health tab** — summary cards (next vaccine, active meds, last visit) + filtered timeline of health events + upcoming schedule.
- **Expenses tab** — monthly navigation, total, category breakdown with progress bars, per-category filtering, ₱ currency formatting.
- **Reminders tab** — three sections: Upcoming (one-time), Recurring Schedules (toggleable), Completed.
- **Profile tab** — user info, pets grid, settings list, dark-mode toggle, log out.
- **Status management** — Healthy / Sick / Under Medication, changeable from Home (modal) and Health (cycle).
- **Auth flow** — email/password + Supabase-magic-link password recovery via deep link.
- **Light / dark theme** — cloud-synced via Supabase `user.user_metadata.theme_preference`; defaults to system theme when logged out; persisted locally in AsyncStorage for instant UI; user-toggleable from Profile.
- **Pull-to-refresh** on Home, Health, Expenses, Reminders.
- **Skeleton loaders** — Home tab has a custom `HomeSkeleton` while loading.
- **Image cropping** — auto-center-square crop + 600×600 resize on add; system editor on edit.

---

## 9. Current Features Implemented

| Area | Status |
|---|---|
| Email + password signup/login/logout | ✅ Done |
| Password reset via deep link (PKCE + implicit) | ✅ Done |
| Add pet (with photo) | ✅ Done |
| Edit pet (with photo replace/remove) | ✅ Done |
| Delete pet (cascades to events + reminders) | ✅ Done (assumes DB cascade) |
| Add event (5 types) | ✅ Done |
| Edit / delete event | ✅ Done (via `EventActionModal`) |
| Home timeline w/ filter pills | ✅ Done |
| Health summary + filtered timeline | ✅ Done |
| Monthly expenses w/ category breakdown | ✅ Done |
| Reminders: one-time + recurring | ✅ Done |
| Recurring reminder active toggle | ✅ Done |
| Reminder "Mark Done" | ✅ Done |
| Dark mode toggle | ✅ Done |
| Theme persistence (cloud-synced) | ✅ Done |
| Pet switcher (Home, Health, Expenses) | ✅ Done |
| Pet status change (Home modal & Health cycle) | ✅ Done |
| Skeleton loading (Home) | ✅ Done |
| Pull-to-refresh | ✅ Done |
| **Google OAuth** | ✅ Done (via `signInWithOAuth` + deep link scheme, requires dev build) |
| **Push notifications** | ❌ Not implemented |
| **Offline cache / queue** | ❌ Not implemented |
| **Automated tests** | ❌ Not implemented |
| **Email verification** | ❌ Not implemented |
| **Multi-factor auth** | ❌ Not implemented |

---

## 10. Known Limitations

1. **Google sign-in requires a development build.** The `petcare://` deep link scheme does not work in Expo Go. Users must build with `npx expo run:android` or EAS Build.
2. **`app/(tabs)/expenses.tsx` and `app/(tabs)/profile.tsx` fetch pets locally** instead of consuming `usePet()`. They are out of sync with `PetContext` and duplicate the source of truth.
3. **`selectedPet` is not persisted.** After a cold start, the user must re-select a pet (handled implicitly by `PetContext` defaulting to `pets[0]`).
4. **`next_due` for vaccines is a free-text field** in `add-event.tsx` (placeholder `"e.g. 2026-09-01"`), not a real date picker. Invalid input is silently accepted.
5. **Hard-coded hex colors** (`#000`, `#f3f4f6`, `#9ca3af`, `#9ca3af`, `#ef4444`, etc.) are mixed with NativeWind utility classes throughout screens. There is no single design-token file.
6. **Most components use ternaries for dark mode** (`isDark ? "bg-dark-bg" : "bg-white"`) instead of NativeWind's `dark:` variant. The root View now properly toggles the `dark` class, so `dark:` variants work — but existing screens haven't been migrated yet.
7. **No RLS / migration files in the repo.** Schema and row-level security are configured externally in Supabase. The code *assumes* `user_id` scoping.
8. **No tests, no CI.** Any refactor is risky.
9. **No offline support.** App is unusable without connectivity.
