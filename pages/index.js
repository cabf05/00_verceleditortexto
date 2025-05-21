import dynamic from 'next/dynamic'

// só roda no cliente, evita SSR quebrar o initialValue
const RichTextEditor = dynamic(
  () => import('../components/RichTextEditor'),
  { ssr: false }
)

export default function Page() {
  return <RichTextEditor />
}
