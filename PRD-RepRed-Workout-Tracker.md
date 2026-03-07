# Product Requirements Document: REP-RED Workout Tracker

## Overview

REP-RED is a personal workout tracker PWA (Progressive Web App) designed for daily calisthenics training using the "Rep Redistribution" method popularized by K Boges. The app runs entirely on-device with no server or cloud dependency, installable to an iPhone home screen.

**App name:** REP-RED
**App icon:** Barbell icon/logo, designed for visibility on an iPhone home screen (clean, bold, works at small sizes against a dark background)

**Target user:** Single user (the developer), training daily with bodyweight exercises (pull-ups, squats, push-ups, lying leg raises, and potentially others).

**Current workflow being replaced:** Google Sheets logging on phone — too clunky for mid-workout use.

---

## Core Concept: Rep Redistribution Algorithm

This is the central progression logic of the app. The algorithm must be implemented precisely.

### Setup

1. User sets a **single-set max rep count** for an exercise (e.g., 5 reps).
2. The app calculates **total daily volume** = max reps × 2 (e.g., 10 reps).
3. The total is distributed across **5 sets** as evenly as possible. If the total doesn't divide evenly by 5, distribute the remainder across the earlier sets (one extra rep each, starting from set 1).

**Examples of initial distribution:**
- Total 10 → `[2, 2, 2, 2, 2]`
- Total 12 → `[3, 3, 2, 2, 2]` (remainder 2 distributed to sets 1 and 2)
- Total 14 → `[3, 3, 3, 3, 2]`
- Total 7 → `[2, 2, 1, 1, 1]`

### Daily Progression (The Redistribution Step)

Each day, if the previous day's prescription was completed successfully, advance to the next day's prescription by applying this redistribution:

1. **Find the last non-zero set** (scanning from set 5 backward) and **subtract 1 rep** from it.
2. **Find the first set where reps decrease** compared to the previous set — i.e., the first index `i` (starting from 1) where `sets[i] < sets[i-1]`. **Add 1 rep** to that set.
3. **Special case:** If all non-zero sets have equal reps (no drop-off exists), add the rep to **set 1** (index 0).

This consolidates volume into fewer, larger sets over time.

### Worked Examples

**Example 1: Max = 5, Total Volume = 10**

```
Day  1: [2, 2, 2, 2, 2]  — Starting distribution
Day  2: [3, 2, 2, 2, 1]  — Took 1 from set 5 (2→1), added to set 1 (first set where drop could go, all were equal so goes to set 1: 2→3)
Day  3: [3, 3, 2, 2, 0]  — Took 1 from set 5 (1→0), added to set 2 (first drop: set 2 had 2 < set 1's 3, now 2→3)
Day  4: [3, 3, 3, 1, 0]  — Took 1 from set 4 (2→1), added to set 3 (first drop: set 3 had 2 < set 2's 3, now 2→3)
Day  5: [4, 3, 3, 0, 0]  — Took 1 from set 4 (1→0), added to set 1 (all non-zero sets equal at 3, so goes to set 1: 3→4)
Day  6: [4, 4, 2, 0, 0]  — Took 1 from set 3 (3→2), added to set 2 (first drop: set 2 had 3 < set 1's 4, now 3→4)
Day  7: [5, 4, 1, 0, 0]  — Took 1 from set 3 (2→1), added to set 1 (all leading non-zero equal? No: set 2 is 4 < set 1's 4... they're equal. But set 1=4, set 2=4 are equal, so add to set 1: 4→5)
Day  8: [5, 5, 0, 0, 0]  — Took 1 from set 3 (1→0), added to set 2 (first drop: set 2 had 4 < set 1's 5, now 4→5)
Day  9: [6, 4, 0, 0, 0]  — Took 1 from set 2 (5→4), added to set 1 (all leading non-zero equal at 5, so set 1: 5→6)
Day 10: [7, 3, 0, 0, 0]  — Took 1 from set 2 (4→3), added to set 1 (first drop: set 2 had 4... wait, set 1=6, set 2=4, first drop is set 2, add there? No — we add to set 1 since set 1 is the one where consolidation goes)
```

**IMPORTANT — Algorithm Clarification for the 2-Set Edge Case:**

When there are only 2 non-zero sets remaining, the rep always redistributes to set 1 (index 0). This is consistent with the general rule: after subtracting from the last non-zero set, if the remaining non-zero sets have no "drop" (because there's only one non-zero set left, or it's already the leading set), the rep goes to set 1.

### Pseudocode for Implementation

