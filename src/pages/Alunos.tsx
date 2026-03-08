import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { StudentClassModal } from "../components/students/StudentClassModal";
import { StudentEditModal } from "../components/students/StudentEditModal";
import { useAuth } from "../context/AuthContext";

interface StudentClass {
  id: string;
  name: string;
  day?: number;
  time?: string;
}

interface Person {
  id: string;
  fullName: string;
  name?: string; // API também retorna name (Participant)
  email: string | null;
  phone: string | null;
  type: string;
  status: "active" | "inactive";
  classes: StudentClass[];
  lastAttendanceDate?: string | null;
}

interface ClassOption {
  id: string;
  name: string;
  day?: number;
  time?: string;
}

interface PendingUnlink {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
}

export function Alunos() {
  const location = useLocation();
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Person | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [savingLink, setSavingLink] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [unlinkManagerStudentId, setUnlinkManagerStudentId] = useState<string | null>(null);
  const [pendingUnlink, setPendingUnlink] = useState<PendingUnlink | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canManageStudents = user?.role === "SUPER_ADMIN" || user?.role === "COORDENADOR";

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

  const loadAlunos = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());

    api
      .get<Person[]>(`/participants?${params}`)
      .then((res) => setAlunos(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error ??
            "Não foi possível carregar os alunos. Tente novamente em instantes."
        )
      )
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    loadAlunos();
  }, [loadAlunos]);

  const updateAlunoInList = useCallback((updated: Person) => {
    setAlunos((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  }, []);

  const availableClassOptions = useMemo(() => {
    if (!selectedAluno) {
      return classOptions;
    }

    const linkedIds = new Set(selectedAluno.classes.map((item) => item.id));
    return classOptions.filter((item) => !linkedIds.has(item.id));
  }, [classOptions, selectedAluno]);

  const openEditModal = (aluno: Person) => {
    setSelectedAluno(aluno);
    setEditError(null);
    setIsEditModalOpen(true);
    setUnlinkManagerStudentId(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditError(null);
    setSelectedAluno(null);
  };

  const openLinkModal = async (aluno: Person) => {
    setSelectedAluno(aluno);
    setLinkError(null);
    setUnlinkManagerStudentId(null);
    setIsLinkModalOpen(true);
    setLoadingClasses(true);

    try {
      const response = await api.get<ClassOption[]>("/classes");
      setClassOptions(response.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível carregar as turmas disponíveis.";
      setLinkError(message);
      setClassOptions([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setLoadingClasses(false);
    setLinkError(null);
    setClassOptions([]);
    setSelectedAluno(null);
  };

  const toggleUnlinkManager = (studentId: string) => {
    setUnlinkManagerStudentId((current) => (current === studentId ? null : studentId));
  };

  const openUnlinkConfirmation = (aluno: Person, classItem: StudentClass) => {
    setPendingUnlink({
      studentId: aluno.id,
      studentName: aluno.fullName,
      classId: classItem.id,
      className: classItem.name,
    });
    setUnlinkError(null);
  };

  const closeUnlinkConfirmation = () => {
    if (unlinkingKey) {
      return;
    }

    setPendingUnlink(null);
    setUnlinkError(null);
  };

  const openDeleteConfirmation = (aluno: Person) => {
    setPendingDelete(aluno);
    setDeleteError(null);
  };

  const closeDeleteConfirmation = () => {
    if (deletingId) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || pendingDelete.status === "inactive") return;

    setDeletingId(pendingDelete.id);
    setDeleteError(null);

    try {
      const response = await api.patch<Person>(`/participants/${pendingDelete.id}/status`, {
        status: "inactive",
      });
      updateAlunoInList(response.data);
      setSuccessMessage("Aluno excluído (desativado) com sucesso. O histórico foi preservado.");
      setPendingDelete(null);
      if (selectedAluno?.id === pendingDelete.id) {
        setSelectedAluno(response.data);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível excluir o aluno.";
      setDeleteError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (aluno: Person) => {
    const nextStatus = aluno.status === "active" ? "inactive" : "active";
    setStatusLoadingId(aluno.id);
    setError(null);

    try {
      const response = await api.patch<Person>(`/participants/${aluno.id}/status`, {
        status: nextStatus,
      });
      updateAlunoInList(response.data);
      setSuccessMessage(
        nextStatus === "active"
          ? "Aluno ativado com sucesso."
          : "Aluno inativado com sucesso."
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível alterar o status do aluno.";
      setError(message);
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleEditSubmit = async (payload: {
    fullName: string;
    email: string | null;
    phone: string | null;
    status: "active" | "inactive";
  }) => {
    if (!selectedAluno) {
      return;
    }

    setSavingEdit(true);
    setEditError(null);

    try {
      const response = await api.put<Person>(`/participants/${selectedAluno.id}`, {
        name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        status: payload.status,
      });
      updateAlunoInList(response.data);
      setSuccessMessage("Aluno atualizado com sucesso.");
      closeEditModal();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível salvar as alterações do aluno.";
      setEditError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLinkSubmit = async (classId: string) => {
    if (!selectedAluno) {
      return;
    }

    setSavingLink(true);
    setLinkError(null);

    try {
      const response = await api.patch<Person>(`/participants/${selectedAluno.id}/class`, {
        classId,
      });
      updateAlunoInList(response.data);
      setSuccessMessage("Aluno vinculado à turma com sucesso.");
      closeLinkModal();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível vincular o aluno à turma.";
      setLinkError(message);
    } finally {
      setSavingLink(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!pendingUnlink) {
      return;
    }

    const requestKey = `${pendingUnlink.studentId}:${pendingUnlink.classId}`;
    setUnlinkingKey(requestKey);
    setUnlinkError(null);

    try {
      await api.delete(`/classes/${pendingUnlink.classId}/participants/${pendingUnlink.studentId}`);

      setAlunos((current) =>
        current.map((item) =>
          item.id === pendingUnlink.studentId
            ? {
                ...item,
                classes: item.classes.filter((classItem) => classItem.id !== pendingUnlink.classId),
              }
            : item
        )
      );

      if (selectedAluno?.id === pendingUnlink.studentId) {
        setSelectedAluno({
          ...selectedAluno,
          classes: selectedAluno.classes.filter((classItem) => classItem.id !== pendingUnlink.classId),
        });
      }

      setSuccessMessage("Aluno desvinculado da turma com sucesso.");
      setPendingUnlink(null);
      setUnlinkManagerStudentId((current) =>
        current === pendingUnlink.studentId ? null : current
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        "Não foi possível remover o vínculo do aluno com a turma.";
      setUnlinkError(message);
    } finally {
      setUnlinkingKey(null);
    }
  };

  const statusLabel: Record<Person["status"], string> = {
    active: "Ativo",
    inactive: "Inativo",
  };

  const formatLastAttendance = (date: string | null | undefined) => {
    if (!date) return null;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    });
  };

  const renderStatusIndicator = (aluno: Person) => {
    const isLoading = statusLoadingId === aluno.id;

    return (
      <button
        type="button"
        className={`student-status-indicator student-status-indicator--${aluno.status}`}
        onClick={() => handleStatusToggle(aluno)}
        disabled={!canManageStudents || isLoading}
        aria-label={`Alterar status de ${aluno.fullName}`}
      >
        <span className="student-status-indicator__dot" aria-hidden="true" />
        <span>{isLoading ? "Salvando..." : statusLabel[aluno.status]}</span>
      </button>
    );
  };

  if (!canManageStudents) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) return <div className="loading">Carregando alunos...</div>;
  if (error && alunos.length === 0) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Alunos ({alunos.length})</h1>
        <Link to="/alunos/novo" className="btn btn-primary students-page__add-desktop">
          + Adicionar aluno
        </Link>
      </div>

      {successMessage && (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div className="filters">
        <input
          type="search"
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="students-quick-list" aria-label="Lista de alunos">
        {alunos.map((a) => (
          <article key={a.id} className="student-quick-card">
            <div className="student-quick-card__top">
              <div className="student-quick-card__identity">
                <h2 className="student-quick-card__name">{a.fullName ?? a.name ?? ""}</h2>
                {renderStatusIndicator(a)}
              </div>
            </div>

            {(a.email || a.phone || formatLastAttendance(a.lastAttendanceDate)) && (
              <div className="student-quick-card__contact">
                <span className="student-quick-card__label">Informações de contato</span>
                {a.email && (
                  <div className="student-quick-card__contact-item">
                    <span className="student-quick-card__contact-label">Email</span>
                    <span className="student-quick-card__contact-value">{a.email}</span>
                  </div>
                )}
                {a.phone && (
                  <div className="student-quick-card__contact-item">
                    <span className="student-quick-card__contact-label">Telefone</span>
                    <span className="student-quick-card__contact-value">{a.phone}</span>
                  </div>
                )}
                {formatLastAttendance(a.lastAttendanceDate) && (
                  <div className="student-quick-card__contact-item">
                    <span className="student-quick-card__contact-label">Última presença</span>
                    <span className="student-quick-card__contact-value">
                      {formatLastAttendance(a.lastAttendanceDate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="student-quick-card__section">
              <span className="student-quick-card__label">Turmas</span>
              {a.classes.length > 0 ? (
                <div className="student-class-list">
                  {a.classes.map((classItem) => (
                    <div key={classItem.id} className="student-class-list__item">
                      <span className="badge">{classItem.name}</span>
                      {unlinkManagerStudentId === a.id && (
                        <button
                          type="button"
                          className="student-class-list__remove"
                          onClick={() => openUnlinkConfirmation(a, classItem)}
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="student-quick-card__empty">Nenhuma turma vinculada</p>
              )}
            </div>

            {canManageStudents && (
              <div className="student-quick-card__actions">
                <button
                  type="button"
                  className="student-inline-action"
                  onClick={() => openEditModal(a)}
                >
                  Editar
                </button>
                <span className="student-quick-card__separator">|</span>
                <button
                  type="button"
                  className="student-inline-action"
                  onClick={() => openLinkModal(a)}
                >
                  Vincular
                </button>
                <span className="student-quick-card__separator">|</span>
                <button
                  type="button"
                  className="student-inline-action"
                  onClick={() => toggleUnlinkManager(a.id)}
                  disabled={a.classes.length === 0}
                >
                  {unlinkManagerStudentId === a.id ? "Cancelar" : "Desvincular"}
                </button>
                {a.status === "active" && (
                  <>
                    <span className="student-quick-card__separator">|</span>
                    <button
                      type="button"
                      className="student-inline-action student-inline-action--danger"
                      onClick={() => openDeleteConfirmation(a)}
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {alunos.length === 0 && (
        <p className="empty">Nenhum aluno cadastrado.</p>
      )}

      <Link
        to="/alunos/novo"
        className="students-fab"
        aria-label="Cadastrar aluno"
      >
        +
      </Link>

      {isLinkModalOpen && selectedAluno && (
        <StudentClassModal
          studentName={selectedAluno.fullName}
          classes={selectedAluno.classes}
          classOptions={availableClassOptions}
          loadingClasses={loadingClasses}
          saving={savingLink}
          error={linkError}
          onClose={closeLinkModal}
          onSubmit={handleLinkSubmit}
        />
      )}

      {isEditModalOpen && selectedAluno && (
        <StudentEditModal
          student={selectedAluno}
          saving={savingEdit}
          error={editError}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
        />
      )}

      {pendingDelete && (
        <div className="modal-overlay" role="presentation">
          <div className="modal student-unlink-modal" role="dialog" aria-modal="true">
            <h3>Excluir aluno</h3>
            <p className="muted">
              O aluno <strong>{pendingDelete.fullName}</strong> será desativado. Ele não aparecerá
              mais nas listas de chamada e vinculação, mas o histórico será preservado.
            </p>
            <p className="muted">Esta ação pode ser revertida editando o aluno e alterando o status para ativo.</p>
            {deleteError && <p className="form-error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDeleteConfirmation}
                disabled={deletingId != null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDelete}
                disabled={deletingId != null}
              >
                {deletingId ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingUnlink && (
        <div className="modal-overlay" role="presentation">
          <div className="modal student-unlink-modal" role="dialog" aria-modal="true">
            <h3>Remover aluno da turma</h3>
            <p className="muted">
              Esta ação removerá o vínculo do aluno com a turma.
            </p>
            <p className="muted">
              O histórico de presença será mantido.
            </p>

            <div className="student-unlink-modal__summary">
              <span>Aluno</span>
              <strong>{pendingUnlink.studentName}</strong>
              <span>Turma</span>
              <strong>{pendingUnlink.className}</strong>
            </div>

            {unlinkError && <p className="form-error">{unlinkError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeUnlinkConfirmation}
                disabled={unlinkingKey != null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmUnlink}
                disabled={unlinkingKey != null}
              >
                {unlinkingKey ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
