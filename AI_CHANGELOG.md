# AI_CHANGELOG.md

> **Project:** PetCare (`petcare-app`)
> **Purpose:** Persistent, append-only log of every meaningful change, technical-decision observation, and planned task. Future AI assistants must read this file before making changes (see `AI_RULES.md`, rule K-2).

---

## How to Use This File

- **Append a new dated section at the bottom** of this file for every change. Do not edit old entries.
- **One section per logical change set** (a PR, a feature, a fix batch). If a change spans multiple days, use the date it was completed.
- **Include a timestamp** in the heading (e.g., `## 2026-06-02 14:30`) so entries can be ordered chronologically. Use 24-hour format.
- **Use the five buckets** consistently:
  - `Completed` — net-new functionality that works end-to-end.
  - `Changed` — modifications to existing behavior, structure, or dependencies.
  - `Fixed` — bug fixes, race conditions, type errors, broken flows.
  - `Known Issues` — new technical debt, TODOs, smells, or follow-ups discovered while working.
  - `Next` — concrete, scoped tasks the author thinks should be done next.
- **Be specific.** Reference file paths and one-line explanations. Avoid vague entries like "improved code".

---

## 2026-06-02 ~22:30

**Repository analysis snapshot.** This entry establishes the baseline. Future entries go below it.

### Completed (existing implemented features)

- Email + password authentication (signup, login, logout) via Supabase Auth.
- Password recovery flow: forgot-password → email → deep link `petcare://reset-password` → reset-password screen. Supports both PKCE (`?code=…`) and implicit (`#access_token=…`) flows.
- Session persistence via `@react-native-async-storage` (configured in `lib/supabase.ts`).
- Pet CRUD: add (`app/add-pet.tsx`), edit (`app/edit-pet.tsx`), delete with `Alert.alert` confirmation, photo upload + replace + remove via `lib/storage.ts`.
- Pet photo pipeline: `expo-image-picker` → `expo-image-manipulator` (center-square crop, 600×600 resize, 0.7 compress) → base64 → `Uint8Array` → Supabase Storage `pet-photos/${userId}/${petId}/${timestamp}.jpg` → public URL.
- `PetAvatar` component (`app/components/PetAvatar.tsx`) with image w/ amber/dog-icon fallback and `onError` graceful degradation.
- Multi-pet support via `PetContext` (`context/PetContext.tsx`): `pets`, `selectedPet`, `setSelectedPet`, `refreshPets()`, `petsLoading`. Auto-fetches on `SIGNED_IN` and clears on `SIGNED_OUT`.
- Home timeline (`app/(tabs)/index.tsx`): greeting header, pet switcher, pet summary card with interactive status badge, 5 quick-action buttons, filter pills, pull-to-refresh, custom skeleton, FAB, and slide-up `EventActionModal` for edit/delete.
- Health tab (`app/(tabs)/health.tsx`): three summary cards (next vaccine, active meds, last visit), upcoming-schedule list, filterable timeline (vaccines / medications / symptoms), pull-to-refresh.
- Expenses tab (`app/(tabs)/expenses.tsx`): month navigator, total card, category breakdown with progress bars, category filter chips, expense history.
- Reminders tab (`app/(tabs)/reminders.tsx`): three sections (upcoming, recurring with active toggle, completed), pull-to-refresh, "Mark Done" action.
- Profile tab (`app/(tabs)/profile.tsx`): user info, pets grid, settings list, dark-mode toggle, log-out.
- Add event (`app/add-event.tsx`): 5 event types (feeding, expense, medication, vaccine, symptom) with type-specific metadata builders; supports both create and edit (`?eventId=…`).
- Add reminder (`app/add-reminder.tsx`): title, pet, type, due date, recurring toggle + free-text recurrence.
- Light / dark theme via `ThemeContext` (`context/ThemeContext.tsx`), persisted under `@petcare_theme`.
- Status management: Healthy / Sick / Under Medication, changeable from Home (modal picker) and Health (cycle).
- Validation patterns on auth forms (email regex, password length ≥ 8, password match, green/red border states).
- `KeyboardAwareScrollView` wrapping on every form screen.

### Known Issues (existing)

