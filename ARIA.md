# ARIA — Training Intelligence: Complete Agent Documentation

**Live URL:** `https://baw2468.github.io/aria-training/aria.html`  
**Athlete:** Brandon Wesch (brandon.wesch@me.com)  
**Goal Race:** Half Marathon — October 22, 2026 (goal: 1:44:52 = 8:00/mi pace)  
**Plan:** 23-week structured training plan, May 13 – October 22, 2026

---

## 1. What ARIA Is

ARIA is a single-page web application that functions as a personal running coach and training tracker. It has no backend logic layer — all reasoning, coaching, and analysis happens client-side in plain JavaScript. It is designed to be used on a mobile browser (Safari on iPhone is the primary target) and is deployed as static files on GitHub Pages.

ARIA tracks five data categories simultaneously:
1. **Running activity logs** (from Garmin CSV bulk import or manual paste)
2. **Strength training sessions** (from a fixed 4-workout library)
3. **Heart rate and HRV** (manually logged)
4. **Nutrition** (meal-by-meal macro tracking)
5. **Training plan adherence** (auto-derived from a hardcoded 23-week plan)

---

## 2. Tech Stack and Constraints

| Layer | Implementation |
|---|---|
| UI Framework | React 18.2.0 via CDN UMD (`react.production.min.js`) |
| DOM Rendering | `ReactDOM.render()` (React 17 API, not `createRoot`) |
| Element creation | `React.createElement` aliased as `e()` — no JSX, no Babel |
| Database | Firebase Realtime Database 9.23.0 compat SDK |
| Database fallback | `localStorage` (used when Firebase is unreachable) |
| Deployment | GitHub Pages static hosting |
| Visualization | SVG polylines hand-coded — no charting library |
| Entry point | `aria.html` → `aria-block1.js` → `aria-block2.js` → `aria-block3.js` |

**Hard constraints (never violate):**
- No `import`/`export` statements — no ES modules
- No JSX — no Babel, no transpilation
- No `window.localStorage` as primary storage (Firebase is primary)
- No Recharts, Chart.js, or any charting library
- No `default export` syntax
- No `text/babel` script tags

---

## 3. Firebase Configuration

**Project:** `aria-training`  
**Database URL:** `https://aria-training-default-rtdb.firebaseio.com`  
**User path:** `brandon/` (UID is hardcoded as `"brandon"`)

Storage keys under `brandon/`:
- `a8_r` — runs array (JSON stringified)
- `a8_s` — strength sessions array (JSON stringified)
- `a8_h` — heart rate entries array (JSON stringified)
- `a8_n` — nutrition entries array (JSON stringified)

The Firebase config is hardcoded in `aria-block1.js` lines 1-4. There is no Firebase Console SDK setup needed — the app uses the compat SDK and the database URL directly.

**Data limits:** All four arrays are capped at 200 items (`slice(0,200)` on every save). Oldest entries drop off the end first. This is a hard constraint, not configurable.

**Fallback behavior:** If Firebase fails, `dbGet` and `dbSet` silently fall back to `localStorage`. The app remains fully functional offline.

---

## 4. File Structure

```
aria.html          — CDN loader only (Firebase, React, then the 3 blocks)
aria-block1.js     — Firebase init, constants, data, helpers, analyze engine
aria-block2.js     — UI component helpers (Btn, Inp, Lbl, Sel, Tag, Saved, 
                      glass, cardS, ICard, DaySheet, ExModal)
aria-block3.js     — App() function: all 7 tabs, all event handlers
```

---

## 5. Data Schemas

### Run Entry
```js
{
  date: "2026-05-20",          // YYYY-MM-DD
  week: 2,                     // 0=pre-plan, 1-23=in-plan, 24=post-plan
  type: "run",                 // See Activity Types below
  dist: "5.2",                 // string, miles (may be null)
  pace: "9:15",                // string, MM:SS (may be null)
  time: "48:12",               // string, elapsed (may be null)
  hrAvg: "152",                // string, bpm (may be null)
  hrMax: "174",                // string, bpm (may be null)
  hrRec: "28",                 // string, 1-min HR recovery bpm (may be null)
  cal: "520",                  // string, calories (may be null)
  cad: "172",                  // string, steps/min (may be null, manual only)
  notes: "Felt strong",        // string (manual entry only)
  raw: "Garmin CSV"            // "Garmin CSV" for CSV import, raw text for manual
}
```

