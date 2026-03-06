interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <span className="summary-card__title">{title}</span>
      <strong className="summary-card__value">{value}</strong>
      <span className="summary-card__subtitle">{subtitle}</span>
    </article>
  );
}
