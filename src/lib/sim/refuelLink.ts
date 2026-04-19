import type { ControllerState } from "@/lib/sim/types";

export function getRefuelLinkVisibility({
  controllerState,
  linkDistance,
  insertTolerance,
}: {
  controllerState: ControllerState;
  linkDistance: number;
  insertTolerance: number;
}) {
  const showPreLink =
    controllerState === "INSERT" && linkDistance < insertTolerance * 1.65;
  const showMatedLink = controllerState === "MATED";

  return {
    showPreLink,
    showMatedLink,
    visible: showPreLink || showMatedLink,
  };
}
