import type { StatisticsClassOption, StatisticsFiltersState } from "../../types/dashboard";

interface StatisticsFiltersProps {
  filters: StatisticsFiltersState;
  classOptions: StatisticsClassOption[];
  onChange: (next: StatisticsFiltersState) => void;
  onReset: () => void;
}

export function StatisticsFilters({
  filters,
  classOptions,
  onChange,
  onReset,
}: StatisticsFiltersProps) {
  return (
    <section className="card statistics-filters">
      <div className="statistics-filters__header">
        <div>
          <h2>Filtros</h2>
          <p className="muted">Refine o período, a turma e o status para explorar os indicadores.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Limpar filtros
        </button>
      </div>

      <div className="statistics-filters__grid">
        <label className="statistics-filters__field">
          <span>Data inicial</span>
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => onChange({ ...filters, from: event.target.value || null })}
          />
        </label>

        <label className="statistics-filters__field">
          <span>Data final</span>
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => onChange({ ...filters, to: event.target.value || null })}
          />
        </label>

        <label className="statistics-filters__field">
          <span>Turma</span>
          <select
            value={filters.classId ?? ""}
            onChange={(event) => onChange({ ...filters, classId: event.target.value || null })}
          >
            <option value="">Todas as turmas</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="statistics-filters__field">
          <span>Status</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as StatisticsFiltersState["status"],
              })
            }
          >
            <option value="all">Todos</option>
            <option value="present">Presentes</option>
            <option value="absent">Ausentes</option>
            <option value="justified">Justificadas</option>
          </select>
        </label>
      </div>
    </section>
  );
}
