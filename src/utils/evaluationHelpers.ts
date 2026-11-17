import { PhysicalEvaluationRecord, StrengthMaxRecord } from '../types';

export const getLocalTodayDateStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatRelativeEvalTime = (dateStr?: string, todayStr: string = getLocalTodayDateStr()): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const evalDate = new Date(`${dateStr}T12:00:00`);
  const todayDate = new Date(`${todayStr}T12:00:00`);
  const diffDays = Math.round((todayDate.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 14) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
  }
  const months = Math.max(
    1,
    (todayDate.getFullYear() - evalDate.getFullYear()) * 12 + (todayDate.getMonth() - evalDate.getMonth())
  );
  if (months < 12) return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`;
};

export const parseEnduranceTimeToSeconds = (str?: string): number => {
  if (!str) return 0;
  const match = str.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
};

export const isAerobicOmittedEval = (ev?: PhysicalEvaluationRecord | null): boolean =>
  Boolean(ev?.cooperTest?.sessionOmitted || ev?.cooperTest?.statusReason === 'Jornada Solo Fuerza 1RM');

export const isEnduranceCompletedEval = (ev?: PhysicalEvaluationRecord | null): boolean => {
  if (!ev || isAerobicOmittedEval(ev)) return false;
  const end = ev.enduranceTest;
  if (!end || end.sessionOmitted || end.status === 'na' || end.status === 'np') return false;
  const sec = typeof end.timeSeconds === 'number' && end.timeSeconds > 0
    ? end.timeSeconds
    : parseEnduranceTimeToSeconds(end.result);
  return sec > 0;
};

export const isCooperCompletedEval = (ev?: PhysicalEvaluationRecord | null): boolean => {
  if (!ev || isAerobicOmittedEval(ev)) return false;
  const c = ev.cooperTest;
  if (!c || c.sessionOmitted || c.status === 'na' || c.status === 'np') return false;
  return (c.distanceMeters || 0) > 0 || (c.lapsCount || 0) > 0 || (c.levelNumber || 0) > 0;
};

export const getEffectiveStrength1RMKg = (rec?: StrengthMaxRecord | null): number => {
  if (!rec || rec.status === 'na' || rec.status === 'np') return 0;
  return rec.estimated1RMKg > 0 ? rec.estimated1RMKg : (rec.weightKg || 0);
};

export const isStrengthCompletedEval = (ev?: PhysicalEvaluationRecord | null): boolean =>
  Boolean(
    ev?.strengthRecords?.some(
      (r) => r.status !== 'na' && r.status !== 'np' && getEffectiveStrength1RMKg(r) > 0
    )
  );

const SHORT_MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const formatYearMonthLabel = (ym: string): string => {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${SHORT_MONTHS_ES[idx] || m} ${y}`;
};

export const shiftYearMonth = (ym: string, deltaMonths: number): string => {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(y, m - 1 + deltaMonths, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

export interface ResolvedExerciseRecord {
  record: StrengthMaxRecord;
  evaluationDate: string;
  previousRecord: StrengthMaxRecord | null;
  previousDate: string | null;
}

const PILLAR_IDS: StrengthMaxRecord['exerciseId'][] = [
  'squats',
  'deadlift',
  'hip_thrust',
  'horizontal_press',
  'pullups_or_rows',
];

/**
 * Resolves the latest meaningful record per strength pillar across chronological evaluations,
 * ignoring "Pendiente en jornada Express" placeholders if an earlier real record exists.
 */
export const resolveLatestStrengthPillars = (
  sortedEvalsAsc: PhysicalEvaluationRecord[]
): ResolvedExerciseRecord[] => {
  const results: ResolvedExerciseRecord[] = [];

  for (const exId of PILLAR_IDS) {
    const history: { record: StrengthMaxRecord; evaluationDate: string }[] = [];
    for (const ev of sortedEvalsAsc) {
      const rec = (ev.strengthRecords || []).find((r) => r.exerciseId === exId);
      if (!rec) continue;
      if (rec.status === 'na' && rec.statusReason === 'Pendiente en jornada Express') continue;
      history.push({ record: rec, evaluationDate: ev.evaluationDate });
    }
    if (history.length === 0) {
      // Fallback: check if there's literally any entry even if express placeholder
      for (const ev of sortedEvalsAsc) {
        const rec = (ev.strengthRecords || []).find((r) => r.exerciseId === exId);
        if (rec) history.push({ record: rec, evaluationDate: ev.evaluationDate });
      }
    }
    if (history.length === 0) continue;

    const latest = history[history.length - 1];
    // Find latest valid previous record for delta comparison
    const prevValid = [...history.slice(0, -1)]
      .reverse()
      .find((h) => h.record.status !== 'na' && h.record.status !== 'np' && getEffectiveStrength1RMKg(h.record) > 0) || null;

    results.push({
      record: latest.record,
      evaluationDate: latest.evaluationDate,
      previousRecord: prevValid ? prevValid.record : null,
      previousDate: prevValid ? prevValid.evaluationDate : null,
    });
  }

  return results;
};
