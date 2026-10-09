import { useMemo, useState } from 'react';
import { AlertTriangle, FileEdit, Plus, Search } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useListPageContent, useUpdatePageContent, getListPageContentQueryKey, type PageContent } from '@workspace/api-client-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { PageHead } from '@/components/admin/studio-ui';

export default function AdminContent() {
  const { t, isRtl } = useLanguage();
  const { data: content, isLoading, error, refetch } = useListPageContent();
  const update = useUpdatePageContent();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState('all');
  const [item, setItem] = useState<PageContent | null>(null);
  const [ar, setAr] = useState('');
  const [en, setEn] = useState('');
  const pages = useMemo(() => Array.from(new Set((content ?? []).map((c) => c.pageSlug))), [content]);
  const rows = useMemo(() => (content ?? []).filter((c) => (page === 'all' || c.pageSlug === page) && (!q || `${c.pageSlug} ${c.sectionKey} ${c.fieldKey} ${c.valueAr} ${c.valueEn}`.toLowerCase().includes(q.toLowerCase()))), [content, q, page]);

  const open = (c: PageContent) => { setItem(c); setAr(c.valueAr); setEn(c.valueEn); };
  const save = () => {
    if (!item) return;
    update.mutate({ id: item.id, data: { valueAr: ar, valueEn: en } }, {
      onSuccess: () => { void qc.invalidateQueries({ queryKey: getListPageContentQueryKey() }); void qc.invalidateQueries({ predicate: query => String(query.queryKey[0]).startsWith('/api/public/') }); setItem(null); toast({ title: t('تم الحفظ', 'Saved') }); },
      onError: () => toast({ title: t('فشل الحفظ', 'Save failed'), variant: 'destructive' }),
    });
  };
  const long = (v: string) => v.length > 50;

  return (
    <div className="space-y-5">
      <PageHead title={t('نصوص المحتوى', 'Content text')} desc={t('تعديل النصوص القائمة. استخدم منشئ الصفحات لإضافة صفحات وأقسام جديدة.', 'Edit existing text. Use the page builder to add pages and sections.')}
        actions={<Button asChild className="gap-2"><Link href="/admin/pages"><Plus className="h-4 w-4" />{t('إنشاء صفحة أو قسم', 'Create page or section')}</Link></Button>} />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('بحث...', 'Search...')} className="ps-9 bg-card" data-testid="input-content-search" /></div>
        <Select value={page} onValueChange={setPage}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('كل الصفحات', 'All pages')}</SelectItem>{pages.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      </div>
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="font-bold">{t('تعذر تحميل المحتوى', 'Could not load content')}</p><Button onClick={() => void refetch()}>{t('إعادة المحاولة', 'Retry')}</Button></div>
      ) : isLoading ? <Skeleton className="h-64" /> : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50"><TableRow>
                <TableHead>{t('الصفحة / القسم', 'Page / section')}</TableHead><TableHead>{t('العربي', 'Arabic')}</TableHead><TableHead>{t('الإنجليزي', 'English')}</TableHead><TableHead className="w-16" />
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm"><div className="font-bold text-secondary">{c.pageSlug}</div><div className="text-xs text-muted-foreground" dir="ltr">{c.sectionKey} / {c.fieldKey}</div></TableCell>
                    <TableCell className="max-w-xs truncate text-sm" dir="rtl">{c.valueAr}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm" dir="ltr">{c.valueEn}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="text-primary" onClick={() => open(c)} aria-label={t('تعديل', 'Edit')} data-testid={`button-edit-content-${c.id}`}><FileEdit className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">{t('لا نتائج', 'No results')}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <Dialog open={!!item} onOpenChange={(o) => !o && setItem(null)}>
        <DialogContent className="max-w-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{t('تعديل المحتوى', 'Edit content')}</DialogTitle><DialogDescription dir="ltr">{item?.pageSlug} / {item?.sectionKey} / {item?.fieldKey}</DialogDescription></DialogHeader>
          {item && <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-sm font-bold">{t('العربي', 'Arabic')}</label>{item.contentType === 'richtext' || long(ar) ? <Textarea rows={6} value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" /> : <Input value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />}</div>
            <div className="space-y-1.5"><label className="text-sm font-bold">{t('الإنجليزي', 'English')}</label>{item.contentType === 'richtext' || long(en) ? <Textarea rows={6} value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" /> : <Input value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" />}</div>
            <Button className="w-full" onClick={save} disabled={update.isPending} data-testid="button-save-content">{t('حفظ', 'Save')}</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
