import { Suspense } from "react";
import CollaborationPanel from "@/components/editor/CollaborationPanel";
import ToolPageShell from "@/components/editor/ToolPageShell";

export default function CollaborationPage() {
  return (
    <ToolPageShell
      description="Create shareable collaboration rooms, invite teammates, exchange room messages, and push or pull workspace snapshots during live teamwork."
      title="Collaboration rooms"
    >
      <Suspense
        fallback={
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Loading collaboration room...
          </div>
        }
      >
        <CollaborationPanel />
      </Suspense>
    </ToolPageShell>
  );
}
