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

## Quick Reference: Essential Files by Priority

### 🔴 Must Read First (Foundation)

| File                                                   | Purpose             | Key Pattern                              |
| ------------------------------------------------------ | ------------------- | ---------------------------------------- |
| [src/types/index.ts](src/types/index.ts)               | Type definitions    | Base types for exam, questions, answers  |
| [src/store/examSlice.ts](src/store/examSlice.ts)       | Redux exam state    | Question fetching, answer storage, timer |
| [src/hooks/useExamLogic.ts](src/hooks/useExamLogic.ts) | Master orchestrator | Combines all hooks and flows             |
| [src/lib/api.ts](src/lib/api.ts)                       | Axios config        | Bearer token, response unwrapping        |

### 🟡 Critical Hooks (Session Management)

| File                                                                       | Purpose                           |
| -------------------------------------------------------------------------- | --------------------------------- |
| [src/hooks/useAutoSaveAnswer.ts](src/hooks/useAutoSaveAnswer.ts)           | 500ms debounced answer saves      |
| [src/hooks/usePeriodicBackup.ts](src/hooks/usePeriodicBackup.ts)           | 2-minute bulk backup              |
| [src/hooks/useRestoreAnswers.ts](src/hooks/useRestoreAnswers.ts)           | Restore on refresh                |
| [src/hooks/useTimerPersistence.ts](src/hooks/useTimerPersistence.ts)       | Timer resilience across refreshes |
| [src/hooks/useEnsureSessionId.ts](src/hooks/useEnsureSessionId.ts)         | localStorage session sync         |
| [src/hooks/useRandomizedQuestions.ts](src/hooks/useRandomizedQuestions.ts) | Deterministic shuffle             |

### 🟢 Utilities & Services

| File                                                           | Purpose                             |
| -------------------------------------------------------------- | ----------------------------------- |
| [src/lib/examUtils.ts](src/lib/examUtils.ts)                   | Parse raw API data → typed objects  |
| [src/lib/questionRandomizer.ts](src/lib/questionRandomizer.ts) | Seeded LCG shuffle algorithm        |
| [src/services/exam.ts](src/services/exam.ts)                   | API wrapper (examStartSafe, submit) |

### 🔵 Debug Tools (Development Only)

- [src/lib/examDebugUtils.ts](src/lib/examDebugUtils.ts) — Log exam state + localStorage
- `ExamDebugTools.tsx` / `ExamDebugToolsSimple.tsx` — UI for manual state inspection
- [src/lib/imageTestUtils.ts](src/lib/imageTestUtils.ts) — Image question validation
- [src/lib/complexMultipleChoiceTests.ts](src/lib/complexMultipleChoiceTests.ts) — Multi-answer validation

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

## Golden Rules for Productivity

Follow these patterns religiously to avoid 90% of bugs:

1. **Never store server data in Redux** if a React Query hook exists for it
   - ❌ `const data = useSelector(state => state.exam.userProfile)`
   - ✅ `const { data } = useExamQuery.useUserProfile()`

2. **Always check localStorage for session token** before API calls
   - Use `useEnsureSessionId()` hook in every exam component
   - Token is lost on refresh without localStorage persistence

3. **Randomization seed must persist** across page refreshes
   - Call `loadRandomizationData(examId)` from localStorage BEFORE re-randomizing
   - Seed = `userId * 1000 + examId` → Don't recalculate

4. **3-tier auto-save ensures zero answer loss**
   - 500ms debounce (individual answers) → 2min bulk backup → restore on refresh
   - Never skip any tier

5. **Response unwrapping is automatic** (except `/submit` endpoint)
   - API returns `{success: true, data: {...}}` → Unwrapped to `response.data = {...}`
   - Submit endpoint keeps full structure for validation errors

6. **15-minute submit window** is enforced by design
   - Only allow manual submit in final 15 minutes before time-up
   - Use `shouldAllowManualSubmit()` utility check

7. **Timer persists via localStorage**, not in-memory
   - On refresh, calculate elapsed time from `exam_start_time_{examId}`
   - Never reset timer to full duration

## When Modifying Exam Flow

1. **Check localStorage keys**: Don't introduce new keys without documenting
2. **Update type definitions**: Edit `src/types/index.ts` first
3. **Invalidate React Query cache**: Use `queryClient.invalidateQueries()`
4. **Test session recovery**: Refresh during exam to verify auto-save works
5. **Verify randomization**: Check same question order across refreshes

## Testing Critical Paths

⚠️ **Note**: No automated test framework (Jest/Vitest) configured. Testing is manual via browser + debug tools.

### Testing Checklist

Run through these scenarios to verify exam flow integrity:

```
✓ Session & Restore
  - Start exam → Refresh page → Verify answers restored + timer continues from last position

✓ Auto-Save Verification
  - Answer a question → Wait 500ms → Verify "Saved" indicator appears

✓ Periodic Backup
  - Wait 2+ minutes during exam → Verify backup indicator shows scheduled backup completed

✓ Submit Window Rules
  - Try manual submit (not in final 15 minutes) → Should block with warning modal
  - Try manual submit (within final 15 minutes) → Should allow

✓ Time Expiration
  - Let timer expire → Should force-submit automatically + redirect to /dashboard

✓ Timer Persistence (Critical)
  - Start exam → Wait 5 minutes → Refresh page → Timer should show ~5 minutes elapsed (NOT reset to full duration)

✓ Randomization Consistency
  - Check question order → Refresh page → Question order should NOT change
  - Different user, same exam → Question order may differ (seed = userId * 1000 + examId)
```

### Using Debug Tools

During development, enable debug output:

```typescript
// In ExamContent.tsx or relevant component
import { logExamState } from "@/lib/examDebugUtils";

// Call during exam to inspect state
logExamState(examId, sessionId);
```

This outputs to console:

- Current exam state (Redux)
- All localStorage keys/values
- Question randomization seed and mapping
- Session token status

### Key Test Files

- [src/lib/examDebugUtils.ts](src/lib/examDebugUtils.ts) — State inspection + logging
- [src/lib/imageTestUtils.ts](src/lib/imageTestUtils.ts) — Image question type validation
- [src/lib/complexMultipleChoiceTests.ts](src/lib/complexMultipleChoiceTests.ts) — Complex MC answer validation
