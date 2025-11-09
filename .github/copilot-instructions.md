# CBT Frontend - AI Coding Agent Instructions

## Project Overview

This is a Computer-Based Testing (CBT) student frontend application built with Next.js 15, TypeScript, and React 19. The app manages exam sessions with real-time auto-save, question randomization, and session recovery.

## Architecture Pattern: Hybrid Redux + React Query

### State Management Split

- **Redux Toolkit** (`src/store/`): Client-side exam state, answers, timers, UI flags
  - `examSlice.ts`: Exam session state, questions, answers, submit modal, timer
  - `authSlice.ts`: User authentication state, student profile
- **React Query** (`@tanstack/react-query`): Server state, API mutations, data fetching
  - Query keys pattern: `examKeys.detail(examId)`, `examKeys.sessionStatus(examId)`
  - Custom hooks in `src/hooks/useExamQuery.ts`, `src/hooks/useAuthQuery.ts`
  - Automatic cache invalidation after mutations

### Critical: Never mix concerns

- ❌ Don't fetch API data in Redux thunks when React Query hook exists
- ❌ Don't store server data in Redux when React Query can cache it
- ✅ Use Redux for client state (current question index, show modal, timer)
- ✅ Use React Query for server sync (submit exam, fetch user, session status)

## Exam Session Architecture

### Session Lifecycle

1. **Start**: `/exam/[slug]/page.tsx` → `examService.examStartSafe()` → Creates session, stores `session_token` and `session_id` in localStorage
2. **Active**: `/exam/[slug]/start/page.tsx` → Auto-save answers every 500ms, backup every 2 minutes
3. **Submit**: Force submit on time-up or manual submit (only allowed in final 15 minutes)
4. **Cleanup**: Navigate to `/dashboard`, invalidate React Query cache, clear localStorage

### Auto-Save Strategy (3-tier)

1. **Individual Answer Save** (`useAutoSaveAnswer.ts`): Debounced 500ms, saves to `student_exam_answers_temp` table
2. **Periodic Backup** (`usePeriodicBackup.ts`): Every 2 minutes, bulk saves all answers
3. **Session Recovery** (`useRestoreAnswers.ts`): On refresh/reconnect, restores from temp table

### Session Token Management

```typescript
// Always stored in localStorage after exam start
localStorage.setItem("session_token", token);
localStorage.setItem("session_id", id.toString());
localStorage.setItem("exam_id", examId.toString());
localStorage.setItem("current_exam_slug", slug);

// Timer persistence (for refresh resilience)
localStorage.setItem("exam_start_time_{examId}", Date.now().toString());
localStorage.setItem("exam_duration_{examId}", durationInSeconds.toString());

// Cleared only on final submit or forced logout
localStorage.removeItem("session_token");
localStorage.removeItem("session_id");
localStorage.removeItem("exam_start_time_{examId}");
localStorage.removeItem("exam_duration_{examId}");
```

## Question Randomization

### Deterministic Shuffle

- Uses **seeded randomization** (Linear Congruential Generator in `src/lib/questionRandomizer.ts`)
- Seed = `userId * 1000 + examId` → Same order for same user+exam across sessions
- Stores mapping in localStorage: `exam_{examId}_randomization_seed`, `exam_{examId}_original_to_randomized_map`
- **Critical**: Must preserve randomization across page refreshes for exam integrity

### Question Types

- `"0"`: Multiple Choice (Single) → Answer: `"A"`
- `"1"`: Multiple Choice Complex → Answer: `["A", "C", "D"]` (comma-separated)
- `"2"`: True/False → Answer: `"True"` or `"False"`
- `"3"`: Essay → Answer: String (max 5000 chars)

## API Integration

### Base Configuration (`src/lib/api.ts`)

```typescript
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL
Authorization: Bearer ${localStorage.getItem('api_token')}
```

### Response Unwrapping

- API returns: `{success: true, data: {...}}`
- Interceptor unwraps to: `response.data = response.data.data`
- **Exception**: Submit endpoint keeps full structure for validation

### Critical Endpoints

- `POST /siswa/exams/{examId}/start` → Returns `session_token`
- `POST /siswa/exams/{examId}/submit` → Payload: `{session_token, answers, essay_answers, force_submit, final_submit}`
- `POST /siswa/exam-session/update-answer` → Individual answer save
- `POST /siswa/exam-session/save-answers` → Bulk backup (periodic)
- `GET /siswa/exam-session/{sessionId}/answers` → Restore saved answers

## Key Custom Hooks

### `useExamLogic.ts` - Master Exam Hook

Central hook that orchestrates entire exam flow:

- Fetches exam, manages navigation, handles submissions
- Integrates auto-save, restore, periodic backup
- Controls submit modal (only shows if validation warnings exist)
- **Rule**: 15-minute window before exam end for manual submit

### Hook Dependencies

