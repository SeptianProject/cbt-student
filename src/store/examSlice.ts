import { createSlice, createAsyncThunk, PayloadAction, Draft } from '@reduxjs/toolkit';
import { examService } from '@/services/exam';
import { parseExamQuestions, findExamBySlug } from '@/lib/examUtils';
import { randomizeQuestions, saveRandomizationData, loadRandomizationData, clearRandomizationData, RandomizedQuestionResult } from '@/lib/questionRandomizer';
import { ParsedQuestion, StudentAnswer, AssignedExam } from '@/types';
import type { Question } from '@/types';

interface ExamState {
     currentExam: AssignedExam | null;
     questions: ParsedQuestion[];
     originalQuestions: ParsedQuestion[]; // Store original order questions
     randomizationData: RandomizedQuestionResult | null; // Store randomization mapping
     answers: Record<number, StudentAnswer>;
     isLoading: boolean;
     isError: boolean;
     errorMessage: string | null;
     examDuration: number;
     timeRemaining: number; // Track remaining time in seconds
     showSubmitModal: boolean;
     isExamEnded: boolean;
     isSubmitting: boolean;
     sessionId: number | null;
     sessionToken: string | null;
     sessionStatus: 'progress' | 'submitted' | 'expired' | 'cancelled' | null;
     submitResult: {
          session_id?: number;
          exam_title?: string;
          total_score?: number;
          max_score?: number;
          percentage?: number;
          grade?: string;
          total_questions?: number;
          answered_questions?: number;
          unanswered_questions?: number;
          submission_time?: string;
     } | null;
}

const initialState: ExamState = {
     currentExam: null,
     questions: [],
     originalQuestions: [],
     randomizationData: null,
     answers: {},
     isLoading: false,
     isError: false,
     errorMessage: null,
     examDuration: 0,
     timeRemaining: 0,
     showSubmitModal: false,
     isExamEnded: false,
     isSubmitting: false,
     sessionId: null,
     sessionToken: null,
     sessionStatus: null,
     submitResult: null,
};

export const fetchExam = createAsyncThunk(
     'exam/fetchExam',
     async ({ assigned, slug, userId }: { assigned: AssignedExam[]; slug: string; userId: number }, { rejectWithValue }) => {
          try {
               const exam = findExamBySlug(assigned, slug);
               if (!exam) throw new Error('Exam not found');

               // Start exam
               const examData = await examService.examStartSafe(Number(exam.exam_id));

               // Get session status to retrieve session_id
               const sessionStatus = await examService.getSessionStatus(Number(exam.exam_id));

               console.log('📊 Session status response:', sessionStatus);

               return { exam, examData, sessionStatus, userId };
          } catch (error) {
               console.error('❌ Failed to fetch exam:', error);
               return rejectWithValue(error);
          }
     }
);

export const submitExam = createAsyncThunk(
     'exam/submitExam',
     async ({
          examId,
          answers,
          questions,
          forceSubmit,
          finalSubmit
     }: {
          examId: number;
          answers: Record<number, StudentAnswer>;
          questions: ParsedQuestion[];
          forceSubmit?: boolean;
          finalSubmit?: boolean;
     }) => {
          return await examService.submitExam(examId, answers, questions, { forceSubmit, finalSubmit });
     }
);

export const checkSessionStatus = createAsyncThunk(
     'exam/checkSessionStatus',
     async (examId: number) => {
          return await examService.getSessionStatus(examId);
     }
);

