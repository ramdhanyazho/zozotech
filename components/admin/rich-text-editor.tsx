"use client";

import dynamic from "next/dynamic";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const SunEditor = dynamic(() => import("suneditor-react"), { ssr: false });

const BUTTON_LIST = [
  ["undo", "redo"],
  ["formatBlock", "bold", "underline", "italic", "strike"],
  ["fontColor", "hiliteColor", "removeFormat"],
  ["align", "list", "lineHeight"],
  ["table", "link", "image", "video"],
  ["fullScreen", "showBlocks", "codeView"],
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <SunEditor
        setContents={value}
        onChange={(content) => onChange(content)}
        setOptions={{
          height: "320px",
          minHeight: "240px",
          placeholder: "Tulis konten artikel di sini...",
          buttonList: BUTTON_LIST,
        }}
      />
    </div>
  );
}
