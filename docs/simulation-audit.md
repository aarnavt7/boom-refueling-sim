# Simulation Audit

This note documents the current passive multispectral boom simulation pipeline in `src/lib/sim`.

## Frames And Geometry

- World / tanker frame: `+z` points aft from the tanker toward the receiver, `+x` is lateral, and `+y` is up.
- Boom root: derived from `TANKER_ATTACHMENT_CONFIG.boomRootLocal`.
- Receiver receptacle: derived from `RECEIVER_ATTACHMENT_CONFIG.receptacleLocal = (0, 0.56, 1.95)`.

The world-space receptacle target is:

```text
target_world = receiver_position + R_xyz(receiver_rotation) * receptacle_local
```

`rotateVectorByEuler()` and `worldFromLocalOffset()` are aligned with Three.js `Euler(..., "XYZ")`.

## Mission Model

Each `ScenarioPreset` now carries:

- receiver motion profile
- environment profile
- mission profile
- passive sensor policy
- controller gains / tolerances
- safety thresholds

Environment profiles explicitly cover:

- day + land
- day + water
- night + land
- night + water
- normal emissions
- EMCON

## Passive Sensor Suite

The perception stack models four passive sensors:

- `tail-acq-left`
- `tail-acq-right`
- `boom-term-left`
- `boom-term-right`

Each mount supports:

- visible / low-light
- thermal

Role split:

- tail sensors: wide-FOV acquisition and stereo depth
- boom sensors: narrow-FOV terminal alignment and insertion

Modality selection is deterministic:

- night => thermal-primary
- water close-in => thermal-primary
- otherwise => visible-primary

## Perception And Fusion

`runPassivePerception()`:

1. Computes each sensor pose from the tanker / boom geometry.
2. Projects the receptacle into each sensor frustum.
3. Applies deterministic dropout, range penalties, glint / horizon penalties, and modality-specific noise.
4. Marks a preferred role handoff:
   - acquisition outside the terminal envelope
   - terminal once close-in observations are credible
5. Chooses a primary active sensor for the HUD feed.

Each `SensorObservation` contains:

- sensor id / role / modality
- visibility + dropout state
- confidence
- estimated receptacle pose
- image point
- camera-space position
- range
- notes such as `emcon-passive-only` or `water-background`

`updateTracker()` fuses the selected observations into a `FusedReceptacleTrack`:

- weighted average position / rotation
- exponential smoothing
- constant-velocity prediction during short losses
- per-axis covariance
- pairwise sensor disagreement metric

## Controller And Autopilot

`updateController()` no longer emits boom joint rates directly.

It outputs a desired boom-tip motion in tanker/body coordinates and progresses through:

- `SEARCH`
- `ACQUIRE`
- `TRACK`
- `ALIGN`
- `INSERT`
- `MATED`
- `HOLD`
- `ABORT`
- `BREAKAWAY`

`toAutopilotCommandECEF()` converts that motion into:

```text
moveECEF(dx, dy, dz)
```

`applyAutopilotCommand()` then maps the ECEF increment into:

- desired tip world position
- inverse-kinematics boom joint target
- rate-limited boom plant motion

## Safety

`evaluateSafety()` now includes:

- near-target confidence collapse
- insertion divergence
- passive sensor disagreement
- excessive closure rate
- keep-out / corridor violation
- receiver motion spike
- manual breakaway hook

Severity split:

- `hold`: pause closure and let the track recover
- `abort`: retract
- `breakaway`: immediate disengage

## Metrics

`computeMetrics()` tracks:

- position, lateral, and forward error
- closure rate
- fused confidence
- mate score
- dropout count
- visible time
- sensor disagreement
- active sensor count
- primary track range
- commanded `moveECEF` magnitude

## Verification

- `bun run typecheck`
- `bun test`

The headless harness in `src/lib/sim/headlessHarness.ts` runs the same passive perception, fusion, controller, autopilot, and safety loop used by the live sim, and the test suite exercises:

- ECEF conversion and saturation
- IK / plant behavior
- controller + safety transitions
- mission matrix coverage across day/night land/water EMCON profiles
