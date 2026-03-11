import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  getDiaryAttendanceByClasses,
  getStatisticsDashboard,
} from "../api/stats";
import { mapApiToAttendanceMatrix } from "../utils/attendanceMatrix";
import { StatsFilters, type StatsFiltersState } from "../components/statistics/StatsFilters";
import { ClassDiaryCard } from "../components/statistics/ClassDiaryCard";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import type { DashboardResponse } from "../types/dashboard";

interface ClassOption {
  id: string;
  name: string;
}

const DEFAULT_FILTERS: StatsFiltersState = {
  classId: null,
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
  const [classesData, setClassesData] = useState<
    ReturnType<typeof mapApiToAttendanceMatrix>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAggregate, setShowAggregate] = useState(false);
  const [aggregateData, setAggregateData] = useState<DashboardResponse | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);

  const isEvangelizador = user?.role === "EVANGELIZADOR";
  const canViewAllClasses = user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR";

  if (
    user &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "COORDENADOR" &&
    user.role !== "EVANGELIZADOR"
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    api
      .get<ClassOption[]>("/classes")
      .then((res) => {
        const classes = res.data.map((c) => ({ id: c.id, name: c.name }));
        setClassOptions(classes);
        if (isEvangelizador && classes.length === 1) {
          setFilters((prev) => ({ ...prev, classId: classes[0].id }));
        }
      })
      .catch(() => setClassOptions([]));
  }, [isEvangelizador]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiData = await getDiaryAttendanceByClasses({
        classId: filters.classId ?? undefined,
        status: "active",
        q: filters.search.trim() || undefined,
      });
      setClassesData(mapApiToAttendanceMatrix(apiData));
    } catch (err) {
      console.error("[Estatisticas] Erro ao carregar estatísticas:", err);
      setError("Não foi possível carregar as estatísticas.");
      setClassesData([]);
    } finally {
      setLoading(false);
    }
  }, [filters.classId, filters.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = useCallback(() => {
    if (isEvangelizador && classOptions.length === 1) {
      setFilters({ ...DEFAULT_FILTERS, classId: classOptions[0].id });
    } else {
      setFilters(DEFAULT_FILTERS);
    }
  }, [isEvangelizador, classOptions]);

  const loadAggregate = useCallback(async () => {
    setAggregateLoading(true);
    try {
      const data = await getStatisticsDashboard({
        classId: filters.classId ?? undefined,
      });
      setAggregateData(data);
    } catch {
      setAggregateData(null);
    } finally {
      setAggregateLoading(false);
    }
  }, [filters.classId]);

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
            Diário de presença por turma. ✓ presente · ✗ falta · P = presenças · F = faltas · FC = faltas consecutivas.
          </p>
        </div>
      </div>

      <StatsFilters
        filters={filters}
        classOptions={classOptions}
        onChange={setFilters}
        onReset={handleResetFilters}
        showAllClassesOption={canViewAllClasses}
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
              <ClassDiaryCard key={classData.classId} classData={classData} />
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
