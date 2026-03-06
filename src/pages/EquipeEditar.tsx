import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

interface TeamMember {
  id: string;
  fullName: string;
  email: string | null;
  status: string;
  worker?: { role: string; function: string };
}

export function EquipeEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    status: "active" as "active" | "inactive",
    function: "",
    role: "worker" as "worker" | "evangelizador" | "super_admin",
  });

  useEffect(() => {
    if (!id) return;
    api
      .get<TeamMember>(`/team/${id}`)
      .then((res) => {
        setMember(res.data);
        setForm({
          fullName: res.data.fullName,
          email: res.data.email ?? "",
          status: res.data.status as "active" | "inactive",
          function: res.data.worker?.function ?? "",
          role: (res.data.worker?.role ?? "worker") as "worker" | "evangelizador" | "super_admin",
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
        fullName: form.fullName,
        email: form.email || null,
        status: form.status,
        function: form.function,
        ...(form.role !== "super_admin" && { role: form.role }),
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
          Função *
          <input
            type="text"
            value={form.function}
            onChange={(e) => setForm((f) => ({ ...f, function: e.target.value }))}
            required
            placeholder="Ex: Evangelizador, Coordenador"
          />
        </label>
        <label>
          Role
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value as "worker" | "evangelizador" | "super_admin",
              }))
            }
          >
            <option value="worker">Trabalhador</option>
            <option value="evangelizador">Evangelizador</option>
            {member.worker?.role === "super_admin" && (
              <option value="super_admin">Super Admin</option>
            )}
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
