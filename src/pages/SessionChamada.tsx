import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

interface AttendanceItem {
  id: string;
  participantId: string;
  status: string;
  justificationReason: string | null;
  participant: { id: string; fullName: string };
}

interface AttendanceResponse {
  items: AttendanceItem[];
  total: number;
  present: number;
  absent: number;
  justified: number;
}

export function SessionChamada() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api
      .get<AttendanceResponse>(`/sessions/${sessionId}/attendance`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="loading">Carregando chamada...</div>;
  if (error) return <div className="error">Erro: {error}</div>;
  if (!data) return null;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/turmas" className="back-link">← Turmas</Link>
        <h1>Chamada</h1>
      </div>
      <div className="stats-row">
        <span>Presentes: <strong>{data.present}</strong></span>
        <span>Faltas: <strong>{data.absent}</strong></span>
        <span>Justificadas: <strong>{data.justified}</strong></span>
        <span>Total: <strong>{data.total}</strong></span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>Status</th>
              <th>Justificativa</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((a) => (
              <tr key={a.id}>
                <td>{a.participant.fullName}</td>
                <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                <td>{a.justificationReason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.items.length === 0 && (
        <p className="empty">Nenhuma presença registrada.</p>
      )}
    </div>
  );
}
