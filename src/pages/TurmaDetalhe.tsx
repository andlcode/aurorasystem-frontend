import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getTodayBahia } from "../utils/dateUtils";

interface ClassDetail {
  id: string;
  name: string;
  day?: number;
  dayOfWeek?: number;
  time?: string;
  startTime?: string;
  responsible?: { fullName: string };
  owner?: { fullName: string };
}

interface Member {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

interface SessionWithMembers {
  id: string;
  sessionDate: string;
  members: Member[];
}

interface AttendanceItem {
  id: string;
  participantId: string;
  status: "present" | "absent" | "justified";
  justificationReason: string | null;
  participant: { id: string; fullName: string };
}

interface AttendanceResponse {
  items: AttendanceItem[];
  total: number;
  present: number;
  absent: number;
  justified: number;
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function TurmaDetalhe() {
  const { id: classId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [class_, setClass] = useState<ClassDetail | null>(null);
  const [participants, setParticipants] = useState<Member[]>([]);
  const [vincularModal, setVincularModal] = useState(false);
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<Member[]>([]);
  const [participanteSelecionado, setParticipanteSelecionado] = useState("");
  const [vincularLoading, setVincularLoading] = useState(false);
  const [vincularError, setVincularError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionWithMembers | null>(null);
  const [attendance, setAttendance] = useState<AttendanceResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => getTodayBahia());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justifiedModal, setJustifiedModal] = useState<{
    participantId: string;
    participantName: string;
  } | null>(null);
  const [justifiedReason, setJustifiedReason] = useState("");

  const loadClass = useCallback(async () => {
    if (!classId) return null;
    const res = await api.get<ClassDetail[]>("/classes");
    return res.data.find((c) => c.id === classId) ?? null;
  }, [classId]);

  const loadParticipants = useCallback(async () => {
    if (!classId) return;
    try {
      const res = await api.get<Member[]>(`/classes/${classId}/participants`);
      setParticipants(res.data);
    } catch {
      setParticipants([]);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) loadParticipants();
  }, [classId, loadParticipants]);

  useEffect(() => {
    if (vincularModal && classId) {
      setVincularError(null);
      setParticipanteSelecionado("");
      api
        .get<Member[]>("/people?type=participant")
        .then((res) => setParticipantesDisponiveis(res.data))
        .catch(() => setParticipantesDisponiveis([]));
    }
  }, [vincularModal, classId]);

  const handleVincular = async () => {
    if (!classId || !participanteSelecionado) return;
    setVincularLoading(true);
    setVincularError(null);
    try {
      await api.post(`/classes/${classId}/participants`, {
        participantId: participanteSelecionado,
      });
      await loadParticipants();
      setVincularModal(false);
    } catch (err: unknown) {
      const res = err as { response?: { data?: { error?: string } } };
      setVincularError(
        res.response?.data?.error ?? "Erro ao vincular participante. Tente novamente."
      );
    } finally {
      setVincularLoading(false);
    }
  };

  const openChamada = useCallback(async () => {
    if (!classId) return;
    setOpening(true);
    setError(null);
    try {
      const res = await api.post<SessionWithMembers>(
        `/classes/${classId}/sessions/open`,
        { date: selectedDate }
      );
      setSession(res.data);
      const attRes = await api.get<AttendanceResponse>(
        `/sessions/${res.data.id}/attendance`
      );
      setAttendance(attRes.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao abrir chamada";
      setError(msg);
      setSession(null);
      setAttendance(null);
    } finally {
      setOpening(false);
    }
  }, [classId, selectedDate]);

  const updateAttendance = useCallback(
    async (participantId: string, status: "present" | "absent" | "justified", justificationReason?: string) => {
      if (!session) return;
      try {
        await api.put(`/sessions/${session.id}/attendance`, {
          participantId,
          status,
          ...(status === "justified" && justificationReason
            ? { justificationReason }
            : {}),
        });
        const res = await api.get<AttendanceResponse>(
          `/sessions/${session.id}/attendance`
        );
        setAttendance(res.data);
      } catch (err) {
        console.error("Erro ao atualizar presença:", err);
      }
    },
    [session]
  );

  const handleJustifiedClick = (participantId: string, participantName: string) => {
    setJustifiedModal({ participantId, participantName });
    setJustifiedReason("");
  };

  const handleJustifiedSubmit = () => {
    if (!justifiedModal || justifiedReason.trim().length < 3) return;
    updateAttendance(justifiedModal.participantId, "justified", justifiedReason.trim());
    setJustifiedModal(null);
    setJustifiedReason("");
  };

  useEffect(() => {
    if (!classId) return;
    loadClass()
      .then(setClass)
      .catch((err) => setError(err?.message ?? "Erro ao carregar turma"))
      .finally(() => setLoading(false));
  }, [classId, loadClass]);

  if (loading) return <div className="loading">Carregando...</div>;
  if (error && !class_) return <div className="error">Erro: {error}</div>;
  if (!class_) return <div className="error">Turma não encontrada.</div>;

  const members = session?.members ?? [];
  const attendanceMap = new Map(
    attendance?.items.map((a) => [a.participantId, a]) ?? []
  );

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/turmas" className="back-link">
          ← Turmas
        </Link>
        <h1>{class_.name}</h1>
      </div>
      <div className="meta">
        {dayNames[class_.dayOfWeek ?? class_.day ?? 0]} {class_.startTime ?? class_.time ?? ""} •{" "}
        {(class_.owner ?? class_.responsible)?.fullName ?? ""}
      </div>

      <section className="section">
        <h2>Participantes vinculados</h2>
        {participants.length > 0 ? (
          <ul className="alunos-list">
            {participants.map((p) => (
              <li key={p.id}>{p.fullName}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-inline">Nenhum participante vinculado a esta turma.</p>
        )}
        {user?.role === "super_admin" && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setVincularModal(true)}
          >
            Vincular participante
          </button>
        )}
      </section>

      <section className="section chamada-section">
        <h2>Chamada</h2>
        <div className="chamada-header">
          <div className="date-row">
            <label>
              Data
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openChamada}
              disabled={opening}
            >
              {opening ? "Abrindo..." : "Abrir chamada"}
            </button>
          </div>
          {error && <p className="error-inline">{error}</p>}
        </div>

        {session && (
          <>
            <div className="stats-row chamada-stats">
              <span>
                Presentes: <strong>{attendance?.present ?? 0}</strong>
              </span>
              <span>
                Faltas: <strong>{attendance?.absent ?? 0}</strong>
              </span>
              <span>
                Justificadas: <strong>{attendance?.justified ?? 0}</strong>
              </span>
            </div>

            <div className="participant-search">
              <input
                type="search"
                placeholder="Buscar participante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="participant-list">
              {filteredMembers.map((m) => {
                const att = attendanceMap.get(m.id);
                const status = att?.status ?? null;
                return (
                  <div key={m.id} className="participant-row">
                    <span className="participant-name">{m.fullName}</span>
                    <div className="attendance-buttons">
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "present" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => updateAttendance(m.id, "present")}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "absent" ? "btn-absent" : "btn-ghost"}`}
                        onClick={() => updateAttendance(m.id, "absent")}
                      >
                        Falta
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "justified" ? "btn-justified" : "btn-ghost"}`}
                        onClick={() => handleJustifiedClick(m.id, m.fullName)}
                      >
                        Justificada
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredMembers.length === 0 && (
              <p className="empty">Nenhum participante encontrado.</p>
            )}
          </>
        )}
      </section>

      {vincularModal && (
        <div
          className="modal-overlay"
          onClick={() => !vincularLoading && setVincularModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Vincular participante – {class_.name}</h3>
            <label>
              Selecione o participante
              <select
                value={participanteSelecionado}
                onChange={(e) => setParticipanteSelecionado(e.target.value)}
                disabled={vincularLoading}
              >
                <option value="">Selecione...</option>
                {participantesDisponiveis
                  .filter((p) => !participants.some((m) => m.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
              </select>
            </label>
            {participantesDisponiveis.filter((p) => !participants.some((m) => m.id === p.id))
              .length === 0 && (
              <p className="muted">Todos os participantes já estão vinculados a esta turma.</p>
            )}
            {vincularError && (
              <p className="form-error" role="alert">
                {vincularError}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setVincularModal(false)}
                disabled={vincularLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleVincular}
                disabled={
                  vincularLoading ||
                  !participanteSelecionado ||
                  participantesDisponiveis.filter((p) => !participants.some((m) => m.id === p.id))
                    .length === 0
                }
              >
                {vincularLoading ? "Vinculando..." : "Vincular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {justifiedModal && (
        <div className="modal-overlay" onClick={() => setJustifiedModal(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Justificativa – {justifiedModal.participantName}</h3>
            <label>
              Motivo (mín. 3 caracteres)
              <input
                type="text"
                value={justifiedReason}
                onChange={(e) => setJustifiedReason(e.target.value)}
                placeholder="Ex: Consulta médica"
                minLength={3}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setJustifiedModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleJustifiedSubmit}
                disabled={justifiedReason.trim().length < 3}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
