'use client';

import React from 'react';
import QuestionCard from './QuestionCard';
import ExamNavigation from './ExamNavigation';
import { useAppSelector } from '@/store/hooks';
import { ParsedQuestion } from '@/types';

interface ExamMainContentProps {
     currentQuestionIndex: number;
     currentQuestion: ParsedQuestion;
     onAnswerChange: (questionId: number, answer: string | string[]) => void;
     onFlagToggle: (questionId: number, isFlagged: boolean) => void;
     onQuestionSelect: (questionNumber: number) => void;
     onPrevious: () => void;
     onNext: () => void;
     onSubmit: () => void;
     isFirstQuestion: boolean;
     isLastQuestion: boolean;
     isSubmitAllowed: boolean;
}

export const ExamMainContent: React.FC<ExamMainContentProps> = ({
     currentQuestionIndex,
     currentQuestion,
     onAnswerChange,
     onFlagToggle,
     onQuestionSelect,
     onPrevious,
     onNext,
     onSubmit,
     isFirstQuestion,
     isLastQuestion,
     isSubmitAllowed,
}) => {
     const { questions, answers } = useAppSelector((state) => state.exam);

     return (
          <div className="relative max-w-7xl mx-auto px-4 py-6">
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                         <QuestionCard
                              key={`question-${currentQuestion.id}-${currentQuestionIndex}`} // Key unik untuk force re-render
                              question={currentQuestion}
                              questionNumber={currentQuestionIndex + 1}
                              totalQuestions={questions.length}
                              currentAnswer={answers[currentQuestion.id]}
                              onAnswerChange={onAnswerChange}
                              onFlagToggle={onFlagToggle}
                         />
                    </div>

                    <div className="lg:col-span-1">
                         <div className="sticky top-24">
                              <ExamNavigation
                                   totalQuestions={questions.length}
                                   currentQuestion={currentQuestionIndex + 1}
                                   answers={answers}
                                   questions={questions} // Tambahkan questions prop
                                   onQuestionSelect={onQuestionSelect}
                                   onPrevious={onPrevious}
                                   onNext={onNext}
                                   onSubmit={onSubmit}
                                   isLastQuestion={isLastQuestion}
                                   isFirstQuestion={isFirstQuestion}
                                   isSubmitAllowed={isSubmitAllowed}
                              />
                         </div>
                    </div>
               </div>
          </div>
     );
};
