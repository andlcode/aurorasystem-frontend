interface ClassOption {
  id: string;
  name: string;
}

export interface StatsFiltersState {
  classId: string | null;
  search: string;
}

interface StatsFiltersProps {
  filters: StatsFiltersState;
  classOptions: ClassOption[];
  onChange: (next: StatsFiltersState) => void;
  onReset: () => void;
  showAllClassesOption?: boolean;
}

export function StatsFilters({
  filters,
  classOptions,
  onChange,
  onReset,
  showAllClassesOption = true,
}: StatsFiltersProps) {
  return (
    <section className="card statistics-filters statistics-filters--compact">
      <div className="statistics-filters__header">
        <div>
          <h2>Filtros</h2>
          <p className="muted">Turma e busca por aluno.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Limpar filtros
        </button>
      </div>

      <div className="statistics-filters__grid statistics-filters__grid--monthly">
        <label className="statistics-filters__field">
          <span>Buscar aluno</span>
          <input
            type="search"
            placeholder="Nome ou e-mail..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </label>

        <label className="statistics-filters__field">
          <span>Turma</span>
          <select
            value={filters.classId ?? ""}
            onChange={(e) => onChange({ ...filters, classId: e.target.value || null })}
          >
            {showAllClassesOption && <option value="">Todas as turmas</option>}
            {classOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
