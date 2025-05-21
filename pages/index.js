// pages/index.js

import React, { useCallback, useMemo, useState } from 'react'
import isHotkey from 'is-hotkey'
import {
  Editor,
  Element as SlateElement,
  Transforms,
  createEditor,
} from 'slate'
import { withHistory } from 'slate-history'
import {
  Slate,
  Editable,
  useSlate,
  withReact,
} from 'slate-react'

// atalhos, listas e alinhamentos
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
  const [rawInput, setRawInput] = useState('') // texto bruto para importar

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  // converte HTML-like -> nós Slate
  const deserialize = html => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const { body } = doc

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

    const nodes = Array.from(body.childNodes)
      .map(walk)
      .flat()

    return nodes.length > 0 ? nodes : initialValue
  }

  // converte nós Slate -> HTML-like
  const serialize = nodes => {
    return nodes
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
            case 'bulleted-list':
              return `<ul>${children}</ul>`
            case 'numbered-list':
              return `<ol>${children}</ol>`
            case 'list-item':
              return `<li>${children}</li>`
            case 'paragraph':
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
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {/* importação */}
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
          window.prompt('Copy your markup:', out)
        }}
        style={{ marginLeft: 8 }}
      >
        Export
      </button>

      {/* editor Slate */}
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

// — utilitários Slate —

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
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor
  if (!selection) return false
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => {
        if (!Editor.isEditor(n) && SlateElement.isElement(n)) {
          return blockType === 'align'
            ? n.align === format
            : n.type === format
        }
        return false
      },
    })
  )
  return !!match
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

// — componentes de renderização —

const Element = ({ attributes, children, element }) => {
  const style = element.align ? { textAlign: element.align } : {}
  switch (element.type) {
    case 'block-quote':
      return <blockquote style={style} {...attributes}>{children}</blockquote>
    case 'heading-one':
      return <h1 style={style} {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 style={style} {...attributes}>{children}</h2>
    case 'bulleted-list':
      return <ul style={style} {...attributes}>{children}</ul>
    case 'numbered-list':
      return <ol style={style} {...attributes}>{children}</ol>
    case 'list-item':
      return <li style={style} {...attributes}>{children}</li>
    default:
      return <p style={style} {...attributes}>{children}</p>
  }
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) children = <strong>{children}</strong>
  if (leaf.code) children = <code>{children}</code>
  if (leaf.italic) children = <em>{children}</em>
  if (leaf.underline) children = <u>{children}</u>
  return <span {...attributes}>{children}</span>
}

// — botões e toolbar —

const Button = ({ active, ...props }) => (
  <button
    style={{
      marginRight: 4,
      padding: '4px 8px',
      background: active ? '#ddd' : 'white',
      border: '1px solid #ccc',
      cursor: 'pointer',
    }}
    {...props}
  />
)

const Icon = ({ children }) => <span>{children}</span>

const Toolbar = ({ children }) => (
  <div style={{ borderBottom: '2px solid #eee', marginBottom: 8, paddingBottom: 4 }}>
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

// — valor inicial — 

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
