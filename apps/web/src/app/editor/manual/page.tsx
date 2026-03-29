import ManualPanel from "@/components/editor/ManualPanel";
import ToolPageShell from "@/components/editor/ToolPageShell";

export default function ManualPage() {
  return (
    <ToolPageShell
      description="Learn how VoidLAB works, how to run code, where to find each feature, and what to expect from cloud execution and previews."
      title="VoidLAB manual"
    >
      <ManualPanel />
    </ToolPageShell>
  );
}
