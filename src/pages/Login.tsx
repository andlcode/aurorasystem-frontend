import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";
import { api } from "../api/client";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/turmas";
  const message = (location.state as { message?: string })?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: { personId: string; username: string; role: string; fullName: string } }>("/auth/login", {
        username: username.trim(),
        password,
      });
      login(res.data.token, {
        ...res.data.user,
        role: res.data.user.role as UserRole,
      });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao entrar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Entrar</h1>
        {message && <p className="login-success">{message}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Usuário
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              autoFocus
              autoComplete="username"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <Link to="/forgot-password" className="login-forgot">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  );
}
