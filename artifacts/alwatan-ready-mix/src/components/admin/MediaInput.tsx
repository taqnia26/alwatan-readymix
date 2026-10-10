import { useState } from 'react';
import { FolderOpen, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MediaPicker, { MediaThumb, type PickKind } from './MediaPicker';
import { mediaKind } from '@/lib/studio';
import { useLanguage } from '@/lib/i18n';

/** URL input plus library picker. Keeps manual link entry. */
export default function MediaInput({ value, onChange, kind = 'image', preview = true, testId }: {
  value: string; onChange: (v: string) => void; kind?: PickKind; preview?: boolean; testId?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const k = kind !== 'any' ? kind : value ? mediaKind(value) : 'image';
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} dir="ltr" placeholder="/api/storage/objects/... or https://" data-testid={testId} />
        <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => setOpen(true)}>
          <FolderOpen className="h-4 w-4" /><span className="hidden sm:inline">{t('اختيار', 'Pick')}</span>
        </Button>
        {value && <Button type="button" variant="ghost" size="icon" onClick={() => onChange('')} aria-label={t('إزالة', 'Clear')}><X className="h-4 w-4" /></Button>}
      </div>
      {preview && value && k !== 'file' && k !== 'pdf' && <MediaThumb url={value} kind={k} className="h-28 w-48 rounded-md border" />}
      <MediaPicker open={open} onOpenChange={setOpen} onSelect={onChange} kind={kind} />
    </div>
  );
}
