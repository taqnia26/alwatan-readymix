import DOMPurify from 'dompurify';

export default function RichText({ value, className = '' }: { value: string; className?: string }) {
  if (!value) return null;
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return <div className={`prose max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }} />;
  }
  return <div className={`space-y-4 leading-loose ${className}`}>{value.split(/\n{1,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>;
}
