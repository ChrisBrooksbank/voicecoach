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
- Assume the user's internal sense of loudness may be unreliable in either direction.
- Teach a felt sense of target volume through repeated calibration, not just moment-by-moment correction.
- Support both "I am too quiet" and "I get too loud" without framing either as the default problem.

## Research-Informed Background

VoiceCoach is not a medical device, but it should be informed by speech science, auditory feedback research, and speech therapy practice.

### Who May Have This Problem

People can struggle with speaking volume for different reasons:

- Some people have a weak internal map between how loud their voice feels and how loud it is to other people.
- Some people speak too softly in ordinary conversation, especially when anxious, tired, masking, uncertain, or in groups.
- Some people become too loud when excited, overstimulated, trying to hold the floor, or speaking over background noise.
- Some autistic people report atypical prosody, including differences in loudness, pitch, rhythm, and conversational modulation. Research on autism and speech prosody identifies intensity, pitch, duration, and rhythm as relevant acoustic dimensions, although patterns vary widely between individuals.
- People with Parkinson's disease commonly experience reduced vocal loudness, often called hypophonia. A key clinical insight from LSVT LOUD is that therapy does not only make the voice louder; it helps recalibrate the person's sensory perception of what normal loudness feels like.
- People with hearing differences, auditory processing differences, sensory sensitivities, or temporary changes such as wearing earplugs or headphones may misjudge their own voice volume.
- Neurotypical speakers also change loudness automatically in noise through the Lombard effect, so situational volume control is a general human issue, not only a clinical one.

### What The Science Suggests

The app should be based on several practical ideas:

- **Auditory feedback matters.** Speech production uses self-monitoring: people listen to their own voice and adjust. If that feedback is distorted, masked, unusually salient, or hard to interpret, volume control can drift.
- **The Lombard effect is normal.** People tend to increase vocal effort in noisy environments. This can improve intelligibility, but it can also overshoot, especially when the noise changes quickly or when the social setting is quiet-but-reverberant.
- **Loudness is contextual.** A good speaking level depends on ambient noise, distance to listeners, room acoustics, social expectations, and whether the user is addressing one person or a group.
- **Absolute dB is not enough.** Phone microphones are not calibrated sound-level meters. The product should use relative measures: user's speech above ambient, target range for the chosen situation, and personal baseline.
- **Biofeedback can help motor learning.** Real-time visual or haptic feedback can help users notice mismatch between intention and output, especially if paired with practice tasks and progressively reduced guidance.
- **Recalibration is central.** LSVT LOUD emphasizes intensive practice, a simple target cue, and recalibrating what "normal" feels like. VoiceCoach should borrow the recalibration principle without claiming to provide therapy.
- **Too much feedback can increase self-consciousness.** The app should avoid constant correction, social embarrassment, or making the user monitor every syllable. It should encourage short practice sessions and discreet cues.

### Product Implications

Research points toward a product that teaches the user a new internal reference, not just a meter that says "louder" or "quieter".

- Use calibration at the start of a session.
- Use situation-specific target ranges.
- Use ambient noise as part of the target calculation.
- Use simple cues such as "lift", "hold", and "ease".
- Include practice drills that fade visual feedback over time.
- Measure speech-to-room relationship, not just raw microphone level.
- Provide summaries that show patterns without shaming the user.
- Make it easy to pause, because live feedback can become cognitively demanding.

## Relevant Ideas From Existing Apps

Several existing speech, voice, and sound-meter apps suggest useful patterns:

- Real-time pitch and volume visualization, as seen in voice analysis tools.
- Custom minimum and maximum target ranges for speech volume.
- Session statistics such as time in range, too quiet, and too loud.
- Adjustable alert thresholds, cooldowns, and sampling frequency.
- Situation-specific coaching, rather than one global volume target.
- Reports and trends that help users notice improvement over time.

VoiceCoach should stay narrower than a general public-speaking coach. The main job is not interview preparation, filler-word analysis, or speech scoring. The main job is live volume calibration in everyday situations.

