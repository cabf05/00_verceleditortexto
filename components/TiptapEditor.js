import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function TiptapEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h1>Welcome to TipTap Editor</h1>
      <p>This is a rich-text editor using <strong>TipTap</strong>.</p>
    `,
  });

  const getHTML = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      window.prompt('Copy your markup:', html);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Toolbar */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
        <button onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button style={{ marginLeft: '1rem' }} onClick={getHTML}>Export HTML</button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} style={{
        minHeight: 200,
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: 4,
      }} />
    </div>
  );
}
