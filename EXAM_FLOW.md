# Exam Flow Documentation

## Flow Overview

### 1. Start Exam

**Endpoint**: `POST /api/siswa/exams/{examId}/start`

- **Response**: Mendapatkan `session_token` dan `session_id`
- **Storage**: Menyimpan ke localStorage untuk digunakan selama exam
- **Status**: Exam session berubah menjadi `progress`

### 2. Check Session Status

**Endpoint**: `POST /api/siswa/exams/{examId}/status`

- **Required**: `session_token`
- **Purpose**: Validasi apakah session masih valid dan statusnya `progress`
- **Usage**: Hook `useExamSession` melakukan periodic check setiap 30 detik

### 3. Auto-Save Answers

**Endpoint**: `POST /api/siswa/exam-session/update-answer`

- **Required Fields**:
  - `session_id`: Integer (dari localStorage)
  - `question_id`: Integer
  - `answer`: String (formatted based on type)
  - `type`: 'choice' | 'essay'
- **Trigger**: Setiap kali jawaban berubah (dengan debounce 1.5 detik)
- **Hook**: `useAutoSaveAnswer` menangani auto-save secara otomatis
- **Format Answer**:
  - Choice (single/multiple): String atau comma-separated string
  - Essay: String teks

### 4. Submit Exam

**Endpoint**: `POST /api/siswa/exams/{examId}/submit`

- **Required**: `session_token`
- **Optional**: `force_submit`, `final_submit`
- **Action**: Mengirim semua jawaban final dan mengakhiri session
- **Cleanup**: Menghapus `session_token` dan `session_id` dari localStorage

## Implementation Details

### Services (exam.ts)

- `examStart()`: Start exam dan simpan session_token + session_id
- `getSessionStatus()`: Check status session dengan session_token
- `updateAnswer()`: Auto-save individual answer ke backend
- `submitExam()`: Final submit dengan semua jawaban

### Store (examSlice.ts)

- Menyimpan `sessionId`, `sessionToken`, dan `sessionStatus`
- Update status menjadi `progress` saat exam dimulai
- Update status menjadi `submitted` saat exam selesai

### Hooks

- `useAutoSaveAnswer`: Auto-save setiap perubahan jawaban (debounced)
- `useExamSession`: Monitor session status secara periodik
- `useExamLogic`: Main hook untuk exam logic

## Answer Storage Strategy

### Local State (Redux)

- Jawaban disimpan di Redux store untuk UI reactivity
- Format: `Record<number, StudentAnswer>`

### Backend Sync (Auto-Save)

- Setiap jawaban otomatis disimpan ke backend via `update-answer` endpoint
- Debounce 1.5 detik untuk menghindari terlalu banyak request
- Hanya menyimpan jawaban yang berubah

### Final Submit

- Mengirim semua jawaban yang sudah di-compile
- Backend akan menggunakan jawaban terakhir yang tersimpan
- Auto-save memastikan tidak ada data hilang jika koneksi terputus

## Session Management

### Session Token

- Didapat dari start exam
- Disimpan di localStorage
- Required untuk semua operasi exam

### Session Status

- `progress`: Exam sedang berlangsung
- `submitted`: Exam sudah selesai di-submit
- `expired`: Session sudah expired
- `cancelled`: Session dibatalkan

### Session Validation

- Check status setiap 30 detik via `useExamSession`
- Validasi sebelum submit
- Handle expired session dengan proper error message

## Error Handling

### Session Expired

- Periodic check mendeteksi session expired
- User diarahkan ke dashboard
- Data lokal dibersihkan

### Network Error

- Auto-save retry mechanism (handled by browser)
- Final submit dengan error handling
- User dapat retry submit

### Active Session Conflict

- Detect existing active session
- Auto-clear dan retry start exam
- Prevent multiple active sessions

## Best Practices Implemented

1. **Debounced Auto-Save**: Mencegah spam request ke backend
2. **Session Validation**: Regular check untuk memastikan session valid
3. **Error Recovery**: Graceful handling untuk berbagai error scenario
4. **Data Persistence**: Auto-save memastikan tidak ada jawaban hilang
5. **Cleanup**: Proper cleanup session data setelah exam selesai
6. **Type Safety**: Strong typing untuk semua data structures
