/**
 * Exam Types
 */

export type ExamType = "unit_test" | "mid_term" | "final" | "practical" | "assignment";

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  batchId: string;
  batchName: string;
  subjectId: string | null;
  subjectName: string | null;
  totalMarks: number;
  passingMarks: number;
  examDate: string;
  isPublished: boolean;
  scoresCount: number;
  createdAt: string;
}

export interface ExamScore {
  id: string;
  studentId: string;
  studentName: string;
  marksObtained: number | null;
  remarks: string | null;
  gradedAt: string;
  gradedBy: string;
  isPassed: boolean;
  grade: string;
}

export interface ExamDetail extends Exam {
  createdByName: string;
  scores: ExamScore[];
  statistics: {
    totalStudents: number;
    totalScored: number;
    totalAbsent: number;
    averageMarks: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
  };
}

export interface StudentForMarks {
  studentId: string;
  studentName: string;
  marksObtained: number | null;
  remarks: string;
  hasScore: boolean;
}

export interface CreateExamInput {
  batchId: string;
  subjectId?: string;
  name: string;
  type: ExamType;
  totalMarks: number;
  passingMarks: number;
  examDate: string;
}

export interface ExamFilters {
  batchId?: string;
  subjectId?: string;
  type?: ExamType;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

export interface SaveScoresInput {
  scores: {
    studentId: string;
    marksObtained: number | null;
    remarks?: string;
  }[];
}

/**
 * Report Card Types
 */
export interface ReportCardExam {
  examId: string;
  examName: string;
  examType: ExamType;
  subjectName: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  grade: string;
  isPassed: boolean;
  remarks: string | null;
}

export interface ReportCard {
  student: {
    id: string;
    name: string;
    batchName: string;
  };
  exams: ReportCardExam[];
}