### Strength Entry
```js
{
  date: "2026-05-18",
  week: 2,                     // uses getWeek() at time of logging (not dateToWeek)
  wkt: "A",                    // "A", "B", "C", or "D"
  sets: [
    {
      id: "goblet_squat",
      name: "Goblet Squats",
      logs: [
        { reps: "12", weight: 35 },
        { reps: "12", weight: 40 }
      ]
    }
  ],
  notes: "Felt heavy on legs"
}
```

**Note:** Strength `week` field uses `week` (current week from `getWeek()`) at the time of logging, not `dateToWeek(sDate)`. This is a known inconsistency — the strength date can be backdated but the week tag stays current.

### HR Entry
```js
{
  date: "2026-05-19",
  resting: 52,                 // number or null
  runAvg: 158,                 // number or null
  runMax: 174,                 // number or null
  hrRecovery: 28,              // number or null, 1-minute recovery
  hrv: 48                      // number or null, milliseconds
}
```

### Nutrition Entry
```js
{
  date: "2026-05-19",
  dayType: "run",              // "run", "strength", or "rest"
  meals: {
    breakfast: { cal: 620, protein: 42, carbs: 80, fat: 18 },
    lunch:     { cal: 750, protein: 55, carbs: 90, fat: 22 },
    dinner:    { cal: 820, protein: 60, carbs: 95, fat: 25 },
    snacks:    { cal: 310, protein: 20, carbs: 40, fat: 8 }
  },
  calories: 2500,              // rounded total
  protein: 177,                // rounded total grams
  carbs: 305,                  // rounded total grams
  fat: 73,                     // rounded total grams
  notes: ""
}
```

---

## 6. Activity Classification

### `isRunActivity(type)` — Boolean filter
Returns `true` if the activity should count toward run mileage, pace zones, and Insights. This is a **negative filter** — it excludes specific non-running types.

**Excluded (returns false):**
- `walk`
- `cross`
- contains `hik` (hiking, hike — note: uses `"hik"` not `"hike"` to catch "hiking")
- contains `cycl` (cycling, cycle)
- contains `swim`
- contains `row` (rowing)
- contains `yoga`
- contains `weight`

**Included (returns true):** Everything else, including `run`, `long_run`, `tempo`, `intervals`, `recovery`. An empty/null type defaults to `"run"` and passes.

### `classifyGarminType(raw)` — CSV type mapper
Maps a raw string (from Garmin CSV columns) to an internal type. Uses substring matching in priority order:

| Match (substring) | Returns |
|---|---|
| `walk` or `hik` | `"walk"` |
| `long` or `trail` | `"long_run"` |
| `tempo`, `race`, `interval`, or `track` | `"tempo"` |
| `recov` or `easy` | `"recovery"` |
| `run` or `jog` | `"run"` |
| `cycl`, `bike`, `swim`, `strength`, `gym`, `yoga`, or `fitness` | `"cross"` |
| (no match) | `"run"` (default) |

### Garmin CSV column priority for type
```js
classifyGarminType(row["activity type"] || row["type"] || row["title"] || "")
```
Garmin's standard Activities CSV export uses `"Title"` (e.g., "Morning Walk", "Long Run") rather than `"Activity Type"` — the title column is the primary fallback in practice.

### Internal activity types
```
run          — standard easy run (blue #0ea5e9)
long_run     — long run (indigo #6366f1)
tempo        — tempo run (purple #8b5cf6)
intervals    — interval session (purple #8b5cf6, same as tempo)
recovery     — recovery run (green #10b981)
walk         — walk or hike (excluded from run metrics, shown grey)
cross        — cross-training (excluded from run metrics, shown grey)
```

---

## 7. Training Plan Structure

**Plan constants:**
```js
const PLAN_START = new Date("2026-05-13");
const RACE_DATE  = new Date("2026-10-22");
```

**`dateToWeek(dateStr)`** — Converts a YYYY-MM-DD string to a plan week:
- Returns `0` if date is before May 13, 2026 (pre-plan sentinel)
- Returns `1`–`23` for dates within the 23-week plan
- Returns `24` if date is after week 23 ends (post-plan sentinel)

**`getWeek()`** — Returns the current live week (1–23, clamped).

**Week schedule (DAY_PLAN):**
- Sunday: Long run (`long_run`)
- Monday: Strength Workout A (Lower Body)
- Tuesday: Easy run (`run`)
- Wednesday: Strength Workout B (Upper Push)
- Thursday: Tempo/intervals (`tempo`)
- Friday: Strength Workout C (Upper Pull + Core)
- Saturday: Easy run (`run`) or REST

### The 23 Weeks

