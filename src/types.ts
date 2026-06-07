export type SituationId =
  | 'quiet-room'
  | 'normal-conversation'
  | 'meeting'
  | 'restaurant'
  | 'presentation'
  | 'custom';

export type CoachingState =
  | 'idle'
  | 'calibratingAmbient'
  | 'calibratingVoice'
  | 'listening'
  | 'tooQuiet'
  | 'inRange'
  | 'tooLoud'
  | 'uncertain'
  | 'paused';

export type AlertMode = 'visual' | 'vibration' | 'both';
export type AlertTarget = 'tooQuiet' | 'tooLoud' | 'both';
export type ToneMode = 'gentle' | 'direct';
export type PhonePlacement = 'handheld' | 'table' | 'chest' | 'pocket';

export interface SituationPreset {
  id: SituationId;
  label: string;
  shortLabel: string;
  description: string;
  listenerDistance: string;
  targetMin: number;
  targetMax: number;
  loudTolerance: 'strict' | 'balanced' | 'forgiving';
}

export interface CalibrationProfile {
  situationId: SituationId;
  placement: PhonePlacement;
  ambientLevel: number;
  defaultSpeechLevel: number;
  targetSpeechLevel: number;
  personalOffset: number;
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  situationId: SituationId;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  inRangeSeconds: number;
  tooQuietSeconds: number;
  tooLoudSeconds: number;
  uncertainSeconds: number;
  averageSpeechOverAmbient: number;
  recommendation: string;
}

export interface AppSettings {
  toneMode: ToneMode;
  alertMode: AlertMode;
  alertTarget: AlertTarget;
  vibrationEnabled: boolean;
  discreetMode: boolean;
  placement: PhonePlacement;
}

export interface AudioReading {
  ambientLevel: number;
  speechLevel: number;
  speechOverAmbient: number;
  rawLevel: number;
  isSpeech: boolean;
  confidence: number;
  timestamp: number;
}

export interface CoachSnapshot extends AudioReading {
  state: CoachingState;
  meter: number;
  message: string;
}
