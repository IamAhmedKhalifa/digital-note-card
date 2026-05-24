"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor-content",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-nc-grey bg-white overflow-hidden focus-within:ring-2 focus-within:ring-nc-green/40 focus-within:border-nc-green transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-nc-grey bg-nc-surface/50">
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-nc-grey mx-1" />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-nc-grey mx-1" />

        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="relative">
        {editor.isEmpty && placeholder && (
          <p className="absolute top-3 left-4 text-sm text-nc-charcoal/30 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Editor styles */}
      <style>{`
        .rich-editor-content {
          min-height: 160px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.625;
          color: var(--color-nc-charcoal, #1c1c1c);
          outline: none;
        }
        .rich-editor-content p {
          margin-bottom: 0.5em;
        }
        .rich-editor-content p:last-child {
          margin-bottom: 0;
        }
        .rich-editor-content h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5em;
          margin-top: 0.75em;
        }
        .rich-editor-content h2:first-child {
          margin-top: 0;
        }
        .rich-editor-content ul,
        .rich-editor-content ol {
          padding-left: 1.5em;
          margin-bottom: 0.5em;
        }
        .rich-editor-content ul {
          list-style: disc;
        }
        .rich-editor-content ol {
          list-style: decimal;
        }
        .rich-editor-content li {
          margin-bottom: 0.15em;
        }
        .rich-editor-content strong {
          font-weight: 600;
        }
        .rich-editor-content em {
          font-style: italic;
        }
        .rich-editor-content blockquote {
          border-left: 3px solid var(--color-nc-green, #2f4638);
          padding-left: 1em;
          color: var(--color-nc-charcoal, #1c1c1c);
          opacity: 0.7;
          margin-bottom: 0.5em;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded-md transition-colors
        ${active ? "bg-nc-green/15 text-nc-green" : "text-nc-charcoal/50 hover:text-nc-charcoal hover:bg-nc-grey/40"}
        ${disabled ? "opacity-30 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}
