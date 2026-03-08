import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface DashboardNavCardProps {
  to: string;
  title: string;
  icon: ReactNode;
  variant?: "module" | "action";
}

export function DashboardNavCard({
  to,
  title,
  icon,
  variant = "module",
}: DashboardNavCardProps) {
  return (
    <Link
      to={to}
      className={`dashboard-nav-card dashboard-nav-card--${variant}`}
      aria-label={title}
    >
      <span className="dashboard-nav-card__icon" aria-hidden="true">
        {icon}
      </span>
      <strong className="dashboard-nav-card__title">{title}</strong>
    </Link>
  );
}
