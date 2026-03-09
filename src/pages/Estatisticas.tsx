import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  getMonthlyAttendanceStudents,
  getMonthlyAttendanceStudentById,
  getStatisticsDashboard,
  type MonthlyAttendanceStudentOverview,
  type MonthlyAttendanceStudentDetail,
} from "../api/stats";
import { StatsFilters, type StatsFiltersState } from "../components/statistics/StatsFilters";
import { StudentAttendanceCard } from "../components/statistics/StudentAttendanceCard";
import { StudentAttendanceDetail } from "../components/statistics/StudentAttendanceDetail";
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
  const location = useLocation();
  const initialStudentId = (location.state as { selectedStudentId?: string })?.selectedStudentId ?? null;

  const [filters, setFilters] = useState<StatsFiltersState>(DEFAULT_FILTERS);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<MonthlyAttendanceStudentOverview[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [studentDetail, setStudentDetail] = useState<MonthlyAttendanceStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMonthlyAttendanceStudents({
        classId: filters.classId ?? undefined,
        startDate: filters.from ?? undefined,
        endDate: filters.to ?? undefined,
        status: "active",
        q: filters.search.trim() || undefined,
      });
      setStudents(data);
    } catch (err) {
      console.error("[Estatisticas] Erro ao carregar estatísticas mensais:", err);
      setError("Não foi possível carregar as estatísticas.");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.from, filters.to, filters.search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    getMonthlyAttendanceStudentById(selectedStudentId, {
      classId: filters.classId ?? undefined,
      startDate: filters.from ?? undefined,
      endDate: filters.to ?? undefined,
      status: "active",
    })
      .then((detail) => {
        if (active) setStudentDetail(detail);
      })
      .catch(() => {
        if (active) setStudentDetail(null);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedStudentId, filters.classId, filters.from, filters.to]);

  const filteredStudents = useMemo(() => students, [students]);

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

  return (
    <div className="page statistics-page">
      <div className="page-header statistics-page__header">
        <div>
          <h1>Estatísticas</h1>
          <p className="muted statistics-page__subtitle">
            Evolução mensal de presença por aluno. Filtre por turma e período.
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

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="empty">
          Nenhum dado de presença encontrado para os filtros selecionados.
        </div>
      )}

      {!loading && !error && filteredStudents.length > 0 && (
        <section className="statistics-main">
          <h2 className="visually-hidden">Visão mensal por aluno</h2>
          <div className="statistics-students-list">
            {filteredStudents.map((student) => (
              <StudentAttendanceCard
                key={student.participantId}
                student={student}
                isSelected={selectedStudentId === student.participantId}
                onClick={() =>
                  setSelectedStudentId(
                    selectedStudentId === student.participantId ? null : student.participantId
                  )
                }
              />
            ))}
          </div>

          {selectedStudentId && (
            <>
              {detailLoading && (
                <div className="loading" role="status">
                  Carregando detalhes...
                </div>
              )}
              {!detailLoading && studentDetail && (
                <StudentAttendanceDetail
                  detail={studentDetail}
                  onClose={() => setSelectedStudentId(null)}
                />
              )}
            </>
          )}

          <details
            className="statistics-aggregate-section"
            open={showAggregate}
            onToggle={(e) => setShowAggregate((e.target as HTMLDetailsElement).open)}
          >
            <summary className="statistics-aggregate-summary">
              Ver estatísticas agregadas (por turma, mês, etc.)
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
