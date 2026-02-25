import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLink = (to: string, label: string) => {
    const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`nav-link ${isActive ? "active" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Cadastro
        </Link>
        <nav className="nav">
          {navLink("/turmas", "Turmas")}
          {(user?.role === "admin" || user?.role === "super_admin") &&
            navLink("/pessoas", "Pessoas")}
        </nav>
        <div className="header-actions">
          <span className="user-badge">{user?.fullName ?? user?.role}</span>
          <button type="button" onClick={handleLogout} className="btn btn-ghost">
            Sair
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
