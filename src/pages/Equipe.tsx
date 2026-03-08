import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { WORKER_ROLE_LABELS } from "../types/auth";

interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
  status: string;
  createdAt: string;
  worker?: { role: string; function: string };
}

export function Equipe() {
  const location = useLocation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
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
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());

    api
      .get<TeamMember[]>(`/team?${params}`)
      .then((res) => setMembers(res.data))
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, [search]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const statusLabel: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
  };

  if (loading) return <div className="loading">Carregando equipe...</div>;
  if (error) return <div className="error">Erro: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Equipe</h1>
        <Link to="/equipe/novo" className="btn btn-primary">
          + Adicionar membro
        </Link>
      </div>

      {successMessage && (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      )}

      <div className="filters">
        <input
          type="search"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Data de criação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.email ?? "—"}</td>
                <td>
                  <span className="badge">
                    {m.worker ? WORKER_ROLE_LABELS[m.worker.role as keyof typeof WORKER_ROLE_LABELS] ?? m.worker.role : "—"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${m.status}`}>
                    {statusLabel[m.status] ?? m.status}
                  </span>
                </td>
                <td>{formatDate(m.createdAt)}</td>
                <td>
                  <Link to={`/equipe/${m.id}/editar`} className="btn btn-sm btn-ghost">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <p className="empty">Nenhum membro na equipe.</p>
      )}
    </div>
  );
}
