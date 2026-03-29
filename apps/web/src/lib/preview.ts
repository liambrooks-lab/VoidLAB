import { ProjectFile } from "@/lib/workspace";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

const buildPreviewDocument = (files: ProjectFile[], activeFileId: string) => {
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const htmlFile = files.find((file) => file.languageId === "html");
  const cssFiles = files.filter((file) => file.languageId === "css");
  const jsFiles = files.filter((file) => file.languageId === "javascript");

  if (htmlFile) {
    const combinedStyles = cssFiles.map((file) => file.content).join("\n\n");
    const combinedScripts = jsFiles.map((file) => file.content).join("\n\n");
    const baseDocument = /<html[\s>]/i.test(htmlFile.content) || /<!doctype/i.test(htmlFile.content)
      ? htmlFile.content
      : `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB Preview</title>
  </head>
  <body>${htmlFile.content}</body>
</html>`;

    return baseDocument
      .replace("</head>", `${combinedStyles ? `<style>${combinedStyles}</style>` : ""}</head>`)
      .replace("</body>", `${combinedScripts ? `<script>${combinedScripts}</script>` : ""}</body>`);
  }

  if (activeFile.languageId === "css") {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB CSS Preview</title>
    <style>${activeFile.content}</style>
  </head>
  <body>
    <main class="preview-shell">
      <section class="card">
        <h1>VoidLAB CSS Preview</h1>
        <p>Your stylesheet is now applied to this preview canvas.</p>
        <button>Primary action</button>
      </section>
    </main>
  </body>
</html>`;
  }

  if (activeFile.languageId === "markdown") {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB Markdown Preview</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #eff6ff; color: #0f172a; }
      article { max-width: 760px; margin: 0 auto; padding: 48px 24px; line-height: 1.7; }
      code { background: #dbeafe; padding: 2px 6px; border-radius: 8px; }
      h1, h2, h3 { color: #1d4ed8; }
    </style>
  </head>
  <body>
    <article><p>${renderMarkdown(activeFile.content)}</p></article>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VoidLAB Preview</title>
    <style>
      body { margin: 0; background: #eff6ff; color: #0f172a; font-family: Arial, sans-serif; }
      main { max-width: 980px; margin: 0 auto; padding: 32px 24px; }
      pre { white-space: pre-wrap; word-break: break-word; background: white; border: 1px solid #bfdbfe; border-radius: 20px; padding: 20px; }
    </style>
  </head>
  <body>
    <main>
      <h1>VoidLAB Preview</h1>
      <pre>${escapeHtml(activeFile.content)}</pre>
    </main>
  </body>
</html>`;
};

export const openPreview = (files: ProjectFile[], activeFileId: string) => {
  const nextWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!nextWindow) {
    throw new Error("Preview window was blocked by the browser.");
  }

  nextWindow.document.open();
  nextWindow.document.write(buildPreviewDocument(files, activeFileId));
  nextWindow.document.close();
};
