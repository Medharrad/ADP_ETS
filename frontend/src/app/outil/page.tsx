import { AppHeader } from "@/components/app-header";
import { OutilWizard } from "@/components/wizard/OutilWizard";

export const metadata = {
  title: "Outil ADP 2026 — ADP-RM",
};

// Standalone (client-only) wizard, with the persistent app navbar on top.
export default function OutilPage() {
  return (
    <>
      <AppHeader />
      <OutilWizard />
    </>
  );
}
