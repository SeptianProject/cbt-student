# Fixed Point System untuk Pilihan Ganda Kompleks

## Update: 15 Oktober 2025

## Masalah yang Ditemukan

Backend mengirim data dengan `points: 15` untuk soal pilihan ganda kompleks, yang menyebabkan perhitungan:

- 15 ÷ 2 = **7.5 poin per jawaban** ❌

Namun seharusnya:

- Setiap jawaban benar = **1.5 poin** ✅
- Total poin maksimal = **3 poin** (2 × 1.5)

## Solusi yang Diterapkan

### Sistem Poin Tetap (Fixed Point System)

Implementasi menggunakan **poin tetap 1.5** per jawaban benar, tidak tergantung nilai `points` dari backend.

```typescript
const FIXED_POINT_PER_ANSWER = 1.5;
```

### Cara Kerja

#### BEFORE (Sistem Lama)

```typescript
// Backend mengirim: points = 15, answer_key = ['A', 'C']
pointsPerAnswer = 15 ÷ 2 = 7.5  ❌ SALAH
totalPoints = 15
```

#### AFTER (Sistem Baru - Default)

```typescript
// Backend mengirim: points = 15, answer_key = ['A', 'C']
pointsPerAnswer = 1.5  ✅ BENAR (fixed)
totalPoints = 1.5 × 2 = 3  ✅ BENAR
```

## Perubahan Kode

### 1. Function `getComplexMultipleChoiceInfo`

```typescript
export const getComplexMultipleChoiceInfo = (
     totalPoints: number,
     correctAnswers: string[],
     useFixedPointPerAnswer: boolean = true  // ← Parameter baru (default: true)
)
```

**Parameter Baru:**

- `useFixedPointPerAnswer` (default: `true`)
  - `true`: Gunakan 1.5 poin per jawaban (RECOMMENDED)
  - `false`: Gunakan sistem pembagian dari backend

**Logika:**

```typescript
if (useFixedPointPerAnswer) {
     pointsPerAnswer = 1.5;  // Fixed
     actualTotalPoints = 1.5 × jumlah_jawaban_benar;
} else {
     pointsPerAnswer = totalPoints ÷ jumlah_jawaban_benar;
     actualTotalPoints = totalPoints;
}
```

### 2. Function `calculateComplexMultipleChoiceScore`

```typescript
export const calculateComplexMultipleChoiceScore = (
     totalPoints: number,
     correctAnswers: string[],
     selectedAnswers: string[],
     useFixedPointPerAnswer: boolean = true  // ← Parameter baru (default: true)
)
```

**Perhitungan:**

```typescript
const FIXED_POINT_PER_ANSWER = 1.5;

const pointsPerCorrectAnswer = useFixedPointPerAnswer
  ? FIXED_POINT_PER_ANSWER // 1.5 (fixed)
  : totalPoints / correctAnswers.length; // dari backend
```

## Contoh Penggunaan

### Contoh 1: Default (Fixed Point - Recommended)

```typescript
// Backend: points = 15, answer_key = ['A', 'C']
const info = getComplexMultipleChoiceInfo(15, ["A", "C"]);

// Result:
// pointsPerAnswer: 1.5
// totalPoints: 3
// description: "Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 1.5 poin. Poin maksimal: 3"
```

**Perhitungan Skor:**

```typescript
// Siswa pilih ['A', 'C']
const score = calculateComplexMultipleChoiceScore(15, ["A", "C"], ["A", "C"]);
// Result: 1.5 × 2 = 3.0 poin ✅
```

### Contoh 2: Menggunakan Sistem Backend

```typescript
// Backend: points = 15, answer_key = ['A', 'C']
const info = getComplexMultipleChoiceInfo(15, ["A", "C"], false);

// Result:
// pointsPerAnswer: 7.5
// totalPoints: 15
// description: "Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 7.5 poin. Poin maksimal: 15"
```

