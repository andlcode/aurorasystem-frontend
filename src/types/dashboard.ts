export interface DashboardTotals {
  totalClasses: number;
  activeParticipants: number;
  sessionsThisMonth: number;
  averageAttendance: number;
}

export interface AttendanceByClassItem {
  classId: string;
  className: string;
  averageAttendance: number;
}

export interface AttendanceByMonthItem {
  month: string;
  label: string;
  averageAttendance: number;
}

export interface TopAbsenceItem {
  participantId: string;
  participantName: string;
  classId: string;
  className: string;
  absences: number;
  lastPresence: string | null;
}

export interface RecentSessionItem {
  sessionId: string;
  classId: string;
  className: string;
  date: string;
  presentCount: number;
  absentCount: number;
}

export interface DashboardResponse {
  totals: DashboardTotals;
  attendanceByClass: AttendanceByClassItem[];
  attendanceByMonth: AttendanceByMonthItem[];
  topAbsences: TopAbsenceItem[];
  recentSessions: RecentSessionItem[];
}
