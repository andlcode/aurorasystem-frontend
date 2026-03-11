/**
 * Utilitários para a matriz de presença escolar.
 * Agrupa chamadas por mês, ordena datas e calcula estatísticas por aluno e turma.
 */

import type { ClassDiaryItem } from "../api/stats";

// --- Tipos ---

export type AttendanceStatus = "present" | "absent" | "justified";

export interface AttendanceMatrixMonth {
  key: string;
  label: string;
  dates: string[];
}

export interface AttendanceMatrixStudent {
  id: string;
  name: string;
  attendancePercent: number;
  presences: number;
  absences: number;
  consecutiveAbsences: number;
  records: Record<string, AttendanceStatus>;
}

export interface AttendanceMatrixSummary {
  studentsCount: number;
  attendanceAverage: number;
  presences: number;
  absences: number;
}

export interface AttendanceMatrixClass {
  classId: string;
  className: string;
  dates: string[];
  months: AttendanceMatrixMonth[];
  students: AttendanceMatrixStudent[];
  summary: AttendanceMatrixSummary;
}

// --- Labels de mês ---

const MONTH_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

// --- Helpers ---

/**
 * Ordena datas cronologicamente (crescente).
 */
export function sortDatesChronologically(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

/**
 * Agrupa datas por mês (YYYY-MM).
 * Retorna apenas meses que possuem datas.
 */
export function groupDatesByMonth(dates: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const d of dates) {
    const monthKey = d.slice(0, 7);
    const list = map.get(monthKey) ?? [];
    list.push(d);
    map.set(monthKey, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return map;
}

/**
 * Obtém o label do mês a partir da chave (YYYY-MM).
 */
export function getMonthLabel(monthKey: string): string {
  const [, m] = monthKey.split("-").map(Number);
  return MONTH_LABELS[m] ?? monthKey;
}

/**
 * Monta a estrutura de meses para o cabeçalho em 2 níveis.
 * Apenas meses com datas são incluídos.
 */
export function buildMonthsFromDates(dates: string[]): AttendanceMatrixMonth[] {
  const sorted = sortDatesChronologically(dates);
  const byMonth = groupDatesByMonth(sorted);
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthDates]) => ({
      key,
      label: getMonthLabel(key),
      dates: sortDatesChronologically(monthDates),
    }));
}

/**
 * Estrutura do cabeçalho em 2 níveis para renderização da tabela.
 */
export interface TableHeaderLevel {
  months: Array<{ key: string; label: string; colSpan: number }>;
  days: Array<{ date: string; isMonthStart: boolean }>;
}

/**
 * Monta o cabeçalho da tabela em 2 níveis: meses e dias.
 */
export function buildTableHeader(months: AttendanceMatrixMonth[]): TableHeaderLevel {
  const headerMonths = months.map((m) => ({
    key: m.key,
    label: m.label,
    colSpan: m.dates.length,
  }));

  const headerDays: Array<{ date: string; isMonthStart: boolean }> = [];
  for (let i = 0; i < months.length; i++) {
    for (let j = 0; j < months[i].dates.length; j++) {
      headerDays.push({
        date: months[i].dates[j],
        isMonthStart: j === 0,
      });
    }
  }

  return { months: headerMonths, days: headerDays };
}

/**
 * Calcula o percentual de presença baseado apenas em chamadas existentes.
 * presences / (presences + absences) * 100
 */
export function calculateAttendancePercent(presences: number, absences: number): number {
  const total = presences + absences;
  if (total === 0) return 0;
  return Math.round((presences / total) * 1000) / 10;
}

/**
 * Calcula faltas consecutivas na sequência cronológica mais recente.
 * Ordena datas decrescente e conta faltas até encontrar uma presença.
 */
export function calculateConsecutiveAbsences(
  records: Record<string, AttendanceStatus>
): number {
  const entries = Object.entries(records)
    .filter(([, status]) => status === "present" || status === "absent")
    .sort(([a], [b]) => b.localeCompare(a));

  let count = 0;
  for (const [, status] of entries) {
    if (status === "absent") count++;
    else break;
  }
  return count;
}

