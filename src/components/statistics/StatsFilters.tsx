interface ClassOption {
  id: string;
  name: string;
}

export interface StatsFiltersState {
  classId: string | null;
  from: string | null;
  to: string | null;
  search: string;
}

interface StatsFiltersProps {
  filters: StatsFiltersState;
  classOptions: ClassOption[];
  onChange: (next: StatsFiltersState) => void;
  onReset: () => void;
}

export function StatsFilters({
  filters,
  classOptions,
  onChange,
  onReset,
}: StatsFiltersProps) {
  return (
    <section className="card statistics-filters statistics-filters--compact">
      <div className="statistics-filters__header">
        <div>
          <h2>Filtros</h2>
          <p className="muted">Turma, período e busca por aluno.</p>
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
            <option value="">Todas as turmas</option>
            {classOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>

        <label className="statistics-filters__field">
          <span>Data inicial</span>
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => onChange({ ...filters, from: e.target.value || null })}
          />
        </label>

        <label className="statistics-filters__field">
          <span>Data final</span>
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => onChange({ ...filters, to: e.target.value || null })}
          />
        </label>
      </div>
    </section>
  );
}
