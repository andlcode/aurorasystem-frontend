import type { MonthlyAttendanceStudentDetail } from "../../api/stats";
import { StudentMonthlySummary } from "./StudentMonthlySummary";
import { StudentAttendanceHistory } from "./StudentAttendanceHistory";

interface StudentAttendanceDetailProps {
  detail: MonthlyAttendanceStudentDetail;
  onClose: () => void;
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return "Sem registro";
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

export function StudentAttendanceDetail({ detail, onClose }: StudentAttendanceDetailProps) {
  const { name, classNames, summary, monthly, history } = detail;

  return (
    <div className="statistics-student-detail-panel">
      <div className="statistics-student-detail-panel__header">
        <div>
          <h2>{name}</h2>
          {classNames.length > 0 && (
            <p className="muted">Turma(s): {classNames.join(", ")}</p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClose}
          aria-label="Fechar detalhe"
        >
          Fechar
        </button>
      </div>

      <div className="statistics-student-summary">
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Total de sessões</span>
          <strong>{summary.totalSessions}</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Presenças</span>
          <strong>{summary.totalPresent}</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Faltas</span>
          <strong>{summary.totalAbsent}</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">% Presença</span>
          <strong>{percentFormatter.format(summary.attendanceRate)}%</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Faltas consecutivas</span>
          <strong>{summary.consecutiveAbsences}</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Última presença</span>
          <strong>{formatDate(summary.lastPresentAt)}</strong>
        </div>
        <div className="statistics-student-summary__item">
          <span className="statistics-student-summary__label">Última falta</span>
          <strong>{formatDate(summary.lastAbsentAt)}</strong>
        </div>
      </div>

      <div className="statistics-student-bar">
        <div
          className="statistics-student-bar__fill statistics-student-bar__fill--present"
          style={{ width: `${Math.max(summary.attendanceRate, 2)}%` }}
        />
      </div>

      <div className="statistics-student-detail-monthly">
        <h4>Evolução mensal</h4>
        <StudentMonthlySummary monthly={monthly} variant="detail" />
      </div>

      <div className="statistics-student-history">
        <h4>Histórico por data</h4>
        <StudentAttendanceHistory history={history} />
      </div>
    </div>
  );
}
