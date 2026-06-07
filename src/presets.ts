import type { SituationPreset } from './types';

export const SITUATION_PRESETS: SituationPreset[] = [
  {
    id: 'quiet-room',
    label: 'Quiet room',
    shortLabel: 'Quiet',
    description: 'Close conversation where loudness should stay contained.',
    listenerDistance: '1-2 m',
    targetMin: 10,
    targetMax: 21,
    loudTolerance: 'strict',
  },
  {
    id: 'normal-conversation',
    label: 'Normal conversation',
    shortLabel: 'Normal',
    description: 'Everyday conversation across a table or small room.',
    listenerDistance: '1-3 m',
    targetMin: 14,
    targetMax: 27,
    loudTolerance: 'balanced',
  },
  {
    id: 'meeting',
    label: 'Meeting',
    shortLabel: 'Meeting',
    description: 'Project clearly enough for a few people nearby.',
    listenerDistance: '2-5 m',
    targetMin: 17,
    targetMax: 31,
    loudTolerance: 'balanced',
  },
  {
    id: 'restaurant',
    label: 'Restaurant / noisy place',
    shortLabel: 'Noisy',
    description: 'Compete gently with changing background noise.',
    listenerDistance: '1-2 m',
    targetMin: 20,
    targetMax: 36,
    loudTolerance: 'forgiving',
  },
  {
    id: 'presentation',
    label: 'Presentation',
    shortLabel: 'Present',
    description: 'Sustained projection for a room or small group.',
    listenerDistance: '4 m+',
    targetMin: 23,
    targetMax: 40,
    loudTolerance: 'forgiving',
  },
  {
    id: 'custom',
    label: 'Custom',
    shortLabel: 'Custom',
    description: 'Use your saved calibration as the target.',
    listenerDistance: 'variable',
    targetMin: 14,
    targetMax: 30,
    loudTolerance: 'balanced',
  },
];

export const getPreset = (id: string): SituationPreset =>
  SITUATION_PRESETS.find((preset) => preset.id === id) ?? SITUATION_PRESETS[1];