| Wk | Phase | Dates | Miles | Long Run | Tuesday | Thursday | Saturday |
|---|---|---|---|---|---|---|---|
| 1 | 1 | May 13-19 | 10 | 3mi @10:30-11:00 | 3mi easy | 2mi easy @11:00+ | 2mi easy |
| 2 | 1 | May 20-26 | 14 | 4mi @10:00-10:15 | 3mi easy | 4mi easy | 3mi easy |
| 3 | 1 | May 27-Jun 2 | 16 | 5mi @10:00-10:15 | 4mi easy | 4mi: 1+2tempo@9:00+1 | 3mi easy |
| 4 | 1 | Jun 3-9 | 10 | 4mi easy | 3mi easy | 3mi easy | REST | *(recovery)* |
| 5 | 1 | Jun 10-16 | 19 | 6mi @9:45-10:00 | 4mi easy | 5mi: 1+3tempo@9:00+1 | 4mi easy |
| 6 | 1 | Jun 17-23 | 20 | 7mi @9:30-9:45 | 4mi easy | 5mi: 1+3tempo@9:00+1 | 4mi easy |
| 7 | 1 | Jun 24-30 | 23 | 8mi @9:15-9:30 | 5mi easy | 6mi: 1+4tempo@8:45+1 | 4mi easy |
| 8 | 1 | Jul 1-7 | 12 | 5mi @9:45-10:00 | 3mi easy | 4mi easy | REST | *(recovery)* |
| 9 | 1 | Jul 8-14 | 24 | 9mi @9:00-9:15 | 5mi easy | 6mi: 1+4tempo@8:45+1 | 4mi easy |
| 10 | 1 | Jul 15-21 | 25 | 10mi @9:00-9:15 | 5mi easy | 6mi: 1+4tempo@8:45+1 | 4mi easy |
| 11 | 2 | Jul 22-28 | 25 | 10mi @9:00-9:15 | 5mi easy | 6×800m @7:45 | 4mi easy |
| 12 | 2 | Jul 29-Aug 4 | 16 | 6mi @9:15-9:30 | 4mi easy | 4×800m @7:45 | REST | *(recovery)* |
| 13 | 2 | Aug 5-11 | 26 | 11mi @8:45-9:00 | 5mi easy | 5×1000m @7:45 | 4mi easy |
| 14 | 2 | Aug 12-18 | 27 | 12mi @8:45-9:00 | 5mi easy | 4×1200m @7:45 | 4mi easy |
| 15 | 2 | Aug 19-25 | 28 | 13mi @8:45-9:00 | 5mi easy | 3×2000m @8:00 | 4mi easy | *(PEAK WEEK)* |
| 16 | 2 | Aug 26-Sep 1 | 17 | 7mi @9:00-9:15 | 4mi easy | 5×800m @7:45 | REST | *(recovery)* |
| 17 | 2 | Sep 2-8 | 26 | 11mi @8:45-9:00 | 5mi easy | 6mi: 1+4@8:00 race pace+1 | 4mi easy |
| 18 | 3 | Sep 9-15 | 27 | 12mi: 8@9:00+4@8:00 | 5mi easy | 6mi continuous @8:00 | 4mi easy |
| 19 | 3 | Sep 16-22 | 29 | 13mi: 8@8:45+5@8:00 | 5mi easy | 7mi continuous @8:00 | 4mi easy |
| 20 | 3 | Sep 23-29 | 22 | 10mi @8:00 GOAL | 4mi easy | 8mi @8:00 VALIDATION | REST |
| 21 | 3 | Sep 30-Oct 6 | 17 | 8mi @8:45-9:00 | 4mi easy | 5mi easy | REST | *(recovery)* |
| 22 | 4 | Oct 7-13 | 17 | 8mi @8:45-9:00 | 4mi easy | 5mi: 1+3@8:00+1 | REST |
| 23 | 4 | Oct 14-20 | 10 | REST or 3mi easy | 4mi + strides | 3mi + strides | REST | *(RACE WEEK)* |

### Phases

| Phase | Weeks | Name | Focus |
|---|---|---|---|
| 1 | 1-10 | Base Building | Easy volume, aerobic base, first tempo runs |
| 2 | 11-16 | Speed Development | 800m-2000m intervals, lactate threshold |
| 3 | 17-21 | Race Prep | Sustained race-pace work, peak fitness |
| 4 | 22-23 | Taper & Race | Volume reduction, race-day readiness |

Recovery weeks: 4, 8, 12, 16, 21 (lighter load, lower weights).

---

## 8. Pace Zone Evaluation

`getPaceZone(type, pace, dist)` — Returns `{rating, color, msg}` or `null`.

**Returns null if:**
- `isRunActivity(type)` is false (walks, cross-training excluded)
- No pace string provided
- `dist < 2` miles (too short to evaluate)
- Pace string cannot be parsed as MM:SS

