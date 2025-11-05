/**
 * Image Testing Utilities
 * Helper functions untuk testing fitur gambar pada soal
 */

import { ParsedQuestion } from '@/types';

/**
 * Mock question dengan question_image
 */
export const mockQuestionWithImage: ParsedQuestion = {
     id: 1,
     exam_id: 5,
     question_type_id: '0',
     question_text: 'Perhatikan gambar berikut. Apa nama bunga ini?',
     question_image: 'question_images/flower.jpg',
     choices: {
          'A': 'Mawar',
          'B': 'Melati',
          'C': 'Anggrek',
          'D': 'Tulip'
     },
     choices_images: null,
     answer_key: ['A'],
     points: 10,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Mock question dengan choices_images
 */
export const mockQuestionWithChoiceImages: ParsedQuestion = {
     id: 2,
     exam_id: 5,
     question_type_id: '0',
     question_text: 'Pilih gambar yang menunjukkan segitiga sama sisi:',
     question_image: null,
     choices: {
          'A': 'Gambar A',
          'B': 'Gambar B',
          'C': 'Gambar C',
          'D': 'Gambar D'
     },
     choices_images: {
          'A': 'choice_images/triangle_a.jpg',
          'B': 'choice_images/triangle_b.jpg',
          'C': 'choice_images/triangle_c.jpg',
          'D': 'choice_images/triangle_d.jpg'
     },
     answer_key: ['B'],
     points: 10,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Mock question dengan kedua gambar
 */
export const mockQuestionWithBothImages: ParsedQuestion = {
     id: 3,
     exam_id: 5,
     question_type_id: '0',
     question_text: 'Berdasarkan peta berikut, di manakah letak ibu kota?',
     question_image: 'question_images/map.jpg',
     choices: {
          'A': 'Lokasi A',
          'B': 'Lokasi B',
          'C': 'Lokasi C',
          'D': 'Lokasi D'
     },
     choices_images: {
          'A': 'choice_images/location_a.jpg',
          'B': 'choice_images/location_b.jpg',
          'C': null,
          'D': null
     },
     answer_key: ['C'],
     points: 15,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Mock question tanpa gambar (backward compatibility)
 */
export const mockQuestionWithoutImage: ParsedQuestion = {
     id: 4,
     exam_id: 5,
     question_type_id: '0',
     question_text: 'Apa ibu kota Indonesia?',
     question_image: null,
     choices: {
          'A': 'Jakarta',
          'B': 'Bandung',
          'C': 'Surabaya',
          'D': 'Medan'
     },
     choices_images: null,
     answer_key: ['A'],
     points: 5,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Mock question dengan PG Kompleks dan gambar
 */
export const mockComplexQuestionWithImages: ParsedQuestion = {
     id: 5,
     exam_id: 5,
     question_type_id: '1',
     question_text: 'Pilih semua gambar yang menunjukkan hewan mamalia:',
     question_image: null,
     choices: {
          'A': 'Hewan A',
          'B': 'Hewan B',
          'C': 'Hewan C',
          'D': 'Hewan D'
     },
     choices_images: {
          'A': 'choice_images/animal_a.jpg',
          'B': 'choice_images/animal_b.jpg',
          'C': 'choice_images/animal_c.jpg',
          'D': 'choice_images/animal_d.jpg'
     },
     answer_key: ['A', 'C', 'D'],
     points: 20,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Mock question Benar/Salah dengan gambar
 */
export const mockTrueFalseWithImage: ParsedQuestion = {
     id: 6,
     exam_id: 5,
     question_type_id: '2',
     question_text: 'Perhatikan gambar berikut. Apakah ini merupakan reaksi kimia?',
     question_image: 'question_images/chemical_reaction.jpg',
     choices: {
          'B': 'Benar',
          'S': 'Salah'
     },
     choices_images: null,
     answer_key: ['B'],
     points: 5,
     created_by: 1,
     created_at: '2025-11-01T10:00:00.000000Z',
     updated_at: '2025-11-01T10:00:00.000000Z'
};

/**
 * Get all mock questions untuk testing
 */
export const getAllMockQuestions = (): ParsedQuestion[] => {
     return [
          mockQuestionWithImage,
          mockQuestionWithChoiceImages,
          mockQuestionWithBothImages,
          mockQuestionWithoutImage,
          mockComplexQuestionWithImages,
          mockTrueFalseWithImage
     ];
};

/**
 * Test URL construction untuk gambar
 */
export const testImageUrls = {
     questionImage: 'http://cbt-app.me:8000/storage/question_images/test.jpg',
     choiceImage: 'http://cbt-app.me:8000/storage/choice_images/test.jpg',
     invalidImage: 'http://cbt-app.me:8000/storage/invalid/test.jpg'
};

/**
 * Helper untuk log mock questions
 */
export const logMockQuestions = () => {
     console.group('🧪 Mock Questions for Image Testing');
     console.groupEnd();
};

/**
 * Validate question image fields
 */
export const validateQuestionImageFields = (question: ParsedQuestion): {
     isValid: boolean;
     errors: string[];
} => {
     const errors: string[] = [];

     // Check question_image
     if (question.question_image !== null && question.question_image !== undefined) {
          if (typeof question.question_image !== 'string') {
               errors.push('question_image must be string or null');
          }
     }

     // Check choices_images
     if (question.choices_images !== null && question.choices_images !== undefined) {
          if (typeof question.choices_images !== 'object') {
               errors.push('choices_images must be object or null');
          } else {
               // Validate each choice image
               Object.entries(question.choices_images).forEach(([key, value]) => {
                    if (value !== null && typeof value !== 'string') {
                         errors.push(`choices_images[${key}] must be string or null`);
                    }
               });
          }
     }

     return {
          isValid: errors.length === 0,
          errors
     };
};

/**
 * Test image loading simulation
 */
export const simulateImageLoading = async (url: string, delay: number = 1000): Promise<boolean> => {
     return new Promise((resolve) => {
          setTimeout(() => {
               // Simulate success/failure based on URL
               const success = !url.includes('invalid');
               resolve(success);
          }, delay);
     });
};
