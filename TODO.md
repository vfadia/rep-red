# REP-RED — Build TODO

Priority levels: **P0** = MVP must-have, **P1** = should have, **P2** = nice to have

---

## Phase 1: Project Foundation

- [x] **P0** Scaffold project — Vite + React + TypeScript
- [x] **P0** Install & configure Tailwind CSS (dark mode, custom palette)
- [x] **P0** Install dependencies: Dexie.js, React Router, recharts (no uuid — use crypto.randomUUID())
- [x] **P0** Set up project folder structure (`/src/db`, `/src/algorithm`, `/src/components`, `/src/screens`, `/src/hooks`)
- [x] **P0** Configure PWA — `vite-plugin-pwa` with app shell caching strategy
- [x] **P0** Web app manifest (`name: REP-RED`, `display: standalone`, dark theme color, start_url `/`)
- [x] **P0** Service worker — cache all static assets on install, serve from cache first
- [x] **P0** iOS meta tags (`apple-mobile-web-app-capable`, status bar style, apple-touch-icon)
- [x] **P0** App icon — barbell SVG design, export PNG at 180×180, 192×192, 512×512

---

## Phase 2: Data Layer

- [ ] **P0** Dexie.js schema setup — define `exercises`, `workoutLogs`, `routines` tables
- [ ] **P0** TypeScript types for `Exercise`, `WorkoutLog`, `Routine`
- [ ] **P0** DB access hooks/service layer (`useExercises`, `useWorkoutLogs`, etc.)
- [ ] **P0** Seed/init logic — create default "Daily Calisthenics" routine on first launch

---

## Phase 3: Rep Redistribution Algorithm

- [ ] **P0** Implement `getInitialDistribution(maxReps)` — total = max × 2, spread across 5 sets with remainder to early sets
- [ ] **P0** Implement `advanceDay(currentSets)` — find last non-zero, subtract 1; find first drop, add 1; edge cases (all equal → set 1, 2-set edge case → set 1)
- [ ] **P0** Implement `isComplete(sets, maxReps)` — true when set[0] >= maxReps * 2
- [ ] **P0** Unit test algorithm against all PRD worked examples (Day 1–10 for max=5)
- [ ] **P0** Edge case tests: odd volumes, single-set completion, 2-set redistribution

---

## Phase 4: App Shell & Navigation

- [x] **P0** Global dark theme — near-black background, white/light-gray text, muted accent color (define CSS vars / Tailwind config)
- [x] **P0** Bottom tab bar — 4 tabs: **Workout** | **Metrics** | **Calendar** | **Settings**
- [x] **P0** React Router setup — routes for each tab
- [x] **P0** Layout wrapper with safe area insets for iPhone notch/home bar

---

## Phase 5: Exercise Management

- [ ] **P0** Exercise list screen (within Settings or dedicated manage screen)
- [ ] **P0** Add exercise form — name, optional setup notes, max reps
- [ ] **P0** On max reps submit — calculate initial distribution, create exercise record
- [ ] **P0** Edit exercise — name, setup notes (no prescription reset)
- [ ] **P0** Update max reps — resets cycle with new initial distribution, preserves history
- [ ] **P0** Toggle exercise active/inactive
- [ ] **P0** Delete exercise — confirmation dialog, preserve historical logs
- [ ] **P0** Exercise sort order (manual ordering for routine)

---

## Phase 6: Daily Workout View (Primary Screen)

- [ ] **P0** Today's date header
- [ ] **P0** Horizontal swipeable carousel / tabs — one tab per active exercise
- [ ] **P0** Exercise card — display prescribed sets prominently (large font, glanceable)
- [ ] **P0** Set logging — tap each set button to mark complete (shows prescribed count)
- [ ] **P0** Tap-to-adjust — allow editing actual reps if different from prescribed
- [ ] **P0** "Complete All as Prescribed" shortcut button per exercise
- [ ] **P0** Per-exercise completion status indicator (not started / in progress / done)
- [ ] **P0** Overall workout completion summary bar
- [ ] **P0** Attempt counter display — "Attempt 2" if previous day not completed
- [ ] **P0** Setup notes accessible inline (collapsible or tooltip) per exercise