**Thresholds (in seconds/mile):**

| Type | Too Fast | Perfect | Too Slow/Relaxed |
|---|---|---|---|
| `long_run` | < 540 (9:00) | 540–660 (9:00–11:00) | > 660 (> 11:00) |
| `tempo` or `intervals` | < 510 (8:30) | 510–550 (8:30–9:10) | > 550 (> 9:10) |
| all other runs (easy, recovery, `run`) | < 540 (9:00) | 540–690 (9:00–11:30) | > 690 (> 11:30) |

Colors: "Too Fast" → red (`#ef4444`), "Perfect" → green (`#10b981`), "Too Slow"/"Relaxed" → orange (`#f97316`).

---

## 9. The Seven Tabs

Navigation is via a fixed bottom tab bar. Tab order (also used for swipe gestures):
`home → calendar → insights → run → strength → nutrition → health`

Touch swipe navigation: requires `|dx| > 50` AND `|dx| > |dy|` (prevents interference with vertical scroll).

### Tab 1: Home
Displays:
- Greeting (morning/afternoon/evening) + current week + days to race
- Weekly readiness score (1–10, color: green ≥8, orange ≥6, red <6)
- Phase banner with gradient (shows phase name, dates, recovery week indicator)
- 4-stat grid: Miles (logged/target), Runs (count), Strength (count/3), Nutrition (days)
- Mileage progress bar (actual vs. planned miles)
- AI summary text from `analyze()`
- Warning factor tags (HR ↑, HRV ↓, Underfueling, Low volume, No strength)
- Today's plan: scheduled run + strength workout with completion status
- Tomorrow's plan preview
- Priority action card (top item from `A.actions`)

### Tab 2: Calendar
Displays:
- Month navigation (‹ ›) with month/year header
- Color legend: Long Run (indigo), Easy Run (blue), Tempo (purple), Strength (amber), Rest (green)
- 7-column calendar grid — tappable cells
  - Solid bar = activity logged; translucent bar = planned but not yet logged
  - Green dot = at least one activity logged that day
  - `isRunActivity(r.type)` filter determines which logged runs count for run bars
- Day detail sheet (modal) — tapping a planned day shows planned activities + any logged activities
- "This Month" summary card: total runs (ALL activities, not filtered), total miles (ALL activities), strength sessions

**Edge case:** The "This Month" miles count includes all logged activities regardless of `isRunActivity()`. This means walks and cross-training inflate the monthly mileage shown in this card.

### Tab 3: Insights
Displays in order:
1. Weekly readiness score card (large, with factor tags)
2. **IC1: Training Load Chart** — last 4 weeks of run mileage vs. planned target (bar chart, dashed target line). Only `isRunActivity` runs with `week >= 1 && week <= 23`. Hidden if no mileage logged.
3. **IC2: Aerobic Efficiency Trend** — dual SVG polyline (pace + HR) across last 8 qualifying easy runs. Requires: type is `"run"` or `"recovery"`, dist ≥ 2mi, both pace and hrAvg present, ≥3 qualifying runs. Shows "Improving" badge when recent half of runs shows faster pace with same or lower HR. Hidden until minimum data met.
4. **IC3: Phase Progress** — always shown. Progress bar within current phase, phase description text.
5. **IC4: Finish Time Projection** — shows locked state until 3 qualifying runs (dist ≥ 3mi, pace + hrAvg present). Once unlocked: current fitness equivalent pace → projected race time with improvement factor applied (0.6% per remaining week, capped at 12%). Goal comparison: 1:44:52 (6292 seconds). Badge: "Ahead of Goal" (>2min under), "On Track" (within 3min), "Building Fitness" (>3min over).
6. Priority Actions card — shows all actions from `analyze()` with priority numbers
7. Warnings card — expandable list with science basis
8. Positives card — training wins
9. Empty state — shown only if both warnings and positives are empty
10. **IC5: Weekly Comparison Table** — 4-column grid (label, This Week, Last Week, Best Week). Rows: Miles, Runs, Strength, Nutrition Days. Only `isRunActivity` runs with `week >= 1 && week <= 23`. Best Week determined by highest mileage among all weeks with data. Hidden until ≥2 distinct weeks have qualifying run data.

### Tab 4: Log Run
Three sections:

**Garmin CSV Bulk Import:**
- File input (hidden, triggered by button) accepts `.csv`
- `parseCSV()` parses Garmin's Activities CSV format
- On re-upload: existing Garmin CSV entries with matching `date_dist` keys are REPLACED (not duplicated). Manual entries with `raw !== "Garmin CSV"` are always preserved.
- Shows count on success; error message on parse failure

