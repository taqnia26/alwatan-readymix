import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Send } from 'lucide-react';
import {
  useListAdminChats, getListAdminChatsQueryKey, useGetAdminChat, getGetAdminChatQueryKey, useReplyAdminChat, useMarkAdminChatRead, type ChatConversation,
} from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';
import { useAdminAccess } from '@/hooks/use-admin-access';

const when = (iso: string, lang: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' });
};

export default function AdminChats() {
  const { t, language } = useLanguage();
  const canEdit = useAdminAccess().canEdit('chats');
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const list = useListAdminChats({ offset }, { query: { queryKey: getListAdminChatsQueryKey({ offset }), refetchInterval: 5000 } });
  const detail = useGetAdminChat(selected, { query: { queryKey: getGetAdminChatQueryKey(selected), enabled: selected > 0, refetchInterval: 3000 } });
  const reply = useReplyAdminChat();
  const mark = useMarkAdminChatRead();
  const markRef = useRef(mark.mutate);
  markRef.current = mark.mutate;
  const qcRef = useRef(qc);
  qcRef.current = qc;

  const items: ChatConversation[] = list.data ?? [];
  const msgs = detail.data?.messages ?? [];
  const conv = detail.data?.conversation ?? items.find((c) => c.id === selected) ?? null;
  const newestId = msgs.length ? msgs[msgs.length - 1].id : 0;
  const newestVisitor = [...msgs].reverse().find((m) => m.sender === 'visitor')?.id ?? 0;

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [newestId, selected]);
  useEffect(() => {
    if (selected <= 0 || !newestVisitor) return;
    markRef.current({ id: selected }, { onSuccess: () => qcRef.current.invalidateQueries({ queryKey: ['/api/admin/chats'] }) });
  }, [selected, newestVisitor]);

  const choose = (id: number) => { setSelected(id); setDraft(''); setError(''); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || reply.isPending || selected <= 0) return;
    reply.mutate({ id: selected, data: { content } }, {
      onSuccess: () => { setDraft(''); setError(''); qc.invalidateQueries({ queryKey: getGetAdminChatQueryKey(selected) }); qc.invalidateQueries({ queryKey: ['/api/admin/chats'] }); },
      onError: () => setError(t('تعذر إرسال الرد.', 'Reply failed to send.')),
    });
  };

  const retry = (r: () => void) => (
    <button type="button" data-testid="admin-chat-retry" onClick={r} className="mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold"><RefreshCw className="h-4 w-4" />{t('إعادة المحاولة', 'Retry')}</button>
  );

  return (
    <div className="grid h-[calc(100dvh-10rem)] min-h-[420px] overflow-hidden rounded-xl border bg-card md:grid-cols-[320px_1fr]">
      <aside data-testid="admin-chat-list" className={`flex min-h-0 flex-col border-e ${selected > 0 ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex-1 overflow-y-auto">
          {list.isLoading && <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>}
          {list.isError && <div className="p-6 text-center text-sm">{t('تعذر تحميل المحادثات.', 'Could not load conversations.')}<br />{retry(() => list.refetch())}</div>}
          {list.isSuccess && items.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">{offset > 0 ? t('لا مزيد من المحادثات.', 'No more conversations.') : t('لا توجد محادثات بعد. ستظهر هنا عندما يراسلكم الزوار.', 'No conversations yet. They appear here when visitors write in.')}</div>
          )}
          {items.map((c) => (
            <button key={c.id} data-testid={`admin-chat-item-${c.id}`} type="button" onClick={() => choose(c.id)} aria-current={selected === c.id}
              className={`block w-full border-b px-4 py-3 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${selected === c.id ? 'bg-primary/10' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-bold">{c.name}</span>
                {c.unreadCount > 0 && <span data-testid={`admin-chat-unread-${c.id}`} className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white" aria-label={t('غير مقروء', 'unread')}>{c.unreadCount}</span>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
              <span className="text-[11px] text-muted-foreground">{when(c.updatedAt, language)}</span>
            </button>
          ))}
        </div>
        {(offset > 0 || items.length >= 100) && (
          <div className="flex justify-between border-t p-2 text-sm font-bold">
            <button type="button" data-testid="admin-chat-prev" disabled={offset === 0} onClick={() => { setOffset(Math.max(0, offset - 100)); setSelected(0); }} className="rounded px-3 py-1 disabled:opacity-40">{t('السابق', 'Previous')}</button>
            <button type="button" data-testid="admin-chat-next" disabled={items.length < 100} onClick={() => { setOffset(offset + 100); setSelected(0); }} className="rounded px-3 py-1 disabled:opacity-40">{t('التالي', 'Next')}</button>
          </div>
        )}
      </aside>
      <section className={`min-h-0 flex-col ${selected > 0 ? 'flex' : 'hidden md:flex'}`}>
        {selected <= 0 ? (
          <div className="m-auto p-8 text-center text-sm text-muted-foreground">{t('اختر محادثة لعرضها والرد عليها.', 'Select a conversation to read and reply.')}</div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <button type="button" data-testid="admin-chat-back" onClick={() => setSelected(0)} aria-label={t('رجوع', 'Back')} className="rounded p-1 hover:bg-muted md:hidden"><ArrowLeft className="h-5 w-5 rtl:-scale-x-100" /></button>
              <div className="min-w-0">
                <div className="truncate font-bold">{conv?.name}</div>
                <div className="truncate text-xs text-muted-foreground" dir="auto">{[conv?.phone, conv?.email].filter(Boolean).join('  |  ')}</div>
              </div>
            </div>
            <div data-testid="admin-chat-messages" className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/40 p-4">
              {detail.isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}
              {detail.isError && !detail.data && <div className="text-center text-sm">{t('تعذر تحميل الرسائل.', 'Could not load messages.')}<br />{retry(() => detail.refetch())}</div>}
              {msgs.length >= 200 && <p className="text-center text-xs text-muted-foreground">{t('يتم عرض آخر 200 رسالة.', 'Showing the latest 200 messages.')}</p>}
              {msgs.map((m) => (
                <div key={m.id} data-testid={`admin-chat-message-${m.sender}-${m.id}`} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender === 'admin' ? 'bg-primary text-white' : 'border bg-card'}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <span className="mt-1 block text-[10px] opacity-70">{when(m.createdAt, language)}</span>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form data-testid="admin-chat-reply-form" onSubmit={submit} className="space-y-2 border-t p-3">
              {error && <p data-testid="admin-chat-error" role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
              <div className="flex items-end gap-2">
                <textarea data-testid="admin-chat-reply-input" value={draft} maxLength={2000} rows={2} onChange={(e) => setDraft(e.target.value)} disabled={!canEdit} aria-label={t('الرد', 'Reply')} placeholder={t('اكتب ردك', 'Write a reply')}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
                <button type="submit" data-testid="admin-chat-reply-submit" disabled={!canEdit || reply.isPending || !draft.trim()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white disabled:opacity-50">
                  <Send className="h-4 w-4 rtl:-scale-x-100" />{reply.isPending ? t('جارٍ الإرسال', 'Sending') : t('إرسال', 'Send')}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
