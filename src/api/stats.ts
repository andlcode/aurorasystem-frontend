import { api } from "./client";
import type { DashboardResponse, StatisticsFiltersState } from "../types/dashboard";

export interface StatisticsQuery {
  from?: string;
  to?: string;
  classId?: string;
  status?: StatisticsFiltersState["status"];
}

export async function getStatisticsDashboard(filters: StatisticsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );

  const response = await api.get<DashboardResponse>("/stats/dashboard", {
    params,
  });

  return response.data;
}

export interface StudentStatsSummary {
  participantId: string;
  name: string;
  classes: Array<{ id: string; name: string }>;
  summary: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    justifiedCount: number;
    attendanceRate: number;
    absenceRate: number;
    consecutiveAbsences: number;
    lastPresentAt: string | null;
    lastAbsentAt: string | null;
  };
}

export interface StudentStatsDetail extends StudentStatsSummary {
  history: Array<{
    sessionId: string;
    date: string;
    className: string;
    status: "present" | "absent" | "justified";
  }>;
}

export interface StudentsStatsQuery {
  q?: string;
  classId?: string;
  from?: string;
  to?: string;
  status?: "all" | "active" | "inactive";
  participantIds?: string;
}

export async function getStatsStudents(filters: StudentsStatsQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<StudentStatsSummary[]>("/stats/students", { params });
  return response.data;
}

export async function getStatsStudentById(
  participantId: string,
  filters?: { classId?: string; from?: string; to?: string }
) {
  const params = Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<StudentStatsDetail>(`/stats/students/${participantId}`, {
    params,
  });
  return response.data;
}

// --- Estatísticas mensais por aluno ---

export interface MonthlyAttendanceItem {
  month: string;
  label: string;
  present: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

export interface MonthlyAttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalSessions: number;
  attendanceRate: number;
  consecutiveAbsences: number;
  lastPresentAt: string | null;
  lastAbsentAt: string | null;
}

export interface MonthlyAttendanceStudentOverview {
  participantId: string;
  name: string;
  classIds: string[];
  classNames: string[];
  summary: MonthlyAttendanceSummary;
  monthly: MonthlyAttendanceItem[];
}

export interface MonthlyAttendanceHistoryItem {
  sessionId: string;
  sessionDate: string;
  classId: string;
  className: string;
  status: "present" | "absent" | "justified";
}

export interface MonthlyAttendanceStudentDetail extends MonthlyAttendanceStudentOverview {
  history: MonthlyAttendanceHistoryItem[];
}

export interface MonthlyAttendanceQuery {
  classId?: string;
  participantId?: string;
  startDate?: string;
  endDate?: string;
  status?: "all" | "active" | "inactive";
  q?: string;
}

export async function getMonthlyAttendanceStudents(filters: MonthlyAttendanceQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<MonthlyAttendanceStudentOverview[]>(
    "/stats/attendance/students/monthly",
    { params }
  );
  return response.data;
}

export async function getMonthlyAttendanceStudentById(
  participantId: string,
  filters?: Omit<MonthlyAttendanceQuery, "participantId">
) {
  const params = Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<MonthlyAttendanceStudentDetail>(
    `/stats/attendance/students/${participantId}/monthly`,
    { params }
  );
  return response.data;
}

// --- Estatísticas agrupadas por turma (compactas) ---

export interface ClassMonthlyStudentItem {
  participantId: string;
  name: string;
  summary: {
    totalPresent: number;
    totalAbsent: number;
    attendanceRate: number;
    consecutiveAbsences: number;
  };
  monthly: Array<{
    month: string;
    label: string;
    present: number;
    absent: number;
  }>;
}

export interface ClassMonthlyAttendanceItem {
  classId: string;
  className: string;
  availableMonths: Array<{ month: string; label: string }>;
  summary: {
    studentCount: number;
    attendanceRate: number;
    totalPresent: number;
    totalAbsent: number;
  };
  students: ClassMonthlyStudentItem[];
}

export async function getMonthlyAttendanceByClasses(filters: MonthlyAttendanceQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<ClassMonthlyAttendanceItem[]>(
    "/stats/attendance/classes/monthly",
    { params }
  );
  return response.data;
}

// --- Diário escolar (presença por data) ---

export interface ClassDiaryMonthItem {
  month: string;
  label: string;
  dates: string[];
}

export interface ClassDiaryStudentItem {
  participantId: string;
  name: string;
  summary: {
    totalPresent: number;
    totalAbsent: number;
    attendanceRate: number;
    consecutiveAbsences: number;
  };
  attendanceByDate: Record<string, "present" | "absent" | "justified">;
}

export interface ClassDiaryItem {
  classId: string;
  className: string;
  summary: {
    studentCount: number;
    attendanceRate: number;
    totalPresent: number;
    totalAbsent: number;
  };
  months: ClassDiaryMonthItem[];
  students: ClassDiaryStudentItem[];
}

export async function getDiaryAttendanceByClasses(filters: MonthlyAttendanceQuery = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value != null && value !== "")
  );
  const response = await api.get<ClassDiaryItem[]>(
    "/stats/attendance/classes/daily",
    { params }
  );
  return Array.isArray(response?.data) ? response.data : [];
}
