// components/RichTextEditor.js

import React, { useCallback, useMemo, useState } from 'react'
import isHotkey from 'is-hotkey'
import { createEditor, Transforms, Editor, Element as SlateElement } from 'slate'
import { withHistory } from 'slate-history'
import { Slate, Editable, useSlate, withReact } from 'slate-react'

// atalhos e tipos
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

// valor inicial
const initialValue = [
  {
    type: 'paragraph',
    children: [
      { text: 'This is editable ' },
      { text: 'rich', bold: true },
      { text: ' text, ' },
      { text: 'much', italic: true },
      { text: ' better than a ' },
      { text: '<textarea>', code: true },
      { text: '!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: "Since it's rich text, you can do things like turn a selection of text " },
      { text: 'bold', bold: true },
      { text: ', or add a semantically rendered block quote in the middle of the page, like this:' },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    align: 'center',
    children: [{ text: 'Try it out for yourself!' }],
  },
]

export default function RichTextEditor() {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [value, setValue] = useState(initialValue)
  const [rawInput, setRawInput] = useState('')

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  // importa HTML-like
  const deserialize = html => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const walk = node => {
      if (node.nodeType === 3) return { text: node.textContent }
      const children = Array.from(node.childNodes).map(walk).flat()
      switch (node.nodeName) {
        case 'STRONG':   return children.map(n => ({ ...n, bold: true }))
        case 'EM':       return children.map(n => ({ ...n, italic: true }))
        case 'U':        return children.map(n => ({ ...n, underline: true }))
        case 'CODE':     return children.map(n => ({ ...n, code: true }))
        case 'BLOCKQUOTE': return [{ type: 'block-quote', children }]
        case 'H1':       return [{ type: 'heading-one', children }]
        case 'H2':       return [{ type: 'heading-two', children }]
        case 'UL':       return [{ type: 'bulleted-list', children }]
        case 'OL':       return [{ type: 'numbered-list', children }]
        case 'LI':       return [{ type: 'list-item', children }]
        default:         return [{ type: 'paragraph', children }]
      }
    }
    const nodes = Array.from(doc.body.childNodes).map(walk).flat()
    return nodes.length ? nodes : initialValue
  }

  // exporta Slate → HTML-like
  const serialize = nodes =>
    nodes.map(n => {
      if (SlateElement.isElement(n)) {
        const children = serialize(n.children)
        switch (n.type) {
          case 'block-quote':   return `<blockquote>${children}</blockquote>`
          case 'heading-one':   return `<h1>${children}</h1>`
          case 'heading-two':   return `<h2>${children}</h2>`
          case 'numbered-list': return `<ol>${children}</ol>`
          case 'bulleted-list': return `<ul>${children}</ul>`
          case 'list-item':     return `<li>${children}</li>`
          default:              return `<p>${children}</p>`
        }
      }
      let text = n.text
      if (n.bold)      text = `<strong>${text}</strong>`
      if (n.italic)    text = `<em>${text}</em>`
      if (n.underline) text = `<u>${text}</u>`
      if (n.code)      text = `<code>${text}</code>`
      return text
    }).join('')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder="Cole aqui seu texto HTML-like..."
        style={{ width: '100%', height: 120, marginBottom: 8, fontFamily: 'monospace' }}
      />
      <button onClick={() => setValue(deserialize(rawInput))}>Load</button>
      <button onClick={() => window.prompt('Copy markup:', serialize(value))} style={{ marginLeft: 8 }}>
        Export
      </button>

      <Slate editor={editor} value={value} onChange={setValue}>
        <Toolbar>
          {/* repete os botões como antes */}
          <MarkButton format="bold" icon="B" />
          {/* … todos os outros … */}
        </Toolbar>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Digite aqui…"
          spellCheck
          autoFocus
          onKeyDown={e => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, e)) {
                e.preventDefault()
                toggleMark(editor, HOTKEYS[hotkey])
              }
            }
          }}
          style={{ minHeight: 200, padding: '1rem', border: '1px solid #ddd', borderRadius: 4 }}
        />
      </Slate>
    </div>
  )
}

// … aqui entram toggleBlock, toggleMark, isBlockActive, isMarkActive,
// Element, Leaf, Button, BlockButton, MarkButton, Toolbar …
