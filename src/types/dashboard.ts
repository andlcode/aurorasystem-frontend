export interface DashboardTotals {
  totalClasses: number;
  activeParticipants: number;
  sessionsThisMonth: number;
  averageAttendance: number;
  totalStudents: number;
  totalTeamMembers: number;
  attendanceRate: number;
  totalAttendanceRecords: number;
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

export interface AttendanceByParticipantItem {
  participantId: string;
  participantName: string;
  className: string | null;
  attendanceRate: number;
  presentCount: number;
  totalAttendanceRecords: number;
}

export interface ConsecutiveAbsenceItem {
  participantId: string;
  participantName: string;
  className: string | null;
  consecutiveAbsences: number;
  lastSessionDate: string | null;
}

export interface RecentSessionItem {
  sessionId: string;
  classId: string;
  className: string;
  date: string;
  presentCount: number;
  absentCount: number;
}

export interface AttendanceByDayItem {
  day: number;
  label: string;
  averageAttendance: number;
  totalRecords: number;
}

export interface StatusDistributionItem {
  status: "present" | "absent" | "justified";
  label: string;
  count: number;
  percentage: number;
}

export interface MostActiveClassItem {
  classId: string;
  className: string;
  sessionCount: number;
  totalAttendanceRecords: number;
  attendanceRate: number;
}

export interface NewStudentItem {
  participantId: string;
  participantName: string;
  email: string | null;
  classId: string;
  className: string;
  joinedAt: string;
}

export interface StatisticsClassOption {
  id: string;
  name: string;
}

export interface StatisticsFiltersState {
  from: string | null;
  to: string | null;
  classId: string | null;
  status: "all" | "present" | "absent" | "justified";
}

export interface DashboardResponse {
  totals: DashboardTotals;
  attendanceByClass: AttendanceByClassItem[];
  attendanceByMonth: AttendanceByMonthItem[];
  attendanceByParticipant: AttendanceByParticipantItem[];
  consecutiveAbsences: ConsecutiveAbsenceItem[];
  attendanceByDay: AttendanceByDayItem[];
  statusDistribution: StatusDistributionItem[];
  topAbsences: TopAbsenceItem[];
  mostActiveClasses: MostActiveClassItem[];
  newStudentsRecently: NewStudentItem[];
  recentSessions: RecentSessionItem[];
  filters: {
    availableClasses: StatisticsClassOption[];
    selected: StatisticsFiltersState;
  };
}
