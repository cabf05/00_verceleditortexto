import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export function QuillEditor() {
  const [rawInput, setRawInput] = useState(
    '<h1>Welcome to React Quill</h1><p>This is a rich-text editor using <strong>Quill</strong>.</p>'
  );
  const quillRef = useRef();

  // carrega conteúdo no editor
  const loadContent = () => {
    const editor = quillRef.current.getEditor();
    editor.root.innerHTML = rawInput;
  };

  // exporta HTML atual
  const exportHTML = () => {
    const editor = quillRef.current.getEditor();
    window.prompt('Copy your markup:', editor.root.innerHTML);
  };

  useEffect(() => {
    // inicializa com rawInput
    if (quillRef.current) loadContent();
  }, [quillRef]);

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
        <ReactQuill
          ref={quillRef}
          theme="snow"
          modules={{ toolbar: [['bold', 'italic', 'underline', 'code'], [{ header: [1, 2, false] }], ['blockquote', 'list', 'bullet'], ['link', 'image']] }}
          formats={[ 'header', 'bold', 'italic', 'underline', 'code', 'blockquote', 'list', 'bullet', 'link', 'image' ]}
          style={{ height: 300 }}
        />
      </div>
    </div>
  );
}
