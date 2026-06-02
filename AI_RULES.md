# AI_RULES.md

> **Project:** PetCare (`petcare-app`)
> **Purpose:** Codified conventions inferred from the codebase, plus mandatory instructions for any AI assistant working in this repository.

---

## A. Coding Standards

- **TypeScript strict mode is mandatory.** `tsconfig.json` extends `expo/tsconfig.base` with `"strict": true`. Do not relax it.
- **Avoid `any`.** The only existing `any` usages are in `EVENT_ICONS` / `RECURRENCE_ICONS` maps (`Record<string, any>`) where the icon name is a free string. Prefer typed icon names (`ComponentProps<typeof Ionicons>["name"]`) or a closed string union.
- **Use functional components only.** No class components exist in the codebase.
- **Prefer `const` arrow functions for components** (`export default function Foo() { … }` is the dominant pattern).
- **Use `import type { … }`** when importing only types (e.g. `import type { Pet, PetEvent } from "../../types/index"`).
- **Module imports are absolute within the source tree** (`../lib/supabase`, `../../context/PetContext`); there is no path alias.
- **`@/` style path aliases are NOT configured** — do not introduce them.
- **Avoid `// @ts-ignore`** unless absolutely required (the root layout uses it once for `global.css`).
- **Native deps:** if a new dependency is required, justify it in the PR description and update `AI_CHANGELOG.md`. Expo-managed deps must stay within SDK 54 (`~` pin).

---

## B. Component Patterns

- **Screens are default-exported React components placed in `app/`.** Filename = route segment.
- **Reusable presentational components live in `app/components/`.** They are default-exported, typed with a `Props` `type`, and named PascalCase.
- **Screens own their loading and error state** with `useState<boolean>` + `useState<string>` for `error`. Use `ActivityIndicator` while `loading === true` and a centered `<Text className="text-red-500 …">` for errors.
- **Refresh-on-focus is via `useFocusEffect` + `useCallback` from `expo-router`** (see `health.tsx`, `reminders.tsx`, `expenses.tsx`).
- **One-time data fetches on mount use `useEffect(() => { … }, [])` or `useEffect(() => { … }, [selectedPet?.id])`**.
- **Memoize derived lists** with `useMemo` for filtered/sorted views (see `index.tsx` `sortedEvents` / `filteredEvents` / `displayEvents`).
- **Skeletons are inline components** in the screen file (e.g. `HomeSkeleton`, `SkeletonBox`) — not a shared component yet.
- **Modals are React Native `<Modal transparent animationType="fade">`** with an overlay `<TouchableOpacity activeOpacity={1} onPress={onClose}>`. The slide-up animation in `EventActionModal.tsx` is the only example of `Animated` use.
- **Form submission buttons follow a ternary pattern:** active state = `bg-black`, disabled = `bg-gray-300`, and `ActivityIndicator color="white"` replaces the label when `loading === true`.
- **Validation lives inline** at the top of the screen as derived booleans (`emailValid`, `passwordValid`, `canSubmit`).

---

## C. Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Components / screens | PascalCase | `AddEventScreen`, `EventActionModal`, `PetAvatar` |
| Hooks | `useXxx` | `usePet`, `useTheme` |
| Context providers | `XxxProvider` (export), `XxxContext` (internal) | `ThemeProvider` / `ThemeContext` |
| State variables | camelCase noun / verb | `petsLoading`, `activeFilter`, `refreshing` |
| Event handlers | `handleXxx` or `onXxx` | `handleSave`, `handleLogin`, `onRefresh` |
| Type unions | PascalCase, often suffixed `Type` | `EventType`, `Pet["status"]` |
| DB column names | snake_case (matches Supabase) | `user_id`, `age_years`, `is_completed` |
| Class-name constants at top of a screen | camelCase + `Class` suffix | `bgClass`, `textClass`, `cardBgClass` |
| Local helpers in a file | camelCase, hoisted above the component | `formatTime`, `getGreeting`, `buildMetadata` |
| Storage keys in AsyncStorage | `@petcare_<scope>` | `@petcare_theme` |
| Deep-link scheme | `petcare://` | `petcare://reset-password` |

---

## D. Folder Structure Rules

