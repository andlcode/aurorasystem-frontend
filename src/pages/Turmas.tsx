import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Class {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  quantidade?: number;
  status: string;
  owner: { fullName: string };
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
    api
      .get<Class[]>("/classes")
      .then((res) => setClasses(res.data))
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, []);

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (loading) return <div className="loading">Carregando turmas...</div>;
  if (error) return <div className="error">Erro: {error}</div>;

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
        {classes.map((c) => (
          <Link
            key={c.id}
            to={`/turmas/${c.id}`}
            className="card card-link"
          >
            <h3>{c.name}</h3>
            {c.description && <p className="muted">{c.description}</p>}
            <div className="meta">
              <span>{dayNames[c.dayOfWeek]} {c.startTime}{c.endTime ? `–${c.endTime}` : ""}</span>
              <span>{c.owner.fullName}</span>
              {c.quantidade != null && <span>Qtd: {c.quantidade}</span>}
            </div>
          </Link>
        ))}
      </div>
      {classes.length === 0 && (
        <p className="empty">Nenhuma turma encontrada.</p>
      )}
    </div>
  );
}
