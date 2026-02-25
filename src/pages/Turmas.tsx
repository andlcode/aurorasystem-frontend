import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface Class {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  status: string;
  owner: { fullName: string };
}

export function Turmas() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <h1>Turmas</h1>
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
