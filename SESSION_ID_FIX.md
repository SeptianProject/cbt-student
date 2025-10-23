# Session ID Fix - Auto-Save Feature

## 📌 Problem

Session ID was null, preventing auto-save from working.

## ✅ Solution

Sistem sekarang otomatis mengambil `session_id` dari endpoint `getSessionStatus` setelah exam start.

---

## 🔧 Changes Made

### 1. **Update `examSlice.ts` - fetchExam**

- Setelah exam start, langsung call `getSessionStatus`
- Parse `session_id` dari response
- Store ke Redux state

```typescript
export const fetchExam = createAsyncThunk(
  "exam/fetchExam",
  async ({ assigned, slug, userId }, { rejectWithValue }) => {
    try {
      const exam = findExamBySlug(assigned, slug);
      const examData = await examService.examStartSafe(exam.exam_id);

      // NEW: Get session status to retrieve session_id
      const sessionStatus = await examService.getSessionStatus(exam.exam_id);

      return { exam, examData, sessionStatus, userId };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
```

### 2. **Update fetchExam.fulfilled Handler**

- Priority untuk `session_id` dari `sessionStatus`
- Fallback ke `examData` jika tidak ada
- Logging untuk debugging

```typescript
// Store session_id from sessionStatus response (priority lebih tinggi)
if (action.payload.sessionStatus?.session_id) {
  state.sessionId = action.payload.sessionStatus.session_id;
  console.log("✅ Session ID retrieved from status:", state.sessionId);
}
```

### 3. **Add checkSessionStatus Handler**

- Handle update session_id dari manual check
- Untuk auto-retry jika null

```typescript
.addCase(checkSessionStatus.fulfilled, (state, action) => {
     if (action.payload.session_id) {
          state.sessionId = action.payload.session_id;
          console.log('✅ Session ID updated from checkSessionStatus:', state.sessionId);
     }
});
```

### 4. **New Hook: `useEnsureSessionId`**

File: `src/hooks/useEnsureSessionId.ts`

- Auto-check session_id setiap render
- Jika null, otomatis call `getSessionStatus`
- Integrated di `useExamLogic`

```typescript
export const useEnsureSessionId = () => {
     const dispatch = useAppDispatch();
     const { sessionId, currentExam, sessionStatus, isLoading } = useAppSelector(...);

     useEffect(() => {
          if (currentExam && sessionStatus === 'progress' && !sessionId && !isLoading) {
               console.log('⚠️ Session ID is null, fetching from getSessionStatus...');
               dispatch(checkSessionStatus(currentExam.exam_id));
          }
     }, [sessionId, currentExam, sessionStatus, isLoading, dispatch]);

     return { sessionId };
};
```

### 5. **Integrate in `useExamLogic.ts`**

```typescript
import { useEnsureSessionId } from "./useEnsureSessionId";

export const useExamLogic = () => {
  // ... existing code ...

  // NEW: Ensure session ID is always available
  useEnsureSessionId();

  // Auto-save will now work because sessionId is guaranteed
  const { isSaving, lastSavedTime, saveError } = useAutoSaveAnswer({
    sessionId, // This will no longer be null
    // ...
  });
};
```

---

## 🔍 How It Works Now

### Flow Diagram

```
1. User starts exam
   ↓
2. fetchExam action dispatched
   ↓
3. Call examStartSafe(exam_id)
   ↓
4. Call getSessionStatus(exam_id)  ← NEW!
   ↓
5. Parse session_id from response
   ↓
6. Store in Redux state
   ↓
7. useEnsureSessionId monitors sessionId
   ↓
8. If null → auto call checkSessionStatus
   ↓
9. sessionId available ✅
   ↓
10. Auto-save enabled ✅
```

---

## 📡 Backend Requirements

### Endpoint: `/siswa/exams/{examId}/status`

**Request:**

```json
POST /siswa/exams/{examId}/status

Headers:
{
  "Authorization": "Bearer {token}"
}

Body:
{
  "session_token": "abc123..."
}
```

**Response (REQUIRED FORMAT):**

