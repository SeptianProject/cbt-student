'use client';

import { ParsedQuestion, StudentAnswer } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flag, FlagOff, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getComplexMultipleChoiceInfo } from '@/lib/examUtils';

interface QuestionCardProps {
     question: ParsedQuestion;
     questionNumber: number;
     totalQuestions: number;
     currentAnswer?: StudentAnswer;
     onAnswerChange: (questionId: number, answer: string | string[]) => void;
     onFlagToggle: (questionId: number, isFlagged: boolean) => void;
}

export default function QuestionCard({
     question,
     questionNumber,
     totalQuestions,
     currentAnswer,
     onAnswerChange,
     onFlagToggle
}: QuestionCardProps) {
     const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
     const [essayAnswer, setEssayAnswer] = useState<string>('');
     const [isFlagged, setIsFlagged] = useState<boolean>(false);

     useEffect(() => {
          // Reset state ketika question berubah
          setSelectedAnswers([]);
          setEssayAnswer('');
          setIsFlagged(false);

          // Set jawaban sesuai dengan currentAnswer yang ada
          if (currentAnswer) {
               if (Array.isArray(currentAnswer.answer)) {
                    setSelectedAnswers(currentAnswer.answer);
               } else {
                    if (question.question_type_id === '3') { // Essay type
                         setEssayAnswer(currentAnswer.answer);
                    } else {
                         setSelectedAnswers([currentAnswer.answer]);
                    }
               }
               setIsFlagged(currentAnswer.is_flagged || false);
          }
     }, [currentAnswer, question.id, question.question_type_id]); // Tambahkan question.id sebagai dependency

     const handleSingleChoice = (optionKey: string) => {
          const newSelectedAnswers = [optionKey];
          setSelectedAnswers(newSelectedAnswers);
          onAnswerChange(question.id, optionKey);
     };

     const handleMultipleChoice = (optionKey: string) => {
          const newAnswers = selectedAnswers.includes(optionKey)
               ? selectedAnswers.filter(ans => ans !== optionKey)
               : [...selectedAnswers, optionKey];

          setSelectedAnswers(newAnswers);
          onAnswerChange(question.id, newAnswers);
     };

     const handleEssayChange = (value: string) => {
          setEssayAnswer(value);
          onAnswerChange(question.id, value);
     };

     const handleFlagToggle = () => {
          const newFlagState = !isFlagged;
          setIsFlagged(newFlagState);
          onFlagToggle(question.id, newFlagState);
     };

     // Get scoring info for complex multiple choice (type '1')
     const complexChoiceInfo = question.question_type_id === '1'
          ? getComplexMultipleChoiceInfo(question.points, question.answer_key)
          : null;



     const renderQuestionType = () => {
          switch (question.question_type_id) {
               case '0':
                    // Pilihan Ganda - Single Choice (Radio Button)
                    return (
                         <div className="space-y-3">
                              <p className="text-sm text-gray-600 mb-4">
                                   <strong>Pilih satu jawaban yang benar:</strong>
                              </p>
                              {Object.entries(question.choices).map(([key, value]) => (
                                   <label
                                        key={key}
                                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAnswers.includes(key)
                                             ? 'border-blue-500 bg-blue-50 shadow-sm'
                                             : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                             }`}
                                   >
                                        <input
                                             type="radio"
                                             name={`question-${question.id}-single`}
                                             value={key}
                                             checked={selectedAnswers.includes(key)}
                                             onChange={() => handleSingleChoice(key)}
                                             className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="flex-1">
                                             <span className="font-medium text-gray-800">{key}.</span>
                                             <span className="ml-2 text-gray-700">{value}</span>
                                        </div>
                                   </label>
                              ))}
                         </div>
                    );

               case '1':
                    // Pilihan Ganda Kompleks - Multiple Choice (Checkbox)
                    return (
                         <div className="space-y-3">
                              <div className="mb-4">
                                   <p className="text-sm text-gray-600 mb-2">
                                        <strong>Pilih semua jawaban yang benar (bisa lebih dari satu):</strong>
                                   </p>
                                   {complexChoiceInfo && (
                                        <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                                             <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                             <div>
                                                  <p className="font-medium mb-1">Sistem Penilaian:</p>
                                                  <p>{complexChoiceInfo.description}</p>
                                                  <p className="mt-1">
                                                       Contoh: Jika Anda memilih 3 pilihan dan 1 diantaranya benar,
                                                       maka nilai Anda = {complexChoiceInfo.pointsPerAnswer} poin
                                                  </p>
                                             </div>
                                        </div>
                                   )}
                              </div>
                              {Object.entries(question.choices).map(([key, value]) => (
                                   <label
                                        key={key}
                                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAnswers.includes(key)
                                             ? 'border-blue-500 bg-blue-50 shadow-sm'
                                             : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                             }`}
                                   >
                                        <input
                                             type="checkbox"
                                             checked={selectedAnswers.includes(key)}
                                             onChange={() => handleMultipleChoice(key)}
                                             className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1">
                                             <span className="font-medium text-gray-800">{key}.</span>
                                             <span className="ml-2 text-gray-700">{value}</span>
                                        </div>
                                   </label>
                              ))}

                              {selectedAnswers.length > 0 && (
                                   <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                             Jawaban yang dipilih:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                             {selectedAnswers.map(answer => (
                                                  <span
                                                       key={answer}
                                                       className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium"
                                                  >
                                                       {answer}
                                                  </span>
                                             ))}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                             Total pilihan: {selectedAnswers.length}
                                        </p>
                                   </div>
                              )}
                         </div>
                    );

               case '2':
                    // Benar Salah - True/False (Radio Button)
                    return (
                         <div className="space-y-3">
                              <p className="text-sm text-gray-600 mb-4">
                                   <strong>Pilih Benar atau Salah:</strong>
                              </p>
                              {Object.entries(question.choices).map(([key, value]) => (
                                   <label
                                        key={key}
                                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAnswers.includes(key)
                                             ? key.toLowerCase().includes('benar') || key.toLowerCase() === 'b' || value.toLowerCase().includes('true')
                                                  ? 'border-green-500 bg-green-50 shadow-sm'
                                                  : 'border-red-500 bg-red-50 shadow-sm'
                                             : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                             }`}
                                   >
                                        <input
                                             type="radio"
                                             name={`question-${question.id}-tf`}
                                             value={key}
                                             checked={selectedAnswers.includes(key)}
                                             onChange={() => handleSingleChoice(key)}
                                             className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="flex-1">
                                             <span className="font-medium text-gray-800">{key}.</span>
                                             <span className="ml-2 text-gray-700">{value}</span>
                                        </div>
                                   </label>
                              ))}
                         </div>
                    );

               case '3':
                    // Essay
                    return (
                         <div className="space-y-3">
                              <p className="text-sm text-gray-600 mb-4">
                                   <strong>Jawab pertanyaan berikut dengan lengkap:</strong>
                              </p>
                              <textarea
                                   value={essayAnswer}
                                   onChange={(e) => handleEssayChange(e.target.value)}
                                   placeholder="Tulis jawaban Anda di sini..."
                                   className="w-full min-h-[200px] p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors"
                              />
                              <p className="text-xs text-gray-500">
                                   Karakter: {essayAnswer.length}
                              </p>
                         </div>
                    );

               default:
                    return (
                         <div className="text-center py-8 text-gray-500">
                              <p>Tipe soal tidak dikenali</p>
                         </div>
                    );
          }
     };

     const getQuestionTypeLabel = () => {
          switch (question.question_type_id) {
               case '0': return 'Pilihan Ganda';
               case '1': return 'Pilihan Ganda Kompleks';
               case '2': return 'Benar Salah';
               case '3': return 'Essay';
               default: return 'Tipe Soal';
          }
     };

     return (
          <Card className="p-6 w-full max-w-4xl mx-auto">
               {/* Header */}
               <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                   {getQuestionTypeLabel()}
                              </span>
                              <span className="text-sm text-gray-500">
                                   {question.points} poin
                              </span>
                         </div>
                         <h3 className="text-lg font-semibold text-gray-800">
                              Soal {questionNumber} dari {totalQuestions}
                         </h3>
                    </div>

                    <Button
                         variant="ghost"
                         size="sm"
                         onClick={handleFlagToggle}
                         className={`flex items-center gap-2 ${isFlagged ? 'text-orange-600 hover:text-orange-700' : 'text-gray-400 hover:text-gray-600'
                              }`}
                    >
                         {isFlagged ? <Flag className="h-4 w-4" /> : <FlagOff className="h-4 w-4" />}
                         {isFlagged ? 'Ditandai' : 'Tandai'}
                    </Button>
               </div>

               {/* Question Text */}
               <div className="mb-6">
                    <div
                         className="text-gray-800 leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: question.question_text }}
                    />
               </div>

               {/* Answer Options */}
               {renderQuestionType()}
          </Card>
     );
}
