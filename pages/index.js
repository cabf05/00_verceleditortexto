import dynamic from 'next/dynamic';

// Import the editor component dynamically to disable SSR
const TiptapEditor = dynamic(
  () => import('../components/TiptapEditor'),
  { ssr: false }
);

export default function Home() {
  return <TiptapEditor />;
}
