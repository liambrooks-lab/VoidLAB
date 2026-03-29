import AIGuidePanel from "@/components/editor/AIGuidePanel";
import ToolPageShell from "@/components/editor/ToolPageShell";

export default function AIPage() {
  return (
    <ToolPageShell
      description="Use the built-in AI Guide for product walkthroughs, debugging direction, collaboration help, and faster onboarding inside VoidLAB."
      title="AI guide"
    >
      <AIGuidePanel />
    </ToolPageShell>
  );
}
