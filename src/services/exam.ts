import api from "@/lib/api";
import {
     Exam,
     StudentAnswer,
     AssignedExam,
     ParsedQuestion,
     ExamSubmitOptions,
     AutoSaveResponse,
     GetSavedAnswersResponse,
     RestoreAnswersResponse,
     CompactAnswersResponse,
     SessionProgressResponse,
     PeriodicBackupResponse
} from "@/types";
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
          } catch {
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

               return response.data;
          } catch (error: unknown) {
               // Check if error is due to existing active session
               const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
               if (axiosError?.response?.status === 422 &&
                    axiosError?.response?.data?.message?.includes('sesi ujian yang aktif')) {

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

          try {
               const response = await api.post(`/siswa/exams/${examId}/submit`, payload, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

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
               }

               return response.data;
          } catch (error: unknown) {
               console.error('Submit exam error:', error);

               // Handle specific error cases
               if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

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

          try {
               const response = await api.post('/siswa/exam-session/update-answer', payload, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

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
               }
          } catch {
               // Errors are expected during session force end
          }

          // Always clear local storage
          localStorage.removeItem('session_token');
          localStorage.removeItem('session_id');
          localStorage.removeItem('exam_result');
          localStorage.removeItem('current_exam_slug');
     },

     // Clear all exam sessions - useful for logout or when all exams completed
     clearAllExamSessions: async (): Promise<void> => {
          // Clear all session-related data
          if (typeof window !== 'undefined') {
               localStorage.removeItem('session_token');
               localStorage.removeItem('session_id');
               localStorage.removeItem('exam_result');
               localStorage.removeItem('current_exam_slug');
               localStorage.removeItem('exam_id');
               localStorage.removeItem('exam_duration');
          }
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

     // Get saved answers from temporary table (for recovery after refresh)
     // Uses GET endpoint: /api/siswa/exam-session/{sessionId}/answers
     getSavedAnswers: async (sessionId: number): Promise<Record<number, StudentAnswer>> => {
          if (!sessionId || sessionId <= 0) {
               return {};
          }

          try {

               // Backend might return two different formats:
               // Format 1: {success: true, data: {session_id, answers, essay_answers}}
               // Format 2: {session_id, session_status, answers, essay_answers} (direct)
               interface DirectResponseFormat {
                    session_id: number;
                    session_status: string;
                    exam_title: string;
                    answers: Record<string, string>;
                    essay_answers: Record<string, string>;
                    is_empty: boolean;
               }

               const response = await api.get<GetSavedAnswersResponse | DirectResponseFormat>(`/siswa/exam-session/${sessionId}/answers`, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               const savedAnswers: Record<number, StudentAnswer> = {};

               // Handle both response formats
               let answersData: Record<string, string> | undefined;
               let essayAnswersData: Record<string, string> | undefined;
               let isEmpty: boolean;

               // Check if it's wrapped format (has 'success' field)
               const isWrappedFormat = 'success' in response.data && response.data.success;
               const isDirectFormat = 'session_id' in response.data && !('success' in response.data);

               if (isWrappedFormat && 'data' in response.data && response.data.data) {
                    // Format 1: Wrapped format
                    answersData = response.data.data.answers;
                    essayAnswersData = response.data.data.essay_answers;
                    isEmpty = response.data.data.is_empty;
               } else if (isDirectFormat) {
                    // Format 2: Direct format (backend return langsung tanpa wrapper)
                    const directData = response.data as DirectResponseFormat;
                    answersData = directData.answers;
                    essayAnswersData = directData.essay_answers;
                    isEmpty = directData.is_empty;
               } else {
                    console.error('Unknown response format:', response.data);
                    return {};
               }

               // Skip if empty
               if (isEmpty) {
                    return {};
               }

               // Process multiple choice answers
               if (answersData && typeof answersData === 'object' && !Array.isArray(answersData)) {
                    Object.entries(answersData).forEach(([questionIdStr, answerValue]) => {
                         const questionId = parseInt(questionIdStr);
                         const answerStr = String(answerValue || '');

                         if (answerStr.trim()) {
                              // Convert "B,C,D" to ["B", "C", "D"] or keep single "A"
                              const parsedAnswer = answerStr.includes(',')
                                   ? answerStr.split(',').map(a => a.trim()).filter(a => a)
                                   : answerStr;

                              savedAnswers[questionId] = {
                                   question_id: questionId,
                                   answer: parsedAnswer
                              };
                         }
                    });
               }

               // Process essay answers
               if (essayAnswersData && typeof essayAnswersData === 'object' && !Array.isArray(essayAnswersData)) {
                    Object.entries(essayAnswersData).forEach(([questionIdStr, answerValue]) => {
                         const questionId = parseInt(questionIdStr);
                         const essayAnswer = String(answerValue || '');

                         if (essayAnswer.trim()) {
                              savedAnswers[questionId] = {
                                   question_id: questionId,
                                   answer: essayAnswer
                              };
                         }
                    });
               }

               return savedAnswers;
          } catch (error) {
               console.error('❌ Failed to fetch saved answers:', error);
               // Don't throw error - gracefully handle by returning empty object
               // This allows exam to continue even if restore fails
               return {};
          }
     },

     // Get compact answers (smaller payload, JSON string format)
     // Uses GET endpoint: /api/siswa/exam-session/{sessionId}/compact-answers
     getCompactAnswers: async (sessionId: number): Promise<Record<number, StudentAnswer>> => {
          if (!sessionId || sessionId <= 0) {
               return {};
          }

          try {
               const response = await api.get<CompactAnswersResponse>(`/siswa/exam-session/${sessionId}/compact-answers`, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               const savedAnswers: Record<number, StudentAnswer> = {};

               if (response.data?.success && response.data?.data?.answers) {
                    // Parse JSON string
                    const answersObject = JSON.parse(response.data.data.answers);

                    Object.entries(answersObject).forEach(([questionIdStr, answerValue]) => {
                         const questionId = parseInt(questionIdStr);
                         const answerStr = String(answerValue || '');

                         if (answerStr.trim()) {
                              const parsedAnswer = answerStr.includes(',')
                                   ? answerStr.split(',').map(a => a.trim()).filter(a => a)
                                   : answerStr;

                              savedAnswers[questionId] = {
                                   question_id: questionId,
                                   answer: parsedAnswer
                              };
                         }
                    });
               }

               return savedAnswers;
          } catch (error) {
               console.error('❌ Failed to fetch compact answers:', error);
               return {};
          }
     },

     // Get session progress
     // Uses GET endpoint: /api/siswa/exam-session/{sessionId}/progress
     getSessionProgress: async (sessionId: number): Promise<SessionProgressResponse['data'] | null> => {
          if (!sessionId || sessionId <= 0) {
               return null;
          }

          try {
               const response = await api.get<SessionProgressResponse>(`/siswa/exam-session/${sessionId}/progress`, {
                    headers: {
                         Authorization: `Bearer ${localStorage.getItem('api_token')}`
                    }
               });

               if (response.data?.success) {
                    return response.data.data;
               }

               return null;
          } catch (error) {
               console.error('❌ Failed to fetch session progress:', error);
               return null;
          }
     },

     // Restore answers using backup endpoint (POST /api/siswa/exam-session/restore-answers)
     // This is more aggressive - it can restore even expired sessions back to progress
     restoreAnswersFromBackup: async (
          sessionId: number,
          answers: Record<number, StudentAnswer>,
          questions: ParsedQuestion[]
     ): Promise<RestoreAnswersResponse> => {
          if (!sessionId || sessionId <= 0) {
               throw new Error('Invalid session ID for restore');
          }

          try {
               // Separate multiple choice and essay answers
               const multipleChoiceAnswers: Record<string, string> = {};
               const essayAnswers: Record<string, string> = {};

               Object.values(answers).forEach(answer => {
                    const question = questions.find(q => q.id === answer.question_id);

                    if (question && answer.answer !== undefined && answer.answer !== null && answer.answer !== '') {
                         if (question.question_type_id === "3") {
                              // Essay question
                              const essayAnswer = Array.isArray(answer.answer)
                                   ? answer.answer.join(', ')
                                   : String(answer.answer || '');

                              if (essayAnswer.trim()) {
                                   essayAnswers[answer.question_id.toString()] = essayAnswer.substring(0, 5000);
                              }
                         } else {
                              // Multiple choice questions
                              let mcAnswer = '';

                              if (Array.isArray(answer.answer)) {
                                   mcAnswer = answer.answer.filter(a => a !== '').join(',');
                              } else {
                                   mcAnswer = String(answer.answer || '');
                              }

                              if (mcAnswer.trim()) {
                                   multipleChoiceAnswers[answer.question_id.toString()] = mcAnswer.substring(0, 10);
                              }
                         }
                    }
               });

               // Prepare payload according to backend requirements
               const payload = {
                    session_id: sessionId,
                    answers_json: JSON.stringify(multipleChoiceAnswers),
                    essay_json: JSON.stringify(essayAnswers)
               };

               const response = await api.post<RestoreAnswersResponse>(
                    '/siswa/exam-session/restore-answers',
                    payload,
                    {
                         headers: {
                              Authorization: `Bearer ${localStorage.getItem('api_token')}`
                         }
                    }
               );

               if (!response.data?.success) {
                    throw new Error('Restore failed: Invalid response from server');
               }

               return response.data;
          } catch (error) {
               console.error('❌ Failed to restore answers from backup:', error);
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

     // Periodic backup using save-answers endpoint
     // This saves all current answers periodically (e.g., every 2 minutes)
     saveAnswersBackup: async (
          sessionId: number,
          answers: Record<number, StudentAnswer>,
          questions: ParsedQuestion[]
     ): Promise<PeriodicBackupResponse> => {
          if (!sessionId || sessionId <= 0) {
               return { success: false, message: 'Invalid session ID' };
          }

          try {
               // Separate multiple choice and essay answers
               const multipleChoiceAnswers: Record<string, string> = {};
               const essayAnswers: Record<string, string> = {};

               Object.values(answers).forEach(answer => {
                    const question = questions.find(q => q.id === answer.question_id);

                    if (question && answer.answer !== undefined && answer.answer !== null && answer.answer !== '') {
                         if (question.question_type_id === "3") {
                              // Essay question
                              const essayAnswer = Array.isArray(answer.answer)
                                   ? answer.answer.join(', ')
                                   : String(answer.answer || '');

                              if (essayAnswer.trim()) {
                                   essayAnswers[answer.question_id.toString()] = essayAnswer.substring(0, 5000);
                              }
                         } else {
                              // Multiple choice questions
                              let mcAnswer = '';

                              if (Array.isArray(answer.answer)) {
                                   mcAnswer = answer.answer.filter(a => a !== '').join(',');
                              } else {
                                   mcAnswer = String(answer.answer || '');
                              }

                              if (mcAnswer.trim()) {
                                   multipleChoiceAnswers[answer.question_id.toString()] = mcAnswer.substring(0, 10);
                              }
                         }
                    }
               });

               // Skip backup if no answers to save
               if (Object.keys(multipleChoiceAnswers).length === 0 && Object.keys(essayAnswers).length === 0) {
                    return { success: true, message: 'No answers to backup' };
               }

               // Prepare payload
               const payload = {
                    session_id: sessionId,
                    answers_json: JSON.stringify(multipleChoiceAnswers),
                    essay_json: JSON.stringify(essayAnswers)
               };

               const response = await api.post<PeriodicBackupResponse>(
                    '/siswa/exam-session/save-answers',
                    payload,
                    {
                         headers: {
                              Authorization: `Bearer ${localStorage.getItem('api_token')}`
                         }
                    }
               );

               return response.data || {
                    success: true,
                    message: 'Backup created successfully'
               };
          } catch (error) {
               console.error('❌ Failed to create backup:', error);
               if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number; data?: unknown } };
                    console.error('Backup error response:', {
                         status: axiosError.response?.status,
                         data: axiosError.response?.data
                    });
               }
               // Don't throw - backup failure shouldn't block the exam
               return {
                    success: false,
                    message: 'Backup failed but exam can continue'
               };
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