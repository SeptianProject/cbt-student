# Troubleshooting Auto-Save Feature

## Cara Debug Auto-Save

### 1. Buka Browser Console

- Tekan `F12` atau `Ctrl+Shift+I`
- Pilih tab **Console**
- Pilih tab **Network** (untuk monitoring request)

### 2. Mulai Ujian & Pilih Jawaban

Ketika Anda memilih jawaban, perhatikan console log dengan icon berikut:

#### ✅ Normal Flow (Berhasil)

```
📝 Detected answer changes: 1 question(s)
⏰ Debounce timer fired, saving answers...
🔄 Saving answer: { sessionId: 123, questionId: 45, type: 'choice', answer: 'A', ... }
📡 Sending update-answer request: { session_id: 123, question_id: 45, ... }
✅ Update-answer response: { success: true, message: '...' }
✅ Answer saved successfully: { questionId: 45, ... }
```

#### ⚠️ Warning Messages

##### Session ID Tidak Ada

```
⚠️ Auto-save disabled: { enabled: true, sessionId: null }
⚠️ Auto-save skipped: { reason: 'No session ID', sessionId: null, enabled: true }
```

**Solusi:**

- Session belum dimulai dengan benar
- Check apakah endpoint `/siswa/exams/{id}/start` return `session_id`
- Pastikan `session_id` tersimpan di Redux state

##### Question Tidak Ditemukan

```
⚠️ Question not found: 45
```

**Solusi:**

- Data questions belum ter-load dengan benar
- Check Redux state `exam.questions`

##### Answer Kosong

```
⚠️ Empty answer, skipping save: { questionId: 45, answer: '' }
```

**Solusi:**

- Ini normal jika siswa clear jawaban
- Auto-save tidak akan menyimpan jawaban kosong

#### ❌ Error Messages

##### Session Token Tidak Ada

```
❌ Session token not found in updateAnswer
```

**Solusi:**

- Check localStorage: `localStorage.getItem('session_token')`
- Pastikan token ada setelah exam start
- Pastikan backend return `session_token`

##### Network Error

```
❌ Update-answer failed: [Error details]
Error response: { status: 404, data: {...} }
```

**Status Codes:**

- **404**: Endpoint tidak ditemukan → Backend belum ready
- **422**: Validation error → Check format data
- **401**: Unauthorized → Token invalid/expired
- **500**: Server error → Backend error

### 3. Check Network Tab

Di tab **Network** browser:

1. Filter: **Fetch/XHR**
2. Cari request ke: `exam-session/update-answer`
3. Click request untuk lihat detail

#### Request Headers

```
Authorization: Bearer {your_token}
Content-Type: application/json
```

#### Request Payload

```json
{
  "session_id": 123,
  "question_id": 45,
  "answer": "A",
  "type": "choice"
}
```

#### Expected Response (Success)

```json
{
  "success": true,
  "message": "Answer updated successfully"
}
```

### 4. Check Redux State

Di Console, ketik:

```javascript
// Check session ID
window.__REDUX_DEVTOOLS_EXTENSION__
  ? store.getState().exam.sessionId
  : "Install Redux DevTools";

// Check answers
window.__REDUX_DEVTOOLS_EXTENSION__
  ? store.getState().exam.answers
  : "Install Redux DevTools";
```

Atau install **Redux DevTools Extension** untuk monitoring real-time.

---

## Common Issues & Solutions

### Issue 1: Auto-save tidak jalan sama sekali (Session ID Null)

**Symptoms:**

- Tidak ada log di console atau hanya ada warning
- Console shows: `⚠️ Auto-save disabled: { enabled: true, sessionId: null }`
- Tidak ada request di Network tab

**New Solution (Updated):**
Sistem sekarang otomatis mengambil `session_id` dari endpoint `getSessionStatus`.

**Debug Steps:**

1. Check console untuk log `✅ Session ID retrieved from status: [number]`
2. Jika masih null, check apakah backend endpoint `/siswa/exams/{id}/status` return `session_id`
3. Pastikan response format:

```json
{
  "success": true,
  "session_id": 123,
  "status": "progress",
  ...
}
```

**Backend Requirements:**
Endpoint `/siswa/exams/{examId}/status` harus return `session_id`:

```php
// Laravel example
public function getSessionStatus(Request $request, $examId) {
    $validated = $request->validate([
        'session_token' => 'required|string'
    ]);

    $session = ExamSession::where('token', $validated['session_token'])
        ->where('exam_id', $examId)
        ->first();

    return response()->json([
        'success' => true,
        'session_id' => $session->id,  // PENTING: Harus ada session_id
        'status' => $session->status,
        'remaining_time' => $session->remaining_time,
        // ... fields lainnya
    ]);
}
```

**Automatic Retry:**

- Jika `session_id` null saat exam start, sistem akan otomatis memanggil `getSessionStatus`
- Check console untuk log: `⚠️ Session ID is null, fetching from getSessionStatus...`

### Issue 2: Request berhasil tapi database tidak update

**Symptoms:**

