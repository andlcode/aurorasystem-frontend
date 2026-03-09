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
