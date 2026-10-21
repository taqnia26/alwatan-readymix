import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import type { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { StudioEditorProvider } from '@/hooks/use-studio-editor';
import ProtectedAdminRoutes from '@/components/layout/ProtectedAdminRoutes';
import AdminPages from '@/pages/admin/AdminPages';
import About from '@/pages/public/About';
import StudioPage from '@/pages/public/StudioPage';
import { usePublicStudio } from '@/hooks/use-public-studio';
import { installStudioTransport } from './fixtures/studio';

// Only authentication/chrome and animation/upload peripherals are substituted.
// There is no production auth bypass and no mock of any CMS component or hook.
vi.mock('@/components/layout/AdminAuthGuard', () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/layout/AdminLayout', () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/admin/MediaInput', () => ({ default: () => <span>Fixture media picker</span> }));
vi.mock('@/components/public/Reveal', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/components/public/BrandEnergyLines', () => ({ default: () => null }));

let transport: ReturnType<typeof installStudioTransport>;
const clients: QueryClient[] = [];
beforeEach(() => {
  transport = installStudioTransport();
  document.head.innerHTML = '<meta name="description" content="">';
});
afterEach(() => { clients.splice(0).forEach(client => client.clear()); });

function mount(path: string, child?: ReactNode, language: 'ar' | 'en' = 'ar') {
  localStorage.setItem('app-lang', language);
  const location = memoryLocation({ path });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  clients.push(client);
  return {
    ...render(
      <QueryClientProvider client={client}>
        <LanguageProvider><Router hook={location.hook}>
          {child ?? <ProtectedAdminRoutes />}
        </Router></LanguageProvider>
      </QueryClientProvider>,
    ), client, navigate: location.navigate,
  };
}

async function openAbout() {
  const card = await screen.findByTestId('card-page-about');
  expect(card.textContent).toContain('/about');
  await userEvent.click(within(card).getByRole('button', { name: 'تحرير' }));
  expect((screen.getByTestId('input-page-slug') as HTMLInputElement).readOnly).toBe(true);
}
async function save() {
  await userEvent.click(screen.getByTestId('button-save-draft'));
  await waitFor(() => expect(screen.getByTestId('status-studio').textContent).toContain('مسودة محفوظة'));
}
async function publish() {
  await userEvent.click(screen.getByTestId('button-publish'));
  await userEvent.click(await screen.findByTestId('button-confirm-publish'));
  await waitFor(() => expect(screen.getByTestId('status-studio').textContent).toContain('منشور ومحدّث'));
}
const change = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } });

function OpenVisitor() {
  const studio = usePublicStudio();
  return <output data-testid="open-visitor-title">{studio.data?.pages.find(p => p.slug === 'about')?.titleAr}</output>;
}

