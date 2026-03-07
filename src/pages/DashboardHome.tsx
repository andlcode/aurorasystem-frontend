import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface DashboardShortcut {
  id: string;
  title: string;
  description: string;
  accent: string;
  to: string;
}

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const primaryModules: DashboardShortcut[] = [
    {
      id: "alunos",
      title: "Alunos",
      description: "Gerencie cadastros, vínculos com turmas e situação dos participantes.",
      accent: "A",
      to: "/alunos",
    },
    {
      id: "turmas",
      title: "Turmas",
      description: "Organize turmas, responsáveis, sessões e fluxo de presença.",
      accent: "T",
      to: "/turmas",
    },
    ...(user?.role === "super_admin"
      ? [
          {
            id: "equipe",
            title: "Equipe",
            description: "Administre contas, permissões e responsáveis pelo sistema.",
            accent: "E",
            to: "/equipe",
          },
        ]
      : []),
  ];

  const quickActions: DashboardShortcut[] = [
    {
      id: "novo-aluno",
      title: "Cadastrar aluno",
      description: "Adicione um novo participante ao sistema em poucos passos.",
      accent: "+",
      to: "/alunos/novo",
    },
    ...(user?.role === "super_admin"
      ? [
          {
            id: "nova-turma",
            title: "Criar turma",
            description: "Cadastre uma nova turma e defina o responsável inicial.",
            accent: "+",
            to: "/turmas/nova",
          },
        ]
      : []),
  ];

  return (
    <div className="page dashboard-home-page">
      <div className="page-header dashboard-home-page__header">
        <div>
          <p className="muted dashboard-page__eyebrow">Central de gerenciamento</p>
          <h1>Bem-vindo ao sistema</h1>
          <p className="muted dashboard-home-page__subtitle">
            Escolha um módulo para gerenciar alunos, turmas e equipe de forma rápida e organizada.
          </p>
        </div>
      </div>

      <section className="dashboard-home-section">
        <div className="dashboard-home-section__header">
          <h2>Módulos principais</h2>
          <p className="muted">Acesse rapidamente as áreas principais do sistema.</p>
        </div>

        <div className="dashboard-home-grid">
          {primaryModules.map((item) => (
            <button
              key={item.id}
              type="button"
              className="dashboard-home-card"
              onClick={() => navigate(item.to)}
            >
              <span className="dashboard-home-card__icon">{item.accent}</span>
              <div className="dashboard-home-card__content">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-home-section">
        <div className="dashboard-home-section__header">
          <h2>Ações rápidas</h2>
          <p className="muted">Atalhos para tarefas frequentes do dia a dia.</p>
        </div>

        <div className="dashboard-home-grid dashboard-home-grid--compact">
          {quickActions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="dashboard-home-card dashboard-home-card--compact"
              onClick={() => navigate(item.to)}
            >
              <span className="dashboard-home-card__icon">{item.accent}</span>
              <div className="dashboard-home-card__content">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
