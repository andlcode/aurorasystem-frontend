import type { MonthlyAttendanceHistoryItem } from "../../api/stats";

interface StudentAttendanceHistoryProps {
  history: MonthlyAttendanceHistoryItem[];
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(date: string | null) {
  if (!date) return "—";
  return dateFormatter.format(new Date(`${date}T00:00:00.000Z`));
}

function statusLabel(status: string) {
  switch (status) {
    case "present":
      return "Presente";
    case "absent":
      return "Ausente";
    case "justified":
      return "Justificado";
    default:
      return status;
  }
}

export function StudentAttendanceHistory({ history }: StudentAttendanceHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <p className="muted statistics-history-empty">
        Nenhum registro de presença no período.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Turma</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.sessionId}>
              <td>{formatDate(h.sessionDate)}</td>
              <td>{h.className}</td>
              <td>
                <span
                  className={`badge ${
                    h.status === "present"
                      ? "present"
                      : h.status === "absent"
                        ? "absent"
                        : "justified"
                  }`}
                >
                  {statusLabel(h.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
