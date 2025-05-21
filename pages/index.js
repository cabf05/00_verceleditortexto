import isHotkey from 'is-hotkey'
import React, { useCallback, useMemo, useState } from 'react'
import { Editor, Element as SlateElement, Transforms, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, Slate, useSlate, withReact } from 'slate-react'

// atalhos, tipos de lista e alinhamento (inalterados)
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

export default function RichTextPage() {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [value, setValue] = useState(initialValue)
  const [rawInput, setRawInput] = useState('')   // para textarea de import

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  // import: converte HTML-like pra Slate nodes
  const deserialize = html => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const { body } = doc

    const walk = node => {
      // texto puro
      if (node.nodeType === 3) {
        return { text: node.textContent }
      }

      // elementos de marcação
      const children = Array.from(node.childNodes).map(walk).flat()

      switch (node.nodeName) {
        case 'STRONG':
          return children.map(n => ({ ...n, bold: true }))
        case 'EM':
          return children.map(n => ({ ...n, italic: true }))
        case 'U':
          return children.map(n => ({ ...n, underline: true }))
        case 'CODE':
        case 'DIV':
          return [{ type: 'code-block', children }]
        case 'BLOCKQUOTE':
          return [{ type: 'block-quote', children }]
        case 'H1':
          return [{ type: 'heading-one', children }]
        case 'H2':
          return [{ type: 'heading-two', children }]
        case 'UL':
          return [{ type: 'bulleted-list', children }]
        case 'OL':
          return [{ type: 'numbered-list', children }]
        case 'LI':
          return [{ type: 'list-item', children }]
        case 'P':
        default:
          return children.length > 0
            ? [{ type: 'paragraph', children }]
            : []
      }
    }

    // percorre cada bloco de body
    const nodes = Array.from(body.childNodes)
      .map(walk)
      .flat()

    // garantir pelo menos um parágrafo
    return nodes.length > 0 ? nodes : initialValue
  }

  // export: converte Slate nodes pra HTML-like
  const serialize = nodes => {
    return nodes
      .map(n => {
        if (SlateElement.isElement(n)) {
          const children = serialize(n.children)
          switch (n.type) {
            case 'block-quote':     return `<blockquote>${children}</blockquote>`
            case 'bulleted-list':   return `<ul>${children}</ul>`
            case 'numbered-list':   return `<ol>${children}</ol>`
            case 'list-item':       return `<li>${children}</li>`
            case 'heading-one':     return `<h1>${children}</h1>`
            case 'heading-two':     return `<h2>${children}</h2>`
            case 'code-block':      return `<div>${children}</div>`
            case 'paragraph':
            default:                return `<p>${children}</p>`
          }
        }
        // leaf
        let text = n.text
        if (n.bold)      text = `<strong>${text}</strong>`
        if (n.italic)    text = `<em>${text}</em>`
        if (n.underline) text = `<u>${text}</u>`
        if (n.code)      text = `<code>${text}</code>`
        return text
      })
      .join('')
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Área de importação */}
      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder="Cole aqui seu texto HTML-like..."
        style={{ width: '100%', height: 120, marginBottom: 8 }}
      />

      <button onClick={() => setValue(deserialize(rawInput))}>
        Load
      </button>
      <button
        onClick={() => {
          const out = serialize(value)
          // você pode exibir num alert, copiar pra área, etc.
          window.prompt('Copy your markup:', out)
        }}
        style={{ marginLeft: 8 }}
      >
        Export
      </button>

      {/* Editor Slate */}
      <Slate editor={editor} value={value} onChange={newVal => setValue(newVal)}>
        <Toolbar>
          <MarkButton format="bold" icon="B" />
          <MarkButton format="italic" icon="I" />
          <MarkButton format="underline" icon="U" />
          <MarkButton format="code" icon="⌃" />
          <BlockButton format="heading-one" icon="H1" />
          <BlockButton format="heading-two" icon="H2" />
          <BlockButton format="block-quote" icon="❝" />
          <BlockButton format="numbered-list" icon="1." />
          <BlockButton format="bulleted-list" icon="•" />
          <BlockButton format="left" icon="←" />
          <BlockButton format="center" icon="↔" />
          <BlockButton format="right" icon="→" />
          <BlockButton format="justify" icon="☰" />
        </Toolbar>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Digite aqui…"
          spellCheck
          autoFocus
          onKeyDown={event => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event)) {
                event.preventDefault()
                toggleMark(editor, HOTKEYS[hotkey])
              }
            }
          }}
          style={{ minHeight: 200, padding: '1rem', border: '1px solid #ddd' }}
        />
      </Slate>
    </div>
  )
}

// ——— resto do código (toggleMark, toggleBlock, isBlockActive, isMarkActive,
// Element, Leaf, Buttons, Toolbar, initialValue) permanece idêntico ao exemplo anterior.
