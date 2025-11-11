import { Question, ParsedQuestion, StudentAnswer, AssignedExam } from '@/types';

// Helper function to safely parse JSON with fallbacks
const safeJSONParse = (value: unknown, fallback: unknown = null) => {
     if (typeof value === 'string') {
          try {
               return JSON.parse(value);
          } catch {
               return fallback;
          }
     }
     return value || fallback;
};

// Helper function to parse choices from various formats
const parseChoices = (choices: unknown): Record<string, string> => {
     // If already an object (not array), return as is
     if (typeof choices === 'object' && choices !== null && !Array.isArray(choices)) {
          return choices as Record<string, string>;
     }

     // If string, try to parse as JSON first
     if (typeof choices === 'string') {
          const parsed = safeJSONParse(choices);

          // ✅ Handle array format from API: ["Option A", "Option B", "Option C", "Option D"]
          if (Array.isArray(parsed)) {
               const result: Record<string, string> = {};
               parsed.forEach((item, index) => {
                    const key = String.fromCharCode(65 + index); // A, B, C, D...
                    result[key] = String(item);
               });
               return result;
          }

          // Handle object format: {"A": "Option A", "B": "Option B"}
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
               return parsed;
          }

          // Try to parse as simple text format
          const trimmed = choices.trim();
          if (trimmed) {
               // Handle formats like "A. Option 1, B. Option 2" or "A) Option 1| B) Option 2"
               const patterns = [
                    /([A-Z])[.)]\s*([^,|;]+)/gi, // "A. Option 1, B. Option 2"
                    /([A-Z])\s*[:-]\s*([^,|;]+)/gi, // "A: Option 1, B: Option 2"
                    /([A-Z])\s+([^,|;]+)/gi, // "A Option 1, B Option 2"
               ];

               for (const pattern of patterns) {
                    const matches = [...trimmed.matchAll(pattern)];
                    if (matches.length > 0) {
                         const result: Record<string, string> = {};
                         matches.forEach(match => {
                              result[match[1].toUpperCase()] = match[2].trim();
                         });
                         if (Object.keys(result).length > 0) {
                              return result;
                         }
                    }
               }

               // If no pattern matches, split by common delimiters and assign A, B, C...
               const items = trimmed.split(/[,|;]/).map(item => item.trim()).filter(item => item);
               if (items.length > 0) {
                    const result: Record<string, string> = {};
                    items.forEach((item, index) => {
                         const key = String.fromCharCode(65 + index); // A, B, C, D...
                         result[key] = item;
                    });
                    return result;
               }

               // Last resort: single option
               return { 'A': trimmed };
          }
     }

     // ✅ Handle direct array format (not stringified)
     if (Array.isArray(choices)) {
          const result: Record<string, string> = {};
          choices.forEach((item, index) => {
               const key = String.fromCharCode(65 + index); // A, B, C, D...
               result[key] = String(item);
          });
          return result;
     }

     return {};
};

// Helper function to parse choices images from various formats
// ✅ Convert array format to object with letter keys: ["path1.png", "path2.png"] -> {"A": "path1.png", "B": "path2.png"}
const parseChoicesImages = (choicesImages: unknown): Record<string, string | null> | null => {
     if (!choicesImages) return null;

     // If already an object (not array), return as is
     if (typeof choicesImages === 'object' && choicesImages !== null && !Array.isArray(choicesImages)) {
          return choicesImages as Record<string, string | null>;
     }

     // If string, try to parse as JSON first
     if (typeof choicesImages === 'string') {
          const parsed = safeJSONParse(choicesImages);

          // ✅ Handle array format from API: ["path1.png", "path2.png", null, "path4.png"]
          if (Array.isArray(parsed)) {
               const result: Record<string, string | null> = {};
               parsed.forEach((item, index) => {
                    const key = String.fromCharCode(65 + index); // A, B, C, D...
                    result[key] = item ? String(item) : null;
               });
               return result;
          }

          // Handle object format: {"A": "path1.png", "B": null}
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
               return parsed;
          }
     }

     // ✅ Handle direct array format (not stringified)
     if (Array.isArray(choicesImages)) {
          const result: Record<string, string | null> = {};
          choicesImages.forEach((item, index) => {
               const key = String.fromCharCode(65 + index); // A, B, C, D...
               result[key] = item ? String(item) : null;
          });
          return result;
     }

     return null;
};

