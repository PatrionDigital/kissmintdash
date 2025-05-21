# KissMint DASH: Anti-Cheat (Client-Side) Implementation Plan

## Objectives

- Prevent and detect automated/inauthentic play.
- Provide robust gameplay data for server-side verification.
- Deter multi-accounting and device spoofing.

---

## 1. Tap Pattern Tracking

### 1.1. Collect High-Precision Tap Timestamps

- Use `performance.now()` for millisecond precision.
- Store each tap’s timestamp in an array (`tapTimestamps`).

### 1.2. Calculate Tap Intervals

- On game end, compute intervals between taps.
- Analyze for:
  - **Average interval** (flag if < physical human minimum, e.g., 30ms)
  - **Variance** (flag if too consistent, i.e., robotic)
  - **Distribution** (for further analysis)

---

## 2. Device Fingerprinting

### 2.1. Device Info Collection

- Collect non-PII device info:
  - `navigator.userAgent`, `navigator.platform`, `navigator.language`
  - Screen size, color depth, pixel ratio
  - Optional: memory, hardware concurrency, touch support

### 2.2. Generate Device Fingerprint

- Use a lightweight library ([@fingerprintjs/fingerprintjs](https://github.com/fingerprintjs/fingerprintjs)) or a custom hash of device info.
- Store fingerprint at game start.

---

## 3. Performance Benchmarking

### 3.1. Benchmark Device Capabilities

- At game start, run a micro-benchmark (e.g., measure time for 1000 empty loops).
- Store result as `devicePerformanceScore`.
- Use this to flag scores that exceed device’s physical capabilities.

---

## 4. Integrity Hash Generation

### 4.1. Gather All Session Data

- Tap timestamps
- Device fingerprint & info
- Performance benchmark
- Game session start/end time
- Final score

### 4.2. Generate Hash

- Use `crypto.subtle.digest('SHA-256', ...)` (Web Crypto API) or a small SHA256 npm package.
- Hash a canonical JSON string of the above data.
- Store as `integrityHash` in the submission payload.

---

## 5. Client-Side Verification Before Submission

- Run basic checks before submission:
  - Tap intervals/variance within human range
  - Score not exceeding device benchmark
- If failed, warn user or flag submission.

---

## 6. Data Submission

- Submit all anti-cheat data with the score:
  - `tapTimestamps`, `deviceInfo`, `deviceFingerprint`, `performanceScore`, `integrityHash`, `finalScore`, etc.

---

## 7. Developer Notes & Security

- **Do not expose secret keys** client-side; server should add a secret for final hash verification.
- All anti-cheat logic should be as tamper-resistant as possible, but assume client can be reverse-engineered.
- Server must perform its own verification and not trust client-side checks alone.

---

## 8. Implementation Steps

1. **Update Game State & Reducer**
   - Add `tapTimestamps`, `deviceInfo`, `deviceFingerprint`, `performanceScore`, `integrityHash` to state.
2. **Integrate Device Fingerprinting**
   - Add async fingerprint generation at game start.
3. **Add Performance Benchmark**
   - Run benchmark at game start and store result.
4. **Track Taps**
   - On each tap, push timestamp to state.
5. **On Game End**
   - Calculate intervals, variance, and generate hash.
   - Run client-side verification.
6. **Submit Data**
   - Send all anti-cheat data with score to backend.
7. **(Optional) UI Feedback**
   - Show warnings if suspicious behavior is detected before submission.

---

## References

- [@fingerprintjs/fingerprintjs](https://github.com/fingerprintjs/fingerprintjs)
- [Web Crypto API - SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest)
- Internal docs: ai-rules.md, backend-structure.md, frontend-guidelines.md, application-flow.md, kissmint-dev-plan.md
