type Role = 'admin' | 'kepala' | 'guru' | 'siswa';

type Gender = 'L' | 'P';

type SchoolStatus = 'active' | 'inactive';

export interface User {
     id: number;
     name: string;
     email: string;
     token: string;
     role: Role;
     is_active: boolean;
}

export interface School {
     id: number;
     name: string;
     npsn: string;
     address: string;
     phone: string;
     email: string;
     code: string;
     logo: string;
     status: SchoolStatus;
}

export interface AssignedExam {
     exam_id: number;
     title: string;
     duration: number;
     total_quest: number;
}

export interface Student {
     id: number;
     user_id: number;
     school_id: number;
     nis: string;
     name: string;
     gender: Gender;
     grade_id: number;
     p_birth: string;
     d_birth: string;
     address: string;
     photo: string;
     user: User;
     school: School;
}

export interface Question {
     id: number;
     exam_id: number;
     question_type_id: string; // "0": Multiple Choice (Single), "1": Multiple Choice Complex, "2": True/False, "3": Essay
     question_text: string;
     choices: string; // JSON string: {"A": "option A", "B": "option B", ...}
     answer_key: string; // JSON string array: "[\"A\",\"C\"]" for multiple choice
     points: string; // String format: "15.00"
     created_by: number; // User ID
     created_at: string;
     updated_at: string;
}

export interface ParsedQuestion {
     id: number;
     exam_id: number;
     question_type_id: string;
     question_text: string;
     choices: Record<string, string>; // Parsed choices object
     answer_key: string[]; // Parsed answer key array
     points: number; // Parsed points as number
     created_by: number;
     created_at: string;
     updated_at: string;
}

export interface ExamSession {
     id: number;
     student_id: number;
     exam_id: number;
     start_time: string;
     end_time?: string;
     remaining_time: number; // in seconds
     status: 'progress' | 'submitted' | 'expired' | 'cancelled';
}

export interface StudentAnswer {
     question_id: number;
     answer: string | string[]; // Can be single answer or multiple for complex questions
     is_flagged?: boolean; // For marking questions for review
}

export interface DashboardExam {
     success: boolean;
     student: Student;
     assigned: AssignedExam[];
}

export interface Exam {
     success: boolean;
     exam: Question[];
     session_token?: string;
     session_id?: number;
}

export interface ExamData {
     success: boolean;
     exam: ParsedQuestion[];
     session: ExamSession;
}

export interface ApiResponse<T> {
     success: boolean;
     data: T;
     message?: string;
}

export interface ExamSubmitResult {
     success: boolean;
     message: string;
     data: {
          session_id: number;
          exam_title: string;
          grade: {
               description: string;
               letter: string;
          };
          percentage: number;
          max_score: number;
          total_score: number;
          total_questions: number;
          answered_questions: number;
          unanswered_questions: number;
          submission_time: string;
          score_breakdown: {
               multiple_choice: {
                    correct: number;
                    total: number;
                    score: number;
                    max_score: number;
               };
               essay: {
                    answered: number;
                    max_score: number;
                    score: number;
                    total: number;
               };
               true_false: {
                    correct: number;
                    total: number;
                    score: number;
                    max_score: number;
               };
               complex_multiple: {
                    correct: number;
                    total: number;
                    score: number;
                    max_score: number;
               };
          };
          detailed_results: Array<{
               question_id: number;
               question_type: number;
               question_type_label: string;
               student_answer: string | string[];
               correct_answer: string | string[];
               is_correct: boolean;
               is_answered: boolean;
               earned_points: number;
               points: number;
          }>;
     };
}

export interface SessionStatus {
     success: boolean;
     data: {
          session_id: number;
          status: 'progress' | 'submitted' | 'expired' | 'cancelled';
          time_remaining: number;
          started_at: string;
          end_time: string;
          is_expired: boolean;
     };
     message?: string;
}

export interface ExamSubmitOptions {
     forceSubmit?: boolean;
     finalSubmit?: boolean;
}

export interface AutoSaveResponse {
     success: boolean;
     message: string;
     data?: {
          saved_answers: number;
          last_saved_at: string;
     };
}

export interface RestoreAnswersResponse {
     success: boolean;
     message: string;
     data: {
          session_id: number;
          session_status: 'progress' | 'submitted' | 'expired' | 'cancelled';
          restored_at: string;
          stats: {
               total_answered: number;
               multiple_choice_answered: number;
               essay_answered: number;
          };
     };
}

export interface GetSavedAnswersResponse {
     success: boolean;
     data: {
          session_id: number;
          session_status: 'progress' | 'submitted' | 'expired' | 'cancelled';
          exam_title: string;
          answers: Record<string, string>; // { "1": "A", "2": "B", "3": "C" }
          essay_answers: Record<string, string>; // { "5": "Jawaban essay..." }
          total_answered: number;
          last_answered_at: string;
          is_empty: boolean;
     };
}

export interface CompactAnswersResponse {
     success: boolean;
     data: {
          session_id: number;
          answers: string; // JSON string: "{\"1\":\"A\",\"2\":\"B\",\"3\":\"C\"}"
          size_bytes: number;
     };
}

export interface SessionProgressResponse {
     success: boolean;
     data: {
          session_id: number;
          exam_title: string;
          status: 'progress' | 'submitted' | 'expired' | 'cancelled';
          total_questions: number;
          progress_percent: number;
          time_remaining: number;
          answer_stats: {
               total_answered: number;
               multiple_choice_answered: number;
               essay_answered: number;
          };
     };
}

export interface PeriodicBackupResponse {
     success: boolean;
     message?: string;
     data?: {
          session_id: number;
          total_saved: number;
          last_backup_at: string;
     };
}