**Manual Paste (single activity):**
- Date picker, type selector (`run`, `long_run`, `tempo`, `intervals`, `recovery`)
- Freeform text area for pasted Garmin activity summary
- `parseGarmin(text)` extracts: distance (mi), pace (MM:SS/mi), time (elapsed), avgHR, maxHR, HR recovery, calories, cadence
- Notes field
- `week` set via `dateToWeek(rDate)` — correct historical assignment

**Activity List:**
- Most recent 8 activities shown
- Color-coded left bar: run types in type color, non-runs in grey
- Week tag: "Wk1"–"Wk23" in indigo for in-plan, "Pre-plan" in grey for week 0 or null, nothing shown for week 24
- Pace zone rating inline under each activity (if qualifies)
- Header shows run count + other activity count separately

**Personal Records:**
- Longest Run (by dist, all run activities)
- Fastest Pace (dist ≥ 2mi, not recovery type)
- Best HR Recovery (highest hrRec value)
- Best Week (highest total mileage across any single week)

### Tab 5: Strength
**Workout selector:** A, B, C, D tiles (A=Mon, B=Wed, C=Fri, D=Sun PM Phase 2+)

**Exercise logger:** For each exercise in selected workout:
- Exercise name, sets×reps spec, muscle group
- Per-set inputs: reps + weight (bodyweight exercises have no weight field)
- "How to →" button opens ExModal with SVG stick-figure animations + coaching cues

**Save:** Creates strength entry. Week uses current `getWeek()` (not backdated from `sDate`).

**Weight Progression:** Only shown when strength data exists. Toggle buttons per weighted exercise (only those with logged data). Selected exercise shows SVG polyline chart of max weight per session + current weight and total gain.

### Tab 6: Nutrition
**Day type selector:** Run Day (2,600-2,700 cal), Strength Day (2,400-2,500 cal), Rest Day (2,300-2,400 cal). Sets the calorie target for compliance evaluation.

**Meal log form:** 4 meals (Breakfast ☀️, Lunch 🥗, Dinner 🌙, Snacks ⚡). Each meal: Calories, Protein (g), Carbs (g), Fat (g).

**Daily totals panel:** Live sum of all meals. Calorie status: "Under" (< low target), "Good" (within target +200), "Over" (> high target +200).

**Save:** Requires date + at least 1 calorie logged.

**Nutrition history:** Last 8 days with date, day type tag, calorie status tag, and macros.

**Nutrition targets:**
| Day Type | Calories | Protein | Carbs | Fat |
|---|---|---|---|---|
| Run | 2,600–2,700 | 140–150g | 350–375g | 70–75g |
| Strength | 2,400–2,500 | 130–140g | 300–325g | 70–75g |
| Rest | 2,300–2,400 | 120–130g | 275–300g | 75–80g |

### Tab 7: Health
**HR trend card** (shown when HR data exists):
- Avg Resting HR + Avg HRV (from last 14 HR entries)
- Trend indicator: ↓ Better / ↑ Watch (comparing most recent 2 resting HR values)
- Resting HR trend SVG polyline chart (shown when ≥3 resting HR values exist)
- History list: last 7 HR entries with resting, run avg/max, HR recovery, HRV

**HR log form:** Date, Resting HR, Run Avg HR, Run Max HR, HR Recovery (1-min), HRV (ms). All fields optional except date.

---

## 10. The Coaching/Analysis Engine

`analyze(week, plan, runs, strength, hr, nutrition)` runs on every render. It returns:
```js
{
  warnings: [{t: "title", b: "body", s: "suggestion"}],
  positives: [{t: "title", b: "body"}],
  actions:   [{p: 1|2, t: "action text"}],   // p=priority
  score: 1-10,
  factors: ["HR ↑", "HRV ↓", ...],           // score deduction labels
  avgRest: number|null,
  avgHRV: number|null,
  wkMi: number,
  wkStr: [{...}],                             // strength sessions this week
  wkRuns: [{...}],                            // runs this week
  summary: "narrative text"
}
```

**Filters applied:** `wkRuns = runs.filter(r => r.week === week && isRunActivity(r.type))`

### Warning/Positive rules:

