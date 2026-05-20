/**
 * Debug utility untuk ExamNavigation mapping
 */

import { StudentAnswer, ParsedQuestion } from "@/types";

export const navigationDebugUtils = {
  /**
   * Log mapping antara questionNumber dan questionId
   */
  logQuestionMapping: () => {
    // Logging disabled
  },

  /**
   * Validate answer status
   */
  validateAnswerStatus: (
    questionId: number,
    answer: StudentAnswer | undefined,
  ) => {
    if (!answer) {
      return { status: "unanswered", reason: "No answer object" };
    }

    if (answer.is_flagged) {
      return { status: "flagged", reason: "Question is flagged" };
    }

    if (Array.isArray(answer.answer)) {
      const hasAnswer = answer.answer.length > 0;
      return {
        status: hasAnswer ? "answered" : "unanswered",
        reason: hasAnswer
          ? `Array with ${answer.answer.length} items`
          : "Empty array",
      };
    } else {
      const hasAnswer = answer.answer && answer.answer.toString().trim() !== "";
      return {
        status: hasAnswer ? "answered" : "unanswered",
        reason: hasAnswer ? `Value: "${answer.answer}"` : "Empty or null value",
      };
    }
  },

  /**
   * Log status untuk semua questions
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logAllQuestionStatus: (
    _questions: ParsedQuestion[],
    _answers: Record<number, StudentAnswer>,
  ) => {
    // Logging disabled
  },
};

// Hook untuk debugging dalam development
export const useNavigationDebug = () => {
  if (process.env.NODE_ENV === "development") {
    return navigationDebugUtils;
  }

  // Return no-op functions in production
  return {
    logQuestionMapping: () => {},
    validateAnswerStatus: () => ({ status: "unknown" as const, reason: "" }),
    logAllQuestionStatus: () => {},
  };
};
