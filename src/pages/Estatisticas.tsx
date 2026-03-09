import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  getMonthlyAttendanceByClasses,
  getStatisticsDashboard,
  type ClassMonthlyAttendanceItem,
} from "../api/stats";
import { StatsFilters, type StatsFiltersState } from "../components/statistics/StatsFilters";
import { ClassStatsBlock } from "../components/statistics/ClassStatsBlock";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import type { DashboardResponse } from "../types/dashboard";

interface ClassOption {
  id: string;
  name: string;
}

const DEFAULT_FILTERS: StatsFiltersState = {
  classId: null,
  from: null,
  to: null,
  search: "",
};

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function Estatisticas() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<StatsFiltersState>(DEFAULT_FILTERS);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [classesData, setClassesData] = useState<ClassMonthlyAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAggregate, setShowAggregate] = useState(false);
  const [aggregateData, setAggregateData] = useState<DashboardResponse | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "COORDENADOR") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    api
      .get<ClassOption[]>("/classes")
      .then((res) => setClassOptions(res.data.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => setClassOptions([]));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonthlyAttendanceByClasses({
        classId: filters.classId ?? undefined,
        startDate: filters.from ?? undefined,
        endDate: filters.to ?? undefined,
        status: "active",
        q: filters.search.trim() || undefined,
      });
      setClassesData(data);
    } catch (err) {
      console.error("[Estatisticas] Erro ao carregar estatísticas:", err);
      setError("Não foi possível carregar as estatísticas.");
      setClassesData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.from, filters.to, filters.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const loadAggregate = useCallback(async () => {
    setAggregateLoading(true);
    try {
      const data = await getStatisticsDashboard({
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
        classId: filters.classId ?? undefined,
      });
      setAggregateData(data);
    } catch {
      setAggregateData(null);
    } finally {
      setAggregateLoading(false);
    }
  }, [filters.from, filters.to, filters.classId]);

  useEffect(() => {
    if (showAggregate) {
      loadAggregate();
    }
  }, [showAggregate, loadAggregate]);

  const isEmpty = !loading && !error && classesData.length === 0;

  return (
    <div className="page statistics-page">
      <div className="page-header statistics-page__header">
        <div>
          <h1>Estatísticas</h1>
          <p className="muted statistics-page__subtitle">
            Presença por turma. Apenas meses com chamadas registradas. P = presenças, F = faltas, FC = faltas consecutivas.
          </p>
        </div>
      </div>

      <StatsFilters
        filters={filters}
        classOptions={classOptions}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {loading && (
        <div className="loading" role="status">
          Carregando estatísticas...
        </div>
      )}

      {!loading && error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && isEmpty && (
        <div className="empty">
          Nenhum dado de presença encontrado para os filtros selecionados.
        </div>
      )}

      {!loading && !error && !isEmpty && (
        <section className="statistics-main statistics-main--compact">
          <h2 className="visually-hidden">Estatísticas por turma</h2>
          <div className="statistics-classes-list">
            {classesData.map((classData) => (
              <ClassStatsBlock
                key={classData.classId}
                classData={classData}
                filters={{
                  classId: filters.classId ?? undefined,
                  from: filters.from ?? undefined,
                  to: filters.to ?? undefined,
                }}
              />
            ))}
          </div>

          <details
            className="statistics-aggregate-section"
            open={showAggregate}
            onToggle={(e) => setShowAggregate((e.target as HTMLDetailsElement).open)}
          >
            <summary className="statistics-aggregate-summary">
              Ver estatísticas agregadas
            </summary>
            {showAggregate && (
              <>
                {aggregateLoading && (
                  <div className="loading">Carregando estatísticas agregadas...</div>
                )}
                {!aggregateLoading && aggregateData && (
                  <div className="statistics-indicators-grid">
                    <SummaryCard
                      title="Taxa de presença"
                      value={`${percentFormatter.format(aggregateData.totals.attendanceRate)}%`}
                      subtitle="Presenças sobre o total de registros"
                    />
                    <SummaryCard
                      title="Participantes ativos"
                      value={numberFormatter.format(aggregateData.totals.activeParticipants)}
                      subtitle="Alunos ativos no recorte atual"
                    />
                    <SummaryCard
                      title="Registros de presença"
                      value={numberFormatter.format(aggregateData.totals.totalAttendanceRecords)}
                      subtitle="Ocorrências consolidadas no período"
                    />
                  </div>
                )}
              </>
            )}
          </details>
        </section>
      )}
    </div>
  );
}
