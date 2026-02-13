
export enum Role {
  DIRECTOR = 'DIRECTOR', // God Mode - Approvals
  MANAGEMENT = 'MANAGEMENT', // View Only - Reports
  DEAN = 'DEAN', // View Only - Dept Aggregates
  COORDINATOR = 'COORDINATOR', // Dept View - Schedule/Attendance
  OPS_ADMIN = 'OPS_ADMIN', // Write Access - Setup/Venues
  TRAINER = 'TRAINER', // Write Access - Syllabus/Attendance
  VENDOR_TRAINER = 'VENDOR_TRAINER', // Write Access - Reports
  LAB_ASSISTANT = 'LAB_ASSISTANT', // Verification
  STUDENT = 'STUDENT', // View Profile
  INSTACKS = 'INSTACKS', // Assessment Config
  PLACEMENT = 'PLACEMENT' // Recruiting View
}

export interface User {
  id: string;
  name: string;
  role: Role;
  department?: string; // For Coordinators/Deans
}

export interface TrainingSession {
  id: string;
  topic: string;
  plannedTopics?: string[]; // Granular topics selected by Trainer
  batch: string; // e.g., "CSE-A+B"
  year: 1 | 2 | 3 | 4;
  venue: string;
  trainerId: string;
  trainerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'VERIFIED' | 'CANCELLED';
  isPlacementDrive?: boolean;
  cancellationReason?: string;
  
  // Verification Data
  actualStartTime?: string;
  actualEndTime?: string;
  topicCovered?: boolean; // True if all/major topics covered
  verifiedTopics?: string[]; // Specific topics confirmed by Lab Asst
  isLate?: boolean;
}

export interface MeetingRecord {
  id: string;
  date: string;
  title: string;
  summary: string;
  decisions: string[];
  deadlines: string[];
  isUrgent: boolean; // Triggers Director bypass
  rawText?: string;
}

export interface SyllabusTopic {
  id: string;
  week: number;
  topic: string;
  isCompleted: boolean;
  completionDate?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  rollNo: string;
  dept: string;
  year: number;
  attendance: number; // Percentage
  avgAssessmentScore: number;
  skills: string[];
}

export interface AssessmentMetric {
  studentId: string;
  studentName: string;
  rollNo: string;
  batch: string;
  fiScore: number; // Foundation Index (0-100)
  eiScore: number; // Efficiency Index (0-100)
  vendor: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- New Configuration Types for Semester Setup ---

export interface TrainerMapping {
  trainerId: string;
  name: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'VENDOR';
  courses: string[]; // e.g., ["Java", "Python"]
}

export interface VenueMapping {
  id: string;
  name: string;
  department: string; // "T&P" or "CSE", etc.
  poc: string;
  isExclusiveTnP: boolean;
  capacity: number;
}

export interface CurriculumMapping {
  department: string;
  semester: number; // 1-8
  courses: string[]; // e.g., ["Java Full Stack", "Soft Skills"]
}

export interface TimingRule {
  semester: number; // Changed from year to semester
  session: 'FN' | 'AN' | 'FULL_DAY'; // Added FULL_DAY
  startTime: string;
  endTime: string;
}

export interface TrainingTypeMapping {
  trainingType: 'REGULAR' | 'ADVANCED';
  course: string;
  allowedTrainerTypes: ('INTERNAL' | 'EXTERNAL' | 'VENDOR')[];
}

export interface Student {
  rollNo: string;
  name: string;
}

export interface SectionDetails {
  id: string;
  department: string;
  section: string; // "A", "B", "C"
  semester: number;
  totalStrength: number;
  students: Student[]; // Parsed from file
}

export interface AcademicCalendarDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Monday, Tuesday...
  type: 'INSTRUCTION' | 'HOLIDAY' | 'EXAM';
  description: string;
}
