import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { getTodayBahia } from "../utils/dateUtils";

type StatusKey = "presente" | "ausente" | "justificado";

interface Member {
  id: string;
  fullName?: string;
  name?: string; // API retorna name (Participant) ou fullName (session)
  email?: string | null;
  phone?: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  day?: number;
  time?: string;
  responsible?: { name: string };
}

interface SessionData {
  id: string;
  sessionDate: string;
  class_: ClassInfo;
  members: Member[];
  items: Array<{
    id: string;
    participantId: string;
    status: "present" | "absent" | "justified";
    justificationReason?: string | null;
    participant: { id: string; fullName?: string; name?: string };
  }>;
  present: number;
  absent: number;
  justified: number;
}

const statusToPt: Record<string, StatusKey> = {
  present: "presente",
  absent: "ausente",
  justified: "justificado",
};

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function ChamadaTurma() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId?: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [linkedParticipants, setLinkedParticipants] = useState<Member[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayBahia());
  const [statusMap, setStatusMap] = useState<Record<string, StatusKey>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [justifiedModal, setJustifiedModal] = useState<{
    participantId: string;
    participantName: string;
  } | null>(null);
  const [justifiedNotes, setJustifiedNotes] = useState("");

  const loadClass = useCallback(async () => {
    if (!classId) return null;
    const res = await api.get<ClassInfo[]>("/classes");
    return res.data.find((c) => c.id === classId) ?? null;
  }, [classId]);

  const loadLinkedParticipants = useCallback(async () => {
    if (!classId) return;

    setLoadingParticipants(true);

    try {
      console.log("[ChamadaTurma] selected class id:", classId);
      const res = await api.get<Member[]>(`/classes/${classId}/participants`);
      console.log("[ChamadaTurma] attendance participants endpoint response:", {
        classId,
        total: res.data.length,
        participants: res.data,
      });
      setLinkedParticipants(res.data);
    } catch (err) {
      console.error("[ChamadaTurma] error loading linked participants:", err);
      setLinkedParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [classId]);

  const openOrLoadSession = useCallback(async () => {
    if (!classId) return;
    setOpening(true);
    setError(null);
    try {
      const res = await api.post<{ id: string; members: Member[]; sessionDate: string; class_: ClassInfo }>(
        `/classes/${classId}/sessions`,
        { date: selectedDate }
      );
      const sessionRes = await api.get<SessionData>(
        `/classes/${classId}/sessions/${res.data.id}`
      );
      const data = sessionRes.data;
      console.log("[ChamadaTurma] session response:", {
        classId,
        sessionId: data.id,
        selectedDate,
        members: data.members.length,
      });
      setSession(data);

      const initial: Record<string, StatusKey> = {};
      const initialNotes: Record<string, string> = {};
      for (const m of data.members) {
        const att = data.items.find((a) => a.participantId === m.id);
        initial[m.id] = att ? statusToPt[att.status] : "ausente";
        if (att?.justificationReason) initialNotes[m.id] = att.justificationReason;
      }
      setStatusMap(initial);
      setNotesMap(initialNotes);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao abrir chamada";
      setError(msg);
      setSession(null);
    } finally {
      setOpening(false);
    }
  }, [classId, selectedDate]);

  const loadExistingSession = useCallback(async () => {
    if (!classId || !sessionId) return;
    setOpening(true);
    setError(null);
    try {
      const sessionRes = await api.get<SessionData>(
        `/classes/${classId}/sessions/${sessionId}`
      );
      const data = sessionRes.data;
      setSession(data);
      setSelectedDate(data.sessionDate.split("T")[0] ?? data.sessionDate);

      const initial: Record<string, StatusKey> = {};
      const initialNotes: Record<string, string> = {};
      for (const m of data.members) {
        const att = data.items.find((a) => a.participantId === m.id);
        initial[m.id] = att ? statusToPt[att.status] : "ausente";
        if (att?.justificationReason) initialNotes[m.id] = att.justificationReason;
      }
      setStatusMap(initial);
      setNotesMap(initialNotes);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao carregar chamada";
      setError(msg);
      setSession(null);
    } finally {
      setOpening(false);
    }
  }, [classId, sessionId]);

  const saveChamada = useCallback(async () => {
    if (!session || !classId) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    const isUpdate = session.items.length > 0;
    try {
      const records = session.members.map((m) => ({
        participantId: m.id,
        status: statusMap[m.id] ?? "ausente",
        notes: statusMap[m.id] === "justificado" ? notesMap[m.id] ?? undefined : undefined,
      }));
      await api.put(`/classes/${classId}/sessions/${session.id}/attendance`, {
        records,
      });
      setSuccessMessage(
        isUpdate ? "Chamada atualizada com sucesso." : "Chamada salva com sucesso."
      );
      const sessionRes = await api.get<SessionData>(
        `/classes/${classId}/sessions/${session.id}`
      );
      setSession(sessionRes.data);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ??
        (isUpdate ? "Não foi possível atualizar a chamada." : "Não foi possível salvar a chamada.");
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [session, classId, statusMap, notesMap]);

  const setStatus = useCallback((participantId: string, status: StatusKey) => {
    if (status === "justificado") {
      setJustifiedModal({ participantId, participantName: "" });
      return;
    }
    setStatusMap((prev) => ({ ...prev, [participantId]: status }));
  }, []);

  const handleJustifiedSubmit = () => {
    if (!justifiedModal) return;
    setStatusMap((prev) => ({
      ...prev,
      [justifiedModal.participantId]: "justificado",
    }));
    setNotesMap((prev) => ({
      ...prev,
      [justifiedModal.participantId]: justifiedNotes.trim(),
    }));
    setJustifiedModal(null);
    setJustifiedNotes("");
  };

  useEffect(() => {
    if (!classId) return;
    loadClass()
      .then(setClassInfo)
      .catch(() => setClassInfo(null))
      .finally(() => setLoading(false));
  }, [classId, loadClass]);

  useEffect(() => {
    if (!classId) return;
    loadLinkedParticipants();
  }, [classId, loadLinkedParticipants]);

  useEffect(() => {
    if (classId && sessionId) {
      loadExistingSession();
    }
  }, [classId, sessionId, loadExistingSession]);

  if (loading) return <div className="loading">Carregando...</div>;
  if (!classInfo) return <div className="error">Turma não encontrada.</div>;

  const members = session?.members ?? linkedParticipants;
  const filteredMembers = members.filter((m) =>
    (m.fullName ?? m.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatSessionDate = (d: string) => {
    const datePart = d.split("T")[0] ?? d;
    const [y, m, day] = datePart.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/turmas" className="back-link">
          ← Turmas
        </Link>
        <h1>Chamada – {classInfo.name}</h1>
      </div>

      <div className="meta">
        {classInfo.day != null && (
          <span>
            {dayNames[classInfo.day]} {classInfo.time ?? ""}
          </span>
        )}
        {classInfo.responsible && (
          <span>{classInfo.responsible?.name ?? ""}</span>
        )}
      </div>

      {successMessage && (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      )}

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
                disabled={!!session || !!sessionId}
              />
            </label>
            {!session ? (
              !sessionId ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openOrLoadSession}
                  disabled={opening}
                >
                  {opening ? "Abrindo..." : "Abrir chamada"}
                </button>
              ) : (
                <span className="muted">{opening ? "Carregando..." : ""}</span>
              )
            ) : (
              <span className="muted">
                Sessão de {formatSessionDate(session.sessionDate)}
              </span>
            )}
          </div>
          {error && <p className="error-inline">{error}</p>}
        </div>

        {session && (
          <>
            <div className="stats-row chamada-stats">
              <span>
                Presentes: <strong>{Object.values(statusMap).filter((s) => s === "presente").length}</strong>
              </span>
              <span>
                Ausentes: <strong>{Object.values(statusMap).filter((s) => s === "ausente").length}</strong>
              </span>
              <span>
                Justificados: <strong>{Object.values(statusMap).filter((s) => s === "justificado").length}</strong>
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
                const status = statusMap[m.id] ?? "ausente";
                return (
                  <div key={m.id} className="participant-row">
                    <span className="participant-name">{m.fullName ?? m.name ?? ""}</span>
                    <div className="attendance-buttons">
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "presente" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setStatus(m.id, "presente")}
                      >
                        Presente
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "ausente" ? "btn-absent" : "btn-ghost"}`}
                        onClick={() => setStatus(m.id, "ausente")}
                      >
                        Ausente
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${status === "justificado" ? "btn-justified" : "btn-ghost"}`}
                        onClick={() =>
                          setJustifiedModal({
                            participantId: m.id,
                            participantName: m.fullName ?? m.name ?? "",
                          })
                        }
                      >
                        Justificado
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMembers.length === 0 && (
              <p className="empty">Nenhum participante encontrado.</p>
            )}

            {members.length > 0 && (
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveChamada}
                  disabled={saving}
                >
                  {saving
                    ? "Salvando..."
                    : session.items.length > 0
                    ? "Atualizar chamada"
                    : "Salvar chamada"}
                </button>
                <Link to={`/turmas/${classId}/historico`} className="btn btn-ghost">
                  Ver histórico
                </Link>
              </div>
            )}
          </>
        )}

        {!session && !loadingParticipants && linkedParticipants.length === 0 && (
          <p className="empty">
            Esta turma não possui participantes vinculados. Vincule participantes na página da turma antes de fazer a chamada.
          </p>
        )}
      </section>

      {justifiedModal && (
        <div className="modal-overlay" onClick={() => setJustifiedModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Justificativa – {justifiedModal.participantName}</h3>
            <label>
              Motivo (opcional)
              <input
                type="text"
                value={justifiedNotes}
                onChange={(e) => setJustifiedNotes(e.target.value)}
                placeholder="Ex: Consulta médica"
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
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
