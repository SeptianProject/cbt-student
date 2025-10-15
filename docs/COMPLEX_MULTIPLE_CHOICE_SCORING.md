# Sistem Penilaian Pilihan Ganda Kompleks

## Overview

Dokumen ini menjelaskan sistem penilaian untuk soal tipe **Pilihan Ganda Kompleks (Type '1')** yang menggunakan checkbox dan memungkinkan siswa memilih lebih dari satu jawaban.

## Karakteristik Soal

- **Jumlah Pilihan**: 5-6 opsi jawaban (A, B, C, D, E, F)
- **Jawaban Benar**: Biasanya 2 pilihan
- **Poin Maksimal**: 3 poin (dapat disesuaikan per soal)
- **Input Type**: Checkbox (multi-select)

## Formula Penilaian

### Formula Dasar

```
Poin per jawaban benar = Total Poin ÷ Jumlah Jawaban Benar
Poin siswa = Poin per jawaban benar × Jumlah jawaban benar yang dipilih
```

### Contoh dengan 3 Poin Maksimal

**Setup Soal:**

- Total poin: 3
- Jawaban benar: 2 (A dan C)
- Poin per jawaban benar: 3 ÷ 2 = **1.5 poin**

## Skenario Perhitungan

### Skenario 1: Jawaban Sempurna ✅

**Pilihan Siswa:** [A, C]

- Jawaban benar dipilih: 2 (A dan C)
- Jawaban salah dipilih: 0
- **Perhitungan:** 1.5 × 2 = **3.0 poin**
- **Status:** Sempurna! 🎉

### Skenario 2: Sebagian Benar (1 dari 2) ✅

**Pilihan Siswa:** [A]

- Jawaban benar dipilih: 1 (A)
- Jawaban salah dipilih: 0
- **Perhitungan:** 1.5 × 1 = **1.5 poin**
- **Status:** 50% benar

### Skenario 3: Sebagian Benar dengan Jawaban Salah ✅

**Pilihan Siswa:** [A, B, C]

- Jawaban benar dipilih: 2 (A dan C)
- Jawaban salah dipilih: 1 (B) → **tidak mengurangi poin!**
- **Perhitungan:** 1.5 × 2 = **3.0 poin**
- **Status:** Dapat poin penuh karena semua jawaban benar dipilih

### Skenario 4: Satu Benar, Dua Salah ⚠️

**Pilihan Siswa:** [A, B, D]

- Jawaban benar dipilih: 1 (A)
- Jawaban salah dipilih: 2 (B, D) → **tidak mengurangi poin!**
- **Perhitungan:** 1.5 × 1 = **1.5 poin**
- **Status:** 50% benar

### Skenario 5: Semua Salah ❌

**Pilihan Siswa:** [B, D, E]

- Jawaban benar dipilih: 0
- Jawaban salah dipilih: 3
- **Perhitungan:** 1.5 × 0 = **0 poin**
- **Status:** Tidak ada jawaban benar

### Skenario 6: Tidak Menjawab ❌

**Pilihan Siswa:** []

- Jawaban benar dipilih: 0
- **Perhitungan:** 1.5 × 0 = **0 poin**
- **Status:** Tidak dijawab

## Prinsip Penting

### ✅ Poin Positif Saja

- **Hanya jawaban BENAR yang dihitung**
- Jawaban salah **TIDAK mengurangi poin**
- Sistem ini mendorong siswa untuk mencoba

### 🎯 Strategi Siswa

**Strategi Optimal:**

- Pilih semua jawaban yang yakin benar
- Boleh pilih lebih dari jumlah jawaban benar (tidak ada penalti)
- Lebih baik pilih daripada tidak (asalkan yakin)

**Tidak Disarankan:**

- Menebak semua pilihan (tidak ada keuntungan)
- Tidak menjawab sama sekali (pasti 0)

## Implementasi di Code

### 1. Function Perhitungan

```typescript
// File: src/lib/examUtils.ts

export const calculateComplexMultipleChoiceScore = (
  totalPoints: number,
  correctAnswers: string[],
  selectedAnswers: string[]
): number => {
  if (!correctAnswers || correctAnswers.length === 0) {
    return 0;
  }

  // Hitung poin per jawaban benar
  const pointsPerCorrectAnswer = totalPoints / correctAnswers.length;

  // Hitung berapa jawaban benar yang dipilih
  const correctSelectedCount = selectedAnswers.filter((answer) =>
    correctAnswers.includes(answer)
  ).length;

  // Kalikan poin per jawaban dengan jumlah benar
  const score = pointsPerCorrectAnswer * correctSelectedCount;

  return Math.round(score * 100) / 100; // Bulatkan 2 desimal
};
```

### 2. Contoh Penggunaan

```typescript
// Contoh Soal
const question = {
  id: 1,
  question_type_id: "1", // Pilihan Ganda Kompleks
  points: 3,
  answer_key: ["A", "C"], // Jawaban benar
  choices: {
    A: "Python",
    B: "HTML",
    C: "JavaScript",
    D: "CSS",
    E: "XML",
  },
};

// Jawaban siswa
const studentAnswer = ["A", "B", "C"];

// Hitung skor
const score = calculateComplexMultipleChoiceScore(
  3, // totalPoints
  ["A", "C"], // correctAnswers
  ["A", "B", "C"] // selectedAnswers
);

console.log(score); // Output: 3.0
// Karena A dan C dipilih (2 benar), meskipun B juga dipilih (1 salah)
```

