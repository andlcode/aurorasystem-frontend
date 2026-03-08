import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { ClassEditModal } from "../components/classes/ClassEditModal";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface Class {
  id: string;
  name: string;
  description?: string | null;
  day?: number;
  dayOfWeek?: number;
  time?: string;
  startTime?: string;
  endTime?: string | null;
  status?: string;
  owner?: { name?: string; fullName?: string };
  responsible?: { name?: string; fullName?: string };
  responsibleUserId?: string;
  participants?: unknown[];
}

interface ResponsibleOption {
  id: string;
  name: string;
  email?: string | null;
  role: UserRole | null;
}

export function Turmas() {
  const location = useLocation();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [responsibles, setResponsibles] = useState<ResponsibleOption[]>([]);
  const [loadingResponsibles, setLoadingResponsibles] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canEditClasses = user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR";

  const loadClasses = useCallback(() => {
    setLoading(true);
    setError(null);

    const requestUrl = `${api.defaults.baseURL ?? ""}/classes`;
    console.log("[Turmas] Chamando endpoint:", requestUrl);

    api
      .get<Class[]>("/classes")
      .then((res) => {
        console.log("[Turmas] Status HTTP:", res.status);
        console.log("[Turmas] Body retornado:", res.data);
        setClasses(res.data);
      })
      .catch((err) => {
        console.error("[Turmas] Erro ao carregar turmas:", err);
        console.log("[Turmas] Status HTTP de erro:", err.response?.status);
        console.log("[Turmas] Body de erro:", err.response?.data);
        setError(
          err.response?.data?.error ??
            "Erro ao carregar turmas."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const loadResponsibles = useCallback(async () => {
    setLoadingResponsibles(true);

    try {
      const response = await api.get<ResponsibleOption[]>("/classes/responsibles");
      setResponsibles(response.data);
    } catch (err) {
      console.error("[Turmas] Erro ao carregar responsáveis para edição:", err);
      setResponsibles([]);
      throw err;
    } finally {
      setLoadingResponsibles(false);
    }
  }, []);

  useEffect(() => {
    const msg = (location.state as { successMessage?: string })?.successMessage;
    if (msg) {
      setSuccessMessage(msg);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, location.pathname]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const openEditModal = async (classItem: Class) => {
    setSelectedClass(classItem);
    setEditError(null);
    setIsEditModalOpen(true);

    if (responsibles.length === 0) {
      try {
        await loadResponsibles();
      } catch (err) {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          "Não foi possível carregar os responsáveis.";
        setEditError(message);
      }
    }
  };

  const closeEditModal = () => {
    setSelectedClass(null);
    setEditError(null);
    setIsEditModalOpen(false);
  };

  const handleEditSubmit = async (payload: {
    name: string;
    day: number;
    time: string;
    responsibleUserId: string;
  }) => {
    if (!selectedClass) return;

    setSavingEdit(true);
    setEditError(null);

    try {
      await api.patch(`/classes/${selectedClass.id}`, payload);
      closeEditModal();
      setSuccessMessage("Turma atualizada com sucesso.");
      loadClasses();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível atualizar a turma.";
      setEditError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="loading">Carregando turmas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Turmas</h1>
        {(user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR") && (
          <Link to="/turmas/nova" className="btn btn-primary">
            + Criar Turma
          </Link>
        )}
      </div>

      {successMessage && (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      )}

      <div className="card-grid">
        {classes.map((c) => {
          const dayOfWeek = c.dayOfWeek ?? c.day ?? 0;
          const startTime = c.startTime ?? c.time ?? "";
          const owner = c.owner ?? c.responsible;
          return (
            <div key={c.id} className="card">
              <Link to={`/turmas/${c.id}`} className="card-link-inner">
                <h3>{c.name}</h3>
                {c.description && <p className="muted">{c.description}</p>}
                <div className="meta">
                  <span>{dayNames[dayOfWeek]} {startTime}{c.endTime ? `–${c.endTime}` : ""}</span>
                  <span>{owner?.name ?? owner?.fullName ?? ""}</span>
                  {c.participants != null && (
                    <span>Participantes: {c.participants.length}</span>
                  )}
                </div>
              </Link>
              <div className="card-actions">
                <Link
                  to={`/turmas/${c.id}/chamada`}
                  className="btn btn-sm btn-primary"
                >
                  Fazer chamada
                </Link>
                {canEditClasses && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => openEditModal(c)}
                  >
                    Editar
                  </button>
                )}
                <Link
                  to={`/turmas/${c.id}/historico`}
                  className="btn btn-sm btn-ghost"
                >
                  Ver histórico
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      {classes.length === 0 && (
        <p className="empty">Nenhuma turma cadastrada ainda.</p>
      )}

      {isEditModalOpen && selectedClass && (
        <ClassEditModal
          classItem={selectedClass}
          responsibles={responsibles}
          loadingResponsibles={loadingResponsibles}
          saving={savingEdit}
          error={editError}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
