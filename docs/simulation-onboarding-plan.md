# Simulation Onboarding Plan

This note captures research on modern onboarding libraries and translates it into a concrete plan for the current sim at `/sim`.

## What The Sim Needs

Right now the sim drops users directly into a live autonomous docking scene with a dense HUD. That is visually strong, but it can also feel like:

- What am I looking at?
- Am I supposed to control something?
- Which panel matters first?
- How do I know a run was successful?
- What should I do after the pretty docking scene finishes?

The biggest product truth from the current codebase is that this experience is not a manual piloting tutorial. The boom controller is already autonomous. The onboarding therefore should explain the system, narrate the controller pipeline, walk the user through one successful run, then teach replay and save-run so they feel ready to record experiments.

## Best Pattern To Copy

The strongest onboarding stacks all converge on the same pattern:

- Start with a short welcome modal that explains the mission in plain English.
- Follow with a persistent checklist instead of one long blocking tour.
- Tie progress to real in-app actions and state changes, not just clicks.
- Use one guided first run so the user learns by watching the real workflow.
- End with a short celebration/debrief so the user knows they are now ready.

That pattern is a much better fit for this sim than a 12-step tooltip parade.

## Library Research

### Best Open-Source Options

| Library | Best at | Strengths | Risks / drawbacks | Fit for this sim |
| --- | --- | --- | --- | --- |
| [React Joyride](https://react-joyride.com/) | React-native guided tours | Controlled mode, custom tooltip components, keyboard support, spotlight click-through, portal rendering, recent docs | DOM-targeted only, so 3D scene annotations still need custom work | Best overall fit |
| [Driver.js](https://driverjs.com/) | Lightweight highlights and product tours | Very flexible hooks, step-level navigation control, function-based targets, simple API, strong highlight engine | Imperative API, custom UI is less React-native | Best fallback / runner-up |
| [Reactour](https://docs.reactour.dev/) | React tours with modular mask/popover packages | Clean React API, modular packages, easy provider/hook model | Smaller ecosystem and fewer battle-tested examples than Joyride/Driver | Good alternative |
| [Shepherd.js](https://www.shepherdjs.dev/) | Highly customizable accessible tours | Strong accessibility story, framework-ready, minimal default styling | More setup/styling effort, less natural than Joyride in a React app | Viable but not my first pick |
| [Onborda](https://www.onborda.dev/) | Fancy Next.js/Tailwind product tours | Nice animations, route-aware tours, Next.js-friendly marketing feel | Adds Framer Motion dependency and Tailwind content setup; lower maturity/adoption | Cool, but not ideal here |
| [Frigade](https://docs.frigade.com/overview) | Full onboarding platform | Tours, checklists, targeting, analytics, versioning, admin tooling | Heavy platform dependency and larger SDK footprint; overkill for this project right now | Only if this becomes a product platform |
| [Intro.js](https://introjs.com/) | Simple generic tours | Lightweight and easy to start | AGPL/commercial licensing makes it a bad default choice here | Avoid |

### Recommendation

Use a hybrid stack:

- `react-joyride` for HUD callouts and guided steps
- Zustand for onboarding state and progression logic
- `localStorage` for first-run persistence and onboarding versioning
- `@react-three/drei` `Html` or existing scene overlays for 3D callouts inside the canvas

Why this wins:

- The project is already a React 19 + Next.js 15 app.
- The onboarding UI should look like part of the tactical HUD, which is easier with Joyride custom components than with an imperative DOM-only solution.
- The important logic is not tour rendering. It is sim-aware progression based on `SEARCH`, `ACQUIRE`, `TRACK`, `ALIGN`, `INSERT`, `MATED`, replay, and save-run.

If we want a smaller dependency and are happy to manage more imperative behavior, `driver.js` is the best backup choice.

## Product Shape

The onboarding should feel like a mission brief plus a first supervised run.

### Phase 1: Welcome

Show a centered modal before the user gets dropped into full HUD complexity.

Core copy:

- What this sim is: autonomous boom docking rehearsal
- What the user will learn: what the panels mean, what a good run looks like, how to replay and save
- What happens next: a 60-90 second guided test run

Actions:

- `Start guided run`
- `Skip for now`
- `Replay onboarding`

### Phase 2: Quick Orientation

Run a very short spotlight tour over the main HUD zones:

1. Main 3D view: "This is the live docking scene."
2. Guidance panel: "This is the status panel that matters most."
3. Sensor viewport: "This is the passive visible / thermal sensor feed."
4. Controller pipeline: "Watch the state move from SEARCH to MATED."
5. Scenario panel: "This changes the difficulty preset."
6. Replay/save panel: "This is how you inspect and persist runs."

This should be six steps max and should not try to explain every metric.

### Phase 3: Guided Test Run

After orientation, the app should automatically reset into the easiest preset:

- scenario: `steady-approach`
- replay: off
- replay playing: off
- debug: off

Then start a narrated first run:

- Explain `SEARCH`: the system is sweeping for the target.
- Explain `ACQUIRE`: the target is now tracked.
- Explain `ALIGN`: the boom is lining up the intercept.
- Explain `INSERT`: the system is committing to closure.
- Explain `MATED`: successful capture.

Important: since the sim is autonomous, the onboarding should frame this as "watch how the system behaves" rather than pretending the user is flying it.

### Phase 4: Debrief And Replay

As soon as the run docks, pause the experience and guide the user through the replay tools:

- switch to replay mode
- scrub the timeline
- explain what to inspect in telemetry
- show that the run can be saved

This is the bridge from "cool demo" to "I understand how to use this for experiments."

### Phase 5: Save A Run

Prompt the user to save the completed run and confirm persistence state.

If save succeeds:

- show a completion message
- unlock free exploration
- collapse onboarding into a small "Getting Started" checklist

If save fails:

- explain the fallback mode clearly
- still mark the user as ready if replay and run completion worked

## Checklist Design

The persistent checklist should stay available after onboarding so users always know what to do next.

Recommended checklist:

1. `Watch a guided docking run`
2. `See the controller reach MATED`
3. `Open replay and scrub the timeline`
4. `Save your first run`
5. `Try a harder scenario`

Checklist rules:

- Keep it to 3-5 items
- Mark items complete from real state, not manual checkboxes
- Front-load quick wins
- Allow the user to reopen it later

## Technical Architecture

### New Store

Add a dedicated onboarding store instead of stuffing this into `uiStore`.

Suggested file:

- `src/lib/store/onboardingStore.ts`

Suggested state:

- `status`: `"idle" | "welcome" | "tour" | "guided-run" | "replay-debrief" | "completed"`
- `version`: string for future onboarding migrations
- `activeStepId`
- `checklist`
- `isOpen`
- `isDismissed`
- `hasCompleted`
- `allowOrbitControls`
- `hasSeenWelcome`

Suggested actions:

- `startOnboarding()`
- `skipOnboarding()`
- `advanceStep(stepId)`
- `completeChecklistItem(id)`
- `setStatus(status)`
- `markCompleted()`
- `resetOnboarding()`
- `hydrateFromStorage()`

### New Components

Suggested files:

- `src/components/onboarding/OnboardingProvider.tsx`
- `src/components/onboarding/WelcomeModal.tsx`
- `src/components/onboarding/GuidedTour.tsx`
- `src/components/onboarding/ChecklistBeacon.tsx`
- `src/components/onboarding/MissionCoachCard.tsx`
- `src/components/scene/TutorialCameraRig.tsx`

What each does:

- `OnboardingProvider`: boots localStorage state, wires observers, mounts tour/checklist layers
- `WelcomeModal`: first-run mission brief
- `GuidedTour`: Joyride wrapper with custom tactical tooltip UI
- `ChecklistBeacon`: persistent reopenable task list
- `MissionCoachCard`: small live explainer during the first run
- `TutorialCameraRig`: optional scripted camera framing during onboarding

### Existing Files To Touch

- `src/app/sim/page.tsx`
  Mount the onboarding provider alongside `SimCanvas` and `DockingHud`.
- `src/components/hud/DockingHud.tsx`
  Add stable selectors like `data-tour="guidance-panel"` and reserve space for the checklist/beacon.
- `src/components/hud/ScenarioPanel.tsx`
  Add a stable tour target for preset/reset.
- `src/components/hud/ReplayPanel.tsx`
  Add a stable tour target for replay/save-run.
- `src/components/hud/MetricsPanel.tsx`
  Add a stable target for debrief metrics if needed.
- `src/components/scene/SimCanvas.tsx`
  Let onboarding temporarily control camera behavior and observe success transitions.
- `src/lib/store/uiStore.ts`
  Potentially add a tiny amount of coordination only if needed for orbit lock or tutorial mode.
- `src/lib/store/simStore.ts`
  Keep this as the source of truth for live sim state and persistence status.

### Stable Tour Targets

Tour libraries work much better with stable selectors than brittle CSS ancestry.

Add explicit attributes such as:

- `data-tour="sim-header"`
- `data-tour="guidance-panel"`
- `data-tour="sensor-feed"`
- `data-tour="controller-pipeline"`
- `data-tour="telemetry-panel"`
- `data-tour="scenario-panel"`
- `data-tour="replay-panel"`
- `data-tour="save-run-button"`

## Event-Driven Step Completion

The onboarding should complete from real sim events.

Suggested mappings:

- `guided-run-started`
  Trigger when the onboarding resets `steady-approach`
- `controller-search-seen`
  Trigger after a short dwell in `SEARCH`
- `controller-acquire-seen`
  Trigger when `live.controllerState === "ACQUIRE"`
- `controller-align-seen`
  Trigger when `live.controllerState === "ALIGN"`
- `controller-insert-seen`
  Trigger when `live.controllerState === "INSERT"`
- `controller-docked-seen`
  Trigger when `live.controllerState === "MATED"`
- `replay-opened`
  Trigger when `replayMode === true`
- `replay-scrubbed`
  Trigger when `replayIndex` changes while replay is open
- `run-saved`
  Trigger when `persistStatus === "saved"`

This is what makes the onboarding feel intelligent instead of fake.

## Camera And Scene Guidance

DOM tour libraries cannot truly spotlight a mesh inside WebGL. For the 3D scene itself, use custom sim-aware guidance:

- temporary camera framing via `TutorialCameraRig`
- lightweight 3D labels using `Html` from `@react-three/drei`
- subtle scene markers for boom tip / receptacle / target line of sight
- optional dimming of HUD during the first few seconds of the guided run

That gives us the "really cool" part without trying to force a generic tooltip library to understand Three.js objects.

## UX Guardrails

- Keep the whole first-run flow under two minutes.
- Never stack multiple modal layers at the same time.
- Always offer `Skip` after the welcome step.
- Do not dump acronyms without plain-language translation.
- Explain only the metrics that help the user decide if a run was good.
- Avoid a never-ending spotlight sequence. The checklist should take over quickly.
- Only auto-run onboarding on first visit or when the onboarding `version` changes.

## Phased Implementation Plan

### Phase 1: Scaffolding

- Add `onboardingStore`
- Add localStorage persistence with versioning
- Add stable `data-tour` attributes to HUD panels
- Mount `OnboardingProvider` in `/sim`

Success criteria:

- onboarding can be started, skipped, reset, and persisted

### Phase 2: Welcome + Orientation Tour

- Add `WelcomeModal`
- Add Joyride wrapper with custom tactical tooltip
- Implement six-step HUD orientation flow

Success criteria:

- first-time user can understand the meaning of the main HUD zones in under 30 seconds

### Phase 3: Guided Run

- Add onboarding observer that resets the sim into `steady-approach`
- Add `MissionCoachCard`
- Watch controller state changes and update copy live
- Optional: add `TutorialCameraRig`

Success criteria:

- first-time user sees one full run and understands the controller progression

### Phase 4: Replay + Save

- Auto-advance into replay debrief after `MATED`
- Guide user to open replay, scrub, and save run
- Mark checklist progress from real state

Success criteria:

- user can inspect and save a run without guessing

### Phase 5: Polish

- Add completion screen
- Add "Replay onboarding" entrypoint
- Add onboarding analytics hooks if needed
- Tune copy, timings, and camera framing

Success criteria:

- onboarding feels smooth enough to leave on by default for first-time users

## Measurement

If we want to know whether this actually helps, log:

- onboarding started
- onboarding skipped
- onboarding completed
- time to first `MATED`
- time to first replay open
- time to first save
- drop-off step

Even a simple in-memory or Convex-backed event log would be enough to start learning.

## Final Recommendation

Build the first version in-house with:

- `react-joyride` for guided HUD steps
- a custom Zustand onboarding state machine
- a persistent checklist
- a narrated guided run tied to real controller states
- replay/save-run graduation at the end

That gives this sim the right feeling: not a generic SaaS tooltip tour, but a calm mission brief that explains what is happening, shows one clean success path, and leaves the user ready to keep recording experiments.

## Sources

- [React Joyride docs](https://react-joyride.com/)
- [React Joyride props and controlled mode](https://docs.react-joyride.com/props)
- [Driver.js docs and configuration](https://driverjs.com/docs/configuration)
- [Reactour docs](https://docs.reactour.dev/)
- [Shepherd.js homepage and docs](https://www.shepherdjs.dev/)
- [Onborda docs](https://www.onborda.dev/docs)
- [Frigade overview](https://docs.frigade.com/overview)
- [Frigade checklist component](https://docs.frigade.com/component/checklist/carousel)
- [Appcues checklist overview](https://docs.appcues.com/checklists/what-are-checklists)
- [Appcues checklist creation and best practices](https://docs.appcues.com/en_US/checklists/create-a-checklist)
