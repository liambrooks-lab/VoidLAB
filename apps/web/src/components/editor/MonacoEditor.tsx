"use client";

import Editor from "@monaco-editor/react";

interface Props {
  language: string;
  theme?: "vs-dark" | "light";
  value: string;
  onChange: (value: string) => void;
}

export default function MonacoEditor({
  language,
  theme = "vs-dark",
  value,
  onChange,
}: Props) {
  return (
    <Editor
      height="100%"
      language={language}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        automaticLayout: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 15,
        lineNumbersMinChars: 4,
        minimap: { enabled: true, maxColumn: 90 },
        overviewRulerBorder: false,
        padding: { top: 20, bottom: 20 },
        roundedSelection: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        wordWrap: "on",
      }}
      theme={theme}
      value={value}
    />
  );
}
