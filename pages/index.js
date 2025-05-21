import dynamic from 'next/dynamic';
import { useState } from 'react';

// Escolha de editor: TipTap ou ReactQuill
export default function Home() {
  const [editorType, setEditorType] = useState('tiptap');
  const EditorComponent = dynamic(
    () =>
      editorType === 'tiptap'
        ? import('../components/TiptapEditor')
        : import('../components/QuillEditor'),
    { ssr: false }
  );

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: 'auto' }}>
      <select
        value={editorType}
        onChange={e => setEditorType(e.target.value)}
        style={{ marginBottom: 16, padding: 4 }}
      >
        <option value="tiptap">TipTap</option>
        <option value="quill">React Quill</option>
      </select>
      <EditorComponent />
    </div>
  );
}
