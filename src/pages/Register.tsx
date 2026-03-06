import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { UserRole } from "../types/auth";
import { USER_ROLES } from "../types/auth";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Senha deve ter no mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "Senha deve conter letras";
  if (!/\d/.test(password)) return "Senha deve conter números";
  return null;
}

export function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [function_, setFunction_] = useState("");
  const [role, setRole] = useState<UserRole>("worker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const strengthError = validatePassword(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    const secret = import.meta.env.VITE_REGISTER_SECRET;
    if (!secret) {
      setError("Registro não configurado (VITE_REGISTER_SECRET ausente)");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/auth/register",
        {
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim() || undefined,
          password,
          function: function_.trim(),
          role,
        },
        {
          headers: { "x-register-secret": secret },
        }
      );
      navigate("/login", { state: { message: "Cadastro realizado. Faça login." }, replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Erro ao cadastrar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Cadastrar usuário</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Nome completo
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome completo"
              required
              autoFocus
            />
          </label>
          <label>
            Usuário
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              autoComplete="username"
            />
          </label>
          <label>
            E-mail (opcional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              autoComplete="email"
            />
          </label>
          <label>
            Senha (mín. 8 caracteres, letras e números)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
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
          <label>
            Função
            <input
              type="text"
              value={function_}
              onChange={(e) => setFunction_(e.target.value)}
              placeholder="Ex: Professor, Coordenador"
              required
            />
          </label>
          <label>
            Perfil
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
          <Link to="/login" className="login-forgot">
            Já tenho conta – Entrar
          </Link>
        </form>
      </div>
    </div>
  );
}
