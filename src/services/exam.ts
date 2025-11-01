import api from "@/lib/api";
import { Exam, StudentAnswer, AssignedExam, ParsedQuestion, ExamSubmitOptions, AutoSaveResponse } from "@/types";
import { findExamBySlug } from "@/lib/examUtils";

export const examService = {
     // Clear any existing session for the exam
     clearExamSession: async (examId: number): Promise<void> => {
          try {
               const sessionToken = localStorage.getItem('session_token');
               if (sessionToken) {
                    // Try to submit with force_submit to end existing session
                    await api.post(`/siswa/exams/${examId}/submit`, {
                         session_token: sessionToken,
                         force_submit: true,
                         final_submit: true,
                         answers: {},
                         essay_answers: {}
                    }, {
                         headers: {
                              Authorization: `Bearer ${localStorage.getItem('api_token')}`
                         }
                    });
               }
          } catch (error) {
               console.log('Error clearing session (might be expected):', error);
               // Ignore errors - session might already be expired or invalid
          } finally {
               // Always clear local session data
               localStorage.removeItem('session_token');
               localStorage.removeItem('session_id');
          }
     },

     examStart: async (examId: number): Promise<Exam> => {
          if (!examId) {
               throw new Error('Exam ID is required');
          }

          try {
               const response = await api.post<Exam>(`/siswa/exams/${examId}/start`, {}, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               // Store session_token and session_id if provided in response
               if (response.data && typeof response.data === 'object') {
                    if ('session_token' in response.data) {
                         const responseWithToken = response.data as { session_token?: string };
                         if (responseWithToken.session_token) {
                              localStorage.setItem('session_token', responseWithToken.session_token);
                         }
                    }
                    if ('session_id' in response.data) {
                         const responseWithSessionId = response.data as { session_id?: number };
                         if (responseWithSessionId.session_id) {
                              localStorage.setItem('session_id', responseWithSessionId.session_id.toString());
                         }
                    }
               }

               console.log('exam id:', examId);
               console.log('data exam start :', response.data);
               return response.data;
          } catch (error: unknown) {
               // Check if error is due to existing active session
               const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
               if (axiosError?.response?.status === 422 &&
                    axiosError?.response?.data?.message?.includes('sesi ujian yang aktif')) {

                    console.log('Active session detected, clearing and retrying...');

                    // Clear existing session and retry
                    await examService.clearExamSession(examId);

                    // Retry starting the exam
                    const retryResponse = await api.post<Exam>(`/siswa/exams/${examId}/start`, {}, {
                         headers: {
                              Authorization: `Bearer ${localStorage.getItem('api_token')}`
                         }
                    });

                    // Store session_token and session_id if provided in response
                    if (retryResponse.data && typeof retryResponse.data === 'object') {
                         if ('session_token' in retryResponse.data) {
                              const responseWithToken = retryResponse.data as { session_token?: string };
                              if (responseWithToken.session_token) {
                                   localStorage.setItem('session_token', responseWithToken.session_token);
                              }
                         }
                         if ('session_id' in retryResponse.data) {
                              const responseWithSessionId = retryResponse.data as { session_id?: number };
                              if (responseWithSessionId.session_id) {
                                   localStorage.setItem('session_id', responseWithSessionId.session_id.toString());
                              }
                         }
                    }

                    console.log('exam id (retry):', examId);
                    console.log('data exam start (retry):', retryResponse.data);
                    return retryResponse.data;
               }

               // Re-throw other errors
               throw error;
          }
     },

     examStartBySlug: async (slug: string, assignedExams: AssignedExam[]): Promise<Exam> => {
          const exam = findExamBySlug(assignedExams, slug);
          if (!exam) {
               throw new Error(`Exam not found for slug: ${slug}`);
          }

          localStorage.setItem('exam_id', exam.exam_id.toString());
          localStorage.setItem('exam_duration', exam.duration.toString());
          localStorage.setItem('current_exam_slug', slug);

          return examService.examStart(exam.exam_id);
     },

     // Safe exam start with automatic session clearing if needed
     examStartSafe: async (examId: number): Promise<Exam> => {
          try {
               return await examService.examStart(examId);
          } catch (error: unknown) {
               const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

               // If there's an active session, clear it and try again
               if (axiosError?.response?.status === 422 &&
                    axiosError?.response?.data?.message?.includes('sesi ujian yang aktif')) {

                    console.log('Active session detected, clearing and retrying...');
                    await examService.clearExamSession(examId);
                    return await examService.examStart(examId);
               }

               throw error;
          }
     },

     getExamIdFromSlug: (slug: string, assignedExams: AssignedExam[]): number | null => {
          const exam = findExamBySlug(assignedExams, slug);
          return exam ? exam.exam_id : null;
     },

     submitExam: async (
          examId: number,
          answers: Record<number, StudentAnswer>,
          questions: ParsedQuestion[],
          options: ExamSubmitOptions = {}
     ) => {
          if (!examId || examId <= 0) {
               throw new Error('Exam ID tidak valid.');
          }

          const sessionToken = localStorage.getItem('session_token');

          if (!sessionToken) {
               throw new Error('Session token tidak ditemukan. Silakan mulai ulang ujian.');
          }

          // Separate multiple choice and essay answers based on question type
          const multipleChoiceAnswers: Record<string, string> = {};
          const essayAnswers: Record<string, string> = {};

          Object.values(answers).forEach(answer => {
               const question = questions.find(q => q.id === answer.question_id);

               if (question && answer.answer !== undefined && answer.answer !== null && answer.answer !== '') {
                    // Question type: "0" = Multiple Choice, "1" = Multiple Choice Complex, "2" = True/False, "3" = Essay
                    if (question.question_type_id === "3") {
                         // Essay question - store as string (max 5000 chars as per backend validation)
                         const essayAnswer = Array.isArray(answer.answer)
                              ? answer.answer.join(', ')
                              : String(answer.answer || '');

                         // Only add if not empty
                         if (essayAnswer.trim()) {
                              essayAnswers[answer.question_id.toString()] = essayAnswer.substring(0, 5000);
                         }
                    } else {
                         // Multiple choice questions (types "0", "1", "2") - store as string (max 10 chars as per backend validation)
                         let mcAnswer = '';

                         if (Array.isArray(answer.answer)) {
                              // For multiple choice complex (type "1"), join array elements
                              mcAnswer = answer.answer.filter(a => a !== '').join(',');
                         } else {
                              // For single choice (types "0" and "2"), use as is
                              mcAnswer = String(answer.answer || '');
                         }

                         // Only add if not empty and truncate to 10 characters
                         if (mcAnswer.trim()) {
                              multipleChoiceAnswers[answer.question_id.toString()] = mcAnswer.substring(0, 10);
                         }
                    }
               }
          });

          // Validate that we have at least some answers or it's a force submit
          if (Object.keys(multipleChoiceAnswers).length === 0 && Object.keys(essayAnswers).length === 0 && !options.forceSubmit) {
               throw new Error('Tidak ada jawaban yang ditemukan. Silakan jawab minimal satu soal atau gunakan force submit.');
          }

          // Format payload according to backend validation rules
          const payload: {
               session_token: string;
               answers?: Record<string, string>;
               essay_answers?: Record<string, string>;
               force_submit: boolean;
               final_submit: boolean;
          } = {
               session_token: sessionToken,
               force_submit: options.forceSubmit || false,
               final_submit: options.finalSubmit || false
          };

          // Only include answers if there are any
          if (Object.keys(multipleChoiceAnswers).length > 0) {
               payload.answers = multipleChoiceAnswers;
          }

          if (Object.keys(essayAnswers).length > 0) {
               payload.essay_answers = essayAnswers;
          }

          // Debug logging
          console.log('Submit Exam Debug Info:', {
               examId,
               sessionToken: sessionToken?.substring(0, 10) + '...',
               payload,
               answersCount: Object.keys(answers).length,
               questionsCount: questions.length,
               multipleChoiceCount: Object.keys(multipleChoiceAnswers).length,
               essayCount: Object.keys(essayAnswers).length
          });

          try {
               const response = await api.post(`/siswa/exams/${examId}/submit`, payload, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               console.log('exam submitted successfully:', response.data);

               // Verify response structure
               if (!response.data || typeof response.data !== 'object' || response.data.success !== true) {
                    console.error('Response validation failed, received:', response.data);
                    throw new Error('Response tidak valid dari server');
               }

               // Clean up session token on successful submit if final submit
               if (options.finalSubmit) {
                    localStorage.removeItem('session_token');
                    localStorage.removeItem('session_id');
                    localStorage.removeItem('exam_result');
                    console.log('✅ Session cleared after final submit');
               }

               return response.data;
          } catch (error: unknown) {
               console.error('Submit exam error:', error);

               // Handle specific error cases
               if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

                    console.log('Backend Error Details:', {
                         status: axiosError.response?.status,
                         data: axiosError.response?.data,
                         examId,
                         sessionToken: sessionToken?.substring(0, 10) + '...'
                    });

                    if (axiosError.response?.status === 500) {
                         throw new Error('Terjadi kesalahan saat menyimpan hasil ujian. Silakan coba lagi.');
                    } else if (axiosError.response?.status === 405) {
                         throw new Error('Metode request tidak didukung. Silakan refresh halaman dan coba lagi.');
                    } else if (axiosError.response?.status === 404) {
                         throw new Error('Endpoint ujian tidak ditemukan. Silakan hubungi administrator.');
                    } else if (axiosError.response?.status === 422) {
                         throw new Error('Data yang dikirim tidak valid. Silakan periksa jawaban Anda.');
                    } else if (axiosError.response?.data?.message) {
                         throw new Error(axiosError.response.data.message);
                    }
               }

               const errorMessage = error && typeof error === 'object' && 'message' in error
                    ? String((error as { message: string }).message)
                    : 'Gagal mengirim jawaban ujian. Silakan coba lagi.';

               throw new Error(errorMessage);
          }
     },

     getSessionStatus: async (examId: number) => {
          const sessionToken = localStorage.getItem('session_token');

          if (!sessionToken) {
               throw new Error('Session token tidak ditemukan.');
          }

          const response = await api.post(`/siswa/exams/${examId}/status`, {
               session_token: sessionToken
          }, {
               headers: {
                    Authorization: `Bearer ${localStorage.getItem('api_token')}`
               }
          });

          return response.data;
     },

     updateAnswer: async (sessionId: number, questionId: number, answer: string | string[], type: 'choice' | 'essay') => {
          const sessionToken = localStorage.getItem('session_token');

          if (!sessionToken) {
               console.error('❌ Session token not found in updateAnswer');
               throw new Error('Session token tidak ditemukan.');
          }

          // Format answer based on type
          let formattedAnswer: string;
          if (type === 'choice') {
               formattedAnswer = Array.isArray(answer) ? answer.join(',') : String(answer);
          } else {
               formattedAnswer = Array.isArray(answer) ? answer.join(', ') : String(answer);
          }

          const payload = {
               session_id: sessionId,
               question_id: questionId,
               answer: formattedAnswer,
               type: type
          };

          console.log('📡 Sending update-answer request:', payload);

          try {
               const response = await api.post('/siswa/exam-session/update-answer', payload, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               console.log('✅ Update-answer response:', response.data);
               return response.data;
          } catch (error) {
               console.error('❌ Update-answer failed:', error);
               if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number; data?: unknown } };
                    console.error('Error response:', {
                         status: axiosError.response?.status,
                         data: axiosError.response?.data
                    });
               }
               throw error;
          }
     },

     // Force end any existing session for an exam
     forceEndSession: async (examId: number): Promise<void> => {
          try {
               // Try different approaches to end the session
               const sessionToken = localStorage.getItem('session_token');

               if (sessionToken) {
                    // First try: Submit with force_submit to end session gracefully
                    await api.post(`/siswa/exams/${examId}/submit`, {
                         session_token: sessionToken,
                         force_submit: true,
                         final_submit: true,
                         answers: {},
                         essay_answers: {}
                    }, {
                         headers: {
                              Authorization: `Bearer ${localStorage.getItem('api_token')}`
                         }
                    });
                    console.log('✅ Session forcefully ended for exam:', examId);
               }
          } catch {
               console.log('Session force end completed (errors are expected)');
          }

          // Always clear local storage
          localStorage.removeItem('session_token');
          localStorage.removeItem('session_id');
          localStorage.removeItem('exam_result');
          localStorage.removeItem('current_exam_slug');
     },

     // Clear all exam sessions - useful for logout or when all exams completed
     clearAllExamSessions: async (): Promise<void> => {
          console.log('🧹 Clearing all exam sessions...');
          // Clear all session-related data
          if (typeof window !== 'undefined') {
               localStorage.removeItem('session_token');
               localStorage.removeItem('session_id');
               localStorage.removeItem('exam_result');
               localStorage.removeItem('current_exam_slug');
               localStorage.removeItem('exam_id');
               localStorage.removeItem('exam_duration');
          }
          console.log('✅ All exam sessions cleared');
     },

     // Check if user has an active session for exam
     checkActiveSession: async (examId: number): Promise<boolean> => {
          try {
               const sessionToken = localStorage.getItem('session_token');
               if (!sessionToken) return false;

               const response = await api.post(`/siswa/exams/${examId}/status`, {
                    session_token: sessionToken
               }, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               return response.data?.success === true;
          } catch {
               return false;
          }
     },

     // Auto-save answers without final submission (for periodic saves)
     autoSaveAnswers: async (
          examId: number,
          answers: Record<number, StudentAnswer>,
          questions: ParsedQuestion[]
     ): Promise<AutoSaveResponse> => {
          const sessionToken = localStorage.getItem('session_token');

          if (!sessionToken) {
               throw new Error('Session token tidak ditemukan. Silakan mulai ulang ujian.');
          }

          // Separate multiple choice and essay answers based on question type
          const multipleChoiceAnswers: Record<string, string> = {};
          const essayAnswers: Record<string, string> = {};

          Object.values(answers).forEach(answer => {
               const question = questions.find(q => q.id === answer.question_id);

               if (question) {
                    if (question.question_type_id === "3") {
                         // Essay question
                         const essayAnswer = Array.isArray(answer.answer)
                              ? answer.answer.join(', ')
                              : String(answer.answer || '');

                         essayAnswers[answer.question_id.toString()] = essayAnswer.substring(0, 5000);
                    } else {
                         // Multiple choice questions (types "0", "1", "2")
                         let mcAnswer = '';

                         if (Array.isArray(answer.answer)) {
                              // For multiple choice complex (type "1")
                              mcAnswer = answer.answer.join(',');
                         } else {
                              // For single choice (types "0" and "2")
                              mcAnswer = String(answer.answer || '');
                         }

                         multipleChoiceAnswers[answer.question_id.toString()] = mcAnswer.substring(0, 10);
                    }
               }
          });

          const payload = {
               session_token: sessionToken,
               answers: Object.keys(multipleChoiceAnswers).length > 0 ? multipleChoiceAnswers : null,
               essay_answers: Object.keys(essayAnswers).length > 0 ? essayAnswers : null,
               force_submit: false,
               final_submit: false // This is auto-save, not final submission
          };

          const response = await api.post(`/siswa/exams/${examId}/submit`, payload, {
               headers: {
                    Authorization: `Bearer ${localStorage.getItem('api_token')}`
               }
          });

          return response.data;
     }
}