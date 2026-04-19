# Boom Investor Notes

## Outreach Blurb
Built and sold an edtech product to Crimson after reaching 70k users, did computational physics research at the Navy, published to NeurIPS, and now building Boom: a browser-based aerial-refueling rehearsal and autonomy debrief tool with a high-school teammate and a Dartmouth-bound collaborator.

Boom turns one of the hardest parts of refueling into software rehearsal: passive sensing, boom alignment, closure control, and post-run analytics in a single loop.

## Two-Minute Problem / Solution
Air-to-air refueling is not just “flying close.” It is a tight moving-geometry problem with expensive consequences when closure rate, alignment, or boom dynamics go wrong.

Air Mobility Command’s Aug. 25, 2025 release summarized KC-46 boom mishaps tied to refueling attempts on:

- Oct. 15, 2022: nozzle binding during breakaway led to the boom striking the tanker tail.
- Nov. 7, 2022: nozzle binding damaged the boom nozzle during an F-22 refueling attempt.
- Aug. 21, 2024: nozzle binding, excessive closure rate, and instability led to a boom strike and structural failure.

The release also noted a July 8, 2025 nozzle-binding incident was still under investigation at the time of publication.

Boom is a software-first rehearsal and debrief layer for that geometry problem:

- Simulate passive visible / thermal sensing and boom control in-browser.
- Upload a controller or mock mission disturbance file to test how autonomy changes the intercept.
- Compare baseline vs uploaded vs overlay runs.
- Debrief with distance offset, closure, confidence, dropout, and safety-event analytics.

The pitch should avoid claiming that a recent aircraft “went down” because of boom misalignment unless a separate verified source is added. The strongest sourced angle today is repeated official mishap reporting around nozzle binding, closure instability, and boom damage.

## Plain-English Math / Physics
- Relative pose: the core quantity is the 3D difference between boom tip and receptacle.
- Lateral offset: side-to-side miss in the docking plane.
- Vertical offset: up/down miss that can cause nozzle binding or missed insertion.
- Forward offset: over- or under-shoot along the closure axis.
- Closure rate: how fast the boom tip is approaching or separating from the receptacle.
- Confidence: how trustworthy the fused passive track is at a given moment.
- Sensor disagreement: how far the passive estimates diverge from each other.
- Inverse kinematics: the math that turns a desired boom-tip position into boom yaw, pitch, and extension.
- Rate limits: physical constraints that prevent the boom from moving infinitely fast even if software asks it to.
- Hold / abort / breakaway: safety states that stop closure, retract, or disengage when the geometry or sensing gets unsafe.

## Product Positioning
- Training aid, not a replacement for official certification or crew instruction.
- Best wedge: autonomy rehearsal + post-run debrief for a risky geometry problem.
- Strong visual hook: camera lock modes, coupled boom visualization, and overlay replay.

## Sources
- AMC KC-46 mishap release, published Aug. 25, 2025:
  [https://www.torch.aetc.af.mil/News/Article-Display/Article/4290059/aircraft-accident-investigation-boards-release-results-of-three-kc-46a-aerial-r/](https://www.torch.aetc.af.mil/News/Article-Display/Article/4290059/aircraft-accident-investigation-boards-release-results-of-three-kc-46a-aerial-r/)
- NASA AARD flight-test results:
  [https://ntrs.nasa.gov/citations/20070028418](https://ntrs.nasa.gov/citations/20070028418)
- Anduril Lattice concepts:
  [https://docs.anduril.com/guide/concepts](https://docs.anduril.com/guide/concepts)
- Anduril entities overview:
  [https://docs.anduril.com/guide/entity/overview](https://docs.anduril.com/guide/entity/overview)
- Shield Benchmark:
  [https://shield.ai/benchmark/](https://shield.ai/benchmark/)
- Shield Tracker:
  [https://shield.ai/tracker/](https://shield.ai/tracker/)
