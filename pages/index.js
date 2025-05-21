// pages/index.js

import dynamic from 'next/dynamic'

// carrega só no cliente, sem SSR
const RichTextEditor = dynamic(
  () => import('../components/RichTextEditor'),
  { ssr: false }
)

export default function Page() {
  return <RichTextEditor />
}
