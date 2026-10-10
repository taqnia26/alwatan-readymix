import AdminPages from './AdminPages';

// Text editing uses the same draft, page sections, preview, and publish flow.
// The previous legacy rows were not consumed by the site's studio pages.
export default function AdminContent() {
  return <AdminPages initialTab="pages" />;
}
