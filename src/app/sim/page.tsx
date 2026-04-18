import { DockingHud } from "@/components/hud/DockingHud";
import { SimCanvas } from "@/components/scene/SimCanvas";

export default function SimPage() {
  return (
    <main className="relative m-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-[color:var(--hud-base)] p-0 text-[color:var(--hud-fg)]">
      <SimCanvas />
      <DockingHud />
    </main>
  );
}
