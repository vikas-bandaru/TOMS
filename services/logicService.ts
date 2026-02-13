import { TrainingSession } from '../types';

// Rule 1: Student Year & Batch Inference
export const inferStudentYear = (rollNo: string): 1 | 2 | 3 | 4 | null => {
  if (!rollNo) return null;
  const r = rollNo.trim().toUpperCase();
  if (r.startsWith('25')) return 1;
  if (r.startsWith('24')) return 2;
  if (r.startsWith('23')) return 3;
  if (r.startsWith('22')) return 4;
  return null;
};

// Rule 2: Time Slot Parsing (FN/AN Logic)
export const getTimeSlot = (session: 'FN' | 'AN', year: number) => {
  if (session === 'FN') {
    // 3rd Year starts earlier (Rule from Section 1)
    if (year === 3) return { start: '09:00', end: '12:40' };
    
    // 1st & 2nd Year (Strict Rule: 09:55 start)
    return { start: '09:55', end: '12:40' };
  } else {
    // AN Session (Strict Rule: 01:20 pm to 04:00 pm)
    return { start: '13:20', end: '16:00' };
  }
};

// Rule 4: Universal Assessment Normalization (FI/EI)
export const normalizeScore = (
  vendor: 'Instacks' | 'Suntek' | 'SmartInterviews' | 'CCC',
  columnName: string,
  obtained: number,
  max: number
): { type: 'FI' | 'EI'; normalizedScore: number } => {
  let type: 'FI' | 'EI' = 'FI';
  
  const col = columnName.toLowerCase();
  
  if (vendor === 'Instacks') {
    if (col.includes('conceptual') || col.includes('snippet')) type = 'FI';
    else if (col.includes('basic coding') || col.includes('intermediate') || col.includes('advanced')) type = 'EI';
  } else {
    // Smart Interviews / Suntek / CCC
    if (col.includes('mcq') || col.includes('homework')) type = 'FI';
    else if (col.includes('contest') || col.includes('leetcode') || col.includes('daily')) type = 'EI';
  }

  const normalizedScore = (obtained / max) * 100;
  return { type, normalizedScore };
};

// Scheduler Conflict Check
export const checkConflict = (newSession: TrainingSession, existingSessions: TrainingSession[]): boolean => {
  return existingSessions.some(session => {
    if (session.date !== newSession.date) return false;
    if (session.venue !== newSession.venue) return false;
    if (session.status === 'CANCELLED') return false;
    
    // Check time overlap
    const newStart = parseInt(newSession.startTime.replace(':', ''));
    const newEnd = parseInt(newSession.endTime.replace(':', ''));
    const existingStart = parseInt(session.startTime.replace(':', ''));
    const existingEnd = parseInt(session.endTime.replace(':', ''));

    // Returns true if there is an overlap
    return (newStart < existingEnd && newEnd > existingStart);
  });
};

// Calculate minutes difference (actual - scheduled)
export const calculateMinutesDifference = (scheduled: string, actual: string): number => {
  if (!scheduled || !actual) return 0;
  const [sH, sM] = scheduled.split(':').map(Number);
  const [aH, aM] = actual.split(':').map(Number);
  
  const schedMins = sH * 60 + sM;
  const actualMins = aH * 60 + aM;
  
  return actualMins - schedMins;
};