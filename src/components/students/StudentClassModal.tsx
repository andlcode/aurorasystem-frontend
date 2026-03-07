import { useEffect, useState } from "react";

interface ClassOption {
  id: string;
  name: string;
  day?: number;
  time?: string;
}

interface StudentClassModalProps {
  studentName: string;
  classes: Array<{ id: string; name: string }>;
  classOptions: ClassOption[];
  loadingClasses: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (classId: string) => void;
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function StudentClassModal({
  studentName,
  classes,
  classOptions,
  loadingClasses,
  saving,
  error,
  onClose,
  onSubmit,
}: StudentClassModalProps) {
  const [classId, setClassId] = useState("");

  useEffect(() => {
    setClassId("");
  }, [studentName]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!classId) {
      return;
    }
    onSubmit(classId);
  };

  return (
    <div className="modal-overlay" role="presentation">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>Vincular à turma</h3>
        <p className="muted">
          Selecione uma turma para vincular <strong>{studentName}</strong>.
        </p>

        <div className="student-current-classes">
          <span className="student-current-classes__label">Turmas atuais</span>
          {classes.length > 0 ? (
            <div className="student-current-classes__list">
              {classes.map((item) => (
                <span key={item.id} className="badge">
                  {item.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="empty-inline">Aluno ainda não vinculado a nenhuma turma.</p>
          )}
        </div>

        <label>
          Turma
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            disabled={loadingClasses || saving || classOptions.length === 0}
          >
            <option value="">
              {loadingClasses
                ? "Carregando turmas..."
                : classOptions.length === 0
                  ? "Nenhuma turma cadastrada"
                  : "Selecione uma turma"}
            </option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.day != null || option.time
                  ? ` - ${option.day != null ? DAY_LABELS[option.day] : ""}${option.time ? ` ${option.time}` : ""}`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}
        {!loadingClasses && classOptions.length === 0 && (
          <p className="empty-inline">Nenhuma turma cadastrada no momento.</p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || loadingClasses || !classId}
          >
            {saving ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </form>
    </div>
  );
}
