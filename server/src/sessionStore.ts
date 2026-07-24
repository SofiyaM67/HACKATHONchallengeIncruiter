import type { IntegritySignal, RiskSnapshot, SavedAnswer, SessionMeta } from "./types.js";
import { scoreToLevel, weightedScore } from "./riskScoring.js";

export class SessionStore {
  private sessions = new Map<string, SessionMeta>();
  private signals = new Map<string, IntegritySignal[]>();
  private answers = new Map<string, SavedAnswer[]>();

  create(meta: SessionMeta): SessionMeta {
    this.sessions.set(meta.id, meta);
    this.signals.set(meta.id, []);
    this.answers.set(meta.id, []);
    return meta;
  }

  get(sessionId: string): SessionMeta | undefined {
    return this.sessions.get(sessionId);
  }

  getAnswers(sessionId: string): SavedAnswer[] {
    return [...(this.answers.get(sessionId) ?? [])].sort((a, b) =>
      a.updatedAt.localeCompare(b.updatedAt)
    );
  }

  saveAnswer(sessionId: string, entry: SavedAnswer): SavedAnswer[] {
    const list = this.answers.get(sessionId) ?? [];
    const idx = list.findIndex((a) => a.questionId === entry.questionId);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    this.answers.set(sessionId, list);
    return this.getAnswers(sessionId);
  }

  update(sessionId: string, patch: Partial<SessionMeta>): SessionMeta | undefined {
    const current = this.sessions.get(sessionId);
    if (!current) return undefined;
    const next = { ...current, ...patch };
    this.sessions.set(sessionId, next);
    return next;
  }

  addSignal(signal: IntegritySignal): RiskSnapshot {
    const list = this.signals.get(signal.sessionId) ?? [];
    const deduped = list.filter((s) => {
      if (s.kind !== signal.kind) return true;
      const delta = Math.abs(Date.parse(signal.at) - Date.parse(s.at));
      return delta > 2000;
    });
    deduped.push(signal);
    deduped.sort((a, b) => a.at.localeCompare(b.at));
    this.signals.set(signal.sessionId, deduped);
    return this.snapshot(signal.sessionId);
  }

  snapshot(sessionId: string): RiskSnapshot {
    const list = this.signals.get(sessionId) ?? [];
    const score = weightedScore(list);
    return {
      sessionId,
      score,
      level: scoreToLevel(list),
      signals: [...list],
      updatedAt: new Date().toISOString(),
    };
  }

  listSessions(): SessionMeta[] {
    return [...this.sessions.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
}