| Trigger | Type | Message |
|---|---|---|
| Logged miles ≥ 90% of target | Positive | Volume on track |
| Miles < 50% of target, not recovery week, not week 1 | Warning | Volume behind |
| Easy run (not tempo/intervals/long_run) with hrAvg > 155 | Warning | Easy run HR too high |
| Avg resting HR (last 3 entries) > prior 3 avg + 5 | Warning + Action P1 | Resting HR elevated |
| Avg resting HR (last 3) < prior 3 avg - 5 | Positive | Resting HR improving |
| Avg HRV (last 3) < prior 3 avg - 5 | Warning + Action P1 | HRV declining |
| Avg HRV (last 3) > prior 3 avg + 5 | Positive | HRV trending up |
| ≥ 2 strength sessions this week | Positive | Strength on track |
| 0 strength sessions, week > 1 | Warning + Action P1 | No strength sessions |
| ≥ 2 of last 7 nutrition entries below calorie target | Warning + Action P1 | Chronically underfueling |
| ≥ 2 of last 7 nutrition entries below protein target | Warning + Action P2 | Protein consistently low |
| ≥ 2 run-day entries within target range | Positive | Run-day fueling on point |

### Score deductions (start at 10):

| Condition | Deduction | Factor tag |
|---|---|---|
| Resting HR elevated (avg3 > prior3 + 5) | -2 | HR ↑ |
| HRV declining (avg3 < prior3 - 5) | -2 | HRV ↓ |
| ≥ 2 of 7 days underfueling | -2 | Underfueling |
| Miles < 50% of target (not recovery, not week 1) | -1 | Low volume |
| 0 strength sessions (not week 1) | -1 | No strength |
| Floor | — | Score clamped to min 1 |

HR and HRV comparisons use last 14 HR entries split into "recent 3" vs "prior 3" (positions 0-2 vs 3-5).

---

## 11. Strength Workout Library

### Workout A — Lower Body (Monday AM)
| Exercise | Sets | Reps | Weighted |
|---|---|---|---|
| Goblet Squats | 4 | 12-15 | Yes |
| Bulgarian Split Squats | 4 | 10-12 each leg | Yes |
| Romanian Deadlifts | 4 | 12-15 | Yes |
| Walking Lunges | 3 | 20 each leg | Yes |
| Single-Leg Calf Raises | 4 | 15-20 each leg | Yes |
| Wall Sits | 2 | 60s | No (bodyweight) |

### Workout B — Upper Push (Wednesday AM)
| Exercise | Sets | Reps | Weighted |
|---|---|---|---|
| DB Floor Press | 4 | 10-12 | Yes |
| DB Shoulder Press | 4 | 10-12 | Yes |
| Push-ups | 3 | 10-15 | No |
| Overhead Tricep Extension | 3 | 12-15 | Yes |
| Lateral Raises | 3 | 12-15 | Yes |
| Pike Push-ups | 3 | 8-12 | No |

### Workout C — Upper Pull + Core (Friday AM)
| Exercise | Sets | Reps | Weighted |
|---|---|---|---|
| DB Bent Rows | 4 | 10-12 | Yes |
| DB Shrugs | 3 | 15-20 | Yes |
| Bicep Curls | 3 | 12-15 | Yes |
| Plank | 3 | 45-60s | No |
| Side Plank | 3 | 30-45s each side | No |
| Dead Bugs | 3 | 10-12 each side | No |
| Bird Dogs | 3 | 10-12 each side | No |

### Workout D — Plyometrics (Sunday PM, Phase 2+)
| Exercise | Sets | Reps | Weighted |
|---|---|---|---|
| Jump Squats | 4 | 10-12 | No |
| Jump Lunges | 3 | 12-16 each leg | No |
| Box Jumps | 3 | 8-10 | No |
| Lateral Bounds | 3 | 10 each side | No |
| Single-Leg Hops | 3 | 10 each leg | No |
| Burpees | 2 | 10 | No |

Each exercise has 3-frame SVG stick-figure animations and 4 coaching cues stored in the `FRAMES` and `WORKOUTS.*.exercises[].cues` objects.

---

## 12. CSV Import Details

### Garmin Activities CSV format
Exported from `connect.garmin.com/activities → Export CSV (top right)`

Key column mappings used by `parseCSV()`:
- Date: `row["date"]` || `row["start time"]` || `row["activity date"]` (takes `.split(" ")[0]`)
- Distance: `row["distance"]` (strips non-numeric characters)
- Pace: `row["avg pace"]`
- Time: `row["time"]` || `row["elapsed time"]`
- Avg HR: `row["avg hr"]` || `row["average heart rate (bpm)"]`
- Max HR: `row["max hr"]`
- Calories: `row["calories"]`
- Type: `row["activity type"]` || `row["type"]` || `row["title"]` (passed to `classifyGarminType`)