---

## Phase 7: Progression Engine Integration

- [ ] **P0** On workout save — check if all sets met or exceeded prescription
- [ ] **P0** If completed → call `advanceDay()`, update exercise's `currentDayPrescription`
- [ ] **P0** If not completed → keep same prescription, increment attempt counter
- [ ] **P0** Cycle completion detection — prompt user to re-test max when `isComplete()` is true
- [ ] **P0** Manual advance override — "Force Advance" with confirmation dialog
- [ ] **P0** Log all changes (manual overrides noted in WorkoutLog)

---

## Phase 8: Workout Logging & Persistence

- [ ] **P0** Save workout log entry on workout completion (date, exerciseId, prescribedSets, actualSets, completed, attemptNumber, notes)
- [ ] **P0** Backfill support — ability to log for a past date
- [ ] **P0** Optional notes field per exercise per session
- [ ] **P0** Multiple workouts per day — append to same day's log (MVP: treat as one session)

---

## Phase 9: Manual Adjustments

- [ ] **P0** Adjust total volume without resetting cycle (volume override) — recalculates current distribution
- [ ] **P0** Update max reps → reset cycle with new initial distribution
- [ ] **P0** Force-advance override — skip failed prescription with confirmation prompt
- [ ] **P0** All manual changes (volume adjust, force advance, max update) logged with flag in WorkoutLog
- ~~Edit today's prescribed sets~~ — removed; prescription is algorithm-owned, users only log actuals

---

## Phase 10: Metrics Dashboard (P1)

- [ ] **P1** Exercise selector (dropdown/tabs)
- [ ] **P1** Rolling 7-day average total reps (big number display)
- [ ] **P1** Rolling 28-day average total reps (big number display)
- [ ] **P1** Current cycle day + progress toward completion
- [ ] **P1** Max reps history (when updated, what it was)
- [ ] **P1** Line chart — daily total volume per exercise over time
- [ ] **P1** Bar/visual chart — set distribution evolution across current cycle

---

## Phase 11: Calendar View (P1)

- [ ] **P1** Monthly calendar component
- [ ] **P1** Color coding per day — green (all complete) / yellow (partial) / empty (none)
- [ ] **P1** Tap day → show that day's log summary
- [ ] **P1** Streak counter — consecutive days with at least one workout

---

## Phase 12: Routine Management (P1)

- [ ] **P1** Create named routines (ordered exercise lists)
- [ ] **P1** Set default routine (auto-loads each day)
- [ ] **P1** Add/remove exercises from routine
- [ ] **P1** Reorder exercises (drag-and-drop or move up/down buttons)

---

## Phase 13: History Log (P2)

- [ ] **P2** Scrollable past workout list
- [ ] **P2** Filter by exercise or date range
- [ ] **P2** Full session detail view (prescribed vs actual, notes, attempt)

---

## Phase 14: Onboarding (P2)

- [ ] **P2** First-launch walkthrough explaining rep redistribution method
- [ ] **P2** Guided setup — add first exercise, enter max, see first prescription
- [ ] **P2** Link to K Boges reference video

---

## Phase 15: Deployment

- [ ] **P0** GitHub Actions workflow — build on push to main, deploy to GitHub Pages
- [ ] **P0** Verify PWA installability (Lighthouse PWA audit)
- [ ] **P0** Test IndexedDB persistence on iOS Safari across sessions
- [ ] **P0** Test offline functionality (airplane mode)
- [ ] **P0** Test home screen install flow on iPhone

---

## Bugs / PRD Clarifications Needed

_Track issues and PRD gaps here as they come up._

- [x] ~~Clarify: prescription editing~~ — Resolved: prescription is algorithm-owned. Users log actuals only; pass/fail = actual vs. prescribed. No direct prescription editing.
- [x] ~~Clarify: multiple workouts per day~~ — Resolved: append to same day's log. Progression advances only once per day (on first completion).