// Helper function to parse answer keys from various formats
// ✅ Mendukung format baru dari backend: '[0]', '[1,2]', dll (index numerik dalam JSON array)
// ✅ Konversi index numerik ke huruf: [0] -> ["A"], [1, 2] -> ["B", "C"]
const parseAnswerKey = (answerKey: unknown): string[] => {
     // If already an array, convert all elements to string
     if (Array.isArray(answerKey)) {
          return answerKey.map(item => {
               const val = String(item);
               // ✅ Convert numeric index to letter: "0" -> "A", "1" -> "B", etc.
               if (/^\d+$/.test(val)) {
                    const numIndex = parseInt(val);
                    return String.fromCharCode(65 + numIndex);
               }
               return val;
          });
     }

     // If string, try to parse as JSON first
     if (typeof answerKey === 'string') {
          const parsed = safeJSONParse(answerKey);
          if (Array.isArray(parsed)) {
               // ✅ Convert parsed array items, handling numeric indices
               return parsed.map(item => {
                    const val = String(item);
                    // ✅ Convert numeric index to letter: "0" -> "A", "1" -> "B", etc.
                    if (/^\d+$/.test(val)) {
                         const numIndex = parseInt(val);
                         return String.fromCharCode(65 + numIndex);
                    }
                    return val;
               });
          }

          // Parse as comma/pipe/semicolon separated values
          const trimmed = answerKey.trim();
          if (trimmed) {
               const items = trimmed.split(/[,|;]/).map(item => item.trim()).filter(item => item);
               return items.length > 0 ? items.map(item => {
                    // ✅ Convert numeric index to letter
                    if (/^\d+$/.test(item)) {
                         const numIndex = parseInt(item);
                         return String.fromCharCode(65 + numIndex);
                    }
                    return item;
               }) : [trimmed];
          }
     }

     // For other types, convert to string and check if numeric
     if (answerKey !== null && answerKey !== undefined) {
          const val = String(answerKey);
          // ✅ Convert numeric index to letter
          if (/^\d+$/.test(val)) {
               const numIndex = parseInt(val);
               return [String.fromCharCode(65 + numIndex)];
          }
          return [val];
     }

     return [];
};

export const parseQuestion = (question: Question): ParsedQuestion => {
     try {
          const choices = parseChoices(question.choices);
          const answer_key = parseAnswerKey(question.answer_key);

          // Handle points parsing
          let points = 0;
          if (question.points) {
               if (typeof question.points === 'string') {
                    points = parseFloat(question.points) || 0;
               } else if (typeof question.points === 'number') {
                    points = question.points;
               }
          }

          // ✅ Parse choices_images using the new helper function
          const choices_images = parseChoicesImages(question.choices_images);

          const result: ParsedQuestion = {
               ...question,
               choices,
               answer_key,
               points,
               question_image: question.question_image || null,
               choices_images
          };

          return result;
     } catch (error) {
          console.error('Error parsing question:', error);
          console.error('Question data:', question);
          return {
               ...question,
               choices: {},
               answer_key: [],
               points: 0,
               question_image: null,
               choices_images: null
          };
     }
};

export const parseExamQuestions = (questions: Question[]): ParsedQuestion[] => {
     // Validate questions data
     if (!Array.isArray(questions)) {
          console.error('Invalid questions data - not an array:', questions);
          return [];
     }

     if (questions.length === 0) {
          console.warn('No questions found in exam data');
          return [];
     }

     const parsedQuestions = questions.map(parseQuestion);

     return parsedQuestions;
};

