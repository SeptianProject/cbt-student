'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRandomizedQuestions } from '@/hooks/useRandomizedQuestions';
import { useAppSelector } from '@/store/hooks';
import { ChevronDown, ChevronUp, Info, Shuffle } from 'lucide-react';

/**
 * Debug component untuk menampilkan informasi randomization
 * Hanya tampil di development mode
 */
export const RandomizationDebugInfo: React.FC = () => {
     const [isExpanded, setIsExpanded] = useState(false);
     const randomizedQuestions = useRandomizedQuestions();
     const { randomizationData } = useAppSelector((state) => state.exam);

     // Hanya tampil di development mode
     if (process.env.NODE_ENV !== 'development' || !randomizedQuestions.isRandomized) {
          return null;
     }

     // Create debug info from available data
     const debugInfo = {
          isRandomized: randomizedQuestions.isRandomized,
          seed: randomizationData?.seed || null,
          totalQuestions: randomizedQuestions.questions.length,
          totalOriginalQuestions: randomizedQuestions.originalQuestions.length,
          sampleMapping: randomizationData ?
               Object.fromEntries(
                    Array.from(randomizationData.originalToRandomizedMap.entries()).slice(0, 5)
                         .map(([orig, rand]: [number, number]) => [`Q${orig + 1}`, `Q${rand + 1}`])
               ) : null
     };

     return (
          <Card className="mb-4 p-3 bg-yellow-50 border-yellow-200">
               <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-2"
               >
                    <div className="flex items-center gap-2">
                         <Shuffle className="w-4 h-4 text-yellow-600" />
                         <span className="text-sm font-medium text-yellow-800">
                              Randomization Info (Dev Mode)
                         </span>
                    </div>
                    {isExpanded ? (
                         <ChevronUp className="w-4 h-4 text-yellow-600" />
                    ) : (
                         <ChevronDown className="w-4 h-4 text-yellow-600" />
                    )}
               </Button>

               {isExpanded && (
                    <div className="mt-3 space-y-3 text-sm">
                         <div className="grid grid-cols-2 gap-4">
                              <div>
                                   <div className="font-medium text-yellow-800 mb-1">Status</div>
                                   <div className="flex items-center gap-2">
                                        <Info className="w-3 h-3 text-green-500" />
                                        <span className="text-green-700">
                                             {debugInfo.isRandomized ? 'Active' : 'Disabled'}
                                        </span>
                                   </div>
                              </div>

                              <div>
                                   <div className="font-medium text-yellow-800 mb-1">Seed</div>
                                   <div className="text-yellow-700 font-mono text-xs">
                                        {debugInfo.seed || 'N/A'}
                                   </div>
                              </div>
                         </div>

                         <div>
                              <div className="font-medium text-yellow-800 mb-1">Questions</div>
                              <div className="text-yellow-700">
                                   Total: {debugInfo.totalQuestions} |
                                   Original: {debugInfo.totalOriginalQuestions}
                              </div>
                         </div>

                         {debugInfo.sampleMapping && (
                              <div>
                                   <div className="font-medium text-yellow-800 mb-2">Sample Mapping</div>
                                   <div className="bg-white rounded p-2 border border-yellow-200">
                                        <div className="space-y-1 text-xs font-mono">
                                             {Object.entries(debugInfo.sampleMapping).map(([original, randomized]) => (
                                                  <div key={original} className="flex justify-between">
                                                       <span className="text-blue-600">{original}:</span>
                                                       <span className="text-green-600">{randomized}</span>
                                                  </div>
                                             ))}
                                        </div>
                                   </div>
                              </div>
                         )}

                         <div className="pt-2 border-t border-yellow-200">
                              <div className="text-xs text-yellow-600">
                                   💡 Randomization memastikan setiap siswa mendapat urutan soal yang berbeda
                                   namun tetap konsisten setiap kali masuk ujian yang sama.
                              </div>
                         </div>
                    </div>
               )}
          </Card>
     );
};

export default RandomizationDebugInfo;
