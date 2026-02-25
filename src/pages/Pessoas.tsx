import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Person {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  type: string;
  status: string;
  worker?: { role: string; function: string };
}

export function Pessoas() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ type: "" as string, q: "" });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.q.trim()) params.set("q", filter.q.trim());

    api
      .get<Person[]>(`/people?${params}`)
      .then((res) => setPeople(res.data))
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, [filter.type, filter.q]);

  if (loading) return <div className="loading">Carregando pessoas...</div>;
  if (error) return <div className="error">Erro: {error}</div>;

  return (
    <div className="page">
      <h1>Pessoas</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="Buscar por nome, email ou telefone..."
          value={filter.q}
          onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          className="search-input"
        />
        <select
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Todos</option>
          <option value="worker">Trabalhadores</option>
          <option value="participant">Participantes</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Função / Role</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.fullName}</td>
                <td>{p.email ?? "—"}</td>
                <td>{p.phone ?? "—"}</td>
                <td><span className="badge">{p.type}</span></td>
                <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                <td>
                  {p.worker
                    ? `${p.worker.function} (${p.worker.role})`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {people.length === 0 && (
        <p className="empty">Nenhuma pessoa encontrada.</p>
      )}
    </div>
  );
}
