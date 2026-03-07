import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  email: string | null;
  phone: string | null;
  type: string;
  status: "active" | "inactive";
  classes: StudentClass[];
}

interface ClassOption {
  id: string;
  name: string;
  day?: number;
  time?: string;
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
  const [editError, setEditError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const isSuperAdmin = user?.role === "super_admin";

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
    params.set("type", "participant");
    if (search.trim()) params.set("q", search.trim());

    api
      .get<Person[]>(`/people?${params}`)
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
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditError(null);
    setSelectedAluno(null);
  };

  const openLinkModal = async (aluno: Person) => {
    setSelectedAluno(aluno);
    setLinkError(null);
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

  const handleStatusToggle = async (aluno: Person) => {
    const nextStatus = aluno.status === "active" ? "inactive" : "active";
    setStatusLoadingId(aluno.id);
    setError(null);

    try {
      const response = await api.patch<Person>(`/people/${aluno.id}/status`, {
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
      const response = await api.put<Person>(`/people/${selectedAluno.id}`, payload);
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
      const response = await api.patch<Person>(`/people/${selectedAluno.id}/class`, {
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

  const statusLabel: Record<Person["status"], string> = {
    active: "Ativo",
    inactive: "Inativo",
  };

  if (loading) return <div className="loading">Carregando alunos...</div>;
  if (error && alunos.length === 0) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Alunos</h1>
        <Link to="/alunos/novo" className="btn btn-primary">
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
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Turma vinculada</th>
              {isSuperAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id}>
                <td>{a.fullName}</td>
                <td>{a.email ?? "—"}</td>
                <td>{a.phone ?? "—"}</td>
                <td>
                  <span className={`badge ${a.status}`}>
                    {statusLabel[a.status] ?? a.status}
                  </span>
                </td>
                <td>
                  {a.classes.length > 0 ? (
                    <div className="student-classes-cell">
                      {a.classes.map((classItem) => (
                        <span key={classItem.id} className="badge">
                          {classItem.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                {isSuperAdmin && (
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => openEditModal(a)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${a.status === "active" ? "btn-absent" : "btn-primary"}`}
                        onClick={() => handleStatusToggle(a)}
                        disabled={statusLoadingId === a.id}
                      >
                        {statusLoadingId === a.id
                          ? "Salvando..."
                          : a.status === "active"
                            ? "Inativar"
                            : "Ativar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => openLinkModal(a)}
                      >
                        Vincular à turma
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alunos.length === 0 && (
        <p className="empty">Nenhum aluno cadastrado.</p>
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
    </div>
  );
}
