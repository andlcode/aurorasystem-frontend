import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { ModuleGrid } from "../components/dashboard/ModuleGrid";
import { QuickActions } from "../components/dashboard/QuickActions";
import { TodayClassCard } from "../components/dashboard/TodayClassCard";

interface DashboardShortcut {
  id: string;
  title: string;
  to: string;
  icon: ReactNode;
}

interface DashboardClass {
  id: string;
  name: string;
  day?: number;
  time?: string;
  responsibleUserId?: string;
}

const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function DashboardHome() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Bem-vindo";
  const [todayClass, setTodayClass] = useState<DashboardClass | null>(null);
  const [todayClassError, setTodayClassError] = useState<string | null>(null);
  const canManagePeople = user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR";
  const canManageTeam = user?.role === "SUPER_ADMIN";
  const canCreateClasses = canManagePeople;

  useEffect(() => {
    api
      .get<DashboardClass | null>("/classes/today")
      .then((response) => {
        setTodayClass(response.data);
        setTodayClassError(null);
      })
      .catch((err) => {
        console.error("[DashboardHome] Erro ao carregar turmas do dia:", err);
        setTodayClass(null);
        setTodayClassError(err.response?.data?.error ?? "Não foi possível verificar a turma de hoje.");
      });
  }, []);

  const primaryModules: DashboardShortcut[] = [
    {
      id: "turmas",
      title: "Turmas",
      to: "/turmas",
      icon: <ClassesIcon />,
    },
    ...(canManagePeople
      ? [
          {
            id: "alunos",
            title: "Alunos",
            to: "/alunos",
            icon: <StudentsIcon />,
          },
          {
            id: "estatisticas",
            title: "Estatísticas",
            to: "/estatisticas",
            icon: <StatisticsIcon />,
          },
        ]
      : []),
    ...(canManageTeam
      ? [
          {
            id: "equipe",
            title: "Equipe",
            to: "/equipe",
            icon: <TeamIcon />,
          },
        ]
      : []),
  ];

  const quickActions: DashboardShortcut[] = [
    ...(canManagePeople
      ? [
          {
            id: "novo-aluno",
            title: "+ Cadastrar aluno",
            to: "/alunos/novo",
            icon: <AddUserIcon />,
          },
        ]
      : []),
    ...(canCreateClasses
      ? [
          {
            id: "nova-turma",
            title: "+ Criar turma",
            to: "/turmas/nova",
            icon: <AddClassIcon />,
          },
        ]
      : []),
  ];

  return (
    <div className="page dashboard-home-page">
      <DashboardHeader title={`Olá, ${firstName} 👋`} />

      <div className="dashboard-home-page__content">
        {todayClass ? (
          <TodayClassCard
            className={todayClass.name}
            weekdayLabel={dayNames[todayClass.day ?? 0]}
            time={todayClass.time ?? "--:--"}
            to={`/turmas/${todayClass.id}/chamada-rapida`}
          />
        ) : todayClassError ? (
          <p className="error-inline dashboard-home-page__inline-error">{todayClassError}</p>
        ) : null}

        <ModuleGrid items={primaryModules} />
        <QuickActions items={quickActions} />
      </div>
    </div>
  );
}

function StudentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3.5 18.5c0-2.2 2.3-4 4.5-4s4.5 1.8 4.5 4M13 18.5c.3-1.6 1.9-3 3.9-3 2.2 0 4.1 1.6 4.1 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClassesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v12.5A2.5 2.5 0 0 0 17.5 20H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 19c0-2.8 3.1-5 7-5s7 2.2 7 5M18.5 10.5a2.5 2.5 0 1 0-1.1-4.7M20.5 18.5c-.3-1.3-1.4-2.4-2.9-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatisticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 19V11M12 19V5M19 19v-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddUserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4.5 18.5c0-2.2 2.4-4 4.5-4 1.2 0 2.5.4 3.3 1M18 8v6M15 11h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AddClassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H14a1 1 0 0 1 1 1v14H6.5A2.5 2.5 0 0 1 4 16.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M18 8v8M14 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
