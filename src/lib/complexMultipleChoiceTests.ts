/**
 * Test cases untuk sistem penilaian Complex Multiple Choice
 * Jalankan di browser console untuk testing manual
 */

// Import fungsi (untuk testing manual di console)
// import { calculateComplexMultipleChoiceScore, getComplexMultipleChoiceInfo } from '@/lib/examUtils';

/**
 * Test cases berdasarkan contoh di dokumentasi
 */
const testCases = [
  {
    name: "Soal 3 poin, 2 jawaban benar (A,C), siswa pilih A,C",
    totalPoints: 3,
    correctAnswers: ["A", "C"],
    selectedAnswers: ["A", "C"],
    expectedScore: 3.0,
  },
  {
    name: "Soal 3 poin, 2 jawaban benar (A,C), siswa pilih A,B,C",
    totalPoints: 3,
    correctAnswers: ["A", "C"],
    selectedAnswers: ["A", "B", "C"],
    expectedScore: 1.5,
  },
  {
    name: "Soal 3 poin, 2 jawaban benar (A,C), siswa pilih B,D,E",
    totalPoints: 3,
    correctAnswers: ["A", "C"],
    selectedAnswers: ["B", "D", "E"],
    expectedScore: 0,
  },
  {
    name: "Soal 3 poin, 2 jawaban benar (A,C), siswa pilih A",
    totalPoints: 3,
    correctAnswers: ["A", "C"],
    selectedAnswers: ["A"],
    expectedScore: 1.5,
  },
  {
    name: "Soal 5 poin, 4 jawaban benar, siswa pilih 2 benar",
    totalPoints: 5,
    correctAnswers: ["A", "B", "D", "E"],
    selectedAnswers: ["A", "B", "C"],
    expectedScore: 2.5, // (5/4) * 2 = 2.5
  },
];

/**
 * Jalankan test cases
 */
function runTests() {
  testCases.forEach((testCase) => {
    // Uncomment this line when testing in browser with actual imports:
    // const actualScore = calculateComplexMultipleChoiceScore(
    //      testCase.totalPoints,
    //      testCase.correctAnswers,
    //      testCase.selectedAnswers
    // );
    // Mock implementation for documentation purposes
    // const pointsPerAnswer = testCase.totalPoints / testCase.correctAnswers.length;
    // const correctSelected = testCase.selectedAnswers.filter(answer =>
    //      testCase.correctAnswers.includes(answer)
    // ).length;
    // const actualScore = Math.round((pointsPerAnswer * correctSelected) * 100) / 100;
  });
}

/**
 * Test getComplexMultipleChoiceInfo function
 */
function testScoringInfo() {
  // const testInfo = {
  //      totalPoints: 3,
  //      correctAnswers: ["A", "C"]
  // };
  // Mock implementation
  // const pointsPerAnswer = Math.round((testInfo.totalPoints / testInfo.correctAnswers.length) * 100) / 100;
}

// Export for manual testing
if (typeof window !== "undefined") {
  (
    window as typeof window & { testComplexMultipleChoice: unknown }
  ).testComplexMultipleChoice = {
    runTests,
    testScoringInfo,
    testCases,
  };
}

// For Node.js testing (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runTests,
    testScoringInfo,
    testCases,
  };
}
