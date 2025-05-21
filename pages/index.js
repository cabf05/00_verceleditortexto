// pages/index.js

import React, { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import isHotkey from 'is-hotkey'
import { createEditor, Transforms, Editor, Element as SlateElement } from 'slate'
import { withHistory } from 'slate-history'
import { Slate, Editable, useSlate, withReact } from 'slate-react'

// ——— Constantes gerais ———
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

// ——— Valor inicial do editor ———
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
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: 'bold', bold: true },
      {
        text:
          ', or add a semantically rendered block quote in the middle of the page, like this:',
      },
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

// ——— Componente principal (cliente-only) ———
function RichTextPage() {
  // editor com React + History
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const [value, setValue] = useState(initialValue)
  const [rawInput, setRawInput] = useState('')

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  // converte HTML-like para Slate nodes
  const deserialize = html => {
    if (typeof window === 'undefined') {
      // no SSR, retorna sempre initialValue
      return initialValue
    }
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const walk = node => {
      if (node.nodeType === 3) {
        return { text: node.textContent }
      }
      const children = Array.from(node.childNodes).map(walk).flat()
      switch (node.nodeName) {
        case 'STRONG':
          return children.map(n => ({ ...n, bold: true }))
        case 'EM':
          return children.map(n => ({ ...n, italic: true }))
        case 'U':
          return children.map(n => ({ ...n, underline: true }))
        case 'CODE':
          return children.map(n => ({ ...n, code: true }))
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
        default:
          return [{ type: 'paragraph', children }]
      }
    }

    const nodes = Array.from(doc.body.childNodes).map(walk).flat()
    return nodes.length ? nodes : initialValue
  }

  // converte Slate nodes para HTML-like
  const serialize = nodes =>
    nodes
      .map(n => {
        if (SlateElement.isElement(n)) {
          const children = serialize(n.children)
          switch (n.type) {
            case 'block-quote':
              return `<blockquote>${children}</blockquote>`
            case 'heading-one':
              return `<h1>${children}</h1>`
            case 'heading-two':
              return `<h2>${children}</h2>`
            case 'numbered-list':
              return `<ol>${children}</ol>`
            case 'bulleted-list':
              return `<ul>${children}</ul>`
            case 'list-item':
              return `<li>${children}</li>`
            default:
              return `<p>${children}</p>`
          }
        } else {
          let text = n.text
          if (n.bold) text = `<strong>${text}</strong>`
          if (n.italic) text = `<em>${text}</em>`
          if (n.underline) text = `<u>${text}</u>`
          if (n.code) text = `<code>${text}</code>`
          return text
        }
      })
      .join('')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* Textarea para importar */}
      <textarea
        value={rawInput}
        onChange={e => setRawInput(e.target.value)}
        placeholder="Cole aqui seu texto HTML-like..."
        style={{
          width: '100%',
          height: 120,
          marginBottom: 8,
          fontFamily: 'monospace',
        }}
      />
      <button onClick={() => setValue(deserialize(rawInput))}>Load</button>
      <button
        onClick={() => {
          const out = serialize(value)
          window.prompt('Copy your markup:', out)
        }}
        style={{ marginLeft: 8 }}
      >
        Export
      </button>

      {/* Editor Slate */}
      <Slate editor={editor} value={value} onChange={setValue}>
        <Toolbar>
          {'bold italic underline code heading-one heading-two block-quote numbered-list bulleted-list left center right justify'
            .split(' ')
            .map(f => {
              const IconMap = {
                bold: 'B',
                italic: 'I',
                underline: 'U',
                code: '⌃',
                'heading-one': 'H1',
                'heading-two': 'H2',
                'block-quote': '❝',
                'numbered-list': '1.',
                'bulleted-list': '•',
                left: '←',
                center: '↔',
                right: '→',
                justify: '☰',
              }
              const Icon = IconMap[f]
              const ButtonComp = f.includes('-') ? BlockButton : MarkButton
              return <ButtonComp key={f} format={f} icon={Icon} />
            })}
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
          style={{
            minHeight: 200,
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: 4,
          }}
        />
      </Slate>
    </div>
  )
}

// Exporta sem SSR, apenas no cliente
export default dynamic(() => Promise.resolve(RichTextPage), { ssr: false })

// ——— Utilitários de formatação ———

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  )
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  })

  const newProps = TEXT_ALIGN_TYPES.includes(format)
    ? { align: isActive ? undefined : format }
    : { type: isActive ? 'paragraph' : isList ? 'list-item' : format }

  Transforms.setNodes(editor, newProps)

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, { type: format, children: [] })
  }
}

const toggleMark = (editor, format) => {
  const isActive = Editor.marks(editor)?.[format] === true
  isActive
    ? Editor.removeMark(editor, format)
    : Editor.addMark(editor, format, true)
}

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (blockType === 'align' ? n.align === format : n.type === format),
    })
  )
  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

// ——— Componentes de renderização ———

const Element = ({ attributes, children, element }) => {
  const style = element.align ? { textAlign: element.align } : {}
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      )
    case 'heading-one':
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.code) children = <code>{children}</code>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.underline) children = <u>{children}</u>
  return <span {...attributes}>{children}</span>
}

// ——— Botões e Toolbar ———

const Button = ({ active, ...props }) => (
  <button
    style={{
      marginRight: 4,
      padding: '4px 8px',
      background: active ? '#eee' : 'white',
      border: '1px solid #ccc',
      borderRadius: 4,
      cursor: 'pointer',
    }}
    {...props}
  />
)

const Icon = ({ children }) => <span style={{ userSelect: 'none' }}>{children}</span>

const Toolbar = ({ children }) => (
  <div
    style={{
      borderBottom: '2px solid #eee',
      marginBottom: 8,
      paddingBottom: 4,
      display: 'flex',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
)

const BlockButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
      )}
      onMouseDown={e => {
        e.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const MarkButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}
