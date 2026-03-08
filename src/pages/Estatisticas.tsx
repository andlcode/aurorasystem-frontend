import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { StatisticsFilters } from "../components/statistics/StatisticsFilters";
import { getStatisticsDashboard } from "../api/stats";
import { useAuth } from "../context/AuthContext";
import type { DashboardResponse, StatisticsFiltersState } from "../types/dashboard";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DEFAULT_FILTERS: StatisticsFiltersState = {
  from: null,
  to: null,
  classId: null,
  status: "all",
};

function formatDate(date: string | null) {
  if (!date) {
    return "Sem registro";
  }

  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

export function Estatisticas() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<StatisticsFiltersState>(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "COORDENADOR") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        setLoading(true);
        setError(null);

        const response = await getStatisticsDashboard({
          from: filters.from ?? undefined,
          to: filters.to ?? undefined,
          classId: filters.classId ?? undefined,
          status: filters.status,
        });

        if (active) {
          setData(response);
        }
      } catch (err) {
        console.error("[Estatisticas] Erro ao carregar estatísticas:", err);
        if (active) {
          setError("Não foi possível carregar as estatísticas no momento.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatistics();

    return () => {
      active = false;
    };
  }, [filters]);

  const isEmpty = useMemo(() => {
    if (!data) {
      return false;
    }

    return data.totals.totalAttendanceRecords === 0;
  }, [data]);

  return (
    <div className="page statistics-page">
      <div className="page-header statistics-page__header">
        <div>
          <h1>Estatísticas</h1>
          <p className="muted statistics-page__subtitle">
            Acompanhe presença, engajamento e sinais de risco em um painel simples e otimizado para mobile.
          </p>
        </div>
      </div>

      <StatisticsFilters
        filters={filters}
        classOptions={data?.filters.availableClasses ?? []}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {loading && <div className="loading">Carregando estatísticas...</div>}

      {!loading && error && <div className="error">{error}</div>}

      {!loading && !error && data && (
        <>
          <section className="statistics-indicators-grid">
            <SummaryCard
              title="Taxa de presença"
              value={`${percentFormatter.format(data.totals.attendanceRate)}%`}
              subtitle="Presenças sobre o total de registros"
            />
            <SummaryCard
              title="Participantes ativos"
              value={numberFormatter.format(data.totals.activeParticipants)}
              subtitle="Alunos ativos no recorte atual"
            />
            <SummaryCard
              title="Registros de presença"
              value={numberFormatter.format(data.totals.totalAttendanceRecords)}
              subtitle="Ocorrências consolidadas no período"
            />
          </section>

          {isEmpty ? (
            <div className="empty">
              Ainda não há dados suficientes para montar as estatísticas com os filtros atuais.
            </div>
          ) : (
            <>
              <section className="statistics-sections">
                <article className="card statistics-section-card">
                  <div className="statistics-section-card__header">
                    <div>
                      <h2>Presença por mês</h2>
                      <p className="muted">Tendência mensal de frequência no período filtrado.</p>
                    </div>
                  </div>
                  <div className="statistics-ranking-list">
                    {data.attendanceByMonth.map((item) => (
                      <div key={item.month} className="statistics-ranking-row">
                        <div className="statistics-ranking-row__meta">
                          <strong>{item.label}</strong>
                          <span>{percentFormatter.format(item.averageAttendance)}% de presença</span>
                        </div>
                        <div className="statistics-ranking-row__bar">
                          <div
                            className="statistics-ranking-row__fill"
                            style={{ width: `${Math.max(item.averageAttendance, 2)}%` }}
                          />
                        </div>
                        <strong className="statistics-ranking-row__value">
                          {percentFormatter.format(item.averageAttendance)}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="card statistics-section-card">
                  <div className="statistics-section-card__header">
                    <div>
                      <h2>Presença por turma</h2>
                      <p className="muted">Compare rapidamente o desempenho de cada turma.</p>
                    </div>
                  </div>
                  {data.attendanceByClass.length === 0 ? (
                    <div className="empty">Nenhuma turma encontrada para o filtro atual.</div>
                  ) : (
                    <div className="statistics-ranking-list">
                      {data.attendanceByClass.map((item) => (
                        <div key={item.classId} className="statistics-ranking-row">
                          <div className="statistics-ranking-row__meta">
                            <strong>{item.className}</strong>
                            <span>Taxa média de presença</span>
                          </div>
                          <div className="statistics-ranking-row__bar">
                            <div
                              className="statistics-ranking-row__fill"
                              style={{ width: `${Math.max(item.averageAttendance, 2)}%` }}
                            />
                          </div>
                          <strong className="statistics-ranking-row__value">
                            {percentFormatter.format(item.averageAttendance)}%
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="card statistics-section-card">
                  <div className="statistics-section-card__header">
                    <div>
                      <h2>Presença por participante</h2>
                      <p className="muted">Participantes ordenados pela taxa de presença.</p>
                    </div>
                  </div>
                  {data.attendanceByParticipant.length === 0 ? (
                    <div className="empty">Nenhum participante com registros no período.</div>
                  ) : (
                    <div className="statistics-ranking-list">
                      {data.attendanceByParticipant.map((item) => (
                        <div key={item.participantId} className="statistics-ranking-row">
                          <div className="statistics-ranking-row__meta">
                            <strong>{item.participantName}</strong>
                            <span>
                              {item.className ? `${item.className} • ` : ""}
                              {item.presentCount}/{item.totalAttendanceRecords} presenças
                            </span>
                          </div>
                          <div className="statistics-ranking-row__bar">
                            <div
                              className="statistics-ranking-row__fill"
                              style={{ width: `${Math.max(item.attendanceRate, 2)}%` }}
                            />
                          </div>
                          <strong className="statistics-ranking-row__value">
                            {percentFormatter.format(item.attendanceRate)}%
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="card statistics-section-card">
                  <div className="statistics-section-card__header">
                    <div>
                      <h2>Faltas consecutivas</h2>
                      <p className="muted">Sinalize rapidamente quem está em risco de afastamento.</p>
                    </div>
                  </div>
                  {data.consecutiveAbsences.length === 0 ? (
                    <div className="empty">Nenhuma sequência de faltas encontrada.</div>
                  ) : (
                    <div className="statistics-risk-list">
                      {data.consecutiveAbsences.map((item) => (
                        <div key={item.participantId} className="statistics-risk-row">
                          <div>
                            <strong>{item.participantName}</strong>
                            <p className="muted">
                              {item.className ? `${item.className} • ` : ""}
                              Última sessão: {formatDate(item.lastSessionDate)}
                            </p>
                          </div>
                          <span className="statistics-risk-row__badge">
                            {item.consecutiveAbsences} falta{item.consecutiveAbsences > 1 ? "s" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