```
function getInitialDistribution(maxReps):
    totalVolume = maxReps * 2
    baseReps = floor(totalVolume / 5)
    remainder = totalVolume % 5
    sets = [baseReps, baseReps, baseReps, baseReps, baseReps]
    for i from 0 to remainder - 1:
        sets[i] += 1
    return sets

function advanceDay(currentSets):
    sets = copy(currentSets)
    
    // Step 1: Find and decrement last non-zero set
    lastNonZero = -1
    for i from 4 down to 0:
        if sets[i] > 0:
            lastNonZero = i
            break
    if lastNonZero <= 0:
        return sets  // Can't redistribute further (all volume in set 1)
    sets[lastNonZero] -= 1
    
    // Step 2: Find target — first set with a drop that still has reps > 0
    targetIndex = 0  // default to set 1
    for i from 1 to 4:
        if sets[i] > 0 and sets[i] < sets[i - 1]:
            targetIndex = i
            break
    
    sets[targetIndex] += 1
    return sets

function isComplete(sets, maxReps):
    // Progression is complete when set 1 reaches 2x max (all volume consolidated)
    return sets[0] >= maxReps * 2
```

### Progression Termination

The cycle completes when all volume is consolidated into a single set equal to 2× the original max. At that point, the user can:
- Re-test their max (which should now be higher)
- Start a new cycle with the updated max

---

## Architecture & Technical Approach

### Platform: Progressive Web App (PWA)

**Rationale:** No Apple Developer fee required, fully offline-capable, installable to iPhone home screen, local-only data storage. No server needed.

### Tech Stack (Recommended)

- **Framework:** React (with Vite for build tooling) OR vanilla JS with a lightweight framework
- **Styling:** Tailwind CSS for rapid UI development
- **Storage:** IndexedDB via a wrapper library (e.g., Dexie.js or idb) for structured local data
- **PWA:** Service worker for offline support, web app manifest for home screen install
- **Charts:** Chart.js or a lightweight charting lib for metrics/trends

### Data Model

```
Exercise {
    id: string (uuid)
    name: string                    // e.g., "Pull-ups"
    setupNotes: string              // e.g., "Neutral grip, shoulder width"
    maxReps: number                 // Current single-set max
    totalVolume: number             // maxReps * 2
    currentDayPrescription: number[] // Current [set1, set2, set3, set4, set5]
    isActive: boolean               // Whether included in daily routine
    sortOrder: number               // For ordering in routine/circuit view
    createdAt: timestamp
    updatedAt: timestamp
}

WorkoutLog {
    id: string (uuid)
    date: string (YYYY-MM-DD)
    exerciseId: string (FK → Exercise)
    prescribedSets: number[]        // What was prescribed [3,3,2,2,2]
    actualSets: number[]            // What was actually done [3,3,2,2,1]
    completed: boolean              // Did actual match or exceed prescribed?
    attemptNumber: number           // 1 = first attempt, 2 = retry, etc.
    notes: string                   // Optional per-workout notes
    createdAt: timestamp
}

Routine {
    id: string (uuid)
    name: string                    // e.g., "Daily Calisthenics"
    exerciseIds: string[]           // Ordered list of exercise IDs
    isDefault: boolean              // Auto-load this routine each day
}
```

---

## Features

### P0 — Must Have (MVP)

#### 1. Exercise Management

