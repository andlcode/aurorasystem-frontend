import { Link } from "react-router-dom";

interface TodayClassCardProps {
  className: string;
  weekdayLabel: string;
  time: string;
  to: string;
}

export function TodayClassCard({
  className,
  weekdayLabel,
  time,
  to,
}: TodayClassCardProps) {
  return (
    <section className="today-class-card" aria-label="Turma de hoje">
      <p className="today-class-card__eyebrow">Turma de hoje</p>
      <div className="today-class-card__content">
        <h2>{className}</h2>
        <p className="today-class-card__meta">
          {weekdayLabel} <span aria-hidden="true">•</span> {time}
        </p>
      </div>
      <Link to={to} className="today-class-card__action">
        Iniciar chamada
      </Link>
    </section>
  );
}
