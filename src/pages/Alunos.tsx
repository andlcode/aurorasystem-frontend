import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";

interface Person {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  type: string;
  status: string;
}

export function Alunos() {
  const location = useLocation();
  const [alunos, setAlunos] = useState<Person[]>([]);
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
    params.set("type", "participant");
    if (search.trim()) params.set("q", search.trim());

    api
      .get<Person[]>(`/people?${params}`)
      .then((res) => setAlunos(res.data))
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, [search]);

  if (loading) return <div className="loading">Carregando alunos...</div>;
  if (error) return <div className="error">Erro: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Alunos</h1>
        <Link to="/alunos/novo" className="btn btn-primary">
          + Adicionar aluno
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
          placeholder="Buscar por nome, email ou telefone..."
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
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id}>
                <td>{a.fullName}</td>
                <td>{a.email ?? "—"}</td>
                <td>{a.phone ?? "—"}</td>
                <td><span className={`badge ${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alunos.length === 0 && (
        <p className="empty">Nenhum aluno cadastrado.</p>
      )}
    </div>
  );
}