## Target Users And Use Cases

### Primary User

The primary user is someone who often receives mixed feedback:

- "Can you speak up?"
- "I can't hear you."
- "Why are you yelling?"
- "That's a bit loud for here."

They may experience their own voice as normal, even when others perceive it differently. The app should help them build an external reference they can gradually internalize.

### Common Situations

- Quiet conversations at home.
- One-to-one conversation across a table.
- Small meetings.
- Speaking in a cafe, pub, or restaurant.
- Speaking while wearing earbuds, earplugs, or noise-reducing headphones.
- Practicing before a call, interview, therapy session, or social event.
- Recovering confidence after being corrected for speaking too softly or too loudly.

### Emotional Needs

The app should respect that voice correction can feel personal. Being told to speak up or quiet down can trigger embarrassment, frustration, or anxiety. The app should feel private, calm, and supportive.

Design implications:

- No harsh warning sounds.
- No red alert language unless the user opts into direct wording.
- No public-facing labels that could embarrass the user if someone sees the screen.
- Offer "practice mode" for private calibration and "discreet mode" for real-world use.

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

The app should classify the current state using a rolling window so it does not react to every syllable. A useful starting point:

- Evaluate speech loudness every 100-250 ms.
- Smooth over 1-2 seconds.
- Require sustained drift before changing the coaching state.
- Use separate thresholds for entering and leaving a state to prevent flicker.

### 2. Situation Modes

The first version should include preset modes:

- Quiet room
- Normal conversation
- Meeting
- Restaurant or noisy place
- Presentation
- Custom

Each mode should have different target ranges. The app should compare speech loudness against both an absolute target and the measured ambient noise level.

Each mode should encode:

- Expected listener distance.
- Expected ambient-noise range.
- Target speech-above-ambient range.
- Alert sensitivity.
- Social tolerance for loudness.

For example, "quiet room" should warn sooner about excessive volume, while "restaurant or noisy place" should tolerate more vocal effort.

### 3. Calibration Flow

Each session should begin with a short calibration:

1. Stay quiet for 5 seconds while the app measures room noise.
2. Speak normally so the app can learn the user's default level.
3. Speak at the desired level for the current situation.

This creates a personal baseline instead of relying on phone microphone readings as if they were certified sound-level measurements.

Calibration should save:

- Ambient noise floor.
- User's comfortable default speech level.
- User's trained target speech level for the situation.
- Approximate phone position, such as handheld, on table, or shirt pocket.

The app should warn that changing phone placement changes readings. A Pixel 7a placed on a table will measure differently from the same phone held near the chest.

### 4. Coaching Language

Feedback should be short, calm, and actionable:

- Lift a little
- Hold this level
- Ease down
- Great for this room
- Borderline quiet
- Borderline loud

Avoid alarming or embarrassing feedback, especially because the app may be used in social settings.

The app should support two tone settings:

- Gentle: "Lift a little", "Ease down".
- Direct: "Too quiet", "Too loud".

The default should be gentle.

### 5. Discreet Alerts

Support optional vibration feedback where available:

- One short vibration when the user remains too quiet.
- Two short vibrations when the user remains too loud.

Alerts should only trigger after the user is outside the target range for a short duration, such as 2 seconds. Add a cooldown so the app does not become annoying.

Alert behavior should be configurable:

- Alert only when too quiet.
- Alert only when too loud.
- Alert for both.
- Visual only.
- Vibration only.
- Visual plus vibration.

The first version should avoid audio alerts because they are likely to be socially awkward and may contaminate the microphone reading.

### 6. Session Summary

At the end of a session, show:

- Time in good range
- Time too quiet
- Time too loud
- Average speech level relative to the target
- Suggested focus for next time

Summaries should focus on one next action:

- "Practice lifting slightly in quiet rooms."
- "You stayed in range most of the time."
- "Your loudness rose when the room got noisier."
- "Try recalibrating with the phone in the same position each time."