const examSlice = createSlice({
     name: 'exam',
     initialState,
     reducers: {
          setAnswers(state: Draft<ExamState>, action: PayloadAction<{ questionId: number; answer: string | string[] }>) {
               const { questionId, answer } = action.payload;

               // Pastikan answer tidak kosong atau undefined untuk menghindari masalah state
               if (answer !== undefined && answer !== null) {
                    state.answers[questionId] = {
                         question_id: questionId,
                         answer,
                         is_flagged: state.answers[questionId]?.is_flagged || false,
                    };
               }
          },
          setFlag(state: Draft<ExamState>, action: PayloadAction<{ questionId: number; isFlagged: boolean }>) {
               const { questionId, isFlagged } = action.payload;

               // Jika belum ada answer untuk question ini, buat entry baru
               if (!state.answers[questionId]) {
                    state.answers[questionId] = {
                         question_id: questionId,
                         answer: '',
                         is_flagged: isFlagged,
                    };
               } else {
                    // Update flag status saja, pertahankan answer yang sudah ada
                    state.answers[questionId].is_flagged = isFlagged;
               }
          },
          setTimeRemaining(state: Draft<ExamState>, action: PayloadAction<number>) {
               state.timeRemaining = action.payload;
          },
          setShowSubmitModal(state: Draft<ExamState>, action: PayloadAction<boolean>) {
               state.showSubmitModal = action.payload;
          },
          setIsExamEnded(state: Draft<ExamState>, action: PayloadAction<boolean>) {
               state.isExamEnded = action.payload;
          },
          resetExamState(state: Draft<ExamState>) {
               // Clear randomization data saat reset
               if (state.currentExam?.exam_id) {
                    clearRandomizationData(state.currentExam.exam_id);
               }
               // Clear session data from localStorage
               if (typeof window !== 'undefined') {
                    localStorage.removeItem('session_token');
                    localStorage.removeItem('session_id');
               }
               return initialState;
          },
          setSubmitResult(state: Draft<ExamState>, action: PayloadAction<ExamState['submitResult']>) {
               state.submitResult = action.payload;
          },
     },
     extraReducers: (builder) => {
          builder
               .addCase(fetchExam.pending, (state: Draft<ExamState>) => {
                    state.isLoading = true;
                    state.isError = false;
                    state.errorMessage = null;
               })
               .addCase(
                    fetchExam.fulfilled,
                    (
                         state: Draft<ExamState>,
                         action: PayloadAction<{
                              exam: AssignedExam;
                              examData: { exam: unknown; success: boolean; session_token?: string; session_id?: number };
                              sessionStatus: { success: boolean; session_id?: number; status?: string;[key: string]: unknown };
                              userId: number;
                         }>
                    ) => {


                         state.currentExam = action.payload.exam;

                         // Store session data from examData (session_token)
                         if (action.payload.examData.session_token) {
                              state.sessionToken = action.payload.examData.session_token;
                         }

                         // Store session_id from sessionStatus response (prioritas lebih tinggi)
                         if (action.payload.sessionStatus?.session_id) {
                              state.sessionId = action.payload.sessionStatus.session_id;
                              console.log('✅ Session ID retrieved from status:', state.sessionId);
                         } else if (action.payload.examData.session_id) {
                              // Fallback ke examData jika ada
                              state.sessionId = action.payload.examData.session_id;
                              console.log('✅ Session ID retrieved from examData:', state.sessionId);
                         } else {
                              console.warn('⚠️ No session_id found in response');
                         }

                         // When starting exam, always set status to 'progress'
                         // Don't use status from getSessionStatus as it might show old session
                         state.sessionStatus = 'progress';
                         console.log('✅ Session status set to progress on exam start');

                         // Parse questions dalam urutan original
                         const parsedQuestions = parseExamQuestions(action.payload.examData.exam as Question[]);
                         state.originalQuestions = parsedQuestions;

                         // Load existing randomization data jika ada
                         const existingRandomization = loadRandomizationData(action.payload.exam.exam_id);

                         if (existingRandomization && Object.keys(existingRandomization.originalToRandomizedMap).length > 0) {
                              // Apply existing randomization
                              const randomizedQuestions = [...parsedQuestions];
                              randomizedQuestions.sort((a, b) => {
                                   const aOriginalIndex = parsedQuestions.findIndex(q => q.id === a.id);
                                   const bOriginalIndex = parsedQuestions.findIndex(q => q.id === b.id);
                                   const aRandomizedIndex = existingRandomization.originalToRandomizedMap[aOriginalIndex] ?? aOriginalIndex;
                                   const bRandomizedIndex = existingRandomization.originalToRandomizedMap[bOriginalIndex] ?? bOriginalIndex;
                                   return aRandomizedIndex - bRandomizedIndex;
                              });

                              state.questions = randomizedQuestions;
                              state.randomizationData = {
                                   ...existingRandomization,
                                   questions: randomizedQuestions
                              };
                         } else {
                              // Create new randomization
                              const randomizationResult = randomizeQuestions(
                                   parsedQuestions,
                                   action.payload.userId,
                                   action.payload.exam.exam_id
                              );

                              state.questions = randomizationResult.questions;
                              state.randomizationData = randomizationResult;

                              // Save randomization data
                              saveRandomizationData(randomizationResult, action.payload.exam.exam_id);
                         }

                         state.examDuration = (action.payload.exam.duration || 120) * 60;
                         state.timeRemaining = state.examDuration; // Initialize timeRemaining
                         state.isLoading = false;
                    }
               )
               .addCase(fetchExam.rejected, (state: Draft<ExamState>, action: { error: { message?: string } }) => {
                    state.isLoading = false;
                    state.isError = true;
                    state.errorMessage = action.error?.message || 'Failed to fetch exam';
               })
               .addCase(submitExam.pending, (state: Draft<ExamState>) => {
                    state.isSubmitting = true;
                    state.isError = false;
                    state.errorMessage = null;
               })
               .addCase(submitExam.fulfilled, (state: Draft<ExamState>, action) => {
                    state.isSubmitting = false;
                    state.isExamEnded = true;
                    state.showSubmitModal = false;
                    state.sessionStatus = 'submitted';

                    // Store submit result if available - payload contains full response with data field
                    if (action.payload?.data) {
                         const examData = action.payload.data;
                         state.submitResult = {
                              session_id: examData.session_id,
                              exam_title: examData.exam_title,
                              total_score: examData.total_score,
                              max_score: examData.max_score,
                              percentage: examData.percentage,
                              grade: examData.grade,
                              total_questions: examData.total_questions,
                              answered_questions: examData.answered_questions,
                              unanswered_questions: examData.unanswered_questions,
                              submission_time: examData.submission_time,
                         };


                    }

                    // Update localStorage exam status
                    if (typeof window !== 'undefined' && state.currentExam) {
                         interface ExamStatus {
                              exam_id: number;
                              status: 'not_started' | 'in_progress' | 'completed';
                              last_accessed?: string;
                         }

                         const statuses: ExamStatus[] = JSON.parse(localStorage.getItem('exam_statuses') || '[]');

                         const updatedStatuses = statuses.map((status) =>
                              status.exam_id === state.currentExam?.exam_id
                                   ? { ...status, status: 'completed' as const, last_accessed: new Date().toISOString() }
                                   : status
                         );

                         const examExists = statuses.some((status) => status.exam_id === state.currentExam?.exam_id);
                         if (!examExists && state.currentExam.exam_id) {
                              updatedStatuses.push({
                                   exam_id: state.currentExam.exam_id,
                                   status: 'completed',
                                   last_accessed: new Date().toISOString()
                              });
                         }

                         localStorage.setItem('exam_statuses', JSON.stringify(updatedStatuses));

                         // Clear session data after successful submission
                         localStorage.removeItem('session_token');
                         localStorage.removeItem('session_id');
                    }
               })
               .addCase(submitExam.rejected, (state: Draft<ExamState>, action: { error: { message?: string } }) => {
                    state.isSubmitting = false;
                    state.isError = true;
                    state.errorMessage = action.error?.message || 'Failed to submit exam';
                    // Don't set isExamEnded to true on error - keep user in exam
               })
               .addCase(checkSessionStatus.fulfilled, (state: Draft<ExamState>, action: PayloadAction<{ success: boolean; session_id?: number; status?: string;[key: string]: unknown }>) => {
                    // Update session_id jika ada di response
                    if (action.payload.session_id) {
                         state.sessionId = action.payload.session_id;
                         console.log('✅ Session ID updated from checkSessionStatus:', state.sessionId);
                    }
               });
     },
});

export const {
     setAnswers,
     setFlag,
     setTimeRemaining,
     setShowSubmitModal,
     setIsExamEnded,
     resetExamState,
     setSubmitResult,
} = examSlice.actions;

export default examSlice.reducer;
