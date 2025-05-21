import dynamic from 'next/dynamic';
import { useState } from 'react';

// Seleção de editor: 'tiptap' ou 'ckeditor'
export default function Home() {
  const [editorType, setEditorType] = useState('tiptap');
  const EditorComponent = dynamic(
    () =>
      editorType === 'tiptap'
        ? import('../components/TiptapEditor')
        : import('../components/CkeditorEditor'),
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
        <option value="ckeditor">CKEditor 5</option>
      </select>
      <EditorComponent />
    </div>
  );
}
