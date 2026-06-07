# VoiceCoach PWA Plan

## Product Focus

VoiceCoach is a phone-first progressive web app that helps the user speak at a suitable volume for the situation. The first target device is Android phones such as the Pixel 7a.

The core problem is inconsistent perceived loudness: sometimes the user's voice sounds fine to them but is barely audible to others; other times they speak too loudly for a quiet setting. VoiceCoach should act like a discreet personal volume coach, using the microphone to provide live guidance such as "lift a little", "in range", or "ease down".

## Product Principles

- Coach behavior, not identity. Avoid judgmental feedback like "you are loud" or "bad volume".
- Prefer simple guidance over raw audio engineering metrics.
- Make the main experience glanceable on a phone.
- Process audio locally by default.
- Do not save recordings unless the user explicitly starts a recording.
- Treat phone decibel readings as approximate and emphasize calibration.

## Relevant Ideas From Existing Apps

Several existing speech, voice, and sound-meter apps suggest useful patterns:

- Real-time pitch and volume visualization, as seen in voice analysis tools.
- Custom minimum and maximum target ranges for speech volume.
- Session statistics such as time in range, too quiet, and too loud.
- Adjustable alert thresholds, cooldowns, and sampling frequency.
- Situation-specific coaching, rather than one global volume target.
- Reports and trends that help users notice improvement over time.

VoiceCoach should stay narrower than a general public-speaking coach. The main job is not interview preparation, filler-word analysis, or speech scoring. The main job is live volume calibration in everyday situations.

## MVP Features

### 1. Live Volume Coach

The main screen should listen through the microphone and show one large coaching state:

- Too quiet
- Good
- Too loud

The app should use color bands to support fast recognition:

- Blue for too quiet
- Green for good
- Amber for loud
- Red for very loud

The screen should also include a simple live meter, but the coaching text should be more prominent than any numeric value.

### 2. Situation Modes

The first version should include preset modes:

- Quiet room
- Normal conversation
- Meeting
- Restaurant or noisy place
- Presentation
- Custom

Each mode should have different target ranges. The app should compare speech loudness against both an absolute target and the measured ambient noise level.

### 3. Calibration Flow

Each session should begin with a short calibration:

1. Stay quiet for 5 seconds while the app measures room noise.
2. Speak normally so the app can learn the user's default level.
3. Speak at the desired level for the current situation.

This creates a personal baseline instead of relying on phone microphone readings as if they were certified sound-level measurements.

### 4. Coaching Language

Feedback should be short, calm, and actionable:

- Lift a little
- Hold this level
- Ease down
- Great for this room
- Borderline quiet
- Borderline loud

Avoid alarming or embarrassing feedback, especially because the app may be used in social settings.

### 5. Discreet Alerts

Support optional vibration feedback where available:

- One short vibration when the user remains too quiet.
- Two short vibrations when the user remains too loud.

Alerts should only trigger after the user is outside the target range for a short duration, such as 2 seconds. Add a cooldown so the app does not become annoying.

### 6. Session Summary

At the end of a session, show:

- Time in good range
- Time too quiet
- Time too loud
- Average speech level relative to the target
- Suggested focus for next time

## Technical Architecture

### Frontend

- React
- TypeScript
- Vite
- PWA manifest and service worker
- Phone-first responsive design

### Audio

- Use `navigator.mediaDevices.getUserMedia` to request microphone access.
- Use the Web Audio API for local audio analysis.
- Compute short-window RMS volume.
- Smooth readings with a rolling average.
- Use simple voice activity detection to separate likely speech from background noise.
- Estimate signal-to-noise ratio rather than relying only on raw loudness.

### Storage

- Store calibration profiles and session summaries locally.
- Use IndexedDB if session history becomes structured or large.
- Use localStorage for early prototype settings if simpler.

### Privacy

- Do not upload microphone audio for the MVP.
- Do not store raw audio by default.
- Clearly explain that the app measures volume locally.

### PWA Constraints

- Microphone access requires a secure context such as HTTPS.
- The browser must request user permission before microphone use.
- Continuous microphone monitoring while the phone is locked or the app is fully backgrounded may be unreliable in a PWA.
- The first version should assume the app is open during active coaching.

## Main User Flow

1. Open the installed PWA.
2. Choose a situation mode.
3. Grant microphone permission.
4. Calibrate ambient noise.
5. Start live coaching.
6. Receive visual and optional vibration feedback.
7. End the session.
8. Review a short summary.

## Interface Direction

The app should feel like a practical everyday tool, not a studio audio dashboard.

Main screen:

- Top: current situation mode
- Center: large coaching status
- Middle: simple vertical or circular volume meter
- Bottom: Pause, Recalibrate, Mode

Design priorities:

- One-handed phone use
- Large readable status text
- Minimal controls
- Calm colors
- No dense charts during live coaching
- No visible instructional clutter once the session starts

## Post-MVP Ideas

- Adaptive target ranges that respond to changing ambient noise.
- Distance presets such as "1 meter away", "across table", or "small group".
- Practice drills for learning how target volume feels.
- A "blind practice" mode where the user speaks first, then sees the result.
- Trend history showing improvement over time.
- Optional short recordings for playback and review.
- Exportable summaries for a speech therapist or coach.

## Build Phases

1. Build a live microphone volume meter.
2. Add smoothing and voice activity detection.
3. Add calibration for ambient noise and personal baseline.
4. Add situation modes and target ranges.
5. Add coaching language and visual states.
6. Add optional vibration alerts with cooldowns.
7. Add session summaries.
8. Test on Pixel 7a and Chrome as an installed PWA.
9. Tune thresholds through real-world use in quiet, normal, noisy, and meeting-like settings.

## Definition of Success

The first useful version succeeds when the user can open the app before or during a conversation, choose the situation, calibrate quickly, and get calm, accurate-enough feedback that helps them stay audible without becoming awkwardly loud.
