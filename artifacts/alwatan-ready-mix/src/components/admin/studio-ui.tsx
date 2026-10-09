import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Trash2, Save, UploadCloud, Undo2, AlertTriangle, Loader2, ExternalLink, CircleDot } from 'lucide-react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/lib/i18n';
import { useStudioEditor } from '@/hooks/use-studio-editor';
import MediaInput from './MediaInput';
import type { PickKind } from './MediaPicker';

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[13px] font-bold text-secondary">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Txt({ label, value, onChange, dir, multiline, rows = 3, hint, placeholder, max, testId }: {
  label: string; value: string; onChange: (v: string) => void; dir?: 'rtl' | 'ltr'; multiline?: boolean; rows?: number; hint?: string; placeholder?: string; max?: number; testId?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline
        ? <Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} dir={dir} rows={rows} maxLength={max} placeholder={placeholder} data-testid={testId} />
        : <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} dir={dir} maxLength={max} placeholder={placeholder} data-testid={testId} />}
    </Field>
  );
}

export function Bi({ label, ar, en, onAr, onEn, multiline, rows, max, testId }: {
  label: string; ar: string; en: string; onAr: (v: string) => void; onEn: (v: string) => void; multiline?: boolean; rows?: number; max?: number; testId?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Txt label={`${label} - ${t('عربي', 'Arabic')}`} value={ar} onChange={onAr} dir="rtl" multiline={multiline} rows={rows} max={max} testId={testId && `${testId}-ar`} />
      <Txt label={`${label} - ${t('إنجليزي', 'English')}`} value={en} onChange={onEn} dir="ltr" multiline={multiline} rows={rows} max={max} testId={testId && `${testId}-en`} />
    </div>
  );
}

export function Media({ label, value, onChange, kind = 'image' }: { label: string; value: string; onChange: (v: string) => void; kind?: PickKind }) {
  return <Field label={label}><MediaInput value={value} onChange={onChange} kind={kind} /></Field>;
}

export function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testId} />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function ConfirmDelete({ onConfirm, title, children }: { onConfirm: () => void; title?: string; children: (open: () => void) => ReactNode }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      {children(() => setOpen(true))}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title ?? t('حذف هذا العنصر؟', 'Remove this item?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('يُحذف من المسودة فقط، ولا يظهر التغيير للزوار قبل النشر. يمكنك التراجع بزر "تجاهل التعديلات" قبل الحفظ.', 'It is removed from the draft only; visitors see no change until you publish. Use "Discard changes" to undo before saving.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onConfirm}>{t('حذف', 'Remove')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RowControls({ index, count, onMove, onRemove, removeTitle }: { index: number; count: number; onMove: (d: -1 | 1) => void; onRemove: () => void; removeTitle?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => onMove(-1)} aria-label={t('أعلى', 'Move up')} data-testid={`button-move-up-${index}`}><ArrowUp className="h-4 w-4" /></Button>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={t('أسفل', 'Move down')} data-testid={`button-move-down-${index}`}><ArrowDown className="h-4 w-4" /></Button>
      <ConfirmDelete onConfirm={onRemove} title={removeTitle}>
        {(open) => <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={open} aria-label={t('حذف', 'Remove')} data-testid={`button-remove-${index}`}><Trash2 className="h-4 w-4" /></Button>}
      </ConfirmDelete>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-4 md:p-5 shadow-sm ${className}`}>{children}</div>;
}

export function PageHead({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-secondary">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{desc}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StudioBar() {
  const { t } = useLanguage();
  const e = useStudioEditor();
  const [confirmPub, setConfirmPub] = useState(false);
  const status = e.dirty ? t('تعديلات غير محفوظة', 'Unsaved changes') : e.unpublished ? t('مسودة محفوظة لم تُنشر', 'Draft saved, not published') : t('منشور ومحدّث', 'Live and up to date');
  const tone = e.dirty ? 'bg-amber-100 text-amber-900 border-amber-300' : e.unpublished ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300';
  return (
    <div className="sticky top-0 z-20 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-5 px-4 md:px-8 py-3 bg-background/90 backdrop-blur border-b flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone}`} data-testid="status-studio"><CircleDot className="h-3 w-3" />{status}</span>
      {e.state?.publishedAt && <span className="hidden md:inline text-xs text-muted-foreground">{t('آخر نشر', 'Last published')}: {new Date(e.state.publishedAt).toLocaleString()}</span>}
      <div className="ms-auto flex flex-wrap items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary px-2"><ExternalLink className="h-3.5 w-3.5" />{t('الموقع', 'Site')}</Link>
        <Button variant="ghost" size="sm" onClick={e.discard} disabled={!e.dirty || e.saving} className="gap-1.5" data-testid="button-discard"><Undo2 className="h-4 w-4" />{t('تجاهل التعديلات', 'Discard changes')}</Button>
        <Button variant="outline" size="sm" onClick={() => void e.save()} disabled={!e.dirty || e.saving} className="gap-1.5" data-testid="button-save-draft">
          {e.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t('حفظ المسودة', 'Save draft')}
        </Button>
        <Button size="sm" onClick={() => setConfirmPub(true)} disabled={!e.unpublished || e.publishing || e.saving} className="gap-1.5" data-testid="button-publish">
          {e.publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{t('نشر', 'Publish')}
        </Button>
      </div>
      <AlertDialog open={confirmPub} onOpenChange={setConfirmPub}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('نشر التغييرات للزوار؟', 'Publish changes to visitors?')}</AlertDialogTitle>
            <AlertDialogDescription>{e.dirty ? t('سيتم حفظ تعديلاتك الحالية أولا ثم نشر المسودة كاملة على الموقع العام.', 'Your pending edits will be saved first, then the entire draft goes live.') : t('سيتم نشر المسودة كاملة على الموقع العام.', 'The entire draft will go live.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void e.publish()} data-testid="button-confirm-publish">{t('نشر الآن', 'Publish now')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Wraps studio pages: handles loading/error and renders the bar. */
export function StudioGate({ children }: { children: (cfg: NonNullable<ReturnType<typeof useStudioEditor>['config']>) => ReactNode }) {
  const { t } = useLanguage();
  const e = useStudioEditor();
  if (e.isLoading) return <div className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-64" /><Skeleton className="h-40" /></div>;
  if (e.error || !e.config) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <p className="font-bold">{t('تعذر تحميل إعدادات الموقع', 'Could not load site studio')}</p>
        <p className="text-sm text-muted-foreground">{e.error instanceof Error ? e.error.message : ''}</p>
        <Button onClick={e.refetch}>{t('إعادة المحاولة', 'Retry')}</Button>
      </div>
    );
  }
  return <><StudioBar />{children(e.config)}</>;
}
