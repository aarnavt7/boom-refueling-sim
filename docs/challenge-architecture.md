# Challenge Architecture

## System Overview

The autonomous boom solution in this repo is built as a passive-first multispectral control stack:

1. Passive sensor suite observes the receiver receptacle.
2. Fused tracker estimates the receptacle pose and confidence.
3. Controller computes desired boom-tip motion by state.
4. Autopilot adapter emits `moveECEF(dx, dy, dz)`.
5. Simulated boom plant applies joint/rate limits and moves the boom.
6. Safety logic can hold, abort, or break away at any point.

## Sensor Placement

### Tail Acquisition Pair

- `tail-acq-left`
- `tail-acq-right`

Placement:

- mounted port / starboard near the boom root on the tanker tail
- fixed wide-FOV aft-looking acquisition view

Purpose:

- initial search / acquire
- stereo depth cueing at longer range

### Boom Terminal Pair

- `boom-term-left`
- `boom-term-right`

Placement:

- mounted just aft of the nozzle on the boom
- narrow-FOV terminal view for close-in alignment

Purpose:

- final alignment
- insertion / mate confirmation

### Inertial / State Inputs

- boom root reference frame
- boom-tip kinematics via boom geometry
- boom joint positions and rates from the simulated plant

## Passive Modalities

Every camera mount supports:

- visible / low-light
- thermal

Selection policy:

- day over land: visible-primary
- day over water close-in: thermal preferred to reduce glint sensitivity
- night: thermal-primary
- EMCON: same passive stack, with active emissions explicitly disabled

## Challenge Coverage

### Night Operations

- thermal modality stays available in darkness
- environment profiles reduce visible SNR and preserve thermal contrast
- night-land and night-water scenarios are both included in the mission matrix

### Over Land Or Water

- land profiles keep higher visible contrast
- water profiles add horizon ambiguity and glint penalties
- HUD exposes the active mission environment

### EMCON

- architecture does not depend on radar, lidar, RF aids, or active illumination
- mission profiles can enter `EMCON` with the same passive sensors
- HUD explicitly shows passive-only / EMCON state

## Safety Model

The safety layer watches:

- fused confidence collapse near the receptacle
- insertion divergence
- sensor disagreement
- excessive closure rate
- keep-out / corridor violations
- receiver motion spikes
- manual operator breakaway

Outputs:

- `HOLD`
- `ABORT`
- `BREAKAWAY`

## Simulator Fidelity

This is a medium-fidelity simulator:

- geometry-first deterministic sensing
- explicit sensor placement and handoff
- modality-aware noise / dropout
- environment-aware mission profiles
- ECEF command path into a rate-limited boom plant

It is intended to test perception / fusion / guidance behavior, not to reproduce certified aeroelastic or photoreal thermal physics.
