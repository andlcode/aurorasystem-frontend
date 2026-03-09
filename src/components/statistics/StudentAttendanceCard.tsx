import type { MonthlyAttendanceStudentOverview } from "../../api/stats";
import { StudentMonthlySummary } from "./StudentMonthlySummary";

interface StudentAttendanceCardProps {
  student: MonthlyAttendanceStudentOverview;
  isSelected?: boolean;
  onClick: () => void;
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function StudentAttendanceCard({
  student,
  isSelected,
  onClick,
}: StudentAttendanceCardProps) {
  const { name, classNames, summary, monthly } = student;
  const hasConsecutive = summary.consecutiveAbsences > 0;
  const isLowAttendance = summary.totalSessions > 0 && summary.attendanceRate < 75;

  return (
    <article
      className={`card statistics-student-card ${isSelected ? "statistics-student-card--selected" : ""} ${
        isLowAttendance ? "statistics-student-card--low" : ""
      } ${hasConsecutive ? "statistics-student-card--consecutive" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="statistics-student-card__header">
        <div>
          <h3 className="statistics-student-card__name">{name}</h3>
          {classNames.length > 0 && (
            <p className="muted statistics-student-card__classes">
              {classNames.join(", ")}
            </p>
          )}
        </div>
        <div className="statistics-student-card__summary">
          <span
            className={`statistics-student-card__rate ${
              summary.attendanceRate >= 75
                ? "statistics-student-card__rate--good"
                : summary.attendanceRate >= 50
                  ? "statistics-student-card__rate--medium"
                  : "statistics-student-card__rate--low"
            }`}
          >
            {percentFormatter.format(summary.attendanceRate)}%
          </span>
          <span className="statistics-student-card__meta">
            {summary.totalPresent} presenças · {summary.totalAbsent} faltas
            {hasConsecutive && (
              <span className="statistics-student-card__consecutive">
                · {summary.consecutiveAbsences} faltas consecutivas
              </span>
            )}
          </span>
        </div>
      </div>

      <StudentMonthlySummary monthly={monthly} />
    </article>
  );
}
