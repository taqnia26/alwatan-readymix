import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAdminStudio, useSaveStudioDraft, usePublishStudio,
  getGetAdminStudioQueryKey, getGetPublicStudioQueryKey,
  type StudioConfig, type StudioState,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';

interface Editor {
  config: StudioConfig | null;
  state: StudioState | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  update: (fn: (c: StudioConfig) => StudioConfig) => void;
  dirty: boolean;
  unpublished: boolean;
  saving: boolean;
  publishing: boolean;
  save: () => Promise<boolean>;
  publish: () => Promise<boolean>;
  discard: () => void;
}
const Ctx = createContext<Editor | null>(null);

export function StudioEditorProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const q = useGetAdminStudio();
  const saveM = useSaveStudioDraft();
  const pubM = usePublishStudio();
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [baseline, setBaseline] = useState('');

  useEffect(() => {
    if (q.data && config === null) {
      setConfig(q.data.draft);
      setBaseline(JSON.stringify(q.data.draft));
    }
  }, [q.data, config]);

  const dirty = config !== null && JSON.stringify(config) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const update = useCallback((fn: (c: StudioConfig) => StudioConfig) => setConfig((c) => (c ? fn(c) : c)), []);

  const unpublished = useMemo(() => {
    if (!q.data) return false;
    return dirty || JSON.stringify(q.data.draft) !== JSON.stringify(q.data.published);
  }, [q.data, dirty]);

  const save = async () => {
    if (!config) return false;
    try {
      const s = await saveM.mutateAsync({ data: { config } });
      setConfig(current => JSON.stringify(current) === JSON.stringify(config) ? s.draft : current);
      setBaseline(JSON.stringify(s.draft));
      qc.setQueryData(getGetAdminStudioQueryKey(), s);
      toast({ title: t('تم حفظ المسودة. الموقع العام لم يتغير بعد.', 'Draft saved. The public site is unchanged.') });
      return true;
    } catch (e) {
      toast({ title: t('فشل حفظ المسودة. تعديلاتك محفوظة هنا.', 'Saving failed. Your edits are kept here.'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
      return false;
    }
  };

  const publish = async () => {
    if (dirty && !(await save())) return false;
    try {
      const s = await pubM.mutateAsync();
      qc.setQueryData(getGetAdminStudioQueryKey(), s);
      await qc.invalidateQueries({ queryKey: getGetPublicStudioQueryKey() });
      await qc.invalidateQueries({ queryKey: ['/api/settings/public'] });
      await qc.invalidateQueries({ queryKey: ['/api/public/home'] });
      toast({ title: t('تم النشر. التغييرات ظاهرة الآن للزوار.', 'Published. Changes are now live.') });
      return true;
    } catch (e) {
      toast({ title: t('فشل النشر', 'Publish failed'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
      return false;
    }
  };

  const discard = () => { if (q.data) setConfig(q.data.draft); if (q.data) setBaseline(JSON.stringify(q.data.draft)); };

  const value: Editor = {
    config, state: q.data, isLoading: q.isLoading || (!!q.data && config === null), error: q.error,
    refetch: () => { void q.refetch(); }, update, dirty, unpublished,
    saving: saveM.isPending, publishing: pubM.isPending, save, publish, discard,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudioEditor() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudioEditor must be used inside StudioEditorProvider');
  return v;
}
