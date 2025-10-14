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
     // If already an object, return as is
     if (typeof choices === 'object' && choices !== null && !Array.isArray(choices)) {
          return choices as Record<string, string>;
     }

     // If string, try to parse as JSON first
     if (typeof choices === 'string') {
          const parsed = safeJSONParse(choices);
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

     return {};
};

// Helper function to parse answer keys from various formats
const parseAnswerKey = (answerKey: unknown): string[] => {
     // If already an array, return as is
     if (Array.isArray(answerKey)) {
          return answerKey.map(String);
     }

     // If string, try to parse as JSON first
     if (typeof answerKey === 'string') {
          const parsed = safeJSONParse(answerKey);
          if (Array.isArray(parsed)) {
               return parsed.map(String);
          }

          // Parse as comma/pipe/semicolon separated values
          const trimmed = answerKey.trim();
          if (trimmed) {
               const items = trimmed.split(/[,|;]/).map(item => item.trim()).filter(item => item);
               return items.length > 0 ? items : [trimmed];
          }
     }

     // For other types, convert to string
     if (answerKey !== null && answerKey !== undefined) {
          return [String(answerKey)];
     }

     return [];
};

export const parseQuestion = (question: Question): ParsedQuestion => {
     try {
          console.log('Parsing question:', {
               id: question.id,
               choices: question.choices,
               answer_key: question.answer_key,
               points: question.points
          });

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

          const result = {
               ...question,
               choices,
               answer_key,
               points
          };

          console.log('Parsed question result:', {
               id: result.id,
               choices: result.choices,
               answer_key: result.answer_key,
               points: result.points
          });

          return result;
     } catch (error) {
          console.error('Error parsing question:', error);
          console.error('Question data:', question);
          return {
               ...question,
               choices: {},
               answer_key: [],
               points: 0
          };
     }
};

export const parseExamQuestions = (questions: Question[]): ParsedQuestion[] => {
     console.log('Parsing exam questions - Total count:', questions?.length || 0);
     console.log('Raw questions from API:', questions);

     // Validate questions data
     if (!Array.isArray(questions)) {
          console.error('Invalid questions data - not an array:', questions);
          return [];
     }

     if (questions.length === 0) {
          console.warn('No questions found in exam data');
          return [];
     }

     // Log first question for debugging
     console.log('Sample question data:', {
          id: questions[0].id,
          exam_id: questions[0].exam_id,
          choices: questions[0].choices,
          answer_key: questions[0].answer_key,
          points: questions[0].points,
          question_type_id: questions[0].question_type_id
     });

     const parsedQuestions = questions.map(parseQuestion);
     console.log('Parsed questions count:', parsedQuestions.length);

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
 * Formula: (total_points / correct_answers_count) * correct_selected_answers
 * 
 * @param totalPoints - Total points for the question
 * @param correctAnswers - Array of correct answer keys (e.g., ["A", "C"])
 * @param selectedAnswers - Array of student selected answers (e.g., ["A", "B", "C"])
 * @returns Calculated score for the question
 */
export const calculateComplexMultipleChoiceScore = (
     totalPoints: number,
     correctAnswers: string[],
     selectedAnswers: string[]
): number => {
     if (!correctAnswers || correctAnswers.length === 0) {
          return 0;
     }

     // Calculate points per correct answer
     const pointsPerCorrectAnswer = totalPoints / correctAnswers.length;

     // Count how many correct answers were selected
     const correctSelectedCount = selectedAnswers.filter(answer =>
          correctAnswers.includes(answer)
     ).length;

     // Calculate final score
     const score = pointsPerCorrectAnswer * correctSelectedCount;

     return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Get scoring information for a complex multiple choice question
 * 
 * @param totalPoints - Total points for the question
 * @param correctAnswers - Array of correct answer keys
 * @returns Scoring information object
 */
export const getComplexMultipleChoiceInfo = (
     totalPoints: number,
     correctAnswers: string[]
) => {
     const pointsPerAnswer = correctAnswers.length > 0
          ? Math.round((totalPoints / correctAnswers.length) * 100) / 100
          : 0;

     return {
          totalPoints,
          correctAnswersCount: correctAnswers.length,
          pointsPerAnswer,
          description: `Setiap jawaban benar bernilai ${pointsPerAnswer} poin (${totalPoints} ÷ ${correctAnswers.length} = ${pointsPerAnswer})`
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
