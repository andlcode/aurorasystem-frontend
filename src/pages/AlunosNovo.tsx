import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function AlunosNovo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "COORDENADOR") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/participants", {
        name: fullName.trim(),
        birthDate: birthDate || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        type: "participant",
      });

      navigate("/alunos", { state: { successMessage: "Aluno cadastrado com sucesso" }, replace: true });
    } catch (err: unknown) {
      const res = err as { response?: { data?: { error?: string; details?: unknown } } };
      const msg = res.response?.data?.error ?? "Erro ao cadastrar aluno. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/alunos" className="back-link">
          ← Alunos
        </Link>
        <h1>Adicionar aluno</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <label>
          Nome completo *
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome do aluno"
            required
            autoFocus
          />
        </label>

        <label>
          Data de nascimento
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label>
          Telefone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <Link to="/alunos" className="btn btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Cadastrar aluno"}
          </button>
        </div>
      </form>
    </div>
  );
}
