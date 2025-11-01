/**
 * 🎯 CONTOH IMPLEMENTASI REACT QUERY + REDUX
 * 
 * File ini menunjukkan berbagai cara menggunakan React Query dan Redux bersama-sama
 * dalam skenario real-world.
 * 
 * @note File ini hanya untuk referensi, tidak digunakan dalam production
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCurrentUser, useLoginMutation, useLogoutMutation } from '@/hooks/useAuthQuery'
import {
     useStartExamMutation,
     useSubmitExamMutation,
     useAutoSaveAnswersMutation,
     useUpdateAnswerMutation,
     useSessionStatus,
     useCheckActiveSession
} from '@/hooks/useExamQuery'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { clearError } from '@/store/authSlice'
import { useEffect, useState } from 'react'

// ============================================================
// 1. LOGIN COMPONENT
// ============================================================
export function LoginExample() {
     const dispatch = useAppDispatch()
     const loginMutation = useLoginMutation()

     // Redux state untuk UI
     const errorMessage = useAppSelector((state) => state.auth.errorMessage)

     const handleLogin = async (email: string, password: string) => {
          // Clear previous errors from Redux
          dispatch(clearError())

          try {
               // React Query mutation
               await loginMutation.mutateAsync({ email, password })
               // ✅ Success: auto redirect ke /dashboard
               // ✅ Token disimpan ke Redux & localStorage
               // ✅ User data di-cache oleh React Query
          } catch (error) {
               console.error('Login failed:', error)
               // Error handling otomatis via Redux
          }
     }

     return (
          <div>
               <button
                    onClick={() => handleLogin('user@test.com', 'password')}
                    disabled={loginMutation.isPending}
               >
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
               </button>

               {loginMutation.isError && (
                    <p className="error">{loginMutation.error?.message}</p>
               )}

               {errorMessage && <p className="error">{errorMessage}</p>}
          </div>
     )
}

// ============================================================
// 2. DASHBOARD WITH CACHED USER DATA
// ============================================================
export function DashboardExample() {
     const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

     // React Query: fetch & cache dashboard data
     const { data, isLoading, error, refetch } = useCurrentUser(isAuthenticated)

     if (isLoading) {
          return <div>Loading dashboard...</div>
     }

     if (error) {
          return (
               <div>
                    <p>Error: {error.message}</p>
                    <button onClick={() => refetch()}>Retry</button>
               </div>
          )
     }

     return (
          <div>
               <h1>Welcome, {data?.student?.name}</h1>
               <p>NIS: {data?.student?.nis}</p>
               <p>Class: {data?.student?.grade_id}</p>

               {/* List assigned exams (dari cache) */}
               <div>
                    <h2>Your Exams</h2>
                    {data?.assigned?.map((exam) => (
                         <div key={exam.exam_id}>
                              {exam.title} - {exam.duration} minutes
                         </div>
                    ))}
               </div>
          </div>
     )
}

// ============================================================
// 3. EXAM START WITH SESSION MANAGEMENT
// ============================================================
export function ExamStartExample({ examId }: { examId: number }) {
     const startExamMutation = useStartExamMutation()
     const checkSessionQuery = useCheckActiveSession(examId, false) // disabled initially

     const handleStartExam = async () => {
          try {
               // Check jika ada active session
               const hasActiveSession = await checkSessionQuery.refetch()

               if (hasActiveSession.data === true) {
                    const confirmRestart = window.confirm('Anda memiliki sesi aktif. Mulai ulang?')
                    if (!confirmRestart) return
               }

               // Start exam
               const examData = await startExamMutation.mutateAsync(examId)
               console.log('Exam started:', examData)

               // ✅ Session token disimpan ke localStorage
               // ✅ Exam data di-cache oleh React Query

          } catch (error) {
               console.error('Failed to start exam:', error)
          }
     }

     return (
          <div>
               <button
                    onClick={handleStartExam}
                    disabled={startExamMutation.isPending}
               >
                    {startExamMutation.isPending ? 'Starting...' : 'Start Exam'}
               </button>

               {startExamMutation.isError && (
                    <p className="error">
                         Failed to start: {startExamMutation.error?.message}
                    </p>
               )}
          </div>
     )
}