- **Google sign-in is a dead button** on `app/(auth)/login.tsx` and `app/(auth)/signup.tsx` — no `onPress` handler.
- **`app/(tabs)/expenses.tsx` and `app/(tabs)/profile.tsx` re-implement pets fetching locally** instead of consuming `usePet()`. They are out of sync with `PetContext` and create two sources of truth.
- **`selectedPet` is not persisted across app restarts.** After a cold start, the user has no way to re-select their previous pet (the context auto-picks `pets[0]`).
- **Vaccine `next_due` is captured as a free-text string** in `app/add-event.tsx` (placeholder `"e.g. 2026-09-01"`) — no `DateTimePicker`, no validation, the value flows straight into `metadata.next_due` and is parsed with `new Date(…)` downstream.
- **Hard-coded hex colors** (`#000`, `#f3f4f6`, `#9ca3af`, `#ef4444`, `#2c2c2e`, etc.) are scattered through every screen, mostly inside `style={{ … }}` props. The Tailwind palette tokens are underused.
- **Dark mode is not class-driven.** `tailwind.config.js` declares `darkMode: "class"` and the `dark.*` palette, but no component adds the `dark` class to the root — every screen uses ternaries with `isDark` from `useTheme()`.
- **`.env` is committed** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. The anon key is safe to be public, but this is worth noting.
- **Stale comment in `app/edit-pet.tsx`**: `// Added import` next to the `ImageManipulator` import line.
- **No skeleton loaders** on tabs other than Home (Health, Expenses, Reminders use a centered `ActivityIndicator`).
- **No empty-state polish** consistency — some screens have empty states, some fall back to plain text.
- **No `useEffect` cleanup for some async fetches** — if a user navigates away mid-load, the resulting `setState` may run on an unmounted component (no abort signal in use today).
- **No RLS / migration files** in the repo. The code assumes `user_id`-scoped reads work in Supabase.
- **No tests, no CI, no lint config** (no `.eslintrc`, no `tsconfig.test.json`).
- **No offline support, no push notifications, no email verification, no MFA.**

---

## 2026-06-02 ~22:35

**Consolidated pet fetching — expenses.tsx & profile.tsx now use PetContext.**

### Changed

- `app/(tabs)/expenses.tsx` — replaced local `useState<Pet[]>` + duplicate Supabase pets query with `usePet()` from PetContext. Pet selector calls `setSelectedPet()` on context instead of managing its own selection state.
- `app/(tabs)/profile.tsx` — replaced local `useState<Pet[]>` + duplicate Supabase pets query with `usePet()` from PetContext. Removed unused `Pet` type import.

### Completed

- Both screens now share a single source of truth for pets (PetContext), staying in sync with Home and Health tabs.
- Removed ~15 lines of duplicate Supabase query code across the two files.

---

## 2026-06-02 ~22:40

**Google sign-in implementation — v1 (signInWithOAuth + deep link scheme).**

### Changed

- `lib/googleAuth.ts` — initial implementation using `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "petcare://login" } })` with deep link handler.

### Known Issues

- The deep link scheme `petcare://` only works reliably in a development build, not Expo Go.

---

## 2026-06-02 ~22:42

**Google sign-in implementation — v2 (useIdTokenAuthRequest + signInWithIdToken).**

### Changed

- `lib/googleAuth.ts` — rewritten to a React hook (`useGoogleAuth`) using `expo-auth-session`'s `useIdTokenAuthRequest` Google provider. Gets `id_token` directly from Google and passes to `supabase.auth.signInWithIdToken()`.

### Completed

- `app/(auth)/login.tsx` — calls `useGoogleAuth()` hook.
- `app/(auth)/signup.tsx` — calls `useGoogleAuth()` hook.

---

## 2026-06-02 ~22:45

**Google sign-in fix — v3 (signInWithOAuth + Supabase callback + development build).**

### Changed

- `lib/googleAuth.ts` — uses `supabase.auth.signInWithOAuth` with Supabase as OAuth intermediary.
- `app/_layout.tsx` — updated `handleDeepLink()` to process OAuth callback URLs in addition to password recovery. Extracts `access_token`/`refresh_token` from URL fragment and calls `setSession()`.

### Fixed

- Google sign-in `Error 400: invalid_request` with `redirect_url=exp...`. Supabase handles the OAuth redirect so Google only needs Supabase's callback URL.

