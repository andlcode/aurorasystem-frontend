import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { WORKER_ROLE_OPTIONS, type UserRole } from "../types/auth";

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  status: string;
  role: string;
}

export function EquipeEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    status: "active" as "active" | "inactive",
    role: "EVANGELIZADOR" as UserRole,
  });

  useEffect(() => {
    if (!id) return;
    api
      .get<TeamMember>(`/team/${id}`)
      .then((res) => {
        setMember(res.data);
        setForm({
          name: res.data.name,
          email: res.data.email ?? "",
          status: res.data.status as "active" | "inactive",
          function: res.data.worker?.function ?? "",
          role: (res.data.worker?.role ?? "EVANGELIZADOR") as UserRole,
        });
      })
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/team/${id}`, {
        fullName: form.name,
        email: form.email || null,
        status: form.status,
        role: form.role,
      });
      navigate("/equipe", { state: { successMessage: "Membro atualizado com sucesso." } });
    } catch (err: unknown) {
      const res = err as { response?: { data?: { error?: string } } };
      setError(res.response?.data?.error ?? "Erro ao atualizar membro.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (error && !member) return <div className="error">Erro: {error}</div>;
  if (!member) return <div className="error">Membro não encontrado.</div>;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/equipe" className="back-link">
          ← Equipe
        </Link>
        <h1>Editar membro</h1>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Nome completo *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          Status
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))
            }
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
        <label>
          Role
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value as UserRole,
              }))
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