- **All routes go under `app/`.** File name maps to the URL path (with Expo Router groups `(auth)` and `(tabs)` not contributing to the URL).
- **Shared components go under `app/components/`.** Do not create a top-level `components/` directory — the Tailwind `content` glob is already configured for `./app/**/*.{js,jsx,ts,tsx}`.
- **Cross-cutting state lives in `context/`.** One file per context, with the `XxxContext` object, the `XxxProvider` component, and a `useXxx()` hook exported.
- **External service clients and helpers live in `lib/`.** Examples: `lib/supabase.ts` (singleton client) and `lib/storage.ts` (upload/delete helpers).
- **Domain types live in `types/index.ts`.** Add new shared types here; do not invent per-screen types when a domain type already exists.
- **Static assets go in `assets/`.** Use `require("../../assets/…")` for images (see `g-logo.png` reference in `login.tsx`).
- **No `screens/`, `hooks/`, `services/`, `utils/` folders exist** — keep this convention.

---

## E. State Management Rules

- **State management is React Context only.** No Redux, Zustand, MobX, Recoil, Jotai, or React Query.
- **Two contexts exist today:**
  - `PetContext` — exposes `pets`, `selectedPet`, `setSelectedPet`, `refreshPets()`, `petsLoading`. Mounted in `app/_layout.tsx` (inside the router guard). Not available to `(auth)/*` screens — they should not import it.
  - `ThemeContext` — exposes `theme`, `isDark`, `toggleTheme()`, `setTheme()`. Mounted at the outermost root in `app/_layout.tsx`.
- **Do not add a third context** without a clear justification; consider lifting state to the existing providers or adding a new screen-local `useState` first.
- **For data that does not need to cross screens** (form fields, modal visibility, current filter), prefer screen-local `useState` over context.
- **Fetch on focus, not on mount only**, when the screen is a tab and the data may have changed (use `useFocusEffect`).
- **Never read from `AsyncStorage` inside a render** — always inside `useEffect` or an event handler.

---

## F. API Usage Rules

- **Use the singleton client from `lib/supabase.ts` only.** Do not call `createClient()` elsewhere.
- **Always scope queries to the current user.** Use `supabase.auth.getUser()` to retrieve `user.id` and then `.eq("user_id", user.id)` (or `.eq("pet_id", …)` for joins through pets).
- **For inserts, set `user_id` explicitly** from `getUser()` — do not rely on Postgres `default` values.
- **For storage uploads, use the helpers in `lib/storage.ts`** (`uploadPetPhoto`, `deletePetPhoto`). They encode the convention `${userId}/${petId}/${timestamp}.jpg` and bucket name `pet-photos`.
- **Use `.select("*")` for list endpoints** and `.select().single()` for single-record fetches (see `add-pet.tsx` insert pattern).
- **Errors from Supabase are returned, not thrown.** Always check `{ data, error }` and surface the error to the user (most screens do `setError(err.message)` or `console.error(err)`).
- **Do not introduce a third-party HTTP client** (axios, ky, etc.) — the only network surface is Supabase.

---

## G. Database Access Rules

- **Three tables exist in the project:** `pets`, `events`, `reminders`. The Storage bucket is `pet-photos`.
- **Column names are snake_case** (`user_id`, `age_years`, `is_completed`, `photo_url`, `next_due`).
- **All timestamps are stored as ISO strings** (Supabase returns ISO; `new Date(…).toISOString()` is used on writes).
- **The `events.metadata` column is a free-form JSONB blob** with a per-type shape (see `types/index.ts` and `add-event.tsx::buildMetadata`). Document any new field by extending the type and the union in `types/index.ts`.
- **Cascading deletes from `pets` to `events` and `reminders` are assumed** (the code deletes the pet and expects related rows to vanish — `edit-pet.tsx::handleDeletePet`).
- **RLS is configured externally in Supabase.** The client-side filters (`user_id`, `pet_id`) are defense-in-depth, not the primary enforcement.
- **No migrations are checked in.** Schema changes must be applied via the Supabase dashboard or `supabase` CLI, then documented in `AI_CHANGELOG.md`.
- **Never use raw SQL strings or `supabase.rpc()`** unless a migration is added to support it.

---

## H. UI Styling Rules