### Deduplication logic
On CSV re-upload, a lookup key `date + "_" + dist` is built for each parsed entry. Any existing stored entry where `raw === "Garmin CSV"` AND the key matches is dropped before the new entries are merged. This means re-uploading the same CSV **replaces** existing Garmin entries (useful for correcting misclassified activity types). Manual entries (any `raw !== "Garmin CSV"`) are always preserved.

### Manual paste parsing (`parseGarmin(text)`)
Uses regex patterns against freeform text:
- Distance: `/(\d+\.?\d*)\s*mi(?!n)/i` (excludes "min")
- Pace: `/(\d+:\d{2})\s*\/mi/i`
- Time: `/(?:elapsed|time)[:\s]*(\d+:\d{2}(?::\d{2})?)/i`
- Avg HR: `/avg\s*(?:hr|heart)[:\s]*(\d+)/i` or `/(\d{2,3})\s*bpm/i`
- Max HR: `/max\s*(?:hr|heart)[:\s]*(\d+)/i`
- HR Recovery: `/recov\w*[:\s]*(\d+)/i`
- Calories: `/(\d+)\s*cal/i`
- Cadence: `/(\d+)\s*spm|cadence[:\s]*(\d+)/i`

---

## 13. Known Edge Cases and Behaviors

### Week sentinel values
- `week: 0` — activity before May 13, 2026. Shown as "Pre-plan" grey tag. Excluded from all training metrics (IC1, IC5, mileage calculations, `analyze()`).
- `week: null` — legacy data from before the pre/post sentinel was added. Treated the same as `0` in the activity list tag display.
- `week: 24` — activity after week 23 ends. No tag shown in the activity list. Excluded from all training metrics.
- `week: 1-23` — in-plan, shown as "Wk1"–"Wk23" indigo tag.

### Strength week vs. run week
Run entries get `week: dateToWeek(rDate)` — date-driven, accurate for backdating. Strength entries get `week: week` (current live week from `getWeek()`) — if you backdate a strength session to last Tuesday but save it today (week 3), the strength entry has `week: 3`, not the week derived from the date.

### Calendar "This Month" mileage
Counts all activities in the calendar month regardless of `isRunActivity()`. Walks, cycling, etc. inflate the monthly miles shown. Only the calendar dot/bar visualization applies the run activity filter.

### IC4 finish time projection formula
```
avgPace = mean of 3 most recent qualifying runs (in seconds/mile)
adj = 1.0 if tempo/intervals, 0.92 otherwise (converts training pace to race pace)
curSec = 13.1 × (avgPace × adj)   // equivalent race time today
imp = min(0.12, daysToRace/7 × 0.006)   // max 12% improvement
raceSec = 13.1 × (avgPace × adj × (1 - imp))   // projected race day
```
Goal: 1:44:52 = 6292 seconds. Badge thresholds: Ahead = raceSec < goalSec - 120, On Track = raceSec ≤ goalSec + 180, Building Fitness = raceSec > goalSec + 180.

### IC5 crash prevention
The `wkMiles(w)` function inside IC5 uses `parseFloat(r.dist||0)` to prevent the string concatenation bug where `0 + "5.2"` produces `"05.2"` (a string), causing `.toFixed(1)` to throw a TypeError and blank the entire Insights tab.

### IC2 aerobic efficiency "Improving" logic
Splits the last 8 qualifying runs into two halves. "Improving" requires: (1) recent half has faster average pace, AND (2) recent half has same or lower average HR (within +2 bpm tolerance). If fewer than 4 qualifying runs, the improving badge is not shown.

### Boot sequence
The app renders a progress bar animation before showing any data. The boot runs for approximately 1.5 seconds with a simulated loading percent. All Firebase data loads happen during this period via `Promise.all`. The app does not wait for Firebase before displaying the boot screen — data is set via `useState` setters once resolved.

### Sync indicator
A green "Saving..." badge appears fixed at top-right for 1.2 seconds after any `sv()` call. This is cosmetic — the save to Firebase is async and may complete before or after the indicator disappears.

---

## 14. Boot Animation and Initial Load

1. `useEffect` with `[]` dependency starts a `setInterval` every 200ms, incrementing `bootPct` by a random 12-32 units
2. When `bootPct >= 100`, clears interval, sets `bootPct = 100`, waits 300ms, then sets `boot = true`
3. A second `useEffect` with `[]` runs `Promise.all([dbGet("a8_r"), ...])` concurrently for all four data keys
4. Each resolved result is JSON-parsed and set via the appropriate `setState`

---

## 15. Integration Notes for Multi-Agent Orchestration

### What ARIA produces (outputs available to an orchestrator)

ARIA's `analyze()` function is the primary intelligence layer. An orchestrator agent can call it programmatically with the same data ARIA reads from Firebase:

