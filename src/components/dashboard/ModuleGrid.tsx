import type { ReactNode } from "react";
import { DashboardNavCard } from "./DashboardNavCard";

interface ModuleItem {
  id: string;
  title: string;
  to: string;
  icon: ReactNode;
}

interface ModuleGridProps {
  items: ModuleItem[];
}

export function ModuleGrid({ items }: ModuleGridProps) {
  return (
    <section className="dashboard-home-section" aria-label="Módulos principais">
      <h2 className="dashboard-home-section__title">Módulos</h2>
      <div className="dashboard-home-grid dashboard-home-grid--modules">
        {items.map((item) => (
          <DashboardNavCard
            key={item.id}
            to={item.to}
            title={item.title}
            icon={item.icon}
          />
        ))}
      </div>
    </section>
  );
}