- Add a new exercise with a name and optional setup notes
- Set or update the single-set max rep count for an exercise, which recalculates the total volume and resets the progression
- Edit exercise name and setup notes at any time
- Mark exercises as active/inactive (inactive ones don't appear in daily workout but data is preserved)
- Delete an exercise (with confirmation, preserving historical logs)

#### 2. Daily Workout View (Primary Screen)

This is the main screen the user sees when opening the app mid-workout.

- Display today's date and the list of active exercises in routine order
- For each exercise, show the **prescribed sets** for today (e.g., `[3, 3, 2, 2, 2]`)
- Tappable set buttons/inputs to log actual reps completed per set
- Quick "complete as prescribed" button to mark all sets done as prescribed
- Ability to scroll/swipe between exercises easily (supports superset/circuit workflow where user alternates between exercises)
- Visual indicator of completion status per exercise (not started / in progress / completed)
- If the previous day's workout was not completed for an exercise, carry forward the same prescription and display an **attempt counter** (e.g., "Attempt 2")

**Circuit/Superset Support:**
- The exercise list should be displayed as a horizontal swipeable carousel or tabs at the top, so the user can quickly jump between exercises during a circuit
- Each exercise card shows only its own sets and progress
- A summary bar or indicator shows overall workout completion

#### 3. Rep Redistribution Progression Engine

- Implement the algorithm described above exactly
- When a day's prescription is completed (all sets matched or exceeded), auto-advance the prescription for the next workout day
- If the user did not complete the prescription, do NOT advance — repeat the same prescription on the next workout day, incrementing the attempt counter
- The user can manually override and advance anyway (with a confirmation prompt)
- When the cycle completes (all volume in 1 set = 2× max), prompt the user to re-test max and start a new cycle

#### 4. Workout Logging

- Each workout session is logged with date, exercise, prescribed sets, and actual sets
- Support for logging on a day even if it's not "today" (backfill for missed logging)
- Notes field per exercise per day (optional)
- Attempt number tracked automatically

#### 5. Manual Adjustments & Overrides

- The prescribed sets are algorithm-owned and not directly editable by the user. Users log actual reps done; pass/fail is determined by actual vs. prescribed.
- User can adjust the **total volume** for an exercise without resetting the full progression (e.g., reduce from 12 to 10 if feeling overtrained). This recalculates the current distribution.
- User can **update the max reps**, which resets the cycle with a new initial distribution from the new max.
- User can **manually force-advance** the prescription (override if they want to move on despite not fully completing) — requires confirmation prompt.
- All manual changes (volume adjustments, force advances, max updates) are logged/noted in WorkoutLog so the user can see what was adjusted.

#### 6. Data Persistence (Local)

- All data stored in IndexedDB (use a wrapper library like Dexie.js for ergonomic querying)
- Data persists across sessions, survives app restarts
- No cloud/server dependency

#### 7. Dark Mode Only

- The app uses a dark theme exclusively (no light mode toggle)
- Dark background with high-contrast text and UI elements for gym readability
- Use a cohesive dark color palette (e.g., near-black backgrounds, muted accent colors, white/light-gray text)

### P1 — Should Have

#### 7. Metrics & Progress View

- **Per exercise:**
  - Rolling 7-day average total reps
  - Rolling 28-day average total reps
  - Current cycle progress (what day of the cycle, how far to completion)
  - Max reps history (track when max was updated and what it was)
- **Simple line chart** showing daily total volume per exercise over time
- **Bar chart** or visual showing set distribution evolution over the current cycle

#### 8. Calendar View

- Monthly calendar showing which days had workouts logged
- Color coding: green = all exercises completed, yellow = partial, empty = no workout
- Tapping a day shows that day's log summary
- Streak counter (consecutive days with at least one workout logged)

#### 9. Routine Management

- Create named routines (ordered lists of exercises)
- Set a default routine that auto-loads each day
- Add a new exercise to the routine and have it automatically carry forward to future days
- Reorder exercises within a routine (drag and drop or move up/down)
- Routines should be flexible — the user can always add or remove exercises from a given day's workout regardless of what the routine prescribes

### P2 — Nice to Have

#### 10. Workout History Log

- Scrollable list of past workout sessions
- Filter by exercise or date range
- See full details of any past session (prescribed vs. actual, notes, attempt number)

#### 11. Onboarding Flow

- First-launch walkthrough explaining the rep redistribution method
- Guided setup: add your first exercises, enter max reps, see your first prescription
- Link to K Boges video for reference

---

## UX & Design Guidelines

### General Principles

- **Speed over polish:** The user is mid-workout, sweaty, possibly wearing gloves. Every interaction should be minimal taps.
- **Large tap targets:** Buttons and inputs should be large and easy to hit.
- **Minimal text entry:** Use number steppers, tap-to-complete, and smart defaults wherever possible.
- **Glanceable:** The user should be able to see their current set prescription at a glance from arm's length.
- **Offline-first:** Everything works without network. No loading spinners, no "connecting..." states.
- **Dark theme only:** All screens use a dark color palette. No light mode.

### Key Screens

1. **Today's Workout** (home screen)
   - Exercise tabs/carousel at top
   - Current exercise's prescribed sets displayed prominently (large font)
   - Set-by-set logging: tap a set to mark it complete (shows prescribed count, user can adjust if actual differs)
   - "Complete All" shortcut button
   - Overall progress summary

2. **Exercise Detail / Setup**
   - Exercise name, setup notes
   - Current max reps, total volume, current cycle day
   - Button to update max (starts new cycle)
   - Manual adjustment controls for current prescription

3. **Metrics Dashboard**
   - Exercise selector (dropdown or tabs)
   - Rolling averages displayed as big numbers
   - Trend chart below
   - Cycle progress indicator

4. **Calendar**
   - Standard monthly view with colored dots
   - Streak counter
   - Tap day for details

5. **Settings / Data Management**
   - Routine management
   - About / link to K Boges video

### Navigation

- Bottom tab bar with 3-4 tabs: **Workout** (home) | **Metrics** | **Calendar** | **Settings**
- The workout tab should be the default landing screen

---

## Edge Cases & Business Logic

### Missed Days
- If the user doesn't log a workout on a given day, no data is recorded for that day.
- The next time they open the app, the prescription is whatever it was at the end of their last completed (or failed) session.
- The calendar shows missed days as empty — no penalty, just a gap.

### Partial Completion
- If the user completes some sets but not all, they can still save the workout.
- The exercise does NOT advance. Same prescription repeats next session.
- Attempt counter increments.

### Exceeding Prescription
- If the user does more reps than prescribed on a set, log the actual reps.
- The exercise still advances based on the prescribed progression (the extra reps are a bonus, not factored into the algorithm).

### Adding a New Exercise Mid-Cycle
- User can add a new exercise at any time.
- They enter a max, the app calculates initial distribution, and it's immediately available in today's workout.
- If added to a routine, it persists for future days.

### Resetting / Re-testing Max
- When the user updates the max for an exercise, the current cycle resets.
- A new initial distribution is calculated from the new max.
- Previous cycle data is preserved in workout history.

### Multiple Workouts Per Day
- Edge case: user might do a morning and evening session.
- Additional sets within the same day append to that day's log entry. No overwriting.
- Progression advancement logic still runs once per day — on the first completion of the prescription for that day. Subsequent sessions that day are bonus volume only.

---

## PWA-Specific Requirements

### Manifest
- App name: "REP-RED"
- `display: standalone` for full-screen experience
- App icon: Bold barbell logo on a dark background — must be legible at 180×180px (iOS home screen size). Generate as SVG, then export to PNG at required sizes (180×180, 192×192, 512×512). Keep the design simple — a stylized barbell or barbell silhouette with "RR" integrated if it works at small scale.
- Theme color and background color should match the app's dark palette
- `start_url: /` to always open to the workout screen

### Service Worker

The service worker is a background script that caches all app assets (HTML, CSS, JS) on the device after first load. This enables fully offline operation — the app loads from local cache without any network requests. Use an app-shell caching strategy: cache all static assets on install, serve from cache first, and update in the background when online.

- Cache all app assets for offline use (app shell model)
- IndexedDB for all data (not localStorage — it has size limits and can be purged more easily)
- No network requests needed for core functionality

### Hosting & Deployment

The app is static files only (no backend server). Host for free on one of these:

- **GitHub Pages** (recommended for simplicity) — push code to a GitHub repo, enable Pages, access at `username.github.io/reprred`. Free, HTTPS included.
- **Netlify or Vercel** — connect a GitHub repo, auto-deploys on push. Free tier.
- **Cloudflare Pages** — same model, generous free tier.

No ongoing server costs. The "hosting" just serves the static files on first load; after that the service worker handles everything locally.

### iOS-Specific Considerations
- Add `apple-mobile-web-app-capable` meta tag
- Add `apple-mobile-web-app-status-bar-style` meta tag
- Provide apple-touch-icon
- Note: iOS PWAs have some limitations (no push notifications, limited background processing) — none of which affect this app
- Test that IndexedDB persistence survives across sessions on iOS Safari (iOS can purge WebKit data if storage pressure is high — the export/import feature mitigates this risk)

---

## Success Criteria

- User can open the app, see today's prescription, and log a full workout in under 60 seconds
- Rep redistribution algorithm produces correct progressions matching the worked examples above
- Data persists reliably across sessions without cloud dependency
- App is installable on iPhone home screen and works fully offline

---

## Out of Scope (for now)

- Multi-user support
- Cloud sync / account system
- Weight tracking / body weight tracking
- Video form recording
- Social/sharing features
- Apple Watch companion
- Data export/import (acceptable risk given local-only storage)
- Rest timer (user uses Apple Watch)
- Light mode / theme toggle (dark mode only)

---

## Appendix: Reference

- **K Boges Rep Redistribution video:** https://www.youtube.com/watch?v=IOJvarQlNTI
- **Method name:** "Rep Red" (Rep Redistribution)
- **Core exercises in current routine:** Pull-ups, Squats, Push-ups, Lying Leg Raises
- **Planned addition:** Lateral Raises (not active yet)
