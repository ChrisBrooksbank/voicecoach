import type { AppSettings, CalibrationProfile, SessionSummary, SituationId } from './types';

const SETTINGS_KEY = 'voicecoach:settings';
const CALIBRATIONS_KEY = 'voicecoach:calibrations';
const SESSIONS_KEY = 'voicecoach:sessions';

export const defaultSettings: AppSettings = {
  toneMode: 'gentle',
  alertMode: 'both',
  alertTarget: 'both',
  vibrationEnabled: true,
  discreetMode: false,
  placement: 'handheld',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private browsing); coaching still works without it.
  }
}

export function loadSettings(): AppSettings {
  return { ...defaultSettings, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function loadCalibrations(): CalibrationProfile[] {
  return readJson<CalibrationProfile[]>(CALIBRATIONS_KEY, []);
}

export function saveCalibration(profile: CalibrationProfile): CalibrationProfile[] {
  const existing = loadCalibrations().filter(
    (item) => !(item.situationId === profile.situationId && item.placement === profile.placement),
  );
  const next = [profile, ...existing].slice(0, 24);
  writeJson(CALIBRATIONS_KEY, next);
  return next;
}

export function findCalibration(
  calibrations: CalibrationProfile[],
  situationId: SituationId,
  placement: string,
): CalibrationProfile | undefined {
  return (
    calibrations.find((item) => item.situationId === situationId && item.placement === placement) ??
    calibrations.find((item) => item.situationId === situationId)
  );
}

export function loadSessions(): SessionSummary[] {
  return readJson<SessionSummary[]>(SESSIONS_KEY, []);
}

export function saveSession(summary: SessionSummary): SessionSummary[] {
  const next = [summary, ...loadSessions()].slice(0, 50);
  writeJson(SESSIONS_KEY, next);
  return next;
}

export function deleteAllHistory(): void {
  try {
    window.localStorage.removeItem(SESSIONS_KEY);
    window.localStorage.removeItem(CALIBRATIONS_KEY);
  } catch {
    // Nothing persisted if storage is unavailable.
  }
}
