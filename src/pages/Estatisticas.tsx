import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { StatisticsFilters } from "../components/statistics/StatisticsFilters";
import {
  getStatisticsDashboard,
  getStatsStudents,
  getStatsStudentById,
  type StudentStatsSummary,
  type StudentStatsDetail,
} from "../api/stats";
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

  const location = useLocation();
  const initialStudentId = (location.state as { selectedStudentId?: string })?.selectedStudentId ?? null;
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsList, setStudentsList] = useState<StudentStatsSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId);
  const [studentDetail, setStudentDetail] = useState<StudentStatsDetail | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

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

  const loadStudentsList = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const list = await getStatsStudents({
        q: studentSearch || undefined,
        classId: filters.classId ?? undefined,
        from: filters.from ?? undefined,
        to: filters.to ?? undefined,
        status: "active",
      });
      setStudentsList(list);
    } catch {
      setStudentsList([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [studentSearch, filters.classId, filters.from, filters.to]);

  useEffect(() => {
    loadStudentsList();
  }, [loadStudentsList]);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetail(null);
      return;
    }
    let active = true;
    setStudentDetailLoading(true);
    getStatsStudentById(selectedStudentId, {
      classId: filters.classId ?? undefined,
      from: filters.from ?? undefined,
      to: filters.to ?? undefined,
    })
      .then((detail) => {
        if (active) setStudentDetail(detail);
      })
      .catch(() => {
        if (active) setStudentDetail(null);
      })
      .finally(() => {
        if (active) setStudentDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedStudentId, filters.classId, filters.from, filters.to]);

  const rankingByPresence = useMemo(
    () =>
      [...studentsList]
        .filter((s) => s.summary.totalSessions > 0)
        .sort((a, b) => b.summary.attendanceRate - a.summary.attendanceRate)
        .slice(0, 10),
    [studentsList]
  );

  const rankingByAbsences = useMemo(
    () =>
      [...studentsList]
        .filter((s) => s.summary.absentCount > 0)
        .sort((a, b) => b.summary.absentCount - a.summary.absentCount)
        .slice(0, 10),
    [studentsList]
  );

  const rankingByConsecutive = useMemo(
    () =>
      [...studentsList]
        .filter((s) => s.summary.consecutiveAbsences > 0)
        .sort((a, b) => b.summary.consecutiveAbsences - a.summary.consecutiveAbsences)
        .slice(0, 10),
    [studentsList]
  );

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

                <article className="card statistics-section-card">
                  <div className="statistics-section-card__header">
                    <div>
                      <h2>Análise por aluno</h2>
                      <p className="muted">Busque um aluno e visualize a frequência individual.</p>
                    </div>
                  </div>
                  <div className="statistics-student-filters">
                    <input
                      type="search"
                      placeholder="Buscar por nome..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="search-input"
                    />
                    <select
                      value={selectedStudentId ?? ""}
                      onChange={(e) => setSelectedStudentId(e.target.value || null)}
                      disabled={studentsLoading}
                    >
                      <option value="">Selecione um aluno</option>
                      {studentsList.map((s) => (
                        <option key={s.participantId} value={s.participantId}>
                          {s.name}
                          {s.classes.length > 0 ? ` (${s.classes.map((c) => c.name).join(", ")})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {studentDetailLoading && selectedStudentId && (
                    <div className="loading">Carregando detalhes...</div>
                  )}

                  {!studentDetailLoading && studentDetail && (
                    <div className="statistics-student-detail">
                      <h3>{studentDetail.name}</h3>
                      {studentDetail.classes.length > 0 && (
                        <p className="muted">
                          Turma(s): {studentDetail.classes.map((c) => c.name).join(", ")}
                        </p>
                      )}
                      <div className="statistics-student-summary">
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Total de chamadas</span>
                          <strong>{studentDetail.summary.totalSessions}</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Presenças</span>
                          <strong>{studentDetail.summary.presentCount}</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Faltas</span>
                          <strong>{studentDetail.summary.absentCount}</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">% Presença</span>
                          <strong>{percentFormatter.format(studentDetail.summary.attendanceRate)}%</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Faltas consecutivas</span>
                          <strong>{studentDetail.summary.consecutiveAbsences}</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Última presença</span>
                          <strong>{formatDate(studentDetail.summary.lastPresentAt)}</strong>
                        </div>
                        <div className="statistics-student-summary__item">
                          <span className="statistics-student-summary__label">Última falta</span>
                          <strong>{formatDate(studentDetail.summary.lastAbsentAt)}</strong>
                        </div>
                      </div>
                      <div className="statistics-student-bar">
                        <div
                          className="statistics-student-bar__fill statistics-student-bar__fill--present"
                          style={{ width: `${Math.max(studentDetail.summary.attendanceRate, 2)}%` }}
                        />
                      </div>
                      {studentDetail.history.length > 0 && (
                        <div className="statistics-student-history">
                          <h4>Histórico recente</h4>
                          <div className="table-wrap">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Data</th>
                                  <th>Turma</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {studentDetail.history.slice(0, 20).map((h) => (
                                  <tr key={h.sessionId}>
                                    <td>{formatDate(h.date)}</td>
                                    <td>{h.className}</td>
                                    <td>
                                      <span
                                        className={`badge ${
                                          h.status === "present"
                                            ? "present"
                                            : h.status === "absent"
                                              ? "absent"
                                              : "justified"
                                        }`}
                                      >
                                        {h.status === "present"
                                          ? "Presente"
                                          : h.status === "absent"
                                            ? "Ausente"
                                            : "Justificado"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="statistics-rankings-grid">
                    <div>
                      <h4>Maior presença</h4>
                      {rankingByPresence.length === 0 ? (
                        <p className="muted">Nenhum dado no período.</p>
                      ) : (
                        <ul className="statistics-ranking-simple">
                          {rankingByPresence.map((s, i) => (
                            <li key={s.participantId}>
                              {i + 1}. {s.name} – {percentFormatter.format(s.summary.attendanceRate)}%
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4>Mais faltas</h4>
                      {rankingByAbsences.length === 0 ? (
                        <p className="muted">Nenhum dado no período.</p>
                      ) : (
                        <ul className="statistics-ranking-simple">
                          {rankingByAbsences.map((s, i) => (
                            <li key={s.participantId}>
                              {i + 1}. {s.name} – {s.summary.absentCount} falta(s)
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4>Faltas consecutivas</h4>
                      {rankingByConsecutive.length === 0 ? (
                        <p className="muted">Nenhum dado no período.</p>
                      ) : (
                        <ul className="statistics-ranking-simple">
                          {rankingByConsecutive.map((s, i) => (
                            <li key={s.participantId}>
                              {i + 1}. {s.name} – {s.summary.consecutiveAbsences} falta(s)
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

