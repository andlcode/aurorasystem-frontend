import type { ReactNode } from "react";
import { DashboardNavCard } from "./DashboardNavCard";

interface QuickActionItem {
  id: string;
  title: string;
  to: string;
  icon: ReactNode;
}

interface QuickActionsProps {
  items: QuickActionItem[];
}

export function QuickActions({ items }: QuickActionsProps) {
  return (
    <section className="dashboard-home-section" aria-label="Ações rápidas">
      <h2 className="dashboard-home-section__title">Ações rápidas</h2>
      <div className="dashboard-home-actions">
        {items.map((item) => (
          <DashboardNavCard
            key={item.id}
            to={item.to}
            title={item.title}
            icon={item.icon}
            variant="action"
          />
        ))}
      </div>
    </section>
  );
}
