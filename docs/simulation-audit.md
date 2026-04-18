# Simulation Audit

This note documents the computation pipeline in `src/lib/sim` and the main mathematical relationships the sim uses.

## Coordinate Frames

- World frame: `+z` points forward from the tanker toward the receiver, `+x` is lateral, and `+y` is up.
- Boom base: fixed at `BOOM_BASE_POSITION = (0, -0.6, 2.8)`.
- Receiver receptacle: modeled as a local offset `RECEIVER_RECEPTACLE_LOCAL = (0, 0.6, -3.3)` from the receiver pose.

The world-space receptacle target is

```text
target_world = receiver_position + R_xyz(receiver_rotation) * receptacle_local
```

where `R_xyz` must match Three.js `Euler(..., "XYZ")` semantics. The audit found that this rotation order was previously inconsistent with the rendered scene and corrected it.

## Motion Model

`sampleReceiverPose()` generates a deterministic moving receiver:

```text
position(t) = base_position + sinusoid(t) + drift(t)
rotation(t) = base_rotation + rotational_sinusoid(t)
```

Each sinusoid uses a per-axis amplitude and frequency from the selected scenario. Drift uses `harmonicNoise()` scaled by the scenario's translation noise.

## Perception Model

`runGeometryPerception()` projects the target into the boom camera:

```text
projected = Project(camera, target_world)
camera_space = camera^-1 * target_world
```

Visibility is true when the target is in front of the camera and inside normalized device coordinates.

Dropout is deterministic:

```text
dropout = visible and normalized_harmonic_noise < dropout_probability
```

When visible and not dropped, the estimate is

```text
estimated_position = target_world + noise
```

with anisotropic noise on x, y, z. Confidence is

```text
confidence = clamp(1 - 0.35 * edge_penalty - 0.18 * noise_penalty, floor, 0.98)
```

where `edge_penalty = max(|x_ndc|, |y_ndc|)`.

## Tracker

`updateTracker()` is an exponential smoother plus constant-velocity extrapolator.

When a measurement is present:

```text
alpha = 1 - exp(-6.5 * dt)
position_hat = lerp(previous_position, measurement, alpha)
velocity_hat = (position_hat - previous_position) / dt
confidence_hat = lerp(previous_confidence, measurement_confidence, alpha)
```

When the measurement is missing:

```text
position_hat = previous_position + previous_velocity * dt
velocity_hat = 0.92 * previous_velocity
confidence_hat = max(previous_confidence - 0.7 * dt, 0)
```

## Controller

`updateController()` computes the pointing errors

```text
rel_base = target - boom_base
rel_tip = target - boom_tip

desired_yaw = atan2(rel_base.x, rel_base.z)
desired_pitch = atan2(-rel_base.y, hypot(rel_base.x, rel_base.z))
```

The controller uses staged behavior:

- `SEARCH`: scan with a sinusoidal bias and recentre yaw/pitch.
- `ACQUIRE`: track yaw/pitch while retracting toward `standbyExtend`.
- `ALIGN`: track yaw/pitch while driving boom extension toward a standby intercept depth.
- `INSERT`: continue yaw/pitch tracking and extend only when lateral error is inside `insertTolerance`.
- `DOCKED`: terminal success state.
- `ABORT`: retract and re-center.

Tracking gains are proportional:

```text
yaw_rate = clamp(2.2 * yaw_error, -0.55, 0.55)
pitch_rate = clamp(2.0 * pitch_error, -0.42, 0.42)
```

## Safety

`evaluateSafety()` applies three main guards:

- Near-target confidence abort: when the tracker confidence collapses below `0.08` close to the target.
- Insert divergence abort: when position error grows materially during `INSERT`.
- Keep-out abort: when the boom tip enters a keep-out sphere around the receiver body before docking.

The audit tightened the distinction between `hold` and `abort`:

- `hold` happens first on low tracker confidence near the target.
- `abort` requires a deeper confidence collapse.
- `DOCKED` is now terminal and no longer gets invalidated by later confidence blips.

## Metrics

`computeMetrics()` returns:

```text
delta = target - boom_tip
position_error = ||delta||
lateral_error = sqrt(delta.x^2 + delta.y^2)
forward_error = delta.z
closure_rate = (previous_error - current_error) / dt
dock_score = saturate(1 - position_error / 8 + 0.35 * confidence)
```

`dropoutCount` and `visibleTime` are cumulative counters.

## Audit Findings And Fixes

1. Euler rotation order mismatch:
   `rotateVectorByEuler()` did not match Three.js `XYZ` ordering, so local offsets and boom directions could diverge from the rendered scene.
   Fix: apply rotations in the same order as Three.js.

2. Single-frame dropout sensitivity:
   The controller and safety logic were reacting to raw per-frame confidence instead of the tracker state, so one dropout near the target could trigger `SEARCH` or `ABORT`.
   Fix: use tracker confidence for loss-of-track and confidence-based safety rules.

3. `DOCKED` was not terminal:
   The run could reach `DOCKED` and still be overturned by later perception loss or keep-out checks.
   Fix: latch `DOCKED` as terminal success.

## Verification

- Unit tests: `bun test`
- Benchmark: `bun run bench`

The headless harness in `src/lib/sim/headlessHarness.ts` reproduces the simulation loop numerically and is used by both the tests and the benchmark script.
