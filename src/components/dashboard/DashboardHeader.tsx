interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="dashboard-home-greeting">
      <h1 className="dashboard-home-greeting__title">{title}</h1>
    </header>
  );
}