export const formatTimeRemaining = (seconds: number): string => {
     const hours = Math.floor(seconds / 3600);
     const minutes = Math.floor((seconds % 3600) / 60);
     const secs = seconds % 60;

     if (hours > 0) {
          return `${hours}j ${minutes}m ${secs}d`;
     }
     if (minutes > 0) {
          return `${minutes}m ${secs}d`;
     }
     return `${secs}d`;
};

export const calculateExamProgress = (answers: Record<number, StudentAnswer>, totalQuestions: number) => {
     const answeredCount = Object.values(answers).filter(answer => {
          if (Array.isArray(answer.answer)) {
               return answer.answer.length > 0;
          }
          return answer.answer && answer.answer.trim() !== '';
     }).length;

     const flaggedCount = Object.values(answers).filter(answer => answer.is_flagged).length;

     return {
          answered: answeredCount,
          flagged: flaggedCount,
          unanswered: totalQuestions - answeredCount,
          percentage: Math.round((answeredCount / totalQuestions) * 100)
     };
};

export const validateAnswers = (answers: Record<number, StudentAnswer>, questions: ParsedQuestion[]) => {
     const validation = {
          isValid: true,
          errors: [] as string[],
          warnings: [] as string[]
     };

     questions.forEach((question, index) => {
          const answer = answers[question.id];

          if (!answer) {
               validation.warnings.push(`Soal ${index + 1} belum dijawab`);
               return;
          }

          // Validate based on question type
          switch (question.question_type_id) {
               case '0': // Single choice (Pilihan Ganda)
                    if (!answer.answer || (typeof answer.answer === 'string' && answer.answer.trim() === '')) {
                         validation.warnings.push(`Soal ${index + 1} (pilihan ganda) belum dijawab`);
                    }
                    break;

               case '1': // Multiple choice complex (Pilihan Ganda Kompleks)
                    if (!Array.isArray(answer.answer) || answer.answer.length === 0) {
                         validation.warnings.push(`Soal ${index + 1} (pilihan ganda kompleks) belum dijawab`);
                    }
                    break;

               case '2': // True/False (Benar Salah)
                    if (!answer.answer || (typeof answer.answer === 'string' && answer.answer.trim() === '')) {
                         validation.warnings.push(`Soal ${index + 1} (benar/salah) belum dijawab`);
                    }
                    break;

               case '3': // Essay
                    if (!answer.answer || (typeof answer.answer === 'string' && answer.answer.trim() === '')) {
                         validation.warnings.push(`Soal ${index + 1} (essay) belum dijawab`);
                    } else if (typeof answer.answer === 'string' && answer.answer.trim().length < 10) {
                         validation.warnings.push(`Soal ${index + 1} (essay) mungkin terlalu singkat`);
                    }
                    break;
          }
     });

     return validation;
};

export const createExamSlug = (examTitle: string): string => {
     return examTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
};

export const parseExamSlug = (slug: string): string => {
     return slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
};

/**
 * Calculate score for multiple choice complex questions
 * 
 * Sistem Penilaian:
 * - Hanya jawaban yang BENAR yang dihitung
 * - Jawaban salah TIDAK mengurangi poin
 * - Menggunakan poin TETAP per jawaban benar (default: 1.5 poin)
 * 
 * Contoh dengan poin tetap 1.5 per jawaban:
 * - Ada 2 jawaban benar (A, C)
 * - Poin per jawaban benar = 1.5 (tetap)
 * 
 * Skenario:
 * 1. Siswa pilih [A, C] (2 benar) → 1.5 + 1.5 = 3.0 poin ✓
 * 2. Siswa pilih [A] (1 benar) → 1.5 poin ✓
 * 3. Siswa pilih [A, B, C] (2 benar, 1 salah) → 1.5 + 1.5 = 3.0 poin ✓
 * 4. Siswa pilih [B] (0 benar) → 0 poin ✗
 * 5. Siswa pilih [A, B, D] (1 benar, 2 salah) → 1.5 poin ✓
 * 
 * @param totalPoints - Total points from backend (ignored if useFixedPoint = true)
 * @param correctAnswers - Array of correct answer keys (contoh: ["A", "C"])
 * @param selectedAnswers - Array of student selected answers (contoh: ["A", "B", "C"])
 * @param useFixedPointPerAnswer - Use fixed 1.5 points per correct answer (default: true)
 * @returns Calculated score for the question
 */
