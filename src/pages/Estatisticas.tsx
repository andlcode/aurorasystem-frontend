import { useEffect, useMemo, useState } from "react";
import { BarChart } from "../components/dashboard/BarChart";
import { LineChart } from "../components/dashboard/LineChart";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { DonutChart } from "../components/statistics/DonutChart";
import { StatisticsFilters } from "../components/statistics/StatisticsFilters";
import { getStatisticsDashboard } from "../api/stats";
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
  const [filters, setFilters] = useState<StatisticsFiltersState>(DEFAULT_FILTERS);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    return data.totals.totalClasses === 0 || data.totals.totalAttendanceRecords === 0;
  }, [data]);

  return (
    <div className="page statistics-page">
      <div className="page-header statistics-page__header">
        <div>
          <p className="muted dashboard-page__eyebrow">Inteligência do sistema</p>
          <h1>Estatísticas</h1>
          <p className="muted statistics-page__subtitle">
            Visão geral de presença, alunos, turmas e engajamento em um painel claro e fácil de acompanhar.
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
          <section className="dashboard-summary-grid">
            <SummaryCard
              title="Total de alunos"
              value={numberFormatter.format(data.totals.totalStudents)}
              subtitle="Participantes ativos dentro do filtro"
            />
            <SummaryCard
              title="Total de turmas"
              value={numberFormatter.format(data.totals.totalClasses)}
              subtitle="Turmas consideradas na análise"
            />
            <SummaryCard
              title="Total da equipe"
              value={numberFormatter.format(data.totals.totalTeamMembers)}
              subtitle="Membros ativos cadastrados"
            />
            <SummaryCard
              title="Taxa de presença"
              value={`${percentFormatter.format(data.totals.attendanceRate)}%`}
              subtitle="Presenças sobre o total de registros"
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
              <section className="statistics-grid statistics-grid--charts">
                <article className="card statistics-panel statistics-panel--wide">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Presença por turma</h2>
                      <p className="muted">Compare rapidamente a média de presença entre as turmas.</p>
                    </div>
                  </div>
                  <BarChart
                    items={data.attendanceByClass.map((item) => ({
                      id: item.classId,
                      label: item.className,
                      value: item.averageAttendance,
                    }))}
                  />
                </article>

                <article className="card statistics-panel statistics-panel--wide">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Presença ao longo do tempo</h2>
                      <p className="muted">Acompanhe a evolução da frequência em uma linha histórica.</p>
                    </div>
                  </div>
                  <LineChart
                    items={data.attendanceByMonth.map((item) => ({
                      label: item.label,
                      value: item.averageAttendance,
                    }))}
                  />
                </article>

                <article className="card statistics-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Distribuição por status</h2>
                      <p className="muted">Resumo percentual entre presentes, ausentes e justificadas.</p>
                    </div>
                  </div>
                  <DonutChart
                    items={data.statusDistribution.map((item) => ({
                      id: item.status,
                      label: item.label,
                      value: item.percentage,
                      color:
                        item.status === "present"
                          ? "#0f766e"
                          : item.status === "absent"
                            ? "#dc2626"
                            : "#64748b",
                    }))}
                  />
                </article>
              </section>

              <section className="statistics-grid statistics-grid--details">
                <article className="card statistics-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Presença por dia</h2>
                      <p className="muted">Entenda quais dias concentram melhor presença.</p>
                    </div>
                  </div>
                  <div className="statistics-list">
                    {data.attendanceByDay.map((item) => (
                      <div key={item.day} className="statistics-list__row">
                        <div className="statistics-list__meta">
                          <strong>{item.label}</strong>
                          <span>{item.totalRecords} registros</span>
                        </div>
                        <div className="statistics-list__bar">
                          <div
                            className="statistics-list__bar-fill"
                            style={{ width: `${Math.max(item.averageAttendance, 2)}%` }}
                          />
                        </div>
                        <strong className="statistics-list__value">
                          {percentFormatter.format(item.averageAttendance)}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="card statistics-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Alunos com mais faltas</h2>
                      <p className="muted">Priorize acompanhamento dos participantes com maior ausência.</p>
                    </div>
                  </div>
                  {data.topAbsences.length === 0 ? (
                    <div className="empty">Nenhuma ausência registrada para os filtros selecionados.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>Faltas</th>
                            <th>Última presença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topAbsences.map((item) => (
                            <tr key={`${item.classId}-${item.participantId}`}>
                              <td>{item.participantName}</td>
                              <td>{item.className}</td>
                              <td>{item.absences}</td>
                              <td>{formatDate(item.lastPresence)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <article className="card statistics-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Turmas mais ativas</h2>
                      <p className="muted">Ranking por volume de sessões e registros de presença.</p>
                    </div>
                  </div>
                  {data.mostActiveClasses.length === 0 ? (
                    <div className="empty">Ainda não há turmas ativas suficientes neste recorte.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Turma</th>
                            <th>Sessões</th>
                            <th>Registros</th>
                            <th>Presença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.mostActiveClasses.map((item) => (
                            <tr key={item.classId}>
                              <td>{item.className}</td>
                              <td>{item.sessionCount}</td>
                              <td>{item.totalAttendanceRecords}</td>
                              <td>{percentFormatter.format(item.attendanceRate)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <article className="card statistics-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Novos alunos adicionados</h2>
                      <p className="muted">Últimos participantes vinculados às turmas monitoradas.</p>
                    </div>
                  </div>
                  {data.newStudentsRecently.length === 0 ? (
                    <div className="empty">Nenhum aluno novo encontrado para este filtro.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>E-mail</th>
                            <th>Entrada</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.newStudentsRecently.map((item) => (
                            <tr key={item.participantId}>
                              <td>{item.participantName}</td>
                              <td>{item.className}</td>
                              <td>{item.email ?? "Sem e-mail"}</td>
                              <td>{formatDate(item.joinedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <article className="card statistics-panel statistics-panel--full">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Sessões recentes</h2>
                      <p className="muted">Últimas sessões realizadas, com presentes e ausentes.</p>
                    </div>
                  </div>
                  {data.recentSessions.length === 0 ? (
                    <div className="empty">Nenhuma sessão recente encontrada.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Turma</th>
                            <th>Data</th>
                            <th>Presentes</th>
                            <th>Ausentes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentSessions.map((item) => (
                            <tr key={item.sessionId}>
                              <td>{item.className}</td>
                              <td>{formatDate(item.date)}</td>
                              <td>{item.presentCount}</td>
                              <td>{item.absentCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