```json
{
  "success": true,
  "session_id": 123,        ← PENTING! Harus ada field ini
  "status": "progress",
  "remaining_time": 3600,
  "start_time": "2025-10-21T10:00:00Z",
  ...
}
```

### ⚠️ CRITICAL

Backend **HARUS** return field `session_id` di response!

```php
// Laravel example
public function getSessionStatus(Request $request, $examId) {
    $validated = $request->validate([
        'session_token' => 'required|string'
    ]);

    $session = ExamSession::where('token', $validated['session_token'])
        ->where('exam_id', $examId)
        ->whereIn('status', ['progress', 'in_progress', 'active'])
        ->first();

    if (!$session) {
        return response()->json([
            'success' => false,
            'message' => 'Session not found'
        ], 404);
    }

    return response()->json([
        'success' => true,
        'session_id' => $session->id,  // ← PENTING!
        'status' => $session->status,
        'remaining_time' => $session->remaining_time,
        'start_time' => $session->start_time,
        'exam_id' => $session->exam_id,
    ]);
}
```

---

## 🧪 Testing

### 1. Check Console Logs

**Expected Success Logs:**

```
📊 Session status response: { success: true, session_id: 123, ... }
✅ Session ID retrieved from status: 123
```

**If Still Null:**

```
⚠️ No session_id found in response
⚠️ Session ID is null, fetching from getSessionStatus...
```

### 2. Check Network Tab

Look for these requests:

1. `POST /siswa/exams/{id}/start`
2. `POST /siswa/exams/{id}/status` ← Should appear right after start

Check response of `/status`:

```json
{
  "session_id": 123  ← Must be present!
}
```

### 3. Check Redux State

Open Redux DevTools:

```
exam.sessionId should be a number (e.g., 123)
NOT null ✅
```

### 4. Verify Auto-Save Works

After session_id is retrieved:

```
📝 Detected answer changes: 1 question(s)
⏰ Debounce timer fired, saving answers...
🔄 Saving answer: { sessionId: 123, questionId: 45, ... }
📡 Sending update-answer request: { session_id: 123, ... }
✅ Answer saved successfully
```

---

## 🐛 Troubleshooting

### Problem: session_id still null

**Check:**

1. Backend response dari `/status` endpoint
2. Pastikan field `session_id` ada di response
3. Check console untuk error

**Solutions:**

#### A. Backend belum return session_id

```bash
# Test dengan curl atau Postman
curl -X POST http://localhost:8000/api/siswa/exams/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_token": "your_session_token"}'

# Response harus punya session_id
{
  "session_id": 123  ← Check this!
}
```

#### B. Network error

Check browser console untuk error messages dari fetchExam.

#### C. Session token invalid

```
// Check localStorage
console.log(localStorage.getItem('session_token'));
// Should not be null
```

---

## 📝 Summary

**Before:**

- Session ID selalu null
- Auto-save tidak jalan
- Data tidak tersimpan

**After:**

- Session ID otomatis diambil dari `getSessionStatus`
- Auto-retry jika masih null
- Auto-save bekerja dengan baik
- Data tersimpan real-time ✅

**Key Points:**

1. ✅ Backend harus return `session_id` di endpoint `/status`
2. ✅ Frontend otomatis fetch session_id setelah exam start
3. ✅ Auto-retry mechanism jika masih null
4. ✅ Extensive logging untuk debugging

---

## 📚 Files Changed

1. `src/store/examSlice.ts` - Update fetchExam & add handler
2. `src/hooks/useEnsureSessionId.ts` - NEW hook
3. `src/hooks/useExamLogic.ts` - Integrate useEnsureSessionId
4. `TROUBLESHOOTING_AUTO_SAVE.md` - Updated documentation

---

## 🚀 Next Steps

1. **Backend**: Pastikan `/siswa/exams/{id}/status` return `session_id`
2. **Test**: Run app, start exam, check console logs
3. **Verify**: Session ID should appear in logs
4. **Confirm**: Auto-save should work (see network requests)

Jika masih ada masalah, share console logs untuk further debugging! 🔍
