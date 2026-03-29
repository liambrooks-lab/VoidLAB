import CollaborationPanel from "@/components/editor/CollaborationPanel";
import ToolPageShell from "@/components/editor/ToolPageShell";

export default function CollaborationPage() {
  return (
    <ToolPageShell
      description="Create shareable collaboration rooms, invite teammates, exchange room messages, and push or pull workspace snapshots during live teamwork."
      title="Collaboration rooms"
    >
      <CollaborationPanel />
    </ToolPageShell>
  );
}