// ============================================================
// 4. AUTO-SAVE ANSWERS (Real-time saving)
// ============================================================
export function ExamWithAutoSaveExample({
     examId,
     sessionId,
     questions
}: {
     examId: number
     sessionId: number
     questions: any[]
}) {
     const [answers, setAnswers] = useState<Record<number, any>>({})
     const autoSaveMutation = useAutoSaveAnswersMutation()
     const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

     // Auto-save every 30 seconds
     useEffect(() => {
          const interval = setInterval(() => {
               if (Object.keys(answers).length > 0) {
                    setSaveStatus('saving')

                    autoSaveMutation.mutate(
                         { examId, answers, questions },
                         {
                              onSuccess: () => {
                                   setSaveStatus('saved')
                                   setTimeout(() => setSaveStatus('idle'), 2000)
                              },
                              onError: () => {
                                   setSaveStatus('error')
                              }
                         }
                    )
               }
          }, 30000) // 30 seconds

          return () => clearInterval(interval)
     }, [examId, answers, questions, autoSaveMutation])

     const handleAnswerChange = (questionId: number, answer: string) => {
          setAnswers(prev => ({
               ...prev,
               [questionId]: {
                    question_id: questionId,
                    answer: answer
               }
          }))
     }

     return (
          <div>
               {/* Save Status Indicator */}
               <div className="save-status">
                    {saveStatus === 'saving' && '💾 Saving...'}
                    {saveStatus === 'saved' && '✅ Saved'}
                    {saveStatus === 'error' && '❌ Save failed'}
               </div>

               {/* Questions */}
               {questions.map((question) => (
                    <div key={question.id}>
                         <h3>{question.question}</h3>
                         <input
                              type="text"
                              value={answers[question.id]?.answer || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                         />
                    </div>
               ))}
          </div>
     )
}

// ============================================================
// 5. SINGLE ANSWER UPDATE (Immediate save)
// ============================================================
export function QuestionWithInstantSaveExample({
     sessionId,
     question
}: {
     sessionId: number
     question: any
}) {
     const updateAnswerMutation = useUpdateAnswerMutation()

     const handleAnswerChange = async (answer: string) => {
          try {
               await updateAnswerMutation.mutateAsync({
                    sessionId,
                    questionId: question.id,
                    answer,
                    type: 'choice'
               })
               console.log('Answer saved!')
          } catch (error) {
               console.error('Failed to save answer:', error)
          }
     }

     return (
          <div>
               <p>{question.question}</p>

               {question.choices?.map((choice: any, index: number) => (
                    <label key={index}>
                         <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={choice}
                              onChange={(e) => handleAnswerChange(e.target.value)}
                              disabled={updateAnswerMutation.isPending}
                         />
                         {choice}
                    </label>
               ))}

               {updateAnswerMutation.isPending && <span>Saving...</span>}
               {updateAnswerMutation.isSuccess && <span>✓ Saved</span>}
               {updateAnswerMutation.isError && <span>✗ Failed</span>}
          </div>
     )
}

// ============================================================
// 6. EXAM SUBMIT WITH CONFIRMATION
// ============================================================
export function ExamSubmitExample({
     examId,
     answers,
     questions
}: {
     examId: number
     answers: Record<number, any>
     questions: any[]
}) {
     const submitMutation = useSubmitExamMutation()
     const [showConfirmation, setShowConfirmation] = useState(false)

     const handleSubmit = async () => {
          const answeredCount = Object.keys(answers).length
          const totalQuestions = questions.length

          if (answeredCount < totalQuestions) {
               const confirm = window.confirm(
                    `Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal. Lanjutkan submit?`
               )
               if (!confirm) return
          }

          try {
               await submitMutation.mutateAsync({
                    examId,
                    answers,
                    questions,
                    options: {
                         finalSubmit: true,
                         forceSubmit: false
                    }
               })

               // ✅ Success: auto redirect ke /exam/[slug]/complete
               // ✅ Session data cleared
               // ✅ Exam result di-cache

          } catch (error) {
               console.error('Submit failed:', error)
          }
     }

     return (
          <div>
               <button onClick={handleSubmit} disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Exam'}
               </button>

               {submitMutation.isError && (
                    <div className="error">
                         <p>Submit failed: {submitMutation.error?.message}</p>
                         <button onClick={handleSubmit}>Retry</button>
                    </div>
               )}
          </div>
     )
}

// ============================================================
// 7. SESSION STATUS MONITORING
// ============================================================
export function SessionMonitorExample({ examId }: { examId: number }) {
     const { data: sessionStatus, isLoading, refetch } = useSessionStatus(examId)
     const [lastChecked, setLastChecked] = useState<Date>(new Date())

     // Manual refresh
     useEffect(() => {
          const interval = setInterval(() => {
               refetch()
               setLastChecked(new Date())
          }, 60000) // Check every minute

          return () => clearInterval(interval)
     }, [refetch])

     if (isLoading) {
          return <div>Checking session...</div>
     }

     return (
          <div className="session-monitor">
               <div>
                    Session Status: {sessionStatus?.success ? '🟢 Active' : '🔴 Expired'}
               </div>
               <div>
                    Last checked: {lastChecked.toLocaleTimeString()}
               </div>
               <button onClick={() => refetch()}>Check Now</button>
          </div>
     )
}

// ============================================================
// 8. LOGOUT WITH CACHE CLEAR
// ============================================================
export function LogoutExample() {
     const logoutMutation = useLogoutMutation()

     const handleLogout = async () => {
          const confirm = window.confirm('Yakin ingin logout?')
          if (!confirm) return

          try {
               await logoutMutation.mutateAsync()

               // ✅ Success:
               // - Redux state cleared
               // - localStorage cleared
               // - All React Query cache cleared
               // - Auto redirect ke /

          } catch (error) {
               console.error('Logout failed:', error)
          }
     }

     return (
          <button onClick={handleLogout} disabled={logoutMutation.isPending}>
               {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
     )
}

// ============================================================
// 9. COMPLEX EXAM PAGE (All-in-one)
// ============================================================
export function CompleteExamPageExample({
     examId,
     sessionId
}: {
     examId: number
     sessionId: number
}) {
     // Redux states
     const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

     // React Query hooks
     const { data: userData } = useCurrentUser(isAuthenticated)
     const { data: sessionStatus } = useSessionStatus(examId)
     const submitMutation = useSubmitExamMutation()
     const autoSaveMutation = useAutoSaveAnswersMutation()

     // Local state
     const [answers, setAnswers] = useState<Record<number, any>>({})
     const [currentQuestion, setCurrentQuestion] = useState(0)

     // Auto-save logic
     useEffect(() => {
          const interval = setInterval(() => {
               if (Object.keys(answers).length > 0) {
                    autoSaveMutation.mutate({
                         examId,
                         answers,
                         questions: [] // Replace with actual questions array
                    })
               }
          }, 30000)

          return () => clearInterval(interval)
     }, [examId, answers, autoSaveMutation])

     const handleSubmit = async () => {
          await submitMutation.mutateAsync({
               examId,
               answers,
               questions: [], // Replace with actual questions array
               options: { finalSubmit: true }
          })
     }

     return (
          <div>
               {/* Header */}
               <header>
                    <h1>Exam: {userData?.assigned?.[0]?.title}</h1>
                    <div>
                         Session: {sessionStatus?.success ? 'Active' : 'Expired'}
                    </div>
                    <div>
                         {autoSaveMutation.isPending && '💾 Saving...'}
                         {autoSaveMutation.isSuccess && '✅ Saved'}
                    </div>
               </header>

               {/* Question Display */}
               <main>
                    {/* Question content here */}
               </main>

               {/* Footer */}
               <footer>
                    <button
                         onClick={handleSubmit}
                         disabled={submitMutation.isPending}
                    >
                         {submitMutation.isPending ? 'Submitting...' : 'Submit Exam'}
                    </button>
               </footer>
          </div>
     )
}

// ============================================================
// 10. PREFETCHING DATA (Optimistic loading)
// ============================================================
export function ExamListWithPrefetchExample() {
     const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
     const { data } = useCurrentUser(isAuthenticated)
     const startExamMutation = useStartExamMutation()

     const handleExamHover = (examId: number) => {
          // Prefetch exam data on hover
          startExamMutation.mutate(examId)
     }

     return (
          <div>
               {data?.assigned?.map((exam) => (
                    <div
                         key={exam.exam_id}
                         onMouseEnter={() => handleExamHover(exam.exam_id)}
                    >
                         <h3>{exam.title}</h3>
                         <button>Start Exam</button>
                    </div>
               ))}
          </div>
     )
}

/**
 * 📝 KESIMPULAN:
 * 
 * ✅ Redux untuk: token, isAuthenticated, UI state
 * ✅ React Query untuk: API calls, caching, mutations
 * ✅ Kombinasi keduanya memberikan developer experience terbaik
 * 
 * Benefits:
 * - Automatic caching & revalidation
 * - Optimistic updates
 * - Less boilerplate
 * - Better error handling
 * - Type-safe
 * - DevTools support
 */