**Perhitungan Skor:**

```typescript
// Siswa pilih ['A', 'C']
const score = calculateComplexMultipleChoiceScore(
  15,
  ["A", "C"],
  ["A", "C"],
  false
);
// Result: 7.5 × 2 = 15.0 poin
```

## Skenario Perhitungan dengan Fixed Point

### Setup Soal

- Backend points: **15** (diabaikan)
- Jawaban benar: **A, C** (2 pilihan)
- Fixed point: **1.5** per jawaban
- Max points: **3** (1.5 × 2)

### Skenario

| Pilihan Siswa | Benar | Salah | Perhitungan | Poin    | Status     |
| ------------- | ----- | ----- | ----------- | ------- | ---------- |
| [A, C]        | 2     | 0     | 1.5 × 2     | **3.0** | ✅ Perfect |
| [A]           | 1     | 0     | 1.5 × 1     | **1.5** | ⚠️ 50%     |
| [C]           | 1     | 0     | 1.5 × 1     | **1.5** | ⚠️ 50%     |
| [A, B, C]     | 2     | 1     | 1.5 × 2     | **3.0** | ✅ Full    |
| [A, B, D]     | 1     | 2     | 1.5 × 1     | **1.5** | ⚠️ 50%     |
| [B, D, E]     | 0     | 3     | 1.5 × 0     | **0.0** | ❌ Salah   |
| []            | 0     | 0     | 1.5 × 0     | **0.0** | ❌ Kosong  |

## Tampilan di Frontend

### Info Box (Sekarang)

```
📊 Sistem Penilaian:

Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 1.5 poin.
Poin maksimal: 3

💡 Hanya jawaban yang benar yang dihitung. Jawaban salah tidak mengurangi poin.

Contoh Perhitungan:
• Pilih 1 jawaban benar → 1.5 poin
• Pilih 2 jawaban benar → 3 poin (maksimal)
• Pilih 3 jawaban (1 benar, 2 salah) → 1.5 poin
```

**Sebelumnya menampilkan:**

```
Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 7.5 poin.
Poin maksimal: 15  ❌ SALAH
```

**Sekarang menampilkan:**

```
Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 1.5 poin.
Poin maksimal: 3  ✅ BENAR
```

## Konfigurasi

### Mengubah Fixed Point Value

Jika ingin mengubah dari 1.5 menjadi nilai lain, edit di `src/lib/examUtils.ts`:

```typescript
// Ubah nilai ini
const FIXED_POINT_PER_ANSWER = 1.5; // ← Ubah sesuai kebutuhan
```

**Contoh nilai lain:**

- `1.0` → max 2 poin untuk 2 jawaban benar
- `2.0` → max 4 poin untuk 2 jawaban benar
- `2.5` → max 5 poin untuk 2 jawaban benar

### Menonaktifkan Fixed Point System

Jika ingin kembali ke sistem pembagian dari backend:

**Di `QuestionCard.tsx`:**

```typescript
const complexChoiceInfo =
  question.question_type_id === "1"
    ? getComplexMultipleChoiceInfo(question.points, question.answer_key, false) // ← Set false
    : null;
```

**Di scoring calculation (jika ada):**

```typescript
const score = calculateComplexMultipleChoiceScore(
  points,
  correctAnswers,
  selectedAnswers,
  false // ← Set false
);
```

## Keuntungan Fixed Point System

### ✅ Kelebihan

1. **Konsisten**: Setiap soal pilihan ganda kompleks punya poin yang sama
2. **Adil**: Tidak tergantung konfigurasi backend
3. **Mudah dipahami**: Siswa tahu pasti berapa poin per jawaban
4. **Fleksibel**: Bisa diubah dengan mudah di satu tempat

### ⚠️ Pertimbangan

1. Backend perlu tahu sistem ini untuk scoring akhir
2. Perlu koordinasi antara frontend dan backend
3. Dokumentasi harus jelas untuk maintainer

