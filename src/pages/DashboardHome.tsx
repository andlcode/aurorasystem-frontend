import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { BarChart } from "../components/dashboard/BarChart";
import { LineChart } from "../components/dashboard/LineChart";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { useAuth } from "../context/AuthContext";
import type { DashboardResponse } from "../types/dashboard";

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

function formatDate(date: string | null) {
  if (!date) {
    return "Nunca";
  }

  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<DashboardResponse>("/stats/dashboard");

        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError("Não foi possível carregar o dashboard de presença.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const isEmpty = useMemo(() => {
    if (!data) {
      return false;
    }

    return (
      data.totals.totalClasses === 0 &&
      data.attendanceByClass.length === 0 &&
      data.topAbsences.length === 0 &&
      data.recentSessions.length === 0
    );
  }, [data]);

  return (
    <div className="page dashboard-page">
      <div className="page-header dashboard-page__header">
        <div>
          <p className="muted dashboard-page__eyebrow">Visão geral</p>
          <h1>Dashboard de presença</h1>
          <p className="muted dashboard-page__subtitle">
            Acompanhe frequência, sessões recentes e participantes com maior índice de faltas.
          </p>
        </div>
        <div className="dashboard-page__actions">
          {user?.role === "super_admin" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/turmas/nova")}
            >
              Criar turma
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/alunos/novo")}
          >
            Adicionar aluno
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/alunos")}
          >
            Ver alunos
          </button>
        </div>
      </div>

      {loading && <div className="loading">Carregando métricas do dashboard...</div>}

      {!loading && error && <div className="error">{error}</div>}

      {!loading && !error && data && (
        <>
          <section className="dashboard-summary-grid">
            <SummaryCard
              title="Total de turmas"
              value={numberFormatter.format(data.totals.totalClasses)}
              subtitle="Turmas com acesso neste painel"
            />
            <SummaryCard
              title="Participantes ativos"
              value={numberFormatter.format(data.totals.activeParticipants)}
              subtitle="Participantes vinculados às turmas"
            />
            <SummaryCard
              title="Sessões no mês"
              value={numberFormatter.format(data.totals.sessionsThisMonth)}
              subtitle="Sessões registradas no mês atual"
            />
            <SummaryCard
              title="Presença média geral"
              value={`${percentFormatter.format(data.totals.averageAttendance)}%`}
              subtitle="Presenças sobre o total de registros"
            />
          </section>

          {isEmpty ? (
            <div className="empty">
              Ainda não há sessões ou presenças suficientes para compor o dashboard.
            </div>
          ) : (
            <>
              <section className="dashboard-grid">
                <article className="card dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Presença média por turma</h2>
                      <p className="muted">Comparativo atual das turmas cadastradas.</p>
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

                <article className="card dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Evolução mensal da presença</h2>
                      <p className="muted">Histórico consolidado dos últimos meses.</p>
                    </div>
                  </div>
                  <LineChart
                    items={data.attendanceByMonth.map((item) => ({
                      label: item.label,
                      value: item.averageAttendance,
                    }))}
                  />
                </article>
              </section>

              <section className="dashboard-grid dashboard-grid--tables">
                <article className="card dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Participantes com mais faltas</h2>
                      <p className="muted">Ranking por ausências registradas.</p>
                    </div>
                  </div>
                  {data.topAbsences.length === 0 ? (
                    <div className="empty">Nenhuma falta registrada até o momento.</div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Nome</th>
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

                <article className="card dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <h2>Últimas sessões realizadas</h2>
                      <p className="muted">Sessões ordenadas da mais recente para a mais antiga.</p>
                    </div>
                  </div>
                  {data.recentSessions.length === 0 ? (
                    <div className="empty">Nenhuma sessão registrada ainda.</div>
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