- ✅ Log "Answer saved successfully"
- Network status 200
- Tapi database masih kosong

**Debug Steps:**

1. Check response dari backend: `{ success: true }`
2. Verify di backend log apakah data sampai
3. Check database connection di backend
4. Check query database di backend

**Solution:**

- Ini adalah backend issue, bukan frontend
- Check backend code untuk endpoint `/siswa/exam-session/update-answer`
- Pastikan query INSERT/UPDATE berjalan

### Issue 3: Error 404 - Endpoint not found

**Symptoms:**

```
❌ Update-answer failed
Error response: { status: 404 }
```

**Solution:**

- Endpoint `/siswa/exam-session/update-answer` belum dibuat di backend
- Check backend routes
- Pastikan endpoint match persis

**Backend harus buat endpoint:**

```php
// Laravel example
Route::post('/siswa/exam-session/update-answer', [ExamSessionController::class, 'updateAnswer']);
```

### Issue 4: Error 422 - Validation Error

**Symptoms:**

```
Error response: {
  status: 422,
  data: {
    message: "Validation failed",
    errors: { ... }
  }
}
```

**Solution:**

- Check backend validation rules
- Match dengan format yang dikirim frontend:
  - `session_id`: integer
  - `question_id`: integer
  - `answer`: string (max 10 chars for choice, 5000 for essay)
  - `type`: 'choice' atau 'essay'

### Issue 5: Error 401 - Unauthorized

**Symptoms:**

```
Error response: { status: 401 }
```

**Solution:**

- Token expired atau invalid
- Check: `localStorage.getItem('api_token')`
- Re-login mungkin diperlukan
- Check backend authentication middleware

---

## Backend Requirements Checklist

Pastikan backend Anda sudah memiliki:

### ✅ Endpoint

```
POST /siswa/exam-session/update-answer
```

### ✅ Request Validation

```php
// Laravel validation example
$request->validate([
    'session_id' => 'required|integer',
    'question_id' => 'required|integer',
    'answer' => 'required|string',
    'type' => 'required|in:choice,essay'
]);
```

### ✅ Database Table

Contoh struktur table yang dibutuhkan:

```sql
CREATE TABLE exam_session_answers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer TEXT,
    answer_type ENUM('choice', 'essay'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_session_question (session_id, question_id)
);
```

### ✅ Controller Logic

```php
// Pseudocode
public function updateAnswer(Request $request) {
    $validated = $request->validate([...]);

    // Upsert (insert or update)
    ExamSessionAnswer::updateOrCreate(
        [
            'session_id' => $validated['session_id'],
            'question_id' => $validated['question_id']
        ],
        [
            'answer' => $validated['answer'],
            'answer_type' => $validated['type']
        ]
    );

    return response()->json([
        'success' => true,
        'message' => 'Answer updated successfully'
    ]);
}
```

### ✅ Authentication

- Pastikan route dilindungi auth middleware
- Verify token di header `Authorization: Bearer {token}`

---

## Testing Steps

### 1. Test Manual di Postman

**Request:**

```
POST http://localhost:8000/api/siswa/exam-session/update-answer
```

**Headers:**

```
Authorization: Bearer {your_token}
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "session_id": 1,
  "question_id": 1,
  "answer": "A",
  "type": "choice"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Answer updated successfully"
}
```

### 2. Test di Frontend

1. Start exam
2. Open browser console
3. Select an answer
4. Wait 500ms (debounce)
5. Check console logs
6. Check Network tab
7. Check database

### 3. Verify Database

Query untuk check data:

```sql
SELECT * FROM exam_session_answers
WHERE session_id = 1
ORDER BY updated_at DESC;
```

---

## Quick Diagnostic Commands

Paste ini di browser console untuk quick check:

```javascript
// Check if auto-save is enabled
console.log("Session ID:", localStorage.getItem("session_id"));
console.log("Session Token:", localStorage.getItem("session_token"));
console.log("API Token:", localStorage.getItem("api_token"));

// Check Redux state (if Redux DevTools installed)
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  const state = window.store?.getState();
  console.log("Exam Session ID:", state?.exam?.sessionId);
  console.log("Session Status:", state?.exam?.sessionStatus);
  console.log("Is Exam Ended:", state?.exam?.isExamEnded);
  console.log("Answers Count:", Object.keys(state?.exam?.answers || {}).length);
}

// Force test save (replace values)
// Note: This assumes examService is imported globally
// examService.updateAnswer(1, 1, 'A', 'choice')
//   .then(r => console.log('Test save result:', r))
//   .catch(e => console.error('Test save error:', e));
```

---

## Contact & Support

Jika masih ada masalah:

1. **Copy semua console logs** (error messages)
2. **Screenshot Network tab** (request & response)
3. **Check backend logs**
4. **Verify database schema**

Kemungkinan besar masalah ada di **backend** jika:

- ✅ Console log shows "Answer saved successfully"
- ✅ Network tab shows status 200
- ❌ Database tidak ada data

Jika begitu, fokus debug di backend untuk endpoint `/siswa/exam-session/update-answer`.