describe('CMS regression journey (isolated transport)', () => {
  it('shows About in /admin/content; editor, draft preview and live /about agree only after publishing and reload', async () => {
    let admin = mount('/admin/content');
    await openAbout();
    change(screen.getByTestId('input-page-title-ar'), 'عنوان معدل من المحرر');
    change(screen.getByLabelText('وصف SEO - عربي'), 'وصف معدل');
    change(screen.getAllByLabelText('العنوان - عربي', { selector: 'input' })[0], 'قصة معدلة');
    change(screen.getAllByLabelText('النص - عربي')[0], '<p>محتوى <strong>معدل</strong></p>');
    await userEvent.click(screen.getByTestId('button-preview-page'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'عنوان معدل من المحرر' })).toBeTruthy();
    expect(within(dialog).getByRole('heading', { name: 'قصة معدلة' })).toBeTruthy();
    expect(dialog.querySelector('strong')?.textContent).toBe('معدل');
    expect(dialog.textContent).toContain('وصف معدل');
    expect(within(dialog).queryByText('قسم مخفي')).toBeNull();
    expect(within(dialog).getByRole('link', { name: 'اطلب عرضًا' }).getAttribute('href')).toBe('/quote');
    await userEvent.keyboard('{Escape}');
    await save();
    expect(transport.snapshot().published.pages[0].titleAr).toBe('من نحن التجريبية');
    admin.unmount();

    // New mount and new QueryClient: no retained editor state or query cache.
    let live = mount('/about', <About />);
    expect(await screen.findByRole('heading', { name: 'من نحن التجريبية' })).toBeTruthy();
    expect(screen.queryByText('عنوان معدل من المحرر')).toBeNull();
    expect(screen.getByText('قصة منشورة')).toBeTruthy();
    live.unmount();
    admin = mount('/admin/content');
    await openAbout();
    expect((screen.getByTestId('input-page-title-ar') as HTMLInputElement).value).toBe('عنوان معدل من المحرر');
    expect((screen.getAllByLabelText('النص - عربي')[0] as HTMLTextAreaElement).value).toContain('<strong>معدل</strong>');
    await publish();
    admin.unmount();
    live = mount('/about', <About />);
    expect(await screen.findByRole('heading', { name: 'عنوان معدل من المحرر' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'قصة معدلة' })).toBeTruthy();
    expect(live.container.querySelector('strong')?.textContent).toBe('معدل');
    expect(screen.queryByText('قسم مخفي')).toBeNull();
    expect(document.title).toBe('عنوان معدل من المحرر | شركة التجهيز');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('وصف معدل');
    live.unmount();
    const refreshed = mount('/about', <About />);
    expect(await screen.findByRole('heading', { name: 'عنوان معدل من المحرر' })).toBeTruthy();
    refreshed.unmount();
    const editorReload = mount('/admin/content');
    await openAbout();
    expect((screen.getByTestId('input-page-title-ar') as HTMLInputElement).value).toBe('عنوان معدل من المحرر');
    expect(transport.requests.filter(r => r.method === 'PUT').map(r => r.path)).toEqual(['/api/admin/studio']);
    editorReload.unmount();
  });

  it('uses the very same unsaved draft when switching between content and page builder', async () => {
    const admin = mount('/admin/content');
    await openAbout();
    change(screen.getByTestId('input-page-title-ar'), 'مسودة مشتركة');
    // Render the actual route again through memory routing without remounting provider.
    fireEvent.click(screen.getByTestId('button-back-pages'));
    act(() => admin.navigate('/admin/pages'));
    await userEvent.click(await screen.findByTestId('tab-pages'));
    await openAbout();
    expect((screen.getByTestId('input-page-title-ar') as HTMLInputElement).value).toBe('مسودة مشتركة');
    expect(transport.requests.some(r => r.path.includes('/content'))).toBe(false);
    expect(transport.requests.some(r => r.method === 'PUT')).toBe(false);
  });

  it('settings redirects to identity and contact fields save through the studio draft, not legacy settings', async () => {
    const admin = mount('/admin/settings');
    await userEvent.click(await screen.findByRole('tab', { name: 'التواصل' }));
    expect((screen.getByTestId('input-contact-phone-1') as HTMLInputElement).value).toBe('0111111111');
    change(screen.getByTestId('input-contact-phone-1'), '0222222222');
    change(screen.getByTestId('input-contact-email'), 'draft@example.test');
    change(screen.getByTestId('input-contact-email-2'), 'sales@example.test');
    change(screen.getByLabelText('واتساب (أرقام فقط)'), '966222222222');
    await save();
    expect(transport.snapshot().draft.branding.phone).toBe('0222222222');
    expect(transport.snapshot().draft.branding.email2).toBe('sales@example.test');
    expect(transport.snapshot().published.branding.email2).toBeUndefined();
    expect(transport.snapshot().published.branding.phone).toBe('0111111111');
    expect(transport.requests.filter(r => r.method === 'PUT').map(r => r.path)).toEqual(['/api/admin/studio']);
    await publish();
    expect(transport.snapshot().published.branding.email).toBe('draft@example.test');
    expect(transport.snapshot().published.branding.email2).toBe('sales@example.test');
    admin.unmount();
    mount('/admin/branding');
    await userEvent.click(await screen.findByRole('tab', { name: 'التواصل' }));
    expect((screen.getByTestId('input-contact-phone-1') as HTMLInputElement).value).toBe('0222222222');
    expect((screen.getByTestId('input-contact-email-2') as HTMLInputElement).value).toBe('sales@example.test');
    change(screen.getByTestId('input-contact-email-2'), '');
    await save();
    await publish();
    expect(transport.snapshot().published.branding.email2).toBe('');
    expect(transport.snapshot().published.branding.email).toBe('draft@example.test');
  });

  it('creates a page, updates its navigation on slug edit, hides it after unpublishing, and deletes its link', async () => {
    let admin = mount('/admin/content');
    await userEvent.click(await screen.findByTestId('button-new-page'));
    change(screen.getByTestId('input-new-slug'), 'new-page');
    await userEvent.click(screen.getByTestId('button-create-page'));
    change(screen.getByTestId('input-page-title-ar'), 'صفحة جديدة');
    change(screen.getAllByLabelText('النص - عربي')[0], 'نص الصفحة الجديدة');
    await userEvent.click(screen.getByTestId('button-add-nav'));
    await userEvent.click(screen.getByTestId('switch-page-published'));
    // Publishing dirty content must save first.
    await publish();
    expect(transport.requests.filter(r => r.method !== 'GET').map(r => r.method)).toEqual(['PUT', 'POST']);
    change(screen.getByTestId('input-page-slug'), 'renamed-page');
    await save();
    expect(transport.snapshot().draft.navigation.some(n => n.href === '/p/renamed-page')).toBe(true);
    expect(transport.snapshot().draft.navigation.some(n => n.href === '/p/new-page')).toBe(false);
    expect(transport.snapshot().published.navigation.some(n => n.href === '/p/new-page')).toBe(true);
    await publish();
    admin.unmount();
    let live = mount('/p/renamed-page', <StudioPage pageSlug="renamed-page" />);
    expect(await screen.findByRole('heading', { name: 'صفحة جديدة' })).toBeTruthy();
    live.unmount();
    live = mount('/p/new-page', <StudioPage pageSlug="new-page" />);
    expect(await screen.findByText('404 Page Not Found')).toBeTruthy();
    live.unmount();
    admin = mount('/admin/content');
    await userEvent.click(within(await screen.findByTestId('card-page-renamed-page')).getByRole('button', { name: 'تحرير' }));
    await userEvent.click(screen.getByTestId('switch-page-published'));
    await publish();
    admin.unmount();
    live = mount('/p/renamed-page', <StudioPage pageSlug="renamed-page" />);
    expect(await screen.findByText('404 Page Not Found')).toBeTruthy();
    live.unmount();
    admin = mount('/admin/content');
    await userEvent.click(within(await screen.findByTestId('card-page-renamed-page')).getByRole('button', { name: 'حذف' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'حذف' }));
    await save();
    expect(transport.snapshot().draft.pages.some(p => p.slug === 'renamed-page')).toBe(false);
    expect(transport.snapshot().draft.navigation.some(n => n.href === '/p/renamed-page')).toBe(false);
  });

  it('preserves unsaved content on save failure and refuses to publish it', async () => {
    mount('/admin/content');
    await openAbout();
    change(screen.getByTestId('input-page-title-ar'), 'تعديل لا يضيع');
    transport.failSave(true);
    await userEvent.click(screen.getByTestId('button-publish'));
    await userEvent.click(await screen.findByTestId('button-confirm-publish'));
    await waitFor(() => expect(transport.requests.some(r => r.method === 'PUT')).toBe(true));
    await waitFor(() => expect((screen.getByTestId('button-save-draft') as HTMLButtonElement).disabled).toBe(false));
    expect((screen.getByTestId('input-page-title-ar') as HTMLInputElement).value).toBe('تعديل لا يضيع');
    expect(transport.requests.some(r => r.path.endsWith('/publish'))).toBe(false);
    expect(transport.snapshot().published.pages[0].titleAr).toBe('من نحن التجريبية');
    transport.failSave(false);
    await publish();
    expect(transport.snapshot().published.pages[0].titleAr).toBe('تعديل لا يضيع');
  });

  it('invalidates an already loaded public query on publish, but not on draft save', async () => {
    mount('/admin/content', <>
      <StudioEditorProvider><ProtectedContent /></StudioEditorProvider>
      <OpenVisitor />
    </>);
    await openAbout();
    await waitFor(() => expect(screen.getByTestId('open-visitor-title').textContent).toBe('من نحن التجريبية'));
    change(screen.getByTestId('input-page-title-ar'), 'منشور دون تحديث يدوي');
    await save();
    expect(screen.getByTestId('open-visitor-title').textContent).toBe('من نحن التجريبية');
    await publish();
    await waitFor(() => expect(screen.getByTestId('open-visitor-title').textContent).toBe('منشور دون تحديث يدوي'));
    expect(transport.requests.filter(r => r.path === '/api/public/studio').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the saved draft and live page unchanged on publish failure, then allows retry', async () => {
    mount('/admin/content');
    await openAbout();
    change(screen.getByTestId('input-page-title-ar'), 'نشر ينتظر إعادة المحاولة');
    await save();
    transport.failPublish(true);
    await userEvent.click(screen.getByTestId('button-publish'));
    await userEvent.click(await screen.findByTestId('button-confirm-publish'));
    await waitFor(() => expect(transport.requests.some(r => r.path.endsWith('/publish'))).toBe(true));
    await waitFor(() => expect((screen.getByTestId('button-publish') as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByTestId('status-studio').textContent).toContain('مسودة محفوظة');
    expect(transport.snapshot().draft.pages[0].titleAr).toBe('نشر ينتظر إعادة المحاولة');
    expect(transport.snapshot().published.pages[0].titleAr).toBe('من نحن التجريبية');
    transport.failPublish(false);
    await publish();
    expect(transport.snapshot().published.pages[0].titleAr).toBe('نشر ينتظر إعادة المحاولة');
  });

  it('renders bilingual preview and public sections with the same English content', async () => {
    const admin = mount('/admin/pages', <StudioEditorProvider><AdminPages initialTab="pages" /></StudioEditorProvider>, 'en');
    const card = await screen.findByTestId('card-page-about');
    await userEvent.click(within(card).getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByTestId('button-preview-page'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Fixture About' })).toBeTruthy();
    expect(within(dialog).getByText('Published story')).toBeTruthy();
    expect(within(dialog).queryByText('Hidden body')).toBeNull();
    admin.unmount();
    mount('/about', <About />, 'en');
    expect(await screen.findByRole('heading', { name: 'Fixture About' })).toBeTruthy();
    expect(screen.getByText('Published story')).toBeTruthy();
    expect(screen.queryByText('Hidden body')).toBeNull();
  });
});

function ProtectedContent() {
  return <AdminPages initialTab="pages" />;
}
