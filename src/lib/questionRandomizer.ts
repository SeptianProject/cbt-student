import { ParsedQuestion } from '@/types';

/**
 * Utility untuk me-randomize soal ujian
 */

// Generate seed berdasarkan user ID dan exam ID untuk konsistensi
const generateSeed = (userId: number, examId: number): number => {
     // Kombinasikan user ID dan exam ID untuk membuat seed yang unik
     return userId * 1000 + examId;
};

// Simple seeded random number generator (Linear Congruential Generator)
class SeededRandom {
     private seed: number;

     constructor(seed: number) {
          this.seed = seed % 2147483647;
          if (this.seed <= 0) this.seed += 2147483646;
     }

     next(): number {
          this.seed = (this.seed * 16807) % 2147483647;
          return this.seed;
     }

     random(): number {
          return (this.next() - 1) / 2147483646;
     }
}

/**
 * Fisher-Yates shuffle algorithm dengan seeded random untuk konsistensi
 * @param array - Array yang akan di-shuffle
 * @param rng - Seeded random number generator
 * @returns Array yang sudah di-shuffle dengan seed yang konsisten
 */
const seededShuffle = <T>(array: T[], rng: SeededRandom): T[] => {
     const shuffled = [...array];

     for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rng.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }

     return shuffled;
};

/**
 * Helper untuk grouping questions berdasarkan tipe
 * Soal essay (type "3") dipisahkan untuk diletakkan di akhir
 */
const groupQuestionsByType = (questions: ParsedQuestion[]) => {
     const essayType = "3";

     const nonEssayQuestions: ParsedQuestion[] = [];
     const essayQuestions: ParsedQuestion[] = [];

     questions.forEach(question => {
          if (question.question_type_id === essayType) {
               essayQuestions.push(question);
          } else {
               nonEssayQuestions.push(question);
          }
     });

     return { nonEssayQuestions, essayQuestions };
};

// Interface untuk question randomizer result
export interface RandomizedQuestionResult {
     questions: ParsedQuestion[];
     originalToRandomizedMap: Record<number, number>; // original index -> randomized index
     randomizedToOriginalMap: Record<number, number>; // randomized index -> original index
     questionIdToRandomizedIndexMap: Record<number, number>; // question ID -> randomized index
     seed: number;
}

/**
 * Me-randomize soal berdasarkan user dan exam dengan strategi grouping by type
 * 
 * Strategi Randomization:
 * 1. Pisahkan soal menjadi 2 grup: Non-Essay dan Essay
 * 2. Shuffle masing-masing grup dengan seed yang berbeda (tapi tetap deterministik)
 * 3. Gabungkan hasil: Non-Essay questions dulu, Essay questions di akhir
 * 4. Pertahankan mapping index untuk session recovery
 * 
 * Benefits:
 * - UX lebih baik: Siswa bisa fokus soal objektif dulu, essay belakangan
 * - Time management: Alokasi waktu lebih mudah
 * - Tetap fair: Randomization tetap konsisten per user+exam
 * 
 * @param questions - Array soal original
 * @param userId - ID pengguna untuk seed
 * @param examId - ID exam untuk seed
 * @returns Hasil randomized questions dengan mapping dan metadata
 */
export const randomizeQuestions = (
     questions: ParsedQuestion[],
     userId: number,
     examId: number
): RandomizedQuestionResult => {
     if (!questions || questions.length === 0) {
          return {
               questions: [],
               originalToRandomizedMap: {},
               randomizedToOriginalMap: {},
               questionIdToRandomizedIndexMap: {},
               seed: 0
          };
     }

     // Generate seed yang konsisten untuk user dan exam ini
     const seed = generateSeed(userId, examId);

     // Group questions by type (non-essay vs essay)
     const { nonEssayQuestions, essayQuestions } = groupQuestionsByType(questions);

     // Shuffle each group with different seed offsets for variety
     // tapi tetap deterministik karena seed base-nya sama
     const rngNonEssay = new SeededRandom(seed);
     const rngEssay = new SeededRandom(seed + 999999); // Offset besar untuk avoid collision

     const shuffledNonEssay = seededShuffle(nonEssayQuestions, rngNonEssay);
     const shuffledEssay = seededShuffle(essayQuestions, rngEssay);

     // Gabungkan: non-essay dulu, essay belakangan
     const shuffledQuestions = [...shuffledNonEssay, ...shuffledEssay];

     // Buat mapping antara original dan randomized index
     const originalToRandomizedMap: Record<number, number> = {};
     const randomizedToOriginalMap: Record<number, number> = {};
     const questionIdToRandomizedIndexMap: Record<number, number> = {};

     shuffledQuestions.forEach((question, randomizedIndex) => {
          const originalIndex = questions.findIndex(q => q.id === question.id);

          originalToRandomizedMap[originalIndex] = randomizedIndex;
          randomizedToOriginalMap[randomizedIndex] = originalIndex;
          questionIdToRandomizedIndexMap[question.id] = randomizedIndex;
     });

     return {
          questions: shuffledQuestions,
          originalToRandomizedMap,
          randomizedToOriginalMap,
          questionIdToRandomizedIndexMap,
          seed
     };
};





