import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function TiptapEditor() {
  // estado para o conteúdo bruto em HTML
  const [rawInput, setRawInput] = useState(`
<h1>Welcome to TipTap Editor</h1>
<p>This is a rich-text editor using <strong>TipTap</strong>.</p>
`);

  // inicializa o editor com StarterKit e conteúdo inicial
  const editor = useEditor({
    extensions: [StarterKit],
    content: rawInput,
    onCreate({ editor }) {
      // já carrega o conteúdo
      editor.commands.setContent(rawInput);
    },
  });

  // função para atualizar o editor com novo HTML
  const loadContent = useCallback(() => {
    if (editor) {
      editor.commands.setContent(rawInput);
    }
  }, [editor, rawInput]);

  // exporta o HTML atual
  const exportHTML = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      window.prompt('Copy your markup:', html);
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Textarea para importar HTML */}
      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder="Cole aqui seu HTML..."
        style={{ width: '100%', height: 120, fontFamily: 'monospace', marginBottom: 8 }}
      />
      <button onClick={loadContent}>Load HTML</button>
      <button onClick={exportHTML} style={{ marginLeft: 8 }}>Export HTML</button>

      {/* Toolbar */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
        <button onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
      </div>

      {/* Conteúdo do Editor */}
      <EditorContent
        editor={editor}
        style={{
          minHeight: 200,
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: 4,
        }}
      />
    </div>
  );
}
