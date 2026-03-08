import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

interface ClassInfo {
  id: string;
  name: string;
  day?: number;
  time?: string;
  responsible?: { name: string };
}

interface SessionItem {
  id: string;
  sessionDate: string;
  present: number;
  absent: number;
  justified: number;
  participantCount: number;
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function HistoricoTurma() {
  const { classId } = useParams<{ classId: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentMonth = () =>
    `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
  const [monthFilter, setMonthFilter] = useState<string>(currentMonth());

  const loadClass = useCallback(async () => {
    if (!classId) return null;
    const res = await api.get<ClassInfo[]>("/classes");
    return res.data.find((c) => c.id === classId) ?? null;
  }, [classId]);

  const loadSessions = useCallback(async () => {
    if (!classId) return;
    try {
      const params = monthFilter ? `?month=${monthFilter}` : "";
      const res = await api.get<SessionItem[]>(
        `/classes/${classId}/sessions${params}`
      );
      setSessions(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao carregar histórico"
      );
      setSessions([]);
    }
  }, [classId, monthFilter]);

  useEffect(() => {
    if (!classId) return;
    loadClass()
      .then(setClassInfo)
      .catch(() => setClassInfo(null))
      .finally(() => setLoading(false));
  }, [classId, loadClass]);

  useEffect(() => {
    if (classId) loadSessions();
  }, [classId, loadSessions]);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dayName = dayNames[date.getDay()];
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} (${dayName})`;
  };


  if (loading) return <div className="loading">Carregando...</div>;
  if (!classInfo) return <div className="error">Turma não encontrada.</div>;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/turmas" className="back-link">
          ← Turmas
        </Link>
        <h1>Histórico – {classInfo.name}</h1>
      </div>

      <div className="meta">
        {classInfo.day != null && (
          <span>
            {dayNames[classInfo.day]} {classInfo.time ?? ""}
          </span>
        )}
        {classInfo.responsible && (
          <span>{classInfo.responsible?.name ?? ""}</span>
        )}
      </div>

      <div className="filters" style={{ marginTop: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="muted" style={{ fontSize: "0.875rem" }}>Mês:</span>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="search-input"
            style={{ maxWidth: "180px" }}
          />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMonthFilter("")}
        >
          Todos os meses
        </button>
        <Link
          to={`/turmas/${classId}/chamada`}
          className="btn btn-primary"
        >
          Fazer chamada
        </Link>
      </div>

      {error && <p className="error-inline">{error}</p>}

      <section className="section">
        <h2>Sessões</h2>
        {sessions.length === 0 ? (
          <p className="empty">Nenhuma sessão encontrada.</p>
        ) : (
          <div className="session-list">
            {sessions.map((s) => (
              <div key={s.id} className="session-item" style={{ padding: "0.75rem 1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="date">{formatDate(s.sessionDate)}</span>
                    <div className="meta" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                      <span>Presentes: {s.present}</span>
                      <span>Ausentes: {s.absent}</span>
                      <span>Justificados: {s.justified}</span>
                    </div>
                  </div>
                  <Link
                    to={`/turmas/${classId}/chamada/${s.id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Ver / Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
