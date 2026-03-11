import type {
  AttendanceMatrixClass,
  AttendanceMatrixStudent,
  AttendanceStatus,
} from "../../utils/attendanceMatrix";
import {
  getCellStatus,
  getMonthStartDates,
  buildTableHeader,
} from "../../utils/attendanceMatrix";

interface ClassDiaryCardProps {
  classData: AttendanceMatrixClass;
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
});

function AttendanceCell({
  status,
  isMonthStart,
}: {
  status: AttendanceStatus | null;
  isMonthStart?: boolean;
}) {
  const monthClass = isMonthStart ? " diary-cell--month-start" : "";
  if (status === null) {
    return (
      <td className={`diary-cell diary-cell--empty${monthClass}`} title="Sem registro">
        —
      </td>
    );
  }
  if (status === "present") {
    return (
      <td className={`diary-cell diary-cell--present${monthClass}`} title="Presente">
        <span className="diary-cell__icon" aria-hidden>✓</span>
      </td>
    );
  }
  if (status === "absent") {
    return (
      <td className={`diary-cell diary-cell--absent${monthClass}`} title="Ausente">
        <span className="diary-cell__icon" aria-hidden>✗</span>
      </td>
    );
  }
  return (
    <td className={`diary-cell diary-cell--justified${monthClass}`} title="Justificado">
      <span className="diary-cell__icon diary-cell__icon--justified">J</span>
    </td>
  );
}

function StudentRow({
  student,
  allDates,
  monthStartDates,
  rowClass,
}: {
  student: AttendanceMatrixStudent;
  allDates: string[];
  monthStartDates: Set<string>;
  rowClass: string;
}) {
  const {
    name = "Aluno",
    attendancePercent = 0,
    presences = 0,
    absences = 0,
    consecutiveAbsences = 0,
    records = {},
  } = student ?? {};

  return (
    <tr className={`diary-row ${rowClass}`}>
      <td className="diary-cell diary-cell--name diary-cell--sticky">{name}</td>
      <td
        className={`diary-cell diary-cell--rate ${
          rowClass.includes("low")
            ? "diary-cell--rate-low"
            : rowClass.includes("medium")
              ? "diary-cell--rate-medium"
              : ""
        }`}
      >
        {percentFormatter.format(attendancePercent)}%
      </td>
      <td className="diary-cell diary-cell--compact">{presences}P</td>
      <td className="diary-cell diary-cell--compact">{absences}F</td>
      <td className="diary-cell diary-cell--compact">
        {consecutiveAbsences >= 2 ? (
          <span className="diary-fc">{consecutiveAbsences} FC</span>
        ) : (
          "—"
        )}
      </td>
      {allDates.map((date) => (
        <AttendanceCell
          key={date}
          status={getCellStatus(records, date)}
          isMonthStart={monthStartDates.has(date)}
        />
      ))}
    </tr>
  );
}

export function ClassDiaryCard({ classData }: ClassDiaryCardProps) {
  const safeData = classData ?? {
    classId: "",
    className: "Turma",
    dates: [],
    months: [],
    students: [],
    summary: { studentsCount: 0, attendanceAverage: 0, presences: 0, absences: 0 },
  };

  const { className, summary, months, students, dates } = safeData;
  const datesList = dates ?? [];
  const monthsList = months ?? [];
  const studentsList = students ?? [];

  const header = buildTableHeader(monthsList);
  const monthStartDates = getMonthStartDates(monthsList);

  if (datesList.length === 0) {
    return (
      <section className="card diary-card">
        <div className="diary-card__header">
          <h3 className="diary-card__title">{className || "Turma"}</h3>
          <p className="diary-card__summary muted">
            {summary?.studentsCount ?? 0} aluno{(summary?.studentsCount ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="diary-empty">
          <p>
            {studentsList.length === 0
              ? "Nenhum aluno vinculado à turma."
              : "Nenhuma chamada registrada no período."}
          </p>
        </div>
      </section>
    );
  }

  if (studentsList.length === 0) {
    return (
      <section className="card diary-card">
        <div className="diary-card__header">
          <h3 className="diary-card__title">{className || "Turma"}</h3>
          <p className="diary-card__summary muted">0 alunos</p>
        </div>
        <div className="diary-empty">
          <p>Nenhum aluno vinculado à turma.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card diary-card">
      <div className="diary-card__header">
        <h3 className="diary-card__title">{className}</h3>
        <p className="diary-card__summary muted">
          {summary?.studentsCount ?? 0} aluno{(summary?.studentsCount ?? 0) !== 1 ? "s" : ""} |{" "}
          {percentFormatter.format(summary?.attendanceAverage ?? 0)}% média |{" "}
          {summary?.presences ?? 0}P | {summary?.absences ?? 0}F
        </p>
      </div>

      <div className="diary-table-wrap">
        <table className="diary-table">
          <thead>
            <tr className="diary-header-row diary-header-row--months">
              <th className="diary-th diary-th--sticky" rowSpan={2}>
                Nome
              </th>
              <th className="diary-th" rowSpan={2}>
                %
              </th>
              <th className="diary-th" rowSpan={2}>
                P
              </th>
              <th className="diary-th" rowSpan={2}>
                F
              </th>
              <th className="diary-th" rowSpan={2}>
                FC
              </th>
              {header.months.map((m) => (
                <th
                  key={m.key}
                  className="diary-th diary-th--month"
                  colSpan={m.colSpan}
                >
                  {m.label}
                </th>
              ))}
            </tr>
            <tr className="diary-header-row diary-header-row--days">
              {header.days.map((d) => (
                <th
                  key={d.date}
                  className={`diary-th diary-th--day ${
                    d.isMonthStart ? "diary-th--day-month-start" : ""
                  }`}
                  title={d.date}
                >
                  {dateFormatter.format(new Date(`${d.date}T00:00:00.000Z`))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentsList.map((student) => {
              const rate = student.attendancePercent;
              const fc = student.consecutiveAbsences;
              const rowClass =
                fc >= 2
                  ? "diary-row--consecutive"
                  : rate < 50
                    ? "diary-row--low"
                    : rate < 75
                      ? "diary-row--medium"
                      : "";
              return (
                <StudentRow
                  key={student.id || student.name}
                  student={student}
                  allDates={datesList}
                  monthStartDates={monthStartDates}
                  rowClass={rowClass}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
