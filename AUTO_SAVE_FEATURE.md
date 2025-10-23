# Auto-Save Feature Documentation

## Overview

Fitur auto-save ini secara otomatis menyimpan jawaban siswa ke database setiap kali mereka memilih atau mengubah jawaban. Ini memastikan bahwa data selalu up-to-date dan dapat di-restore jika terjadi masalah selama ujian.

## Cara Kerja

### 1. **Real-time Answer Saving**

Setiap kali siswa memilih jawaban:

- Jawaban akan di-debounce selama **500ms** untuk menghindari terlalu banyak request
- Request POST dikirim ke endpoint `/siswa/exam-session/update-answer`
- Database di-update secara real-time

### 2. **Visual Feedback**

Siswa akan melihat status saving di header exam:

- 🔄 **"Menyimpan jawaban..."** - Sedang menyimpan
- ✅ **"Tersimpan pada HH:MM:SS"** - Berhasil disimpan
- ❌ **"Gagal menyimpan: [error]"** - Gagal menyimpan

### 3. **Endpoint yang Digunakan**

```
POST /siswa/exam-session/update-answer
```

**Request Body:**

```json
{
  "session_id": 123,
  "question_id": 45,
  "answer": "A" // atau "A,B,C" untuk multiple choice complex, atau text untuk essay
  "type": "choice" // atau "essay"
}
```

**Headers:**

```
Authorization: Bearer {api_token}
```

## Komponen yang Dimodifikasi

### 1. **useAutoSaveAnswer Hook**

Location: `src/hooks/useAutoSaveAnswer.ts`

**Fitur:**

- Debounce 500ms untuk performa optimal
- Track multiple questions yang sedang di-save
- Return status: `isSaving`, `lastSavedTime`, `saveError`
- Automatic retry bisa ditambahkan jika diperlukan

**Usage:**

```typescript
const { isSaving, lastSavedTime, saveError } = useAutoSaveAnswer({
  sessionId,
  answers,
  questions,
  enabled: sessionStatus === "progress" && !isExamEnded,
  debounceMs: 500,
});
```

### 2. **SaveStatusIndicator Component**

Location: `src/components/exam/SaveStatusIndicator.tsx`

**Fitur:**

- Tampilan visual status saving
- 3 state: saving, success, error
- Format waktu HH:MM:SS

**Props:**

```typescript
interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSavedTime: Date | null;
  saveError: string | null;
}
```

### 3. **ExamProgressHeader Component**

Location: `src/components/exam/ExamProgressHeader.tsx`

**Perubahan:**

- Menambahkan props untuk save status
- Menampilkan SaveStatusIndicator di header

### 4. **useExamLogic Hook**

Location: `src/hooks/useExamLogic.ts`

**Perubahan:**

- Mengintegrasikan useAutoSaveAnswer
- Return save status ke component

### 5. **ExamService**

Location: `src/services/exam.ts`

**Method yang Digunakan:**

```typescript
updateAnswer: async (
  sessionId: number,
  questionId: number,
  answer: string | string[],
  type: 'choice' | 'essay'
) => { ... }
```

## Flow Diagram

```
User Action (Select Answer)
    ↓
handleAnswerChange (useExamLogic)
    ↓
dispatch(setAnswers) (Redux)
    ↓
useAutoSaveAnswer detects change
    ↓
Debounce 500ms
    ↓
examService.updateAnswer()
    ↓
POST /siswa/exam-session/update-answer
    ↓
Backend updates database
    ↓
Status updated in UI
```

## Keunggulan Fitur

### 1. **Data Safety**

- Jawaban tersimpan real-time di database
- Tidak bergantung pada final submit saja
- Backup otomatis setiap jawaban

### 2. **Recovery Support**

- Jika browser crash, data sudah tersimpan
- Jika koneksi terputus sementara, bisa retry
- Session dapat di-restore dari database

### 3. **User Experience**

- Visual feedback yang jelas
- Tidak mengganggu flow ujian
- Performance optimal dengan debouncing

### 4. **Error Handling**

- Tampilkan error jika gagal save
- Log detail untuk debugging
- Support untuk retry mechanism

## Konfigurasi

### Debounce Time

Adjust di `useExamLogic.ts`:

```typescript
debounceMs: 500; // 500ms (default)
```

**Rekomendasi:**

- 300-500ms untuk ujian normal
- 1000ms+ jika ada keterbatasan bandwidth

### Retry Logic (Optional)

Tambahkan di `useAutoSaveAnswer.ts`:

```typescript
catch (error) {
  console.error('✗ Failed to save answer:', error);
  setSaveError(errorMessage);

  // Retry after 2 seconds
  setTimeout(() => saveAnswer(questionId, answer), 2000);
}
```

## Testing Checklist

- [ ] Jawaban multiple choice tersimpan
- [ ] Jawaban multiple choice complex tersimpan
- [ ] Jawaban true/false tersimpan
- [ ] Jawaban essay tersimpan
- [ ] Visual feedback tampil saat saving
- [ ] Visual feedback tampil saat berhasil
- [ ] Visual feedback tampil saat error
- [ ] Debouncing bekerja dengan baik
- [ ] Tidak ada duplicate request
- [ ] Session token valid
- [ ] Error handling bekerja

## Monitoring & Debugging

### Console Logs

```javascript
// Success
✓ Answer saved successfully: {
  questionId: 45,
  type: 'choice',
  time: '2025-10-21T10:30:45.000Z'
}

// Saving
Saving answer: {
  questionId: 45,
  type: 'choice',
  answer: 'A'
}

// Skip (already saving)
Already saving question 45, skipping...
```

### Network Tab

Monitor request ke:

```
POST /api/siswa/exam-session/update-answer
```

Check response status:

- 200: Success
- 401: Unauthorized (token issue)
- 422: Validation error
- 500: Server error

## Backend Requirements

Backend harus menyediakan endpoint:

```php
POST /siswa/exam-session/update-answer

Request:
{
  "session_id": integer,
  "question_id": integer,
  "answer": string (max 10 chars for choice, max 5000 for essay),
  "type": "choice" | "essay"
}

Response:
{
  "success": true,
  "message": "Answer updated successfully"
}
```

## Future Enhancements

1. **Offline Support**

   - Queue answers saat offline
   - Auto-sync saat online kembali

2. **Batch Saving**

   - Save multiple answers dalam satu request
   - Reduce network overhead

3. **Progress Indicator**

   - Show percentage of auto-saved questions
   - Notification untuk questions yang belum tersave

4. **Analytics**
   - Track save success rate
   - Monitor average save time
   - Alert jika banyak failures

## Troubleshooting

### Issue: Jawaban tidak tersimpan

**Solution:**

1. Check session token di localStorage
2. Verify sessionId tidak null
3. Check network tab untuk error response
4. Pastikan backend endpoint aktif

### Issue: Too many requests

**Solution:**

1. Increase debounceMs (misal 1000ms)
2. Check tidak ada multiple instances hook
3. Verify useEffect dependencies correct

### Issue: Visual feedback tidak muncul

**Solution:**

1. Check props passed ke ExamProgressHeader
2. Verify SaveStatusIndicator imported
3. Check CSS/Tailwind classes loaded

## Contact & Support

Jika ada pertanyaan atau issue, hubungi:

- Developer: [Your Name]
- Repository: [Your Repo URL]
- Documentation: [This file]
