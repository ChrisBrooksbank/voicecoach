import {
  Activity,
  Bell,
  Check,
  Gauge,
  History,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  SlidersHorizontal,
  Trash2,
  Vibrate,
  Volume1,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, formatSeconds } from './audio';
import { getPreset, SITUATION_PRESETS } from './presets';
import {
  defaultSettings,
  deleteAllHistory,
  findCalibration,
  loadCalibrations,
  loadSessions,
  loadSettings,
  saveCalibration,
  saveSession,
  saveSettings,
} from './storage';
import type {
  AppSettings,
  CalibrationProfile,
  CoachSnapshot,
  CoachingState,
  SessionSummary,
  SituationId,
} from './types';
import { useVoiceAnalyzer } from './useVoiceAnalyzer';

type View = 'coach' | 'practice' | 'history' | 'settings';
type SessionCounts = Record<'inRange' | 'tooQuiet' | 'tooLoud' | 'uncertain', number>;

const COACH_INTERVAL_SECONDS = 0.25;

const initialCounts: SessionCounts = {
  inRange: 0,
  tooQuiet: 0,
  tooLoud: 0,
  uncertain: 0,
};

function gentleMessage(state: CoachingState): string {
  switch (state) {
    case 'tooQuiet':
      return 'Lift a little';
    case 'tooLoud':
      return 'Ease down';
    case 'inRange':
      return 'Hold this level';
    case 'uncertain':
      return 'Finding your voice';
    case 'calibratingAmbient':
      return 'Let the room settle';
    case 'calibratingVoice':
      return 'Speak your target level';
    case 'paused':
      return 'Paused';
    default:
      return 'Ready when you are';
  }
}

function directMessage(state: CoachingState): string {
  switch (state) {
    case 'tooQuiet':
      return 'Too quiet';
    case 'tooLoud':
      return 'Too loud';
    case 'inRange':
      return 'Good';
    case 'uncertain':
      return 'Uncertain';
    case 'calibratingAmbient':
      return 'Calibrating room';
    case 'calibratingVoice':
      return 'Calibrating voice';
    case 'paused':
      return 'Paused';
    default:
      return 'Idle';
  }
}

function recommend(summary: Omit<SessionSummary, 'recommendation'>): string {
  const total = Math.max(1, summary.durationSeconds);
  const quietRatio = summary.tooQuietSeconds / total;
  const loudRatio = summary.tooLoudSeconds / total;
  const rangeRatio = summary.inRangeSeconds / total;

  if (rangeRatio > 0.72) return 'You stayed in range most of the time.';
  if (quietRatio > loudRatio && quietRatio > 0.22) return 'Practice lifting slightly in this situation.';
  if (loudRatio > quietRatio && loudRatio > 0.22) return 'Practice easing down sooner when you notice the room is quiet.';
  if (summary.uncertainSeconds / total > 0.25) return 'Try keeping the phone position steady and recalibrate.';
  return 'Repeat a short drill and try to predict the target before looking.';
}

function createSummary(
  situationId: SituationId,
  startedAt: number,
  counts: SessionCounts,
  averageSpeechOverAmbient: number,
): SessionSummary {
  const endedAt = Date.now();
  const partial = {
    id: crypto.randomUUID(),
    situationId,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationSeconds: Math.max(1, (endedAt - startedAt) / 1000),
    inRangeSeconds: counts.inRange * COACH_INTERVAL_SECONDS,
    tooQuietSeconds: counts.tooQuiet * COACH_INTERVAL_SECONDS,
    tooLoudSeconds: counts.tooLoud * COACH_INTERVAL_SECONDS,
    uncertainSeconds: counts.uncertain * COACH_INTERVAL_SECONDS,
    averageSpeechOverAmbient,
  };

  return { ...partial, recommendation: recommend(partial) };
}