/**
 * Calcula estatísticas por aluno a partir dos registros.
 */
export function calculateStudentStats(
  records: Record<string, AttendanceStatus>
): {
  presences: number;
  absences: number;
  attendancePercent: number;
  consecutiveAbsences: number;
} {
  let presences = 0;
  let absences = 0;
  for (const status of Object.values(records)) {
    if (status === "present") presences++;
    else if (status === "absent") absences++;
  }
  const attendancePercent = calculateAttendancePercent(presences, absences);
  const consecutiveAbsences = calculateConsecutiveAbsences(records);
  return {
    presences,
    absences,
    attendancePercent,
    consecutiveAbsences,
  };
}

/**
 * Calcula o resumo da turma.
 */
export function calculateClassSummary(
  students: Array<{ presences: number; absences: number }>
): AttendanceMatrixSummary {
  const studentsCount = students.length;
  const presences = students.reduce((s, st) => s + st.presences, 0);
  const absences = students.reduce((s, st) => s + st.absences, 0);
  const total = presences + absences;
  const attendanceAverage = total > 0 ? Math.round((presences / total) * 1000) / 10 : 0;

  return {
    studentsCount,
    attendanceAverage,
    presences,
    absences,
  };
}

/**
 * Resolve o status da célula para exibição.
 * Retorna null quando não há registro.
 */
export function getCellStatus(
  records: Record<string, AttendanceStatus> | null | undefined,
  date: string
): AttendanceStatus | null {
  if (!records || typeof records !== "object") return null;
  const status = records[date];
  if (!status) return null;
  return status as AttendanceStatus;
}

/**
 * Retorna um conjunto de datas que são o início de cada mês (para separadores visuais).
 * Exclui a primeira data do primeiro mês.
 */
export function getMonthStartDates(months: AttendanceMatrixMonth[]): Set<string> {
  const set = new Set<string>();
  for (const m of months.slice(1)) {
    const first = m.dates[0];
    if (first) set.add(first);
  }
  return set;
}

// --- Estrutura vazia segura ---

export const EMPTY_MATRIX_CLASS: AttendanceMatrixClass = {
  classId: "",
  className: "",
  dates: [],
  months: [],
  students: [],
  summary: {
    studentsCount: 0,
    attendanceAverage: 0,
    presences: 0,
    absences: 0,
  },
};

// --- Mapper ---

/**
 * Transforma os dados da API para a estrutura de renderização da matriz.
 * Garante que turmas sem chamadas retornem estrutura vazia segura.
 * Garante que alunos sem registros apareçam corretamente.
 * Tratamento defensivo para null/undefined.
 */
export function mapApiToAttendanceMatrix(
  apiClasses: ClassDiaryItem[] | null | undefined
): AttendanceMatrixClass[] {
  if (!apiClasses || !Array.isArray(apiClasses)) {
    return [];
  }

  return apiClasses.map((cls) => {
    const classId = cls?.classId ?? "";
    const className = cls?.className ?? "Turma";
    const monthsRaw = cls?.months ?? [];
    const studentsRaw = cls?.students ?? [];

    const allDates = monthsRaw.flatMap((m) => m?.dates ?? []).filter(Boolean);
    const sortedDates = sortDatesChronologically(allDates);

    const months = buildMonthsFromDates(sortedDates);

    const students: AttendanceMatrixStudent[] = studentsRaw.map((s) => {
      const records = (s?.attendanceByDate ?? {}) as Record<string, AttendanceStatus>;
      const stats = calculateStudentStats(records);

      return {
        id: s?.participantId ?? "",
        name: s?.name ?? "Aluno",
        attendancePercent: stats.attendancePercent,
        presences: stats.presences,
        absences: stats.absences,
        consecutiveAbsences: stats.consecutiveAbsences,
        records: records && typeof records === "object" ? records : {},
      };
    });

    const summary = calculateClassSummary(
      students.map((s) => ({ presences: s.presences, absences: s.absences }))
    );

    return {
      classId,
      className,
      dates: sortedDates,
      months,
      students: students
        .filter((s) => s.id)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")),
      summary,
    };
  });
}

