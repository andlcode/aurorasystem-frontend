import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Responsavel {
  id: string;
  name?: string;
  fullName: string;
  email?: string | null;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  evangelizador: "Evangelizador",
  super_admin: "Super Admin",
};

const DAY_NAMES = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export function TurmaNova() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [responsibles, setResponsibles] = useState<Responsavel[]>([]);
  const [loadingResponsibles, setLoadingResponsibles] = useState(true);
  const [name, setName] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Responsavel[]>("/classes/responsibles")
      .then((res) => {
        console.log("[TurmaNova] Responsáveis carregados:", res.data);
        setResponsibles(res.data);
      })
      .catch((err) => {
        console.error("[TurmaNova] Erro ao carregar responsáveis:", err);
        setResponsibles([]);
      })
      .finally(() => setLoadingResponsibles(false));
  }, []);

  if (user?.role !== "super_admin") {
    return <Navigate to="/turmas" replace />;
  }

  const responsiblesElegiveis = responsibles.filter((r) =>
    ["evangelizador", "super_admin"].includes(r.role)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameTrimmed = name.trim();

    if (!nameTrimmed) {
      setError("Nome da turma é obrigatório.");
      return;
    }
    if (!responsibleId) {
      setError("Responsável é obrigatório.");
      return;
    }
    const selected = responsibles.find((r) => r.id === responsibleId);
    if (selected && !["evangelizador", "super_admin"].includes(selected.role)) {
      setError("O responsável deve ser um evangelizador ou super_admin.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: nameTrimmed,
        responsibleUserId: responsibleId,
        day: dayOfWeek,
        time: startTime,
      };

      console.log("[TurmaNova] Payload enviado para criar turma:", payload);

      await api.post("/classes", payload);

      navigate("/turmas", { state: { successMessage: "Turma criada com sucesso" }, replace: true });
    } catch (err: unknown) {
      console.error("[TurmaNova] Erro ao criar turma:", err);
      const res = err as { response?: { data?: { error?: string } } };
      const msg = res.response?.data?.error ?? "Erro ao criar turma. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/turmas" className="back-link">
          ← Turmas
        </Link>
        <h1>Criar Turma</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <label>
          Nome da turma *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Turma A"
            required
            autoFocus
          />
        </label>

        <label>
          Responsável *
          <select
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
            required
            disabled={loadingResponsibles}
          >
            <option value="">
              {loadingResponsibles
                ? "Carregando responsáveis..."
                : responsiblesElegiveis.length === 0
                  ? "Nenhum responsável disponível"
                  : "Selecione o responsável"}
            </option>
            {responsiblesElegiveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {(r.name ?? r.fullName)} - {ROLE_LABELS[r.role] ?? r.role}
                </option>
              ))}
          </select>
        </label>

        {!loadingResponsibles && responsiblesElegiveis.length === 0 && (
          <p className="empty-inline">Nenhum responsável disponível.</p>
        )}

        <label>
          Dia *
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            required
          >
            {DAY_NAMES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Horário *
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <Link to="/turmas" className="btn btn-ghost">
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || loadingResponsibles || responsiblesElegiveis.length === 0}
          >
            {loading ? "Criando..." : "Criar turma"}
          </button>
        </div>
      </form>
    </div>
  );
}
