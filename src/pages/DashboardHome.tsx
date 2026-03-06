import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="dashboard-home">
      <div className="dashboard-home__container">
        {user?.role === "super_admin" && (
          <button
            type="button"
            className="dashboard-home__btn btn btn-primary"
            onClick={() => navigate("/turmas/nova")}
          >
            Criar Turma
          </button>
        )}
        <button
          type="button"
          className="dashboard-home__btn btn btn-primary"
          onClick={() => navigate("/alunos/novo")}
        >
          Adicionar aluno
        </button>
        <button
          type="button"
          className="dashboard-home__btn btn btn-primary"
          onClick={() => navigate("/alunos")}
        >
          Listar alunos
        </button>
      </div>
    </div>
  );
}