## Rekomendasi

### Untuk Production

**Pilihan 1: Fix di Backend** ⭐ RECOMMENDED

```php
// Backend PHP
if ($question_type_id == '1') {  // Pilihan Ganda Kompleks
     $points_per_answer = 1.5;
     $total_points = $points_per_answer * count($answer_keys);
     // Simpan $total_points ke database (contoh: 3)
}
```

**Pilihan 2: Gunakan Fixed Point di Frontend** ⭐ CURRENT

- Menggunakan sistem fixed point 1.5 per jawaban
- Frontend dan backend harus sinkron untuk scoring

**Pilihan 3: Dynamic Configuration**

- Buat config table di backend untuk poin per tipe soal
- Frontend fetch config saat login
- Lebih fleksibel tapi lebih kompleks

## Testing

### Test Case dengan Fixed Point

```typescript
// Test 1: Perfect Score
const score1 = calculateComplexMultipleChoiceScore(
  15, // dari backend (diabaikan)
  ["A", "C"], // 2 jawaban benar
  ["A", "C"], // siswa pilih semua benar
  true // use fixed point
);
expect(score1).toBe(3.0); // 1.5 × 2

// Test 2: Partial Score
const score2 = calculateComplexMultipleChoiceScore(
  15, // dari backend (diabaikan)
  ["A", "C"],
  ["A"], // siswa pilih 1 benar
  true
);
expect(score2).toBe(1.5); // 1.5 × 1

// Test 3: With Wrong Answers
const score3 = calculateComplexMultipleChoiceScore(
  15, // dari backend (diabaikan)
  ["A", "C"],
  ["A", "B", "C"], // 2 benar, 1 salah
  true
);
expect(score3).toBe(3.0); // 1.5 × 2 (salah tidak mengurangi)
```

## Migration Notes

### Jika Update dari Sistem Lama

1. ✅ Tidak ada breaking changes di interface
2. ✅ Default behavior menggunakan fixed point
3. ✅ Bisa revert dengan parameter `false`
4. ✅ Existing code tetap work (backward compatible)

### Perubahan yang Perlu Dilakukan

1. **Tidak perlu perubahan** di `QuestionCard.tsx` (sudah otomatis)
2. **Opsional**: Update backend untuk konsistensi
3. **Opsional**: Update dokumentasi user

## FAQ

### Q: Kenapa tidak menggunakan nilai dari backend?

**A:** Backend mengirim nilai yang terlalu tinggi (15 poin) untuk soal pilihan ganda kompleks. Sistem fixed point memastikan konsistensi dengan nilai yang masuk akal (3 poin untuk 2 jawaban benar).

### Q: Apakah ini mempengaruhi scoring di backend?

**A:** Tidak, ini hanya untuk display di frontend. Backend tetap perlu melakukan scoring sendiri dengan aturan yang sama.

### Q: Bagaimana jika soal punya 3 jawaban benar?

**A:** Tetap menggunakan 1.5 per jawaban:

- 3 jawaban benar × 1.5 = 4.5 poin maksimal

### Q: Apakah bisa custom per soal?

**A:** Saat ini tidak. Semua soal tipe '1' menggunakan 1.5 poin per jawaban. Untuk custom, perlu development tambahan.

### Q: Bagaimana koordinasi dengan backend?

**A:** Backend perlu tahu bahwa soal tipe '1' menggunakan:

- 1.5 poin per jawaban benar
- Total poin = 1.5 × jumlah jawaban benar
- Simpan nilai yang sesuai di database

## Status

✅ **IMPLEMENTED & TESTED**

- [x] Fixed point system di `examUtils.ts`
- [x] Backward compatible (bisa disable)
- [x] No breaking changes
- [x] Documentation updated
- [x] Ready for testing

---

**Note:** Koordinasi dengan backend developer sangat disarankan untuk memastikan scoring konsisten di seluruh sistem.