### 7. Practice Drills

The MVP should include at least one simple practice mode after the live meter works:

1. Choose a situation.
2. Read a short phrase at the target level.
3. Watch the meter for 15-30 seconds.
4. Repeat with the meter hidden for 10 seconds.
5. Reveal the result.

This supports motor learning by moving from external feedback toward internal self-monitoring.

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
- Track ambient level during non-speech windows so the target can adapt if the room changes.
- Avoid treating brief laughs, coughs, taps, or phone handling noise as speech-volume failures.
- Use hysteresis and cooldowns to prevent jumpy feedback.
- Consider A-weighting or speech-band filtering later, but keep the first prototype simple and explain that values are approximate.

### Measurement Model

The app should compute several values:

- `ambientLevel`: rolling estimate of room noise when the user is not speaking.
- `speechLevel`: rolling estimate of the user's voice during speech windows.
- `speechOverAmbient`: difference between speech and ambient levels.
- `targetRange`: desired speech-over-ambient range for the selected situation.
- `personalOffset`: adjustment learned during calibration.
- `confidence`: rough confidence that the app is measuring the user's speech rather than background noise.

The first prototype can use RMS amplitude converted into a decibel-like relative value. Later versions can improve voice detection and calibration.

### Coaching State Machine

Suggested states:

- `idle`: microphone not active.
- `calibratingAmbient`: measuring room noise.
- `calibratingVoice`: measuring user's default and target voice.
- `listening`: actively coaching.
- `tooQuiet`: speech is below target for long enough.
- `inRange`: speech is within target range.
- `tooLoud`: speech is above target for long enough.
- `uncertain`: background noise or handling noise makes feedback unreliable.
- `paused`: session paused.

The state machine should prefer stability over sensitivity. It is better to be slightly late than to nag constantly.

### Storage

- Store calibration profiles and session summaries locally.
- Use IndexedDB if session history becomes structured or large.
- Use localStorage for early prototype settings if simpler.

### Privacy

- Do not upload microphone audio for the MVP.
- Do not store raw audio by default.
- Clearly explain that the app measures volume locally.
- Include a "delete all history" control.
- Make recording an explicit separate mode with its own consent.

### PWA Constraints

- Microphone access requires a secure context such as HTTPS.
- The browser must request user permission before microphone use.
- Continuous microphone monitoring while the phone is locked or the app is fully backgrounded may be unreliable in a PWA.
- The first version should assume the app is open during active coaching.
- Test installed-PWA behavior separately from browser-tab behavior on Android Chrome.
- The app should degrade gracefully if vibration is unavailable.

## Main User Flow

1. Open the installed PWA.
2. Choose a situation mode.
3. Grant microphone permission.
4. Calibrate ambient noise.
5. Start live coaching.
6. Receive visual and optional vibration feedback.
7. End the session.
8. Review a short summary.

## Detailed Coaching Model

### Target Range Strategy

VoiceCoach should not begin with a universal "correct dB" target. Instead, it should combine:

- Situation preset.
- Ambient noise floor.
- User calibration.
- Phone placement.
- Recent speech behavior.

Example target logic:

- Quiet room: small speech-over-ambient margin, strict upper bound.
- Normal conversation: moderate margin, balanced lower and upper bounds.
- Meeting: moderate-to-high margin, tolerate slightly stronger projection.
- Restaurant or noisy place: larger margin, slower warnings about loudness.
- Presentation: higher target and less sensitivity to brief peaks.

### Feedback Timing

To avoid overcorrection:

- Show live meter immediately.
- Change coaching labels only after sustained evidence.
- Use vibration only after a longer sustained drift.
- Add a cooldown after each alert.
- Suppress feedback during uncertain detection.

### Learning Loop

Each session should teach:

1. Notice the target visually.
2. Feel what the target voice feels like.
3. Try without looking.
4. Get a short result.
5. Repeat in different situations.

