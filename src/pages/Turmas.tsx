import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Class {
  id: string;
  name: string;
  description?: string | null;
  day?: number;
  dayOfWeek?: number;
  time?: string;
  startTime?: string;
  endTime?: string | null;
  status?: string;
  owner?: { fullName: string };
  responsible?: { fullName: string };
  participants?: unknown[];
}

export function Turmas() {
  const location = useLocation();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = (location.state as { successMessage?: string })?.successMessage;
    if (msg) {
      setSuccessMessage(msg);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const requestUrl = `${api.defaults.baseURL ?? ""}/classes`;
    console.log("[Turmas] Chamando endpoint:", requestUrl);
    setError(null);

    api
      .get<Class[]>("/classes")
      .then((res) => {
        console.log("[Turmas] Status HTTP:", res.status);
        console.log("[Turmas] Body retornado:", res.data);
        setClasses(res.data);
      })
      .catch((err) => {
        console.error("[Turmas] Erro ao carregar turmas:", err);
        console.log("[Turmas] Status HTTP de erro:", err.response?.status);
        console.log("[Turmas] Body de erro:", err.response?.data);
        setError(
          err.response?.data?.error ??
            "Erro ao carregar turmas."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (loading) return <div className="loading">Carregando turmas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Turmas</h1>
        {user?.role === "super_admin" && (
          <Link to="/turmas/nova" className="btn btn-primary">
            + Criar Turma
          </Link>
        )}
      </div>

      {successMessage && (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      )}

      <div className="card-grid">
        {classes.map((c) => {
          const dayOfWeek = c.dayOfWeek ?? c.day ?? 0;
          const startTime = c.startTime ?? c.time ?? "";
          const owner = c.owner ?? c.responsible;
          return (
            <div key={c.id} className="card">
              <Link to={`/turmas/${c.id}`} className="card-link-inner">
                <h3>{c.name}</h3>
                {c.description && <p className="muted">{c.description}</p>}
                <div className="meta">
                  <span>{dayNames[dayOfWeek]} {startTime}{c.endTime ? `–${c.endTime}` : ""}</span>
                  <span>{owner?.fullName ?? ""}</span>
                  {c.participants != null && (
                    <span>Participantes: {c.participants.length}</span>
                  )}
                </div>
              </Link>
              <div className="card-actions">
                <Link
                  to={`/turmas/${c.id}/chamada`}
                  className="btn btn-sm btn-primary"
                >
                  Fazer chamada
                </Link>
                <Link
                  to={`/turmas/${c.id}/historico`}
                  className="btn btn-sm btn-ghost"
                >
                  Ver histórico
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {classes.length === 0 && (
        <p className="empty">Nenhuma turma cadastrada ainda.</p>
      )}
    </div>
  );
}
