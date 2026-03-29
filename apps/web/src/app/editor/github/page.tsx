import GitHubWorkspacePanel from "@/components/editor/GitHubWorkspacePanel";
import ToolPageShell from "@/components/editor/ToolPageShell";

export default function GitHubPage() {
  return (
    <ToolPageShell
      description="Prepare repository details, review the correct push commands, and keep your GitHub publishing flow separate from the coding workspace."
      title="GitHub publishing"
    >
      <GitHubWorkspacePanel />
    </ToolPageShell>
  );
}
