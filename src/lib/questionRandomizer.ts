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

// Fisher-Yates shuffle dengan seeded random
const shuffleArray = <T>(array: T[], rng: SeededRandom): T[] => {
     const shuffled = [...array];

     for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(rng.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
     }

     return shuffled;
};

// Interface untuk question randomizer result
export interface RandomizedQuestionResult {
     questions: ParsedQuestion[];
     originalToRandomizedMap: Map<number, number>; // original index -> randomized index
     randomizedToOriginalMap: Map<number, number>; // randomized index -> original index
     questionIdToRandomizedIndexMap: Map<number, number>; // question ID -> randomized index
     seed: number;
}

/**
 * Me-randomize soal berdasarkan user dan exam
 * @param questions - Array soal original
 * @param userId - ID pengguna untuk seed
 * @param examId - ID exam untuk seed
 * @returns Hasil randomized questions dengan mapping
 */
export const randomizeQuestions = (
     questions: ParsedQuestion[],
     userId: number,
     examId: number
): RandomizedQuestionResult => {
     if (!questions || questions.length === 0) {
          return {
               questions: [],
               originalToRandomizedMap: new Map(),
               randomizedToOriginalMap: new Map(),
               questionIdToRandomizedIndexMap: new Map(),
               seed: 0
          };
     }

     // Generate seed yang konsisten untuk user dan exam ini
     const seed = generateSeed(userId, examId);

     // Buat seeded random number generator
     const rng = new SeededRandom(seed);

     // Shuffle questions
     const shuffledQuestions = shuffleArray(questions, rng);

     // Buat mapping antara original dan randomized index
     const originalToRandomizedMap = new Map<number, number>();
     const randomizedToOriginalMap = new Map<number, number>();
     const questionIdToRandomizedIndexMap = new Map<number, number>();

     shuffledQuestions.forEach((question, randomizedIndex) => {
          const originalIndex = questions.findIndex(q => q.id === question.id);

          originalToRandomizedMap.set(originalIndex, randomizedIndex);
          randomizedToOriginalMap.set(randomizedIndex, originalIndex);
          questionIdToRandomizedIndexMap.set(question.id, randomizedIndex);
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
               JSON.stringify(Array.from(result.originalToRandomizedMap.entries())));
          localStorage.setItem(prefix + STORAGE_KEYS.RANDOMIZED_TO_ORIGINAL_MAP,
               JSON.stringify(Array.from(result.randomizedToOriginalMap.entries())));
          localStorage.setItem(prefix + STORAGE_KEYS.QUESTION_ID_TO_RANDOMIZED_MAP,
               JSON.stringify(Array.from(result.questionIdToRandomizedIndexMap.entries())));
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
          const originalToRandomizedArray = JSON.parse(originalToRandomizedStr);
          const randomizedToOriginalArray = JSON.parse(randomizedToOriginalStr);
          const questionIdToRandomizedArray = JSON.parse(questionIdToRandomizedStr);

          return {
               questions: [], // Will be populated by caller
               originalToRandomizedMap: new Map(originalToRandomizedArray),
               randomizedToOriginalMap: new Map(randomizedToOriginalArray),
               questionIdToRandomizedIndexMap: new Map(questionIdToRandomizedArray),
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
