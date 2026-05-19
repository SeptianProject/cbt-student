import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examService } from "@/services/exam";
import {
  AssignedExam,
  ParsedQuestion,
  StudentAnswer,
  ExamSubmitOptions,
} from "@/types";
import { useRouter } from "next/navigation";

// Query Keys
export const examKeys = {
  all: ["exam"] as const,
  detail: (examId: number) => [...examKeys.all, "detail", examId] as const,
  sessionStatus: (examId: number) =>
    [...examKeys.all, "sessionStatus", examId] as const,
  activeSession: (examId: number) =>
    [...examKeys.all, "activeSession", examId] as const,
};

// Hook untuk start exam
export const useStartExamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: number) => examService.examStart(examId),
    onSuccess: (data, examId) => {
      // Cache exam data
      queryClient.setQueryData(examKeys.detail(examId), data);

      // Invalidate session status
      queryClient.invalidateQueries({
        queryKey: examKeys.sessionStatus(examId),
      });
    },
    onError: (error: Error) => {
      console.error("Failed to start exam:", error.message);
    },
  });
};

// Hook untuk start exam by slug
export const useStartExamBySlugMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      assignedExams,
    }: {
      slug: string;
      assignedExams: AssignedExam[];
    }) => examService.examStartBySlug(slug, assignedExams),
    onSuccess: (data) => {
      // Get exam_id from localStorage (set by examStartBySlug)
      const examId = localStorage.getItem("exam_id");
      if (examId) {
        queryClient.setQueryData(examKeys.detail(parseInt(examId)), data);
      }
    },
  });
};

// Hook untuk safe exam start (with auto-retry)
export const useStartExamSafeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: number) => examService.examStartSafe(examId),
    onSuccess: (data, examId) => {
      queryClient.setQueryData(examKeys.detail(examId), data);
    },
  });
};

// Hook untuk clear exam session
export const useClearExamSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: number) => examService.clearExamSession(examId),
    onSuccess: (_, examId) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: examKeys.detail(examId) });
      queryClient.invalidateQueries({
        queryKey: examKeys.sessionStatus(examId),
      });
      queryClient.invalidateQueries({
        queryKey: examKeys.activeSession(examId),
      });
    },
  });
};

// Hook untuk submit exam
export const useSubmitExamMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      examId,
      answers,
      questions,
      options = {},
    }: {
      examId: number;
      answers: Record<number, StudentAnswer>;
      questions: ParsedQuestion[];
      options?: ExamSubmitOptions;
    }) => examService.submitExam(examId, answers, questions, options),
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: examKeys.detail(variables.examId),
      });
      queryClient.invalidateQueries({
        queryKey: examKeys.sessionStatus(variables.examId),
      });

      // Navigate to complete page if final submit
      if (variables.options?.finalSubmit) {
        const slug = localStorage.getItem("current_exam_slug");
        if (slug) {
          router.push(`/exam/${slug}/complete`);
        }
      }
    },
    onError: (error: Error) => {
      console.error("Failed to submit exam:", error.message);
    },
  });
};

// Hook untuk get session status
export const useSessionStatus = (examId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: examKeys.sessionStatus(examId),
    queryFn: () => examService.getSessionStatus(examId),
    enabled: enabled && examId > 0,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};

// Hook untuk check active session
export const useCheckActiveSession = (
  examId: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: examKeys.activeSession(examId),
    queryFn: () => examService.checkActiveSession(examId),
    enabled: enabled && examId > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Hook untuk update answer
export const useUpdateAnswerMutation = () => {
  return useMutation({
    mutationFn: ({
      sessionId,
      questionId,
      answer,
      type,
    }: {
      sessionId: number;
      questionId: number;
      answer: string | string[];
      type: "choice" | "essay";
    }) => examService.updateAnswer(sessionId, questionId, answer, type),
    onSuccess: (data) => {},
    onError: (error: Error) => {
      console.error("Failed to update answer:", error.message);
    },
  });
};

// Hook untuk force end session
export const useForceEndSessionMutation = () => {
  return useMutation({
    mutationFn: (examId: number) => examService.forceEndSession(examId),
    onSuccess: () => {},
  });
};

// Hook untuk auto-save answers
export const useAutoSaveAnswersMutation = () => {
  return useMutation({
    mutationFn: ({
      examId,
      answers,
      questions,
    }: {
      examId: number;
      answers: Record<number, StudentAnswer>;
      questions: ParsedQuestion[];
    }) => examService.autoSaveAnswers(examId, answers, questions),
    onSuccess: (data) => {},
    onError: (error: Error) => {
      console.error("Auto-save failed:", error.message);
    },
  });
};
