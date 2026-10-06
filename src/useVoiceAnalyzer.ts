import { useCallback, useEffect, useRef, useState } from 'react';
import { amplitudeToRelativeDb, lerp, rmsFromTimeDomain } from './audio';
import type { AudioReading } from './types';

type AnalyzerStatus = 'idle' | 'requesting' | 'active' | 'paused' | 'error';

interface VoiceAnalyzer {
  status: AnalyzerStatus;
  error: string | null;
  reading: AudioReading;
  start: () => Promise<boolean>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
}

// Frames used to seed the room level before speech detection kicks in (~0.5s at 60fps).
const WARMUP_FRAMES = 30;
// How fast the room level may creep upward while speech is detected, so a bad seed recovers.
const AMBIENT_RISE_DURING_SPEECH = 0.0005;

const initialReading: AudioReading = {
  ambientLevel: 20,
  speechLevel: 20,
  speechOverAmbient: 0,
  rawLevel: 20,
  isSpeech: false,
  confidence: 0,
  timestamp: 0,
};

export function useVoiceAnalyzer(): VoiceAnalyzer {
  const [status, setStatus] = useState<AnalyzerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<AudioReading>(initialReading);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const ambientRef = useRef(20);
  const speechRef = useRef(20);
  const lastSpeechAtRef = useRef(0);
  const pausedRef = useRef(false);
  const warmupFramesRef = useRef(0);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const cleanup = useCallback(() => {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || pausedRef.current) return;

    if (!bufferRef.current || bufferRef.current.length !== analyser.fftSize) {
      bufferRef.current = new Float32Array(analyser.fftSize);
    }
    const data = bufferRef.current;
    // Float samples keep quiet-room detail that 8-bit byte data rounds away to silence.
    analyser.getFloatTimeDomainData(data);

    const rawLevel = amplitudeToRelativeDb(rmsFromTimeDomain(data));

    if (warmupFramesRef.current < WARMUP_FRAMES) {
      // Learn the room first; otherwise a stale seed makes every frame look like speech.
      ambientRef.current = warmupFramesRef.current === 0 ? rawLevel : Math.min(ambientRef.current, rawLevel);
      speechRef.current = ambientRef.current;
      warmupFramesRef.current += 1;
    }

    const ambient = ambientRef.current;
    const speechDelta = rawLevel - ambient;
    const now = performance.now();
    const isSpeech = speechDelta > 7 || (speechDelta > 4 && now - lastSpeechAtRef.current < 700);

    if (isSpeech) {
      lastSpeechAtRef.current = now;
      speechRef.current = lerp(speechRef.current, rawLevel, 0.22);
      ambientRef.current = lerp(ambientRef.current, rawLevel, AMBIENT_RISE_DURING_SPEECH);
    } else {
      ambientRef.current = lerp(ambientRef.current, rawLevel, rawLevel > ambient + 10 ? 0.01 : 0.06);
      speechRef.current = lerp(speechRef.current, Math.max(rawLevel, ambientRef.current), 0.04);
    }

    const nextAmbient = ambientRef.current;
    const nextSpeech = speechRef.current;
    const speechOverAmbient = Math.max(0, nextSpeech - nextAmbient);
    const confidence = isSpeech ? Math.min(1, Math.max(0, (speechDelta - 4) / 16)) : 0;

    setReading({
      ambientLevel: nextAmbient,
      speechLevel: nextSpeech,
      speechOverAmbient,
      rawLevel,
      isSpeech,
      confidence,
      timestamp: Date.now(),
    });

    frameRef.current = window.requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('Microphone access is not available in this browser.');
      return false;
    }

    try {
      setStatus('requesting');
      setError(null);
      cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = context;
      analyserRef.current = analyser;
      pausedRef.current = false;

      // iOS Safari starts contexts suspended when they are created after an await.
      if (context.state === 'suspended') {
        await context.resume();
      }

      setStatus('active');
      frameRef.current = window.requestAnimationFrame(tick);
      return true;
    } catch (caught) {
      cleanup();
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Could not start the microphone.');
      return false;
    }
  }, [cleanup, tick]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setStatus('paused');
  }, []);

  const resume = useCallback(async () => {
    if (!analyserRef.current) {
      await start();
      return;
    }

    pausedRef.current = false;
    setStatus('active');
    frameRef.current = window.requestAnimationFrame(tick);
  }, [start, tick]);

  const stop = useCallback(() => {
    cleanup();
    pausedRef.current = false;
    warmupFramesRef.current = 0;
    ambientRef.current = initialReading.ambientLevel;
    speechRef.current = initialReading.speechLevel;
    setStatus('idle');
    setReading(initialReading);
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { status, error, reading, start, pause, resume, stop };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
