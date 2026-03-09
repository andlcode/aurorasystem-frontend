import type { MonthlyAttendanceItem } from "../../api/stats";

interface StudentMonthlySummaryProps {
  monthly: MonthlyAttendanceItem[];
  variant?: "compact" | "detail";
}

const MONTH_ABBREV: Record<string, string> = {
  Janeiro: "Jan",
  Fevereiro: "Fev",
  Março: "Mar",
  Abril: "Abr",
  Maio: "Mai",
  Junho: "Jun",
  Julho: "Jul",
  Agosto: "Ago",
  Setembro: "Set",
  Outubro: "Out",
  Novembro: "Nov",
  Dezembro: "Dez",
};

function getShortLabel(label: string): string {
  return MONTH_ABBREV[label] ?? label.slice(0, 3);
}

export function StudentMonthlySummary({ monthly, variant = "compact" }: StudentMonthlySummaryProps) {
  if (!monthly || monthly.length === 0) {
    return <span className="statistics-monthly-empty">Sem dados</span>;
  }

  return (
    <div className={`statistics-monthly-cells statistics-monthly-cells--${variant}`}>
      {monthly.map((m) => (
        <div
          key={m.month}
          className={`statistics-monthly-cell ${
            m.total > 0
              ? m.attendanceRate >= 75
                ? "statistics-monthly-cell--good"
                : m.attendanceRate >= 50
                  ? "statistics-monthly-cell--medium"
                  : "statistics-monthly-cell--low"
              : "statistics-monthly-cell--empty"
          }`}
          title={`${m.label}: ${m.present}P / ${m.absent}F (${m.attendanceRate}%)`}
        >
          <span className="statistics-monthly-cell__label">
            {getShortLabel(m.label)}
          </span>
          <span className="statistics-monthly-cell__value">
            {m.total > 0 ? `${m.present}P/${m.absent}F` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
