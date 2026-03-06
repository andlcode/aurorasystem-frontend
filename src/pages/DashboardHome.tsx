import { useNavigate } from "react-router-dom";

export function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-home">
      <div className="dashboard-home__container">
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
