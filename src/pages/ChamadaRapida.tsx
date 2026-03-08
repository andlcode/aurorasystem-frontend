import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { getTodayBahia } from "../utils/dateUtils";

type QuickStatus = "unmarked" | "presente" | "ausente" | "justificado";

interface Member {
  id: string;
  fullName?: string;
  name?: string;
}

interface ClassInfo {
  id: string;
  name: string;
  day?: number;
  time?: string;
}

interface SessionData {
  id: string;
  sessionDate: string;
  class_: ClassInfo;
  members: Member[];
  items: Array<{
    participantId: string;
    status: "present" | "absent" | "justified";
  }>;
}

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const STATUS_SEQUENCE: QuickStatus[] = ["presente", "ausente", "justificado"];

const STATUS_META: Record<
  Exclude<QuickStatus, "unmarked">,
  { label: string; icon: string; counterLabel: string }
> = {
  presente: {
    label: "Presente",
    icon: "✔",
    counterLabel: "Presentes",
  },
  ausente: {
    label: "Ausente",
    icon: "✖",
    counterLabel: "Ausentes",
  },
  justificado: {
    label: "Justificado",
    icon: "⚠",
    counterLabel: "Justificados",
  },
};

export function ChamadaRapida() {
  const { classId } = useParams<{ classId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, QuickStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const today = getTodayBahia();
      const sessionResponse = await api.post<{ id: string }>(`/classes/${classId}/sessions`, {
        date: today,
      });
      const detailsResponse = await api.get<SessionData>(
        `/classes/${classId}/sessions/${sessionResponse.data.id}`
      );

      const data = detailsResponse.data;
      const nextStatusMap: Record<string, QuickStatus> = {};

      const items = data.items ?? [];
      for (const member of data.members ?? []) {
        const item = items.find((attendance) => attendance.participantId === member.id);
        nextStatusMap[member.id] =
          item?.status === "present"
            ? "presente"
            : item?.status === "absent"
              ? "ausente"
              : item?.status === "justified"
                ? "justificado"
              : "unmarked";
      }

      setSession(data);
      setStatusMap(nextStatusMap);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Erro ao abrir a chamada rápida.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const toggleStatus = (participantId: string) => {
    setStatusMap((current) => ({
      ...current,
      [participantId]: (() => {
        const currentStatus = current[participantId] ?? "unmarked";
        if (currentStatus === "unmarked") {
          return STATUS_SEQUENCE[0];
        }

        const nextIndex = (STATUS_SEQUENCE.indexOf(currentStatus) + 1) % STATUS_SEQUENCE.length;
        return STATUS_SEQUENCE[nextIndex];
      })(),
    }));
  };

  const presentCount = useMemo(
    () => Object.values(statusMap).filter((status) => status === "presente").length,
    [statusMap]
  );

  const absentCount = useMemo(
    () => Object.values(statusMap).filter((status) => status === "ausente").length,
    [statusMap]
  );

  const justifiedCount = useMemo(
    () => Object.values(statusMap).filter((status) => status === "justificado").length,
    [statusMap]
  );

  const totalCount = session?.members.length ?? 0;

  const markAllPresent = () => {
    if (!session) return;

    const nextMap: Record<string, QuickStatus> = {};
    for (const member of session.members) {
      nextMap[member.id] = "presente";
    }
    setStatusMap(nextMap);
  };

  const finishAttendance = async () => {
    if (!session || !classId) return;

    setSaving(true);
    setError(null);

    try {
      await api.put(`/classes/${classId}/sessions/${session.id}/attendance`, {
        records: session.members.map((member) => ({
          participantId: member.id,
          status:
            statusMap[member.id] === "ausente"
              ? "ausente"
              : statusMap[member.id] === "justificado"
                ? "justificado"
                : "presente",
        })),
      });

      setSuccessMessage("Chamada finalizada com sucesso.");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Erro ao finalizar a chamada.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Abrindo chamada rápida...</div>;
  }

  if (error && !session) {
    return <div className="error">{error}</div>;
  }

  if (!session) {
    return <div className="error">Turma não encontrada.</div>;
  }

  const classWeekdayLabel =
    session.class_.day != null ? dayNames[session.class_.day] : "Turma do dia";

  return (
    <div className="page quick-attendance-page">
      <div className="quick-attendance-page__header">
        <Link to="/dashboard" className="back-link">
          ← Dashboard
        </Link>
        <p className="quick-attendance-page__eyebrow">Chamada rápida</p>
        <h1>{session.class_.name}</h1>
        <p className="quick-attendance-page__subtitle">
          {classWeekdayLabel}
          {session.class_.time ? ` às ${session.class_.time}` : ""}
        </p>
      </div>

      {successMessage ? (
        <div className="success-banner" role="alert">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <p className="error-inline quick-attendance-page__error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="quick-attendance-toolbar" aria-label="Resumo da chamada">
        <div className="quick-attendance-counters">
          <div className="quick-attendance-counter quick-attendance-counter--presente">
            <span className="quick-attendance-counter__label">Presentes</span>
            <strong>{presentCount}</strong>
          </div>
          <div className="quick-attendance-counter quick-attendance-counter--ausente">
            <span className="quick-attendance-counter__label">Ausentes</span>
            <strong>{absentCount}</strong>
          </div>
          <div className="quick-attendance-counter quick-attendance-counter--justificado">
            <span className="quick-attendance-counter__label">Justificados</span>
            <strong>{justifiedCount}</strong>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-ghost quick-attendance-toolbar__action"
          onClick={markAllPresent}
          disabled={totalCount === 0}
        >
          Marcar todos presentes
        </button>
      </section>

      <div className="quick-attendance-list" aria-label="Lista de alunos para presença">
        {session.members.map((member) => {
          const status = statusMap[member.id] ?? "unmarked";
          const statusMeta = status === "unmarked" ? null : STATUS_META[status];

          return (
            <button
              key={member.id}
              type="button"
              className={`quick-attendance-card quick-attendance-card--${status}`}
              onClick={() => toggleStatus(member.id)}
              aria-pressed={status !== "unmarked"}
              aria-label={`Alternar status de ${member.fullName ?? member.name ?? ""}`}
            >
              <span className="quick-attendance-card__name">{member.fullName ?? member.name ?? ""}</span>
              <span className={`quick-attendance-card__status quick-attendance-card__status--${status}`}>
                {statusMeta ? `${statusMeta.icon} ${statusMeta.label}` : "Toque para marcar"}
              </span>
              <span className="quick-attendance-card__hint">
                Toque para alternar: Presente, Ausente e Justificado
              </span>
            </button>
          );
        })}
      </div>

      <div className="quick-attendance-footer">
        <div className="quick-attendance-footer__summary">
          {presentCount + absentCount + justifiedCount} de {totalCount} participantes marcados
        </div>
        <button
          type="button"
          className="btn btn-primary quick-attendance-footer__button"
          onClick={finishAttendance}
          disabled={saving || totalCount === 0}
        >
          {saving ? "Finalizando..." : "Finalizar chamada"}
        </button>
      </div>
    </div>
  );
}
