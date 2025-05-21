import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// CKEditor imports precisam de window => dynamic
const CKEditor = dynamic(
  () => import('@ckeditor/ckeditor5-react').then(mod => mod.CKEditor),
  { ssr: false }
);
const ClassicEditor = dynamic(
  () => import('@ckeditor/ckeditor5-build-classic'),
  { ssr: false }
);

export function CkeditorEditor() {
  const [rawInput, setRawInput] = useState(
    '<h1>Welcome to CKEditor 5</h1>\n<p>This is a rich-text editor using <strong>CKEditor</strong>.</p>'
  );
  const editorRef = useRef();

  const loadContent = () => {
    if (editorRef.current) {
      editorRef.current.setData(rawInput);
    }
  };

  const exportHTML = () => {
    if (editorRef.current) {
      window.prompt('Copy your markup:', editorRef.current.getData());
    }
  };

  return (
    <div>
      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        style={{ width: '100%', height: 120, fontFamily: 'monospace' }}
      />
      <button onClick={loadContent}>Load HTML</button>
      <button onClick={exportHTML} style={{ marginLeft: 8 }}>Export HTML</button>

      <div style={{ marginTop: 16 }}>
        <CKEditor
          editor={ClassicEditor}
          data={rawInput}
          onReady={editor => {
            editorRef.current = editor;
          }}
          onChange={(event, editor) => {
            // opcional: sincronizar automaticamente
          }}
        />
      </div>
    </div>
  );
}