### Known Issues

- Google OAuth requires a **development build** (not Expo Go).
- User must configure: (1) Google Cloud Console → add `https://nqdcxlpsfctrhzcwttud.supabase.co/auth/v1/callback` to redirect URIs, (2) Supabase Dashboard → Google provider → Redirect URL `petcare://login`.

---

## 2026-06-02 ~22:50

**Google sign-in fix — v4 (added missing browser open call).**

### Fixed

- `lib/googleAuth.ts` — `signInWithOAuth` was not opening the browser. Added `WebBrowser.openAuthSessionAsync()` to launch the OAuth flow, extract tokens from the result URL, and call `setSession()`. Added `skipBrowserRedirect: true` to prevent Supabase from trying to redirect directly.

---

## 2026-06-02 ~22:52

**Google profile photo in profile tab.**

### Completed

- `app/(tabs)/profile.tsx` — user avatar now displays the Google profile photo (`user.user_metadata.avatar_url` or `.picture`) for Google-signed-in users. Falls back to the person icon for email/password users.

---

## 2026-06-02 ~22:54

**Cloud-synced dark mode preference.**

### Changed

- `context/ThemeContext.tsx` — rewritten to support cloud-synced theme preference. Default is now the **system theme** (via React Native `Appearance` API) instead of hardcoded `"light"`. When logged in, loads `theme_preference` from `user.user_metadata` in Supabase. On toggle, saves to both AsyncStorage (instant) and Supabase (synced across devices). On logout, reverts to system theme.
- `app/_layout.tsx` — root View now uses NativeWind `dark:` variant (`bg-white dark:bg-dark-bg`) with the `dark` class toggled conditionally, enabling `dark:` variants on all child components.

### Completed

- Logged-in users' theme preference is synced to Supabase `user.user_metadata.theme_preference`
- Theme preference syncs across devices via Supabase
- `dark:` Tailwind variants now work natively on all components

---

## 2026-06-02 ~22:56

**Fixed system theme detection on Android.**

### Fixed

- `context/ThemeContext.tsx` — moved `Appearance.getColorScheme()` out of `useState` initializer (returns `null` before mount on Android) into a `getSystemTheme()` helper called in `useEffect` when no saved theme exists. **Note: still not working on some devices — needs further investigation.**

---

## Future Entry Template

Copy this block under a new `## YYYY-MM-DD HH:MM` heading and fill in the relevant items.

```markdown
## YYYY-MM-DD HH:MM

**Short description of change.**

### Completed

* item

### Changed

* item

### Fixed

* item

### Known Issues

* item
```

---

## Next (suggested development tasks)

- [ ] **Fix system theme detection on Android** — `Appearance.getColorScheme()` not returning correct value on fresh launch (logged out). Needs investigation.
- [ ] **Persist `selectedPet`** to AsyncStorage (key `@petcare_selected_pet`) and rehydrate on mount.
- [ ] **Replace vaccine `next_due` free-text input with `DateTimePicker`** in `add-event.tsx`.
- [ ] **Remove stale `// Added import` comment** in `app/edit-pet.tsx`.
- [ ] **Consolidate pet fetching** — Make `app/(tabs)/expenses.tsx` and `app/(tabs)/profile.tsx` consume `usePet()` if not already done.
- [ ] **Introduce a design-tokens module** (`lib/theme.ts` or extend `tailwind.config.js`) and migrate hard-coded hex colors to token references.
- [ ] **Migrate components to use `dark:` variants** instead of `isDark` ternaries.
- [ ] **Add Jest + RN Testing Library** and seed the test suite with pure-logic tests.
- [ ] **Document Supabase RLS policies** in a `docs/SUPABASE.md`.
- [ ] **Add a Supabase migration folder** (`supabase/migrations/`).
- [ ] **Replace `.env` commit with `.env.example` + `.env` in `.gitignore`**.
- [ ] **Build a real "Add Reminder" recurring engine**.
- [ ] **Add an `Onboarding` flow** for first-time users.
- [ ] **Add an `ErrorBoundary`** at the root of `app/_layout.tsx`.
- [ ] **Add an `eslint` + `prettier` config** and a `lint` script in `package.json`.