import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { WORKER_ROLE_LABELS, type UserRole } from "../types/auth";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canManagePeople = user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR";
  const canManageTeam = user?.role === "SUPER_ADMIN";
  const canViewStats =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COORDENADOR" ||
    user?.role === "EVANGELIZADOR";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => [
      canViewStats ? { to: "/estatisticas", label: "Estatísticas" } : null,
      { to: "/turmas", label: "Turmas" },
      canManagePeople ? { to: "/alunos", label: "Alunos" } : null,
      canManageTeam ? { to: "/equipe", label: "Equipe" } : null,
    ].filter((item): item is { to: string; label: string } => item !== null),
    [canManagePeople, canManageTeam, canViewStats]
  );

  const roleLabel = user?.role
    ? WORKER_ROLE_LABELS[user.role as UserRole] ?? user.role
    : "";

  return (
    <div className="layout">
      <header className="header">
        <Link to="/dashboard" className="logo" onClick={() => setIsMenuOpen(false)}>
          Aurora
        </Link>

        <div className="header-controls">
          <button
            type="button"
            className="header-icon-button"
            aria-label="Abrir perfil e navegação"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5 19.5c1.5-3 4.2-4.5 7-4.5s5.5 1.5 7 4.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="header-icon-button"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="header-menu-backdrop"
            aria-label="Fechar menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="header-menu" aria-label="Menu principal">
            <div className="header-menu__profile">
              <strong>{user?.name ?? "Usuário"}</strong>
              <span>{roleLabel}</span>
            </div>

            <nav className="header-menu__nav">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.to || location.pathname.startsWith(item.to + "/");

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`header-menu__link ${isActive ? "active" : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button type="button" onClick={handleLogout} className="header-menu__logout">
              Sair
            </button>
          </aside>
        </>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