```js
analyze(weekNumber, PLAN[weekNumber], runsArray, strengthArray, hrArray, nutritionArray)
// Returns: { warnings, positives, actions, score, factors, avgRest, avgHRV, wkMi, wkStr, wkRuns, summary }
```

**Signals ARIA can surface to peer agents:**
- Readiness score (1–10) — usable as a gating signal for training load decisions
- `factors` array — specific deduction reasons (e.g., "HRV ↓", "HR ↑", "Underfueling")
- `avgRest` and `avgHRV` — recovery biomarkers
- `wkMi` — current week mileage vs. plan
- `A.actions` — priority-ordered coaching interventions
- `A.warnings` — list of flagged issues with science basis
- `A.positives` — positive training signals
- `summary` — natural language summary of the week

**Pace zone evaluation for any stored run:**
```js
getPaceZone(run.type, run.pace, run.dist)
// Returns: { rating, color, msg } or null
```

**Plan lookup for any date:**
```js
getPlannedForDate("2026-07-15")
// Returns: { week, plan, runLabel, runType, strWkt, strLabel, dow }
```

### Reading ARIA's data from Firebase
An external agent can read the same Firebase paths directly:
```
GET https://aria-training-default-rtdb.firebaseio.com/brandon/a8_r.json  → runs array
GET https://aria-training-default-rtdb.firebaseio.com/brandon/a8_s.json  → strength array
GET https://aria-training-default-rtdb.firebaseio.com/brandon/a8_h.json  → HR array
GET https://aria-training-default-rtdb.firebaseio.com/brandon/a8_n.json  → nutrition array
```
Each value is a JSON string that must be parsed: `JSON.parse(snap.val())`.

### Writing data from an external agent
An external agent (e.g., a Garmin sync agent, a meal-logging agent) can write to the same Firebase paths using the same key format. The data must match the schema defined in Section 5. Entries should be prepended (not appended) to the array and the array sliced to 200. The `raw` field should be set to a string identifying the source agent so ARIA's CSV deduplication logic doesn't accidentally drop it.

### What ARIA does NOT do
- ARIA does not generate natural language training advice beyond what's hardcoded in `analyze()` rules
- ARIA does not adjust the training plan dynamically — the 23-week plan is fixed
- ARIA does not communicate with any external service other than Firebase
- ARIA has no authentication layer — the `UID="brandon"` path is hardcoded
- ARIA does not support multiple athletes — it is single-user

### Suggested orchestration pattern
An orchestrator could treat ARIA as:
1. **Data sink:** Other agents (Garmin sync, meal tracker, wearable reader) write structured data to Firebase in ARIA's schema
2. **State reader:** The orchestrator reads Firebase and calls `analyze()` to get current training state and readiness score
3. **Condition evaluator:** The readiness score and factor tags gate decisions in peer agents (e.g., a recovery agent triggers when score < 6 or "HRV ↓" is present)
4. **Plan source:** `getPlannedForDate()` and `PLAN[week]` provide the prescribed training for any given day

---

## 16. Color System Reference

```js
const C = {
  bg:           "#f0f4ff",
  bgDeep:       "#e8eeff",
  bgCard:       "rgba(255,255,255,0.82)",
  border:       "rgba(99,102,241,0.14)",
  borderStrong: "rgba(99,102,241,0.3)",
  run:          "#0ea5e9",    // blue — easy runs
  longRun:      "#6366f1",    // indigo — long runs
  tempo:        "#8b5cf6",    // purple — tempo/intervals
  strength:     "#f59e0b",    // amber — strength
  recovery:     "#10b981",    // green — recovery runs, positive signals
  hr:           "#ef4444",    // red — HR warnings, danger
  nutrition:    "#06b6d4",    // cyan — nutrition tab
  warn:         "#f97316",    // orange — warnings, pace zones
  good:         "#10b981",    // green — positive signals
  text:         "#1e293b",
  textMid:      "#64748b",
  textSoft:     "#94a3b8"
};
```

---

## 17. `getPlannedForDate(date)` — Full Signature

```js
// Input: YYYY-MM-DD string
// Output:
{
  week: null | 1-23,
  plan: null | PLAN[week],
  runLabel: null | string,    // e.g., "9mi @9:00-9:15"
  runType: null | string,     // e.g., "long_run", "run", "tempo"
  strWkt: null | "A"|"B"|"C",
  strLabel: null | "Workout A"|"Workout B"|"Workout C",
  dow: 0-6                    // day of week (0=Sunday)
}
```

Returns `week: null, plan: null` for dates outside the plan window (before May 13, 2026 or more than 23 weeks after).
