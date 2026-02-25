import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Senha deve ter no mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "Senha deve conter letras";
  if (!/\d/.test(password)) return "Senha deve conter números";
  return null;
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const strengthError = validatePassword(newPassword);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    if (!token) {
      setError("Token inválido. Solicite um novo link de recuperação.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      navigate("/login", { state: { message: "Senha atualizada" }, replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao alterar senha.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Redefinir senha</h1>
          <p className="login-subtitle">
            Link inválido. Solicite um novo link de recuperação.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Redefinir senha</h1>
        <p className="login-subtitle">
          Digite sua nova senha (mín. 8 caracteres, letras e números).
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Nova senha
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Alterando..." : "Alterar senha"}
          </button>
          <Link to="/login" className="login-forgot">
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}
