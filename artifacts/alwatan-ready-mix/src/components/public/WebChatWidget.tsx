import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MessagesSquare, X, Send, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetVisitorChat, getGetVisitorChatQueryKey, useStartVisitorChat, useSendVisitorMessage } from '@workspace/api-client-react';
import { useLanguage } from '@/lib/i18n';

const fmt = (iso: string, lang: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
};
const field = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export default function WebChatWidget() {
  const { t, language } = useLanguage();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const q = useGetVisitorChat({ query: { queryKey: getGetVisitorChatQueryKey(), enabled: open, refetchInterval: 3000 } });
  const start = useStartVisitorChat();
  const send = useSendVisitorMessage();
  const sending = start.isPending || send.isPending;
  const conv = q.data?.conversation ?? null;
  const messages = q.data?.messages ?? [];
  const lastId = messages.length ? messages[messages.length - 1].id : 0;

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [lastId, open, conv?.id]);
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>('textarea, input');
    el?.focus();
  }, [open, q.isSuccess, conv?.id]);

  const close = () => { setOpen(false); btnRef.current?.focus(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button, input, textarea, [href]') ?? []).filter((x) => !(x as HTMLButtonElement).disabled);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const done = () => { setDraft(''); setError(''); qc.invalidateQueries({ queryKey: getGetVisitorChatQueryKey() }); };
  const fail = () => setError(t('تعذر الإرسال. حاول مرة أخرى.', 'Could not send. Please try again.'));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const content = draft.trim();
    if (!content) return;
    if (!conv) {
      const n = name.trim();
      if (!n) { setError(t('الاسم مطلوب.', 'Name is required.')); return; }
      start.mutate({ data: { name: n, ...(phone.trim() && { phone: phone.trim() }), ...(email.trim() && { email: email.trim() }), content } }, { onSuccess: done, onError: fail });
    } else {
      send.mutate({ data: { content } }, { onSuccess: done, onError: fail });
    }
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => (open ? close() : setOpen(true))} aria-label={t('محادثة مباشرة على الموقع', 'Open web chat')} aria-haspopup="dialog" aria-expanded={open} data-testid="button-webchat"
        className="fixed bottom-[5.5rem] end-5 z-[60] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_35px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/35">
        {open ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
      </button>
      {open && (
        <div ref={panelRef} data-testid="webchat-dialog" role="dialog" aria-modal="false" aria-label={t('محادثة مع الوطن', 'Chat with AlWatan')} onKeyDown={onKey}
          className="fixed inset-x-3 bottom-[9.5rem] end-3 z-[70] flex max-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl sm:inset-x-auto sm:end-5 sm:w-[380px]">
          <div className="flex items-center justify-between bg-secondary px-4 py-3 text-secondary-foreground">
            <div className="font-bold">{t('محادثة مع فريق الوطن', 'Chat with the AlWatan team')}</div>
            <button type="button" data-testid="webchat-close" onClick={close} aria-label={t('إغلاق', 'Close')} className="rounded p-1 hover:bg-white/20"><X className="h-4 w-4" /></button>
          </div>
          <div data-testid="webchat-messages" className="min-h-[140px] flex-1 space-y-2 overflow-y-auto bg-muted/40 p-3" aria-live="polite">
            {q.isLoading && <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>}
            {q.isError && !q.data && (
              <div className="py-6 text-center text-sm">
                <p className="mb-3">{t('تعذر تحميل المحادثة.', 'Could not load the chat.')}</p>
                <button type="button" data-testid="webchat-retry" onClick={() => q.refetch()} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-bold"><RefreshCw className="h-4 w-4" />{t('إعادة المحاولة', 'Retry')}</button>
              </div>
            )}
            {q.isSuccess && !conv && <p className="py-4 text-center text-sm text-muted-foreground">{t('اكتب اسمك ورسالتك وسيرد عليك فريقنا هنا.', 'Leave your name and message and our team will reply here.')}</p>}
            {messages.map((m) => (
              <div key={m.id} data-testid={`webchat-message-${m.sender}-${m.id}`} className={`flex ${m.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender === 'visitor' ? 'bg-primary text-white' : 'border bg-card'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <span className="mt-1 block text-[10px] opacity-70">{fmt(m.createdAt, language)}</span>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {(q.isSuccess || conv) && (
            <form data-testid="webchat-form" onSubmit={submit} className="space-y-2 border-t p-3">
              {!conv && (
                <>
                  <input data-testid="webchat-input-name" className={field} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={t('الاسم (مطلوب)', 'Name (required)')} aria-label={t('الاسم', 'Name')} autoComplete="name" />
                  <div className="grid grid-cols-2 gap-2">
                    <input data-testid="webchat-input-phone" className={field} value={phone} maxLength={50} onChange={(e) => setPhone(e.target.value)} placeholder={t('الجوال (اختياري)', 'Phone (optional)')} aria-label={t('الجوال', 'Phone')} autoComplete="tel" dir="ltr" />
                    <input data-testid="webchat-input-email" className={field} type="email" value={email} maxLength={200} onChange={(e) => setEmail(e.target.value)} placeholder={t('البريد (اختياري)', 'Email (optional)')} aria-label={t('البريد', 'Email')} autoComplete="email" dir="ltr" />
                  </div>
                </>
              )}
              {error && <p data-testid="webchat-error" role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
              <div className="flex items-end gap-2">
                <textarea data-testid="webchat-input-message" className={`${field} max-h-28 resize-none`} rows={2} value={draft} maxLength={2000} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
                  placeholder={t('اكتب رسالتك', 'Type your message')} aria-label={t('الرسالة', 'Message')} />
                <button type="submit" data-testid="webchat-submit" disabled={sending || !draft.trim()} aria-label={t('إرسال', 'Send')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white disabled:opacity-50">
                  {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
