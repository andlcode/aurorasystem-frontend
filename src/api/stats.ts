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
