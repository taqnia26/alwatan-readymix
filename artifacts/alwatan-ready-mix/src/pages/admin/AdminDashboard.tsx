import { useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, Eye, Users, MessageCircle, FileDown, Inbox, Mail, Package, MapPin, BookOpen } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { useGetAdminSummary, useGetSiteInsights } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { Card } from '@/components/admin/studio-ui';

const nf = new Intl.NumberFormat('en-US');
type Days = 7 | 30 | 90;

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Eye; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <div className="text-2xl font-black tabular-nums text-secondary" data-testid={`kpi-${label}`}>{nf.format(value)}</div>
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) { return <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground px-6">{children}</div>; }

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const [days, setDays] = useState<Days>(30);
  const summary = useGetAdminSummary();
  const ins = useGetSiteInsights({ days });
  const d = ins.data;
  const colors = ['hsl(145 50% 32%)', 'hsl(220 45% 15%)', 'hsl(42 100% 50%)'];
  const statusLabel = (n: string) => ({ new: t('جديد', 'New'), contacted: t('تم التواصل', 'Contacted'), closed: t('مغلق', 'Closed') } as Record<string, string>)[n] ?? n;
  const statuses = (d?.quoteStatuses ?? []).slice(0, 3);
  const timeline = (d?.timeline ?? []).map((x) => ({ ...x, label: x.date.slice(5) }));
  const hasViews = (d?.views ?? 0) > 0;
  const hasInq = timeline.some((x) => x.quotes + x.messages > 0);
  const tip = { contentStyle: { borderRadius: 8, border: '1px solid hsl(220 20% 90%)', fontFamily: 'Cairo' } };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-secondary">{t('نظرة عامة على الأداء', 'Performance overview')}</h2>
          <p className="text-sm text-muted-foreground">{t('بيانات الزيارات من نظام التتبع الداخلي للموقع.', 'Visit data comes from the site\'s first-party activity tracking.')}</p>
        </div>
        <div className="flex rounded-lg border bg-card p-0.5" role="group" aria-label="interval">
          {([7, 30, 90] as Days[]).map((v) => (
            <button key={v} onClick={() => setDays(v)} data-testid={`button-days-${v}`} className={`rounded-md px-4 py-1.5 text-sm font-bold transition ${days === v ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-secondary'}`}>{v} {t('يوم', 'd')}</button>
          ))}
        </div>
      </div>

      {ins.error ? (
        <Card className="flex items-center justify-between gap-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3 text-destructive"><AlertTriangle className="h-5 w-5" /><span className="font-bold">{t('تعذر تحميل بيانات الزيارات', 'Could not load insights')}</span></div>
          <Button variant="outline" onClick={() => ins.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button>
        </Card>
      ) : ins.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Kpi icon={Eye} label={t('مشاهدات', 'Views')} value={d.views} tone="bg-primary/10 text-primary" />
            <Kpi icon={Users} label={t('جلسات', 'Sessions')} value={d.sessions} tone="bg-secondary/10 text-secondary" />
            <Kpi icon={MessageCircle} label={t('نقرات واتساب', 'WhatsApp clicks')} value={d.whatsappClicks} tone="bg-emerald-100 text-emerald-700" />
            <Kpi icon={FileDown} label={t('تحميل الملف', 'Profile downloads')} value={d.profileDownloads} tone="bg-amber-100 text-amber-700" />
            <Kpi icon={Inbox} label={t('طلبات تسعير', 'Quotes')} value={d.quotes} tone="bg-sky-100 text-sky-700" />
            <Kpi icon={Mail} label={t('رسائل', 'Messages')} value={d.messages} tone="bg-violet-100 text-violet-700" />
          </div>
          {!hasViews && <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900" data-testid="empty-insights">{t('لا توجد زيارات مسجلة في هذه الفترة بعد. ستظهر الرسوم عند تسجيل أول زيارة.', 'No visits recorded in this period yet. Charts populate as visits are tracked.')}</div>}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <h3 className="mb-3 font-extrabold text-secondary">{t('المشاهدات اليومية', 'Daily views')}</h3>
              <div className="h-64">{hasViews ? (
                <ResponsiveContainer><AreaChart data={timeline}><defs><linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(145 50% 32%)" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(145 50% 32%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} /><Tooltip {...tip} />
                  <Area type="monotone" dataKey="views" name={t('مشاهدات', 'Views')} stroke="hsl(145 50% 32%)" strokeWidth={2.5} fill="url(#gv)" /></AreaChart></ResponsiveContainer>
              ) : <Empty>{t('لا بيانات مشاهدات', 'No view data')}</Empty>}</div>
            </Card>
            <Card>
              <h3 className="mb-3 font-extrabold text-secondary">{t('حالة طلبات التسعير', 'Quote status')}</h3>
              <div className="h-64">{statuses.some((s) => s.count > 0) ? (
                <ResponsiveContainer><PieChart><Pie data={statuses.map((s) => ({ ...s, name: statusLabel(s.name) }))} dataKey="count" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{statuses.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip {...tip} /><Legend /></PieChart></ResponsiveContainer>
              ) : <Empty>{t('لا طلبات في هذه الفترة', 'No quotes in this period')}</Empty>}</div>
            </Card>
            <Card className="lg:col-span-2">
              <h3 className="mb-3 font-extrabold text-secondary">{t('الاستفسارات', 'Inquiries')}</h3>
              <div className="h-60">{hasInq ? (
                <ResponsiveContainer><LineChart data={timeline}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 90%)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} /><Tooltip {...tip} /><Legend />
                  <Line type="monotone" dataKey="quotes" name={t('طلبات تسعير', 'Quotes')} stroke="hsl(145 50% 32%)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="messages" name={t('رسائل', 'Messages')} stroke="hsl(42 100% 45%)" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>
              ) : <Empty>{t('لا استفسارات في هذه الفترة', 'No inquiries in this period')}</Empty>}</div>
            </Card>
            <Card>
              <h3 className="mb-3 font-extrabold text-secondary">{t('أكثر الصفحات زيارة', 'Top pages')}</h3>
              <div className="h-60">{d.topPages.length ? (
                <ResponsiveContainer><BarChart data={d.topPages.slice(0, 6)} layout="vertical" margin={{ left: 8 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} orientation={language === 'ar' ? 'right' : 'left'} /><Tooltip {...tip} /><Bar dataKey="count" name={t('مشاهدات', 'Views')} fill="hsl(145 50% 32%)" radius={4} /></BarChart></ResponsiveContainer>
              ) : <Empty>{t('لا بيانات', 'No data')}</Empty>}</div>
            </Card>
          </div>
        </>
      )}

      <div>
        <h3 className="mb-3 font-extrabold text-secondary">{t('ملخص النظام', 'System summary')}</h3>
        {summary.error ? (
          <Card className="flex items-center justify-between"><span className="font-bold text-destructive">{t('تعذر تحميل الملخص', 'Could not load summary')}</span><Button variant="outline" onClick={() => summary.refetch()}>{t('إعادة المحاولة', 'Retry')}</Button></Card>
        ) : summary.isLoading ? <Skeleton className="h-28" /> : summary.data && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-3 lg:col-span-1">
              <Kpi icon={Inbox} label={t('طلبات جديدة', 'New quotes')} value={summary.data.newQuotes} tone="bg-primary/10 text-primary" />
              <Kpi icon={Inbox} label={t('إجمالي الطلبات', 'Total quotes')} value={summary.data.totalQuotes} tone="bg-secondary/10 text-secondary" />
              <Kpi icon={Package} label={t('المنتجات', 'Products')} value={summary.data.products} tone="bg-amber-100 text-amber-700" />
              <Kpi icon={BookOpen} label={t('مقالات منشورة', 'Published posts')} value={summary.data.publishedPosts} tone="bg-sky-100 text-sky-700" />
              <Kpi icon={MapPin} label={t('الفروع', 'Branches')} value={summary.data.branches} tone="bg-violet-100 text-violet-700" />
            </div>
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold text-secondary">{t('أحدث الطلبات', 'Recent quotes')}</h3><Link href="/admin/quotes" className="text-sm font-bold text-primary hover:underline">{t('عرض الكل', 'View all')}</Link></div>
              {summary.data.recentQuotes.length === 0 ? <Empty>{t('لا طلبات بعد', 'No quotes yet')}</Empty> : (
                <ul className="divide-y">{summary.data.recentQuotes.slice(0, 6).map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0"><div className="truncate font-bold text-secondary">{q.fullName}</div><div className="truncate text-xs text-muted-foreground">{q.productName} - {q.projectLocation}</div></div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold">{statusLabel(q.status)}</span>
                  </li>))}</ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