### 3. Info untuk Siswa

```typescript
// File: src/lib/examUtils.ts

export const getComplexMultipleChoiceInfo = (
  totalPoints: number,
  correctAnswers: string[]
) => {
  const pointsPerAnswer = totalPoints / correctAnswers.length;
  const totalCorrectAnswers = correctAnswers.length;

  return {
    totalPoints,
    correctAnswersCount: totalCorrectAnswers,
    pointsPerAnswer,
    description: `Terdapat ${totalCorrectAnswers} jawaban benar. Setiap jawaban benar bernilai ${pointsPerAnswer} poin. Poin maksimal: ${totalPoints}`,
    scoringNote: `Hanya jawaban yang benar yang dihitung. Jawaban salah tidak mengurangi poin.`,
  };
};
```

## UI/UX Implementation

### Info Box yang Ditampilkan

```
📊 Sistem Penilaian:
Terdapat 2 jawaban benar. Setiap jawaban benar bernilai 1.5 poin.
Poin maksimal: 3

💡 Hanya jawaban yang benar yang dihitung. Jawaban salah tidak
mengurangi poin.

Contoh Perhitungan:
• Pilih 1 jawaban benar → 1.5 poin
• Pilih 2 jawaban benar → 3 poin (maksimal)
• Pilih 3 jawaban (1 benar, 2 salah) → 1.5 poin
```

### Summary Box Setelah Memilih

```
✓ Jawaban yang dipilih:
[A] [C] [B]

Total pilihan: 3
Poin per jawaban benar: 1.5
```

## Testing Scenarios

### Test Case 1: Perfect Score

```typescript
Input:
- totalPoints: 3
- correctAnswers: ['A', 'C']
- selectedAnswers: ['A', 'C']

Expected Output: 3.0
Status: ✅ PASS
```

### Test Case 2: Partial Correct

```typescript
Input:
- totalPoints: 3
- correctAnswers: ['A', 'C']
- selectedAnswers: ['A']

Expected Output: 1.5
Status: ✅ PASS
```

### Test Case 3: All Correct + Wrong Answers

```typescript
Input:
- totalPoints: 3
- correctAnswers: ['A', 'C']
- selectedAnswers: ['A', 'B', 'C', 'D']

Expected Output: 3.0
Status: ✅ PASS
```

### Test Case 4: No Correct Answers

```typescript
Input:
- totalPoints: 3
- correctAnswers: ['A', 'C']
- selectedAnswers: ['B', 'D', 'E']

Expected Output: 0
Status: ✅ PASS
```

### Test Case 5: Empty Selection

```typescript
Input:
- totalPoints: 3
- correctAnswers: ['A', 'C']
- selectedAnswers: []

Expected Output: 0
Status: ✅ PASS
```

## Variasi Poin

### Soal dengan 5 Poin

- Jawaban benar: 2
- Poin per jawaban: 5 ÷ 2 = **2.5 poin**
- Pilih 1 benar → 2.5 poin
- Pilih 2 benar → 5.0 poin

### Soal dengan 4 Poin

- Jawaban benar: 2
- Poin per jawaban: 4 ÷ 2 = **2.0 poin**
- Pilih 1 benar → 2.0 poin
- Pilih 2 benar → 4.0 poin

### Soal dengan 3 Jawaban Benar

- Total poin: 3
- Jawaban benar: 3
- Poin per jawaban: 3 ÷ 3 = **1.0 poin**
- Pilih 1 benar → 1.0 poin
- Pilih 2 benar → 2.0 poin
- Pilih 3 benar → 3.0 poin

## FAQ

### Q: Apakah jawaban salah mengurangi poin?

**A:** Tidak! Hanya jawaban benar yang dihitung. Jawaban salah tidak mengurangi poin.

### Q: Bolehkah memilih semua pilihan?

**A:** Boleh, tapi tidak ada keuntungan. Poin hanya dihitung dari jawaban benar.

### Q: Bagaimana jika pilih 1 benar dan 5 salah?

**A:** Tetap dapat poin untuk 1 jawaban benar tersebut. Salah tidak mengurangi.

### Q: Apakah ada strategi terbaik?

**A:** Pilih semua jawaban yang yakin benar. Tidak ada penalti untuk jawaban salah.

### Q: Bagaimana dengan pembulatan?

**A:** Poin dibulatkan ke 2 desimal. Contoh: 1.666... → 1.67

## Kesimpulan

Sistem penilaian ini dirancang untuk:

- ✅ Memberikan poin hanya untuk jawaban benar
- ✅ Tidak memberikan penalti untuk jawaban salah
- ✅ Mendorong siswa untuk mencoba
- ✅ Adil dan transparan
- ✅ Mudah dipahami

**Prinsip Utama:** Semakin banyak jawaban benar yang dipilih, semakin tinggi poin yang didapat!