```typescript
useExamLogic (master)
├── useAutoSaveAnswer (500ms debounce)
├── usePeriodicBackup (2 min interval)
├── useRestoreAnswers (on mount)
├── useEnsureSessionId (localStorage sync)
├── useTimerPersistence (elapsed time calculation)
└── useRandomizedQuestions (deterministic shuffle)
```

## Type System Patterns

### Parsed vs Raw Data

```typescript
// Raw from API (JSON strings)
interface Question {
  choices: string; // "{\"A\": \"option A\", \"B\": \"option B\"}"
  answer_key: string; // "[\"A\",\"C\"]"
  points: string; // "15.00"
}

// Parsed for UI (in examUtils.ts)
interface ParsedQuestion {
  choices: Record<string, string>; // {A: "option A", B: "option B"}
  answer_key: string[]; // ["A", "C"]
  points: number; // 15
}
```

### Answer Format

```typescript
// Redux storage
Record<number, StudentAnswer> // {1: {question_id: 1, answer: "A"}, 2: {...}}

// API submission format
{
  answers: Record<string, string>, // {"1": "A", "2": "B,C"} - MC answers
  essay_answers: Record<string, string> // {"5": "Essay text..."} - Essay answers
}
```

## Routing Convention

### App Router Structure

- `/exam` → Exam list (dashboard)
- `/exam/[slug]` → Pre-exam confirmation page
- `/exam/[slug]/start` → Active exam page (main exam UI)
- `/exam/[slug]/complete` → Post-submission (SKIPPED - goes directly to `/dashboard`)

### Protected Routes

Wrap all exam pages with `<ProtectedRoute>` component:

```tsx
export default function ExamPage() {
  return <ProtectedRoute>{/* Page content */}</ProtectedRoute>;
}
```

## Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Common Pitfalls

### 1. Session Token Loss

**Problem**: Refresh page → Session token lost → Can't submit
**Solution**: Always use `useEnsureSessionId()` hook, reads from localStorage

### 2. Randomization Inconsistency

**Problem**: Different question order after refresh
**Solution**: Check `loadRandomizationData(examId)` in localStorage before re-randomizing

### 3. Auto-Save Race Conditions

**Problem**: Multiple saves for same question
**Solution**: `savingQuestionsRef.current.has(questionId)` check in `useAutoSaveAnswer.ts`

### 4. Modal Won't Close After Submit

**Problem**: Submit modal stays open even after success
**Solution**: Don't manually close modal in `confirmSubmission()` - Redux auto-closes on `isExamEnded`

### 5. Timer Reset on Refresh

**Problem**: Timer resets to full duration after page refresh
**Solution**: `useTimerPersistence` hook calculates elapsed time from `exam_start_time_{examId}` in localStorage. Timer automatically syncs after answers restore completes.

## UI Component Patterns

### Exam Components (`src/components/exam/`)

- `ExamContent.tsx` - Main wrapper with debug tools
- `ExamMainContent.tsx` - Question display + navigation
- `ExamTimer.tsx` - Countdown timer with auto-submit
- `SaveStatusIndicator.tsx` - Shows "Saving..." / "Saved" / "Error"
- `BackupStatusIndicator.tsx` - Shows periodic backup status
- `RestoreStatusIndicator.tsx` - Shows answer restoration on mount
- `ExamSubmitModal.tsx` - Confirmation modal (only shows if warnings)

### Status Indicators Usage

```tsx
<SaveStatusIndicator
  isSaving={isSaving}
  lastSavedTime={lastSavedTime}
  saveError={saveError}
/>
```

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api
```

## Code Style Conventions

- Use `'use client'` directive for all interactive components
- Prefer `useCallback` for event handlers in hooks
- Use TypeScript strict mode (no implicit any)
- Path alias: `@/` maps to `src/`
- Component files: PascalCase (`ExamTimer.tsx`)
- Hook files: camelCase with `use` prefix (`useExamLogic.ts`)
- Utility files: camelCase (`examUtils.ts`)

## When Modifying Exam Flow

1. **Check localStorage keys**: Don't introduce new keys without documenting
2. **Update type definitions**: Edit `src/types/index.ts` first
3. **Invalidate React Query cache**: Use `queryClient.invalidateQueries()`
4. **Test session recovery**: Refresh during exam to verify auto-save works
5. **Verify randomization**: Check same question order across refreshes

## Testing Critical Paths

1. Start exam → Refresh → Verify answers restored AND timer continues from last position
2. Answer question → Wait 500ms → Check "Saved" indicator
3. Wait 2 minutes → Check backup indicator
4. Submit early → Should block (not in 15-min window)
5. Time expires → Should force submit automatically
6. Start exam → Wait 5 minutes → Refresh → Timer should show 5 minutes elapsed (not reset)
7. Start exam → Wait 5 minutes → Refresh → Timer should show 5 minutes elapsed (not reset)
