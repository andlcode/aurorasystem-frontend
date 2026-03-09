import { useState } from "react";
import type { ClassMonthlyAttendanceItem, ClassMonthlyStudentItem } from "../../api/stats";
import { getMonthlyAttendanceStudentById } from "../../api/stats";
import type { MonthlyAttendanceStudentDetail } from "../../api/stats";
import { StudentAttendanceDetail } from "./StudentAttendanceDetail";

interface ClassStatsBlockProps {
  classData: ClassMonthlyAttendanceItem;
  filters: { classId?: string; from?: string; to?: string };
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function StudentRow({
  student,
  months,
  onClick,
  isSelected,
}: {
  student: ClassMonthlyStudentItem;
  months: Array<{ month: string; label: string }>;
  onClick: () => void;
  isSelected: boolean;
}) {
  const { name, summary, monthly } = student;
  const rateClass =
    summary.attendanceRate >= 75
      ? "statistics-compact-rate--good"
      : summary.attendanceRate >= 50
        ? "statistics-compact-rate--medium"
        : "statistics-compact-rate--low";

  return (
    <tr
      className={`statistics-compact-row ${isSelected ? "statistics-compact-row--selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <td className="statistics-compact-cell statistics-compact-cell--name">{name}</td>
      <td className={`statistics-compact-cell statistics-compact-cell--rate ${rateClass}`}>
        {percentFormatter.format(summary.attendanceRate)}%
      </td>
      <td className="statistics-compact-cell">{summary.totalPresent}P</td>
      <td className="statistics-compact-cell">{summary.totalAbsent}F</td>
      <td className="statistics-compact-cell">
        {summary.consecutiveAbsences > 0 ? `${summary.consecutiveAbsences} FC` : "—"}
      </td>
      {months.map((m) => {
        const data = monthly.find((x) => x.month === m.month);
        const present = data?.present ?? 0;
        const absent = data?.absent ?? 0;
        return (
          <td key={m.month} className="statistics-compact-cell statistics-compact-cell--month">
            {present + absent > 0 ? `${present}/${absent}` : "—"}
          </td>
        );
      })}
    </tr>
  );
}

export function ClassStatsBlock({ classData, filters }: ClassStatsBlockProps) {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MonthlyAttendanceStudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { className, availableMonths, summary, students } = classData;

  const handleStudentClick = (participantId: string) => {
    if (expandedStudentId === participantId) {
      setExpandedStudentId(null);
      setDetail(null);
      return;
    }
    setExpandedStudentId(participantId);
    setDetailLoading(true);
    setDetail(null);
    getMonthlyAttendanceStudentById(participantId, {
      classId: classData.classId,
      startDate: filters.from,
      endDate: filters.to,
      status: "active",
    })
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  return (
    <section className="card statistics-class-block">
      <div className="statistics-class-block__header">
        <h3 className="statistics-class-block__title">{className}</h3>
        <p className="statistics-class-block__summary muted">
          {summary.studentCount} aluno{summary.studentCount !== 1 ? "s" : ""} |{" "}
          {percentFormatter.format(summary.attendanceRate)}% média | {summary.totalPresent}P |{" "}
          {summary.totalAbsent}F
        </p>
      </div>

      <div className="statistics-compact-table-wrap">
        <table className="statistics-compact-table">
          <thead>
            <tr>
              <th className="statistics-compact-th statistics-compact-th--name">Nome</th>
              <th className="statistics-compact-th">%</th>
              <th className="statistics-compact-th">P</th>
              <th className="statistics-compact-th">F</th>
              <th className="statistics-compact-th">FC</th>
              {availableMonths.map((m) => (
                <th key={m.month} className="statistics-compact-th statistics-compact-th--month">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentRow
                key={student.participantId}
                student={student}
                months={availableMonths}
                onClick={() => handleStudentClick(student.participantId)}
                isSelected={expandedStudentId === student.participantId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {expandedStudentId && (
        <div className="statistics-class-block__detail">
          {detailLoading && (
            <div className="loading">Carregando detalhes...</div>
          )}
          {!detailLoading && detail && (
            <StudentAttendanceDetail
              detail={detail}
              onClose={() => {
                setExpandedStudentId(null);
                setDetail(null);
              }}
            />
          )}
        </div>
      )}
    </section>
  );
}
