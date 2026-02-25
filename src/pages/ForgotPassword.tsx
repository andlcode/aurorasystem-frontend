import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        usernameOrEmail: usernameOrEmail.trim(),
      });
      setSent(true);
    } catch (err: unknown) {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const message = "Se existir uma conta, enviamos um link para o e-mail cadastrado.";

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Esqueci minha senha</h1>
          <p className="login-subtitle">{message}</p>
          <Link to="/login" className="btn btn-primary" style={{ display: "block", textAlign: "center" }}>
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Esqueci minha senha</h1>
        <p className="login-subtitle">{message}</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Usuário ou e-mail
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="username ou email@exemplo.com"
              required
              autoFocus
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
          <Link to="/login" className="login-forgot">
            Voltar ao login
          </Link>
        </form>
      </div>
    </div>
  );
}