This is the difference between "meter app" and "coach app".

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

### Suggested Screens

- Home: choose mode, start calibration, view recent trend.
- Calibration: guided ambient and voice baseline steps.
- Live Coach: large coaching state, simple meter, discreet controls.
- Practice: short drills with optional hidden feedback.
- Summary: one session result and one next action.
- Settings: alert style, vibration, privacy, delete history, calibration profiles.

### Accessibility

- Do not rely only on color.
- Support large text.
- Support reduced motion.
- Make haptics optional.
- Avoid flashing feedback.
- Keep tap targets large for one-handed phone use.

## Post-MVP Ideas

- Adaptive target ranges that respond to changing ambient noise.
- Distance presets such as "1 meter away", "across table", or "small group".
- Practice drills for learning how target volume feels.
- A "blind practice" mode where the user speaks first, then sees the result.
- Trend history showing improvement over time.
- Optional short recordings for playback and review.
- Exportable summaries for a speech therapist or coach.
- "Earbuds mode" for users who speak differently while wearing headphones or earplugs.
- "Conversation distance" calibration using a second device later.
- Optional clinician/coach profile presets, without presenting the app as therapy.
- More advanced speech detection using on-device models if needed.

## Build Phases

1. Build a live microphone volume meter.
2. Add smoothing and voice activity detection.
3. Add calibration for ambient noise and personal baseline.
4. Add situation modes and target ranges.
5. Add coaching language and visual states.
6. Add optional vibration alerts with cooldowns.
7. Add session summaries.
8. Add one practice drill that hides and reveals feedback.
9. Add local history and delete-history controls.
10. Test on Pixel 7a and Chrome as an installed PWA.
11. Tune thresholds through real-world use in quiet, normal, noisy, and meeting-like settings.

## Validation Plan

### Technical Validation

- Compare readings across phone positions: handheld, table, pocket, and near chest.
- Test with steady speech, whispering, laughter, coughs, keyboard taps, and background music.
- Test with quiet room, fan noise, cafe noise playback, and outdoor street noise.
- Verify microphone permission behavior in browser and installed PWA.
- Verify vibration support on Pixel 7a.

### Product Validation

Run short user trials around these questions:

- Does the user understand what action to take?
- Does the app reduce uncertainty about being too quiet or too loud?
- Does feedback feel discreet enough for real-world use?
- Does the user start to predict their volume more accurately after practice?
- Are alerts helpful or irritating?
- Which wording feels supportive rather than embarrassing?

### Safety And Scope

- Do not claim to diagnose or treat autism, Parkinson's disease, hearing loss, anxiety, or speech disorders.
- Suggest consulting a speech-language therapist or healthcare professional if the user has persistent voice changes, pain, sudden changes in speech, swallowing issues, or neurological symptoms.
- Present the app as a coaching and self-awareness tool.

## Research Sources To Revisit

- Lombard effect: speakers naturally increase vocal effort in noise, with changes beyond loudness. Useful starting points:
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3985863/
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC5612409/
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3507387/
- Auditory feedback control: speakers use auditory feedback to monitor and adjust speech production.
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3658624/
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC10750862/
- LSVT LOUD: Parkinson's voice therapy emphasizes vocal loudness, intensive practice, and recalibration of sensory perception.
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3316992/
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3210871/
  - https://pubmed.ncbi.nlm.nih.gov/11215597/
- Autism prosody research: speech prosody differences can include intensity, pitch, duration, rhythm, and voice quality, with substantial individual variability.
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC11371491/
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC8630064/
  - https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0269637
- PWA microphone access: browser microphone access requires user permission and a secure context.
  - https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Sound-level apps: phone microphone readings are useful for relative feedback but should not be treated as certified sound measurements.
  - https://www.decibelmeter.app/

## Definition of Success

The first useful version succeeds when the user can open the app before or during a conversation, choose the situation, calibrate quickly, and get calm, accurate-enough feedback that helps them stay audible without becoming awkwardly loud.
