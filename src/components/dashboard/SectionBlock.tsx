import type { ReactNode } from "react";

interface SectionBlockProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionBlock({
  eyebrow,
  title,
  description,
  children,
}: SectionBlockProps) {
  return (
    <section className="dashboard-home-section-block">
      <div className="dashboard-home-section-block__header">
        {eyebrow ? <p className="dashboard-home-section-block__eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}