/**
 * Storage keys untuk menyimpan randomization data
 */
export const STORAGE_KEYS = {
     RANDOMIZATION_SEED: 'exam_randomization_seed',
     ORIGINAL_TO_RANDOMIZED_MAP: 'exam_original_to_randomized_map',
     RANDOMIZED_TO_ORIGINAL_MAP: 'exam_randomized_to_original_map',
     QUESTION_ID_TO_RANDOMIZED_MAP: 'exam_question_id_to_randomized_map',
} as const;

/**
 * Save randomization data ke localStorage
 */
export const saveRandomizationData = (result: RandomizedQuestionResult, examId: number): void => {
     try {
          const prefix = `exam_${examId}_`;

          localStorage.setItem(prefix + STORAGE_KEYS.RANDOMIZATION_SEED, result.seed.toString());
          localStorage.setItem(prefix + STORAGE_KEYS.ORIGINAL_TO_RANDOMIZED_MAP,
               JSON.stringify(result.originalToRandomizedMap));
          localStorage.setItem(prefix + STORAGE_KEYS.RANDOMIZED_TO_ORIGINAL_MAP,
               JSON.stringify(result.randomizedToOriginalMap));
          localStorage.setItem(prefix + STORAGE_KEYS.QUESTION_ID_TO_RANDOMIZED_MAP,
               JSON.stringify(result.questionIdToRandomizedIndexMap));
     } catch {
          // Silently fail - randomization will be recreated if needed
     }
};

/**
 * Load randomization data dari localStorage
 */
export const loadRandomizationData = (examId: number): RandomizedQuestionResult | null => {
     try {
          const prefix = `exam_${examId}_`;

          const seedStr = localStorage.getItem(prefix + STORAGE_KEYS.RANDOMIZATION_SEED);
          const originalToRandomizedStr = localStorage.getItem(prefix + STORAGE_KEYS.ORIGINAL_TO_RANDOMIZED_MAP);
          const randomizedToOriginalStr = localStorage.getItem(prefix + STORAGE_KEYS.RANDOMIZED_TO_ORIGINAL_MAP);
          const questionIdToRandomizedStr = localStorage.getItem(prefix + STORAGE_KEYS.QUESTION_ID_TO_RANDOMIZED_MAP);

          if (!seedStr || !originalToRandomizedStr || !randomizedToOriginalStr || !questionIdToRandomizedStr) {
               return null;
          }

          const seed = parseInt(seedStr, 10);
          const originalToRandomizedMap = JSON.parse(originalToRandomizedStr);
          const randomizedToOriginalMap = JSON.parse(randomizedToOriginalStr);
          const questionIdToRandomizedIndexMap = JSON.parse(questionIdToRandomizedStr);

          return {
               questions: [], // Will be populated by caller
               originalToRandomizedMap,
               randomizedToOriginalMap,
               questionIdToRandomizedIndexMap,
               seed
          };
     } catch {
          return null;
     }
};

/**
 * Clear randomization data untuk exam tertentu
 */
export const clearRandomizationData = (examId: number): void => {
     try {
          const prefix = `exam_${examId}_`;

          localStorage.removeItem(prefix + STORAGE_KEYS.RANDOMIZATION_SEED);
          localStorage.removeItem(prefix + STORAGE_KEYS.ORIGINAL_TO_RANDOMIZED_MAP);
          localStorage.removeItem(prefix + STORAGE_KEYS.RANDOMIZED_TO_ORIGINAL_MAP);
          localStorage.removeItem(prefix + STORAGE_KEYS.QUESTION_ID_TO_RANDOMIZED_MAP);
     } catch {
          // Silently fail
     }
};
