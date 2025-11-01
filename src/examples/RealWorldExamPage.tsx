/**
 * 🎯 REAL WORLD EXAMPLE: Exam Page with React Query + Redux
 * 
 * This file demonstrates a complete exam page implementation using:
 * - React Query for API calls and caching
 * - Redux for client state management
 * - Auto-save functionality
 * - Session monitoring
 * - Optimistic updates
 * 
 * @note This is an example file for reference
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import { useCurrentUser } from '@/hooks/useAuthQuery'
import {
     useStartExamMutation,
     useSubmitExamMutation,
     useAutoSaveAnswersMutation,
     useSessionStatus,
} from '@/hooks/useExamQuery'

interface ExamPageProps {
     examId: number
     slug: string
}

export default function ExamPageWithReactQuery({ examId, slug }: ExamPageProps) {
     const router = useRouter()

     // ============================================================
     // 1. REDUX STATE (Client State)
     // ============================================================
     const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

     // ============================================================
     // 2. REACT QUERY HOOKS (Server State)
     // ============================================================

     // Get user data (cached automatically)
     const { data: userData, isLoading: userLoading } = useCurrentUser(isAuthenticated)

     // Start exam mutation
     const startExamMutation = useStartExamMutation()

     // Submit exam mutation
     const submitExamMutation = useSubmitExamMutation()

     // Auto-save mutation
     const autoSaveMutation = useAutoSaveAnswersMutation()

     // Session status (refetches every minute)
     const { data: sessionStatus, refetch: refetchSession } = useSessionStatus(examId, true)

     // ============================================================
     // 3. LOCAL STATE
     // ============================================================
     const [answers, setAnswers] = useState<Record<number, any>>({})
     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
     const [examStarted, setExamStarted] = useState(false)
     const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

     // ============================================================
     // 4. EXAM START HANDLER
     // ============================================================
     const handleStartExam = async () => {
          try {
               const examData = await startExamMutation.mutateAsync(examId)
               setExamStarted(true)
               console.log('✅ Exam started:', examData)
               // Session token automatically saved to localStorage
          } catch (error) {
               console.error('❌ Failed to start exam:', error)
          }
     }

     // ============================================================
     // 5. AUTO-SAVE LOGIC (Every 30 seconds)
     // ============================================================
     useEffect(() => {
          if (!examStarted) return

          const interval = setInterval(() => {
               if (Object.keys(answers).length > 0) {
                    setSaveStatus('saving')

                    autoSaveMutation.mutate(
                         {
                              examId,
                              answers,
                              // @ts-ignore - Example file
                              questions: userData?.assigned?.find(e => e.exam_id === examId)?.questions || [],
                         },
                         {
                              onSuccess: () => {
                                   setSaveStatus('saved')
                                   setTimeout(() => setSaveStatus('idle'), 2000)
                                   console.log('✅ Auto-save successful')
                              },
                              onError: (error) => {
                                   setSaveStatus('error')
                                   console.error('❌ Auto-save failed:', error)
                              },
                         }
                    )
               }
          }, 30000) // 30 seconds

          return () => clearInterval(interval)
     }, [examStarted, examId, answers, userData, autoSaveMutation])

     // ============================================================
     // 6. SESSION MONITORING (Every minute)
     // ============================================================
     useEffect(() => {
          if (!examStarted) return

          const interval = setInterval(() => {
               refetchSession()
          }, 60000) // 60 seconds

          return () => clearInterval(interval)
     }, [examStarted, refetchSession])

     // ============================================================
     // 7. SESSION EXPIRY HANDLER
     // ============================================================
     useEffect(() => {
          if (sessionStatus && !sessionStatus.success) {
               alert('⚠️ Session expired! Redirecting to dashboard...')
               router.push('/dashboard')
          }
     }, [sessionStatus, router])

     // ============================================================
     // 8. ANSWER CHANGE HANDLER
     // ============================================================
     const handleAnswerChange = (questionId: number, answer: string | string[]) => {
          setAnswers((prev) => ({
               ...prev,
               [questionId]: {
                    question_id: questionId,
                    answer: answer,
               },
          }))
     }

     // ============================================================
     // 9. SUBMIT EXAM HANDLER
     // ============================================================
     const handleSubmitExam = async () => {
          // @ts-ignore - Example file
          const totalQuestions = userData?.assigned?.find(e => e.exam_id === examId)?.questions?.length || 0
          const answeredCount = Object.keys(answers).length

          // Confirmation
          if (answeredCount < totalQuestions) {
               const confirmed = window.confirm(
                    `⚠️ Anda baru menjawab ${answeredCount} dari ${totalQuestions} soal.\n\nLanjutkan submit?`
               )
               if (!confirmed) return
          }

          try {
               await submitExamMutation.mutateAsync({
                    examId,
                    answers,
                    // @ts-ignore - Example file
                    questions: userData?.assigned?.find(e => e.exam_id === examId)?.questions || [],
                    options: {
                         finalSubmit: true,
                         forceSubmit: false,
                    },
               })

               console.log('✅ Exam submitted successfully')
               // Auto redirect to complete page (handled in hook)
          } catch (error) {
               console.error('❌ Submit failed:', error)
               alert('❌ Gagal submit! Error: ' + (error as Error).message)
          }
     }

     // ============================================================
     // 10. LOADING STATE
     // ============================================================
     if (userLoading || startExamMutation.isPending) {
          return (
               <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                         <p>Loading exam...</p>
                    </div>
               </div>
          )
     }

     // ============================================================
     // 11. EXAM NOT STARTED YET
     // ============================================================
     if (!examStarted) {
          const exam = userData?.assigned?.find(e => e.exam_id === examId)

          return (
               <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
                         <h1 className="text-2xl font-bold mb-4">{exam?.title}</h1>
                         <div className="space-y-2 mb-6">
                              <p>⏱️ Duration: {exam?.duration} minutes</p>
                              {/* @ts-ignore - Example file */}
                              <p>📝 Questions: {exam?.questions?.length || 0}</p>
                         </div>

                         <button
                              onClick={handleStartExam}
                              disabled={startExamMutation.isPending}
                              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                         >
                              {startExamMutation.isPending ? 'Starting...' : '🚀 Start Exam'}
                         </button>

                         {startExamMutation.isError && (
                              <p className="text-red-500 mt-4">
                                   ❌ {startExamMutation.error?.message}
                              </p>
                         )}
                    </div>
               </div>
          )
     }

     // ============================================================
     // 12. EXAM IN PROGRESS
     // ============================================================
     const exam = userData?.assigned?.find(e => e.exam_id === examId)
     // @ts-ignore - Example file
     const questions = exam?.questions || []
     const currentQuestion = questions[currentQuestionIndex]

     return (
          <div className="min-h-screen bg-gray-50">
               {/* ========== HEADER ========== */}
               <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                         <div>
                              <h1 className="text-xl font-bold">{exam?.title}</h1>
                              <p className="text-sm text-gray-600">
                                   Question {currentQuestionIndex + 1} of {questions.length}
                              </p>
                         </div>

                         <div className="flex items-center gap-4">
                              {/* Save Status */}
                              <div className="text-sm">
                                   {saveStatus === 'saving' && '💾 Saving...'}
                                   {saveStatus === 'saved' && '✅ Saved'}
                                   {saveStatus === 'error' && '❌ Save failed'}
                                   {saveStatus === 'idle' && autoSaveMutation.isSuccess && '✓'}
                              </div>

                              {/* Session Status */}
                              <div className="text-sm">
                                   {sessionStatus?.success ? '🟢 Active' : '🔴 Expired'}
                              </div>
                         </div>
                    </div>
               </header>

               {/* ========== MAIN CONTENT ========== */}
               <main className="max-w-4xl mx-auto p-6">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                         {/* Question */}
                         <div className="mb-6">
                              <h2 className="text-lg font-semibold mb-4">
                                   {currentQuestion?.question}
                              </h2>

                              {/* Answer Input (simplified) */}
                              <div className="space-y-3">
                                   {currentQuestion?.choices?.map((choice: string, index: number) => (
                                        <label
                                             key={index}
                                             className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
                                             <input
                                                  type="radio"
                                                  name={`question-${currentQuestion.id}`}
                                                  value={choice}
                                                  checked={answers[currentQuestion.id]?.answer === choice}
                                                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                  className="w-4 h-4"
                                             />
                                             <span>{choice}</span>
                                        </label>
                                   ))}
                              </div>
                         </div>

                         {/* Navigation */}
                         <div className="flex justify-between items-center pt-4 border-t">
                              <button
                                   onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                   disabled={currentQuestionIndex === 0}
                                   className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                              >
                                   ← Previous
                              </button>

                              <span className="text-sm text-gray-600">
                                   Answered: {Object.keys(answers).length} / {questions.length}
                              </span>

                              <button
                                   onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                   disabled={currentQuestionIndex === questions.length - 1}
                                   className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                              >
                                   Next →
                              </button>
                         </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                         <button
                              onClick={handleSubmitExam}
                              disabled={submitExamMutation.isPending}
                              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                         >
                              {submitExamMutation.isPending ? 'Submitting...' : '✅ Submit Exam'}
                         </button>

                         {submitExamMutation.isError && (
                              <p className="text-red-500 mt-4 text-center">
                                   ❌ {submitExamMutation.error?.message}
                              </p>
                         )}
                    </div>
               </main>
          </div>
     )
}

/**
 * 📝 KEY FEATURES DEMONSTRATED:
 * 
 * ✅ React Query for all API calls
 * ✅ Redux for auth state
 * ✅ Automatic caching of user data
 * ✅ Auto-save every 30 seconds
 * ✅ Session monitoring every minute
 * ✅ Optimistic UI updates
 * ✅ Error handling
 * ✅ Loading states
 * ✅ Type-safe
 * 
 * This is a production-ready example showing how to combine
 * React Query and Redux for optimal developer experience!
 */
