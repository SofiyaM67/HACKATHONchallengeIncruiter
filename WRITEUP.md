# Write-up: InCruiter Interview Integrity Monitor

## What we built

A single-command web app with two roles: **candidate interview** and **reviewer dashboard**, connected in real time over WebSockets. The candidate joins via a normal URL—no installs, extensions, or agents. After explicit consent, the page collects only approved signals (behavioral events and optional webcam frames processed locally in the browser). The server aggregates signals into a weighted **risk score** and **clean / suspicious / high** band for human reviewers, with a timestamped evidence timeline (JSON details per signal).

## How detection works

Stealth overlays are not visible to screen share, so we infer **assistive behavior** from patterns cheating tools encourage:

| Signal | Rationale |
|--------|-----------|
| Tab hidden / window blur during an answer | Reading a hidden overlay or switching context mid-response |
| Long pause after the question, then rapid typing burst | Listening, then reading a teleprompter-style feed |
| Large paste into the answer field | Pasting model-generated text |
| Webcam motion heuristic | Sustained lateral motion vs. low central motion while answering (proxy for eyes on an off-screen overlay) |
| Extended display (informational) | Context only; not scored as proof |
| Demo overlay simulation | Live hackathon demo of teleprompter timing + flagged pattern |

Each signal carries weight, human-readable text, and structured evidence. Reviewers see **why** the score moved—not a black box.

## Coverage and limits (honest)

**Can help catch:** obvious assistive workflows in a web interview (context switching, paste-heavy answers, teleprompter-like timing, optional gaze heuristic).

**Cannot guarantee:** detection of a specific product (Cluely, Parakeet, FinalRound, etc.), especially with perfect stealth, audio-only copilots, or a second device off-camera. A second monitor or thoughtful pauses alone should not auto-flag; weights aim to combine signals.

**Privacy:** consent gates capture; session data is in-memory for the demo (no persistent storage).

## What’s next

Calibrate weights from labeled sessions, add interviewer-side timing (question-to-answer latency distributions), optional on-device face mesh for stronger gaze estimation, and exportable PDF reports for audit trails.
