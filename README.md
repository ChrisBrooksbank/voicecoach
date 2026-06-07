# VoiceCoach

A phone-first PWA that helps you speak at a suitable volume for the room.

Live app: [https://voicecoach-volume.netlify.app](https://voicecoach-volume.netlify.app)

## Why This Exists

Sometimes your voice sounds fine to you, but other people can barely hear it. Other times, especially in a quiet setting, you may speak louder than you intended. VoiceCoach is a private, local-first microphone coach that helps you build a better feel for "audible but not awkwardly loud".

The app focuses on one job: live voice-volume calibration for everyday situations.

It is not a general public-speaking coach, a speech disorder diagnostic tool, or a certified sound-level meter.

## What It Does

- Uses the phone microphone to estimate your speaking level relative to room noise.
- Offers situation modes such as quiet room, normal conversation, meeting, noisy place, and presentation.
- Guides you with simple cues like "Lift a little", "Hold this level", and "Ease down".
- Includes a calibration flow for room noise and your target voice.
- Supports optional vibration nudges for discreet feedback.
- Saves session summaries locally.
- Includes a simple practice drill for learning how the target level feels.

## Research-Informed Approach

VoiceCoach is designed around a few practical ideas from speech science and therapy practice:

- People do not always perceive their own loudness accurately.
- Good speaking volume depends on context: ambient noise, listener distance, room acoustics, and social setting.
- Phone microphones are useful for relative feedback, but they are not calibrated measurement devices.
- Real-time biofeedback can help people notice mismatch between intention and output.
- Recalibration matters: the goal is not only to see a meter, but to learn what the right level feels like.

The product plan in [PLAN.md](./PLAN.md) includes more detailed research notes and references.

## Current Status

This is an early working prototype.

Implemented:

- React, TypeScript, and Vite PWA
- Netlify production deployment
- Web Audio microphone analysis
- Situation presets and target ranges
- Ambient and voice calibration flow
- Live coaching states
- Practice, history, and settings screens
- Local-only storage for settings, calibration profiles, and session summaries
- PWA manifest and service worker

Needs real-world tuning:

- Pixel 7a microphone behavior
- Phone placement differences
- Quiet-room versus noisy-room thresholds
- Voice activity detection edge cases
- Long-session comfort and alert timing

## Live Deployment

Production URL:

[https://voicecoach-volume.netlify.app](https://voicecoach-volume.netlify.app)

Netlify configuration lives in [netlify.toml](./netlify.toml).

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Browser And Device Notes

Microphone access requires a secure context. The deployed Netlify URL uses HTTPS, so microphone permission should work in supported browsers.

For local phone testing, use a secure tunnel or another HTTPS setup if the browser blocks microphone access from a non-secure origin.

The first target device is an Android phone such as a Pixel 7a. Desktop browsers are useful for layout and build checks, but the real product quality depends on phone testing.

## Privacy

The prototype analyzes microphone input locally in the browser.

By default:

- Raw audio is not uploaded.
- Raw recordings are not saved.
- Session summaries and calibration settings are stored locally on the device.
- History can be deleted from the settings screen.

## Tech Stack

- React
- TypeScript
- Vite
- Web Audio API
- Local storage
- Netlify

## Safety Scope

VoiceCoach is a coaching and self-awareness tool. It does not diagnose or treat autism, Parkinson's disease, hearing loss, anxiety, or speech disorders.

If someone has persistent voice changes, pain, sudden speech changes, swallowing issues, or neurological symptoms, they should speak with a qualified clinician.
