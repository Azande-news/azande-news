"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: "Write your story…" }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-article font-body text-ink min-h-[280px] focus:outline-none px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `px-2.5 py-1.5 text-sm rounded-sm font-medium transition-colors ${
      active ? "bg-ink text-paper" : "text-ink hover:bg-offwhite"
    }`;

  return (
    <div className="border border-border rounded-sm">
      <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-offwhite">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
          Bold
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
          Italic
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))}>
          H3
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
          Bullet list
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
          Numbered list
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
          Quote
        </button>
        <button type="button" onClick={setLink} className={btnClass(editor.isActive("link"))}>
          Link
        </button>
        <button type="button" onClick={addImage} className={btnClass(false)}>
          Image
        </button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)}>
          Undo
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