export const calculateComplexMultipleChoiceScore = (
     totalPoints: number,
     correctAnswers: string[],
     selectedAnswers: string[],
     useFixedPointPerAnswer: boolean = true
): number => {
     if (!correctAnswers || correctAnswers.length === 0) {
          return 0;
     }

     const FIXED_POINT_PER_ANSWER = 1.5;

     // Calculate points per correct answer
     const pointsPerCorrectAnswer = useFixedPointPerAnswer
          ? FIXED_POINT_PER_ANSWER
          : (totalPoints / correctAnswers.length);

     // Count how many correct answers were selected
     const correctSelectedCount = selectedAnswers.filter(answer =>
          correctAnswers.includes(answer)
     ).length;

     // Calculate final score (only count correct answers)
     const score = pointsPerCorrectAnswer * correctSelectedCount;

     return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Get scoring information for a complex multiple choice question
 * 
 * Sistem Penilaian Khusus untuk Pilihan Ganda Kompleks:
 * - Setiap jawaban benar mendapat poin TETAP (default: 1.5 poin)
 * - Total poin = jumlah jawaban benar × poin per jawaban
 * - Jika backend mengirim poin tinggi (misal 15), kita gunakan sistem poin tetap
 * 
 * @param totalPoints - Total points from backend (might be high like 15)
 * @param correctAnswers - Array of correct answer keys (contoh: ["A", "C"])
 * @param useFixedPointPerAnswer - Use fixed 1.5 points per correct answer (default: true)
 * @returns Scoring information object with detailed explanation
 */
export const getComplexMultipleChoiceInfo = (
     totalPoints: number,
     correctAnswers: string[],
     useFixedPointPerAnswer: boolean = true
) => {
     const FIXED_POINT_PER_ANSWER = 1.5; // Poin tetap per jawaban benar
     const totalCorrectAnswers = correctAnswers.length;

     let pointsPerAnswer: number;
     let actualTotalPoints: number;

     if (useFixedPointPerAnswer) {
          // Gunakan poin tetap 1.5 per jawaban benar
          pointsPerAnswer = FIXED_POINT_PER_ANSWER;
          actualTotalPoints = FIXED_POINT_PER_ANSWER * totalCorrectAnswers;
     } else {
          // Gunakan sistem pembagian dari backend
          pointsPerAnswer = totalCorrectAnswers > 0
               ? Math.round((totalPoints / totalCorrectAnswers) * 100) / 100
               : 0;
          actualTotalPoints = totalPoints;
     }

     return {
          totalPoints: actualTotalPoints,
          correctAnswersCount: totalCorrectAnswers,
          pointsPerAnswer,
          description: `Terdapat ${totalCorrectAnswers} jawaban benar. Setiap jawaban benar bernilai ${pointsPerAnswer} poin. Poin maksimal: ${actualTotalPoints}`,
          scoringNote: `Hanya jawaban yang benar yang dihitung. Jawaban salah tidak mengurangi poin.`
     };
};

// Find exam by slug from assigned exams
export const findExamBySlug = (exams: AssignedExam[], slug: string): AssignedExam | null => {
     return exams.find(exam => createExamSlug(exam.title) === slug) || null;
};

// Create exam context that includes both ID and slug info
export const createExamContext = (exam: AssignedExam | null) => {
     if (!exam) return null;

     return {
          ...exam,
          slug: createExamSlug(exam.title),
          displayTitle: exam.title
     };
};