- **Use NativeWind utility classes for layout, spacing, typography, and most colors.** Examples: `flex-1`, `px-5`, `rounded-2xl`, `text-sm font-semibold`, `gap-3`.
- **Dark mode palette is defined in `tailwind.config.js` under `colors.dark.*`**: `bg`, `card`, `border`, `text`, `text-secondary`, `text-tertiary`. The config sets `darkMode: "class"` — **but the app does not actually toggle the `dark` class on the root**. Instead, every screen reads `isDark` from `useTheme()` and uses ternaries.
- **Follow the existing pattern of `bgClass` / `textClass` / `cardBgClass` / `inputBgClass` / `inputTextClass` constants at the top of a screen** to keep the JSX clean.
- **Hard-coded hex colors are allowed for now** (e.g. `bg-black` expands to `#000`, but inline `style={{ backgroundColor: "#2c2c2e" }}` is also common in `app/(tabs)/*`). Prefer the existing palette tokens; if you need a new color, add it to `tailwind.config.js` first.
- **Icons are from `@expo/vector-icons`** — primarily `Ionicons` and `MaterialCommunityIcons`. Use a named icon import and pass `name` and `size`. Do not add another icon library.
- **Buttons follow the pill / rounded-rectangle convention:** `rounded-xl` (12px) for inputs and small buttons, `rounded-2xl` (16px) for cards, `rounded-full` for chips/avatars.
- **Always wrap forms in `KeyboardAwareScrollView`** from `react-native-keyboard-aware-scroll-view` with `keyboardShouldPersistTaps="handled"`, `enableOnAndroid={true}`, `extraScrollHeight={100}`.
- **Status bar is controlled per-screen** with `<StatusBar style={isDark ? "light" : "dark"} />` from `expo-status-bar`.
- **Do not introduce a UI library** (no Tamagui, Gluestack, Paper, etc.) without updating `AI_CHANGELOG.md`.

---

## I. Testing Rules

- **There are no tests in the project today.** No Jest config, no `__tests__` folders, no `*.test.*` files.
- **If you add tests, follow these defaults:**
  - Runner: **Jest** with `jest-expo` preset.
  - Component tests: **React Native Testing Library** (`@testing-library/react-native`).
  - Mock `lib/supabase.ts` at the module boundary — never hit the real network in tests.
  - Mock `expo-image-picker`, `expo-file-system`, and `expo-linking` to avoid native module errors.
- **Test naming:** `*.test.ts` / `*.test.tsx`, co-located with the file under test (e.g. `app/(tabs)/index.test.tsx`).
- **Tests are not optional for new pure logic** (formatters, reducers, metadata builders). UI tests are optional but encouraged.
- **CI is not configured.** Document test instructions in `AI_CHANGELOG.md` if you add them.

---

## J. Error Handling Rules

- **Every Supabase call is followed by an `error` check.** If `error` is non-null, surface it to the UI via `setError(err.message)` and stop the loading state.
- **For non-blocking failures (refresh, photo upload, background fetches),** use `try/catch` + `console.error(err)`. Do not throw past the handler.
- **User-facing errors are strings** displayed in red: `<Text className="text-red-500 text-sm text-center mb-4">{error}</Text>`. Do not render raw error objects.
- **Destructive actions require `Alert.alert` confirmation** (see `edit-pet.tsx::handleDeletePet`, `EventActionModal.tsx::handleDelete`).
- **Loading buttons use `ActivityIndicator color="white"`** in place of the label, not a separate spinner.
- **No global error boundary exists.** Do not add one without a clear plan for surfacing errors to the user.
- **Auth errors are mapped to readable messages** by Supabase itself — pass `error.message` straight to the UI.

---

## K. Mandatory AI Instructions

> **Every AI assistant working in this repository must follow these rules on every task.**

1. **Read `AI_PROJECT.md` before making changes.** It is the single source of truth for architecture, stack, and conventions.
2. **Read `AI_CHANGELOG.md` before making changes.** Review recent history to avoid duplicating work and to understand active context.
3. **Follow existing project patterns.** Match the file structure, naming, and component patterns described above. Do not invent new conventions.
4. **Avoid introducing new dependencies unless necessary.** Justify any new dependency in the change summary and update `AI_CHANGELOG.md`.
5. **Do not refactor unrelated code.** Touch only the files required for the task. If you see a smell, log it in `AI_CHANGELOG.md` under "Known Issues" instead of fixing it inline.
6. **Preserve backward compatibility.** Do not change exported types, table columns, or storage paths without a migration plan documented in `AI_CHANGELOG.md`.
7. **Update `AI_CHANGELOG.md` after implementation.** Add a dated entry with the relevant `Completed` / `Changed` / `Fixed` / `Known Issues` / `Next` items.
8. **Suggest `AI_PROJECT.md` updates when architecture changes.** If your change introduces a new context, lib, screen, table, or routing convention, call this out so a human can update the docs.

---

## L. Enforcement Checklist (use this before marking a task complete)

- [ ] `AI_PROJECT.md` and `AI_CHANGELOG.md` were read at the start of the task.
- [ ] New code follows the folder, naming, and component patterns above.
- [ ] All Supabase calls are scoped by `user_id` / `pet_id`.
- [ ] No new top-level dependencies were added.
- [ ] No unrelated refactors were performed.
- [ ] `AI_CHANGELOG.md` has a new dated entry.
- [ ] If architecture changed, `AI_PROJECT.md` was flagged for update.
- [ ] No hard-coded secrets (`.env` is already committed; never add real service-role keys).
