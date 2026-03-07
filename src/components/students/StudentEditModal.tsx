import { useEffect, useState } from "react";

interface StudentEditModalProps {
  student: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: "active" | "inactive";
  };
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    fullName: string;
    email: string | null;
    phone: string | null;
    status: "active" | "inactive";
  }) => void;
}

export function StudentEditModal({
  student,
  saving,
  error,
  onClose,
  onSubmit,
}: StudentEditModalProps) {
  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email ?? "");
  const [phone, setPhone] = useState(student.phone ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(student.status);

  useEffect(() => {
    setFullName(student.fullName);
    setEmail(student.email ?? "");
    setPhone(student.phone ?? "");
    setStatus(student.status);
  }, [student]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      fullName: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      status,
    });
  };

  return (
    <div className="modal-overlay" role="presentation">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>Editar aluno</h3>

        <label>
          Nome
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplo.com"
          />
        </label>

        <label>
          Telefone
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(00) 00000-0000"
          />
        </label>

        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "active" | "inactive")}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