export function App() {
  const analyzer = useVoiceAnalyzer();
  const [view, setView] = useState<View>('coach');
  const [selectedSituation, setSelectedSituation] = useState<SituationId>('normal-conversation');
  const [settingsState, setSettingsState] = useState<AppSettings>(() =>
    typeof window === 'undefined' ? defaultSettings : loadSettings(),
  );
  const [calibrations, setCalibrations] = useState<CalibrationProfile[]>(() =>
    typeof window === 'undefined' ? [] : loadCalibrations(),
  );
  const [sessions, setSessions] = useState<SessionSummary[]>(() =>
    typeof window === 'undefined' ? [] : loadSessions(),
  );
  const [calibrationStep, setCalibrationStep] = useState<'none' | 'ambient' | 'voice'>('none');
  const [ambientSamples, setAmbientSamples] = useState<number[]>([]);
  const [voiceSamples, setVoiceSamples] = useState<number[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [counts, setCounts] = useState<SessionCounts>(initialCounts);
  const [speechSum, setSpeechSum] = useState(0);
  const [speechSamples, setSpeechSamples] = useState(0);
  const [lastSummary, setLastSummary] = useState<SessionSummary | null>(null);
  const [hiddenPractice, setHiddenPractice] = useState(false);
  const lastAlertRef = useRef(0);
  const stableStateRef = useRef<CoachingState>('idle');
  const driftCountRef = useRef(0);

  const preset = useMemo(() => getPreset(selectedSituation), [selectedSituation]);
  const calibration = useMemo(
    () => findCalibration(calibrations, selectedSituation, settingsState.placement),
    [calibrations, selectedSituation, settingsState.placement],
  );

  useEffect(() => {
    saveSettings(settingsState);
  }, [settingsState]);

  const targetRange = useMemo(() => {
    const offset = calibration?.personalOffset ?? 0;
    return {
      min: Math.max(6, preset.targetMin + offset),
      max: Math.max(preset.targetMin + 4, preset.targetMax + offset),
    };
  }, [calibration?.personalOffset, preset.targetMax, preset.targetMin]);

  const derivedState = useMemo<CoachingState>(() => {
    if (analyzer.status === 'idle') return 'idle';
    if (analyzer.status === 'paused') return 'paused';
    if (calibrationStep === 'ambient') return 'calibratingAmbient';
    if (calibrationStep === 'voice') return 'calibratingVoice';
    if (!analyzer.reading.isSpeech || analyzer.reading.confidence < 0.25) return 'uncertain';
    if (analyzer.reading.speechOverAmbient < targetRange.min) return 'tooQuiet';
    if (analyzer.reading.speechOverAmbient > targetRange.max) return 'tooLoud';
    return 'inRange';
  }, [
    analyzer.reading.confidence,
    analyzer.reading.isSpeech,
    analyzer.reading.speechOverAmbient,
    analyzer.status,
    calibrationStep,
    targetRange.max,
    targetRange.min,
  ]);

  const snapshot = useMemo<CoachSnapshot>(() => {
    const nextState = derivedState;
    if (nextState === stableStateRef.current) {
      driftCountRef.current = 0;
    } else {
      driftCountRef.current += 1;
      if (driftCountRef.current >= 5 || nextState.startsWith('calibrating') || nextState === 'paused') {
        stableStateRef.current = nextState;
        driftCountRef.current = 0;
      }
    }

    const state = stableStateRef.current;
    const meter = clamp(
      ((analyzer.reading.speechOverAmbient - Math.max(0, targetRange.min - 12)) /
        (targetRange.max - targetRange.min + 24)) *
        100,
      0,
      100,
    );

    return {
      ...analyzer.reading,
      state,
      meter,
      message: settingsState.toneMode === 'gentle' ? gentleMessage(state) : directMessage(state),
    };
  }, [analyzer.reading, derivedState, settingsState.toneMode, targetRange.max, targetRange.min]);

  useEffect(() => {
    if (calibrationStep === 'ambient') {
      setAmbientSamples((samples) => [...samples, analyzer.reading.rawLevel].slice(-60));
    }

    if (calibrationStep === 'voice' && analyzer.reading.isSpeech) {
      setVoiceSamples((samples) => [...samples, analyzer.reading.speechLevel].slice(-90));
    }
  }, [
    analyzer.reading.isSpeech,
    analyzer.reading.rawLevel,
    analyzer.reading.speechLevel,
    analyzer.reading.timestamp,
    calibrationStep,
  ]);

  useEffect(() => {
    if (analyzer.status !== 'active' || calibrationStep !== 'none' || !sessionStartedAt) return;

    const id = window.setInterval(() => {
      setCounts((current) => {
        const next = { ...current };
        if (snapshot.state === 'inRange') next.inRange += 1;
        if (snapshot.state === 'tooQuiet') next.tooQuiet += 1;
        if (snapshot.state === 'tooLoud') next.tooLoud += 1;
        if (snapshot.state === 'uncertain') next.uncertain += 1;
        return next;
      });

      if (analyzer.reading.isSpeech) {
        setSpeechSum((current) => current + analyzer.reading.speechOverAmbient);
        setSpeechSamples((current) => current + 1);
      }
    }, COACH_INTERVAL_SECONDS * 1000);

    return () => window.clearInterval(id);
  }, [
    analyzer.reading.isSpeech,
    analyzer.reading.speechOverAmbient,
    analyzer.status,
    calibrationStep,
    sessionStartedAt,
    snapshot.state,
  ]);

  useEffect(() => {
    const shouldAlert =
      analyzer.status === 'active' &&
      calibrationStep === 'none' &&
      settingsState.vibrationEnabled &&
      (settingsState.alertMode === 'vibration' || settingsState.alertMode === 'both') &&
      (snapshot.state === 'tooQuiet' || snapshot.state === 'tooLoud') &&
      (settingsState.alertTarget === 'both' || settingsState.alertTarget === snapshot.state);

    if (!shouldAlert || !navigator.vibrate) return;

    const now = Date.now();
    if (now - lastAlertRef.current < 4500) return;

    lastAlertRef.current = now;
    navigator.vibrate(snapshot.state === 'tooQuiet' ? [80] : [80, 80, 80]);
  }, [
    analyzer.status,
    calibrationStep,
    settingsState.alertMode,
    settingsState.alertTarget,
    settingsState.vibrationEnabled,
    snapshot.state,
  ]);

  async function startCalibration() {
    await analyzer.start();
    setLastSummary(null);
    setSessionStartedAt(null);
    setCalibrationStep('ambient');
    setAmbientSamples([]);
    setVoiceSamples([]);
    window.setTimeout(() => {
      setCalibrationStep('voice');
    }, 5000);
  }

  function finishCalibration() {
    const ambient = average(ambientSamples) || analyzer.reading.ambientLevel;
    const voice = average(voiceSamples) || analyzer.reading.speechLevel;
    const targetSpeechLevel = Math.max(voice, ambient + preset.targetMin + 2);
    const personalOffset = clamp(targetSpeechLevel - ambient - (preset.targetMin + preset.targetMax) / 2, -8, 8);
    const profile: CalibrationProfile = {
      situationId: selectedSituation,
      placement: settingsState.placement,
      ambientLevel: ambient,
      defaultSpeechLevel: voice,
      targetSpeechLevel,
      personalOffset,
      createdAt: new Date().toISOString(),
    };

    setCalibrations(saveCalibration(profile));
    setCalibrationStep('none');
    setCounts(initialCounts);
    setSpeechSum(0);
    setSpeechSamples(0);
    setSessionStartedAt(Date.now());
  }

  async function startSession() {
    await analyzer.start();
    setLastSummary(null);
    setCalibrationStep('none');
    setCounts(initialCounts);
    setSpeechSum(0);
    setSpeechSamples(0);
    setSessionStartedAt(Date.now());
  }

  function pauseOrResume() {
    if (analyzer.status === 'paused') {
      void analyzer.resume();
    } else {
      analyzer.pause();
    }
  }

  function endSession() {
    if (sessionStartedAt) {
      const summary = createSummary(
        selectedSituation,
        sessionStartedAt,
        counts,
        speechSamples > 0 ? speechSum / speechSamples : 0,
      );
      setLastSummary(summary);
      setSessions(saveSession(summary));
    }

    setSessionStartedAt(null);
    setCalibrationStep('none');
    analyzer.stop();
  }

  function resetHistory() {
    deleteAllHistory();
    setSessions([]);
    setCalibrations([]);
    setLastSummary(null);
  }

  const sessionActive = analyzer.status === 'active' || analyzer.status === 'paused';
  const activeClass = `coach-state coach-state-${snapshot.state}`;
  const canFinishCalibration = calibrationStep === 'voice' && voiceSamples.length > 8;
  const presetLabel = getPreset(selectedSituation).label;

  return (
    <div className={settingsState.discreetMode ? 'app discreet' : 'app'}>
      <header className="app-header">
        <div>
          <p className="eyebrow">VoiceCoach</p>
          <h1>{view === 'coach' ? presetLabel : titleForView(view)}</h1>
        </div>
        <div className="status-pill">
          <Shield size={16} />
          Local
        </div>
      </header>

      <main>
        {view === 'coach' && (
          <section className="coach-layout">
            <SituationPicker selected={selectedSituation} onSelect={setSelectedSituation} />

            <section className={activeClass} aria-live="polite">
              <div className="meter-shell">
                <div className="meter-track">
                  <div className="target-band" />
                  <div className="meter-fill" style={{ height: `${snapshot.meter}%` }} />
                </div>
                <div>
                  <p className="coach-label">{hiddenPractice ? 'Hidden practice' : snapshot.message}</p>
                  <p className="coach-detail">
                    {sessionActive
                      ? `${Math.round(snapshot.speechOverAmbient)} above room · target ${Math.round(
                          targetRange.min,
                        )}-${Math.round(targetRange.max)}`
                      : 'Calibrate or start a quick session'}
                  </p>
                </div>
              </div>

              <div className="signal-grid">
                <Metric label="Room" value={Math.round(snapshot.ambientLevel)} icon={<Volume1 size={18} />} />
                <Metric label="Voice" value={Math.round(snapshot.speechLevel)} icon={<Volume2 size={18} />} />
                <Metric label="Confidence" value={`${Math.round(snapshot.confidence * 100)}%`} icon={<Gauge size={18} />} />
              </div>
            </section>

            {calibrationStep !== 'none' && (
              <section className="guided-panel">
                <div>
                  <p className="eyebrow">{calibrationStep === 'ambient' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
                  <h2>{calibrationStep === 'ambient' ? 'Let the room settle' : 'Speak your target level'}</h2>
                  <p>
                    {calibrationStep === 'ambient'
                      ? 'Stay quiet for a few seconds so VoiceCoach can learn the room.'
                      : 'Speak as you would like to sound in this situation. Keep the phone position steady.'}
                  </p>
                </div>
                {calibrationStep === 'voice' && (
                  <button className="primary-button" disabled={!canFinishCalibration} onClick={finishCalibration}>
                    <Check size={20} />
                    Start coaching
                  </button>
                )}
              </section>
            )}

            {lastSummary && <SummaryCard summary={lastSummary} />}

            {analyzer.error && <p className="error-text">{analyzer.error}</p>}

            <section className="control-bar" aria-label="Session controls">
              {!sessionActive && (
                <>
                  <button className="primary-button" onClick={startCalibration}>
                    <Mic size={20} />
                    Calibrate
                  </button>
                  <button className="secondary-button" onClick={startSession}>
                    <Play size={20} />
                    Quick start
                  </button>
                </>
              )}
              {sessionActive && (
                <>
                  <button className="secondary-button" onClick={pauseOrResume}>
                    {analyzer.status === 'paused' ? <Play size={20} /> : <Pause size={20} />}
                    {analyzer.status === 'paused' ? 'Resume' : 'Pause'}
                  </button>
                  <button className="secondary-button" onClick={startCalibration}>
                    <RotateCcw size={20} />
                    Recalibrate
                  </button>
                  <button className="danger-button" onClick={endSession}>
                    End
                  </button>
                </>
              )}
            </section>
          </section>
        )}

        {view === 'practice' && (
          <section className="page-panel">
            <div className="section-heading">
              <Activity size={20} />
              <h2>Target Feel Drill</h2>
            </div>
            <p>
              Read one sentence while watching the meter, then hide feedback and try to keep the same voice.
            </p>
            <div className="practice-card">
              <p>
                "I can speak clearly at a level that suits this room, without pushing or disappearing."
              </p>
            </div>
            <label className="toggle-row">
              <span>Hide live feedback</span>
              <input
                type="checkbox"
                checked={hiddenPractice}
                onChange={(event) => setHiddenPractice(event.currentTarget.checked)}
              />
            </label>
            <button className="primary-button" onClick={() => setView('coach')}>
              <Mic size={20} />
              Use live coach
            </button>
          </section>
        )}

        {view === 'history' && (
          <section className="page-panel">
            <div className="section-heading">
              <History size={20} />
              <h2>Recent Sessions</h2>
            </div>
            {sessions.length === 0 && <p>No sessions yet. Run a short calibration and end the session to save one.</p>}
            <div className="history-list">
              {sessions.map((session) => (
                <SummaryCard key={session.id} summary={session} />
              ))}
            </div>
          </section>
        )}

        {view === 'settings' && (
          <section className="page-panel settings-panel">
            <div className="section-heading">
              <Settings size={20} />
              <h2>Settings</h2>
            </div>
            <SelectRow
              label="Coaching tone"
              value={settingsState.toneMode}
              options={[
                ['gentle', 'Gentle'],
                ['direct', 'Direct'],
              ]}
              onChange={(value) => setSettingsState({ ...settingsState, toneMode: value as AppSettings['toneMode'] })}
            />
            <SelectRow
              label="Phone position"
              value={settingsState.placement}
              options={[
                ['handheld', 'Handheld'],
                ['table', 'On table'],
                ['chest', 'Near chest'],
                ['pocket', 'Pocket'],
              ]}
              onChange={(value) => setSettingsState({ ...settingsState, placement: value as AppSettings['placement'] })}
            />
            <SelectRow
              label="Alerts"
              value={settingsState.alertTarget}
              options={[
                ['both', 'Both'],
                ['tooQuiet', 'Too quiet'],
                ['tooLoud', 'Too loud'],
              ]}
              onChange={(value) =>
                setSettingsState({ ...settingsState, alertTarget: value as AppSettings['alertTarget'] })
              }
            />
            <label className="toggle-row">
              <span>
                <Vibrate size={18} />
                Vibration
              </span>
              <input
                type="checkbox"
                checked={settingsState.vibrationEnabled}
                onChange={(event) =>
                  setSettingsState({ ...settingsState, vibrationEnabled: event.currentTarget.checked })
                }
              />
            </label>
            <label className="toggle-row">
              <span>
                <Bell size={18} />
                Discreet mode
              </span>
              <input
                type="checkbox"
                checked={settingsState.discreetMode}
                onChange={(event) => setSettingsState({ ...settingsState, discreetMode: event.currentTarget.checked })}
              />
            </label>
            <button className="danger-button wide" onClick={resetHistory}>
              <Trash2 size={20} />
              Delete history
            </button>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <NavButton active={view === 'coach'} icon={<Mic size={20} />} label="Coach" onClick={() => setView('coach')} />
        <NavButton
          active={view === 'practice'}
          icon={<Activity size={20} />}
          label="Practice"
          onClick={() => setView('practice')}
        />
        <NavButton
          active={view === 'history'}
          icon={<History size={20} />}
          label="History"
          onClick={() => setView('history')}
        />
        <NavButton
          active={view === 'settings'}
          icon={<SlidersHorizontal size={20} />}
          label="Settings"
          onClick={() => setView('settings')}
        />
      </nav>
    </div>
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function titleForView(view: View): string {
  if (view === 'practice') return 'Practice';
  if (view === 'history') return 'History';
  if (view === 'settings') return 'Settings';
  return 'VoiceCoach';
}

function SituationPicker({
  selected,
  onSelect,
}: {
  selected: SituationId;
  onSelect: (situation: SituationId) => void;
}) {
  return (
    <div className="situation-strip" aria-label="Situation modes">
      {SITUATION_PRESETS.map((preset) => (
        <button
          key={preset.id}
          className={selected === preset.id ? 'situation-chip active' : 'situation-chip'}
          onClick={() => onSelect(preset.id)}
          title={`${preset.description} Listener distance: ${preset.listenerDistance}`}
        >
          {preset.shortLabel}
        </button>
      ))}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryCard({ summary }: { summary: SessionSummary }) {
  const preset = getPreset(summary.situationId);
  return (
    <article className="summary-card">
      <div>
        <p className="eyebrow">{preset.label}</p>
        <h3>{summary.recommendation}</h3>
      </div>
      <div className="summary-grid">
        <Metric label="Good" value={formatSeconds(summary.inRangeSeconds)} icon={<Check size={18} />} />
        <Metric label="Quiet" value={formatSeconds(summary.tooQuietSeconds)} icon={<Volume1 size={18} />} />
        <Metric label="Loud" value={formatSeconds(summary.tooLoudSeconds)} icon={<Volume2 size={18} />} />
      </div>
    </article>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-row">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
