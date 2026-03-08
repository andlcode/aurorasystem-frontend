import { useEffect, useState } from "react";
import type { UserRole } from "../../types/auth";
import { WORKER_ROLE_LABELS } from "../../types/auth";

interface ResponsibleOption {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole | null;
}

interface ClassEditModalProps {
  classItem: {
    id: string;
    name: string;
    day?: number;
    dayOfWeek?: number;
    time?: string;
    startTime?: string;
    responsibleUserId?: string;
  };
  responsibles: ResponsibleOption[];
  loadingResponsibles: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    day: number;
    time: string;
    responsibleUserId: string;
  }) => void;
}

const DAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export function ClassEditModal({
  classItem,
  responsibles,
  loadingResponsibles,
  saving,
  error,
  onClose,
  onSubmit,
}: ClassEditModalProps) {
  const [name, setName] = useState(classItem.name);
  const [day, setDay] = useState(classItem.dayOfWeek ?? classItem.day ?? 0);
  const [time, setTime] = useState(classItem.startTime ?? classItem.time ?? "");
  const [responsibleUserId, setResponsibleUserId] = useState(classItem.responsibleUserId ?? "");

  useEffect(() => {
    setName(classItem.name);
    setDay(classItem.dayOfWeek ?? classItem.day ?? 0);
    setTime(classItem.startTime ?? classItem.time ?? "");
    setResponsibleUserId(classItem.responsibleUserId ?? "");
  }, [classItem]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      name: name.trim(),
      day,
      time,
      responsibleUserId,
    });
  };

  return (
    <div className="modal-overlay" role="presentation">
      <form className="modal class-edit-modal" onSubmit={handleSubmit}>
        <h3>Editar turma</h3>

        <label>
          Nome da turma
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Dia da semana
          <select
            value={day}
            onChange={(event) => setDay(Number(event.target.value))}
            required
          >
            {DAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Horário
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </label>

        <label>
          Responsável
          <select
            value={responsibleUserId}
            onChange={(event) => setResponsibleUserId(event.target.value)}
            disabled={loadingResponsibles}
            required
          >
            <option value="">
              {loadingResponsibles
                ? "Carregando responsáveis..."
                : responsibles.length === 0
                  ? "Nenhum responsável disponível"
                  : "Selecione o responsável"}
            </option>
            {responsibles.map((responsible) => (
              <option key={responsible.id} value={responsible.id}>
                {responsible.name}
                {responsible.role ? ` - ${WORKER_ROLE_LABELS[responsible.role]}` : ""}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || loadingResponsibles || !responsibleUserId}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
