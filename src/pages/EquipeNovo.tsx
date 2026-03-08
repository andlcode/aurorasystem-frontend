import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { WORKER_ROLE_OPTIONS, type UserRole } from "../types/auth";

export function EquipeNovo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    function: "",
    role: "EVANGELIZADOR" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/team", form);
      navigate("/equipe", { state: { successMessage: "Membro adicionado com sucesso." } });
    } catch (err: unknown) {
      const res = err as { response?: { data?: { error?: string } } };
      setError(res.response?.data?.error ?? "Erro ao adicionar membro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/equipe" className="back-link">
          ← Equipe
        </Link>
        <h1>Adicionar membro à equipe</h1>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Nome completo *
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            required
            placeholder="Nome completo"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@exemplo.com"
          />
        </label>
        <label>
          Username *
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            placeholder="Nome de usuário para login"
          />
        </label>
        <label>
          Senha *
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            placeholder="Mín. 8 caracteres, letras e números"
          />
        </label>
        <label>
          Role
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as UserRole }))
            }
          >
            {WORKER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <Link to="/equipe" className="btn btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}
