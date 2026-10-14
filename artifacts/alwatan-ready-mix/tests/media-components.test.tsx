import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { errorCases, provider, resetMedia, state, UploadXHR } from './media-support';
import MediaPicker from '@/components/admin/MediaPicker';
import AdminMedia from '@/pages/admin/AdminMedia';
import VideoPlayer from '@/components/VideoPlayer';

beforeEach(resetMedia);

describe.each([
  ['MediaPicker', () => <MediaPicker open onOpenChange={() => {}} onSelect={() => {}} />],
  ['AdminMedia', () => <AdminMedia />],
] as const)('%s upload UI', (_name, component) => {
  it.each(errorCases)('shows %s failure without a success toast', async (failure, message) => {
    UploadXHR.result = failure;
    const { wrapper } = provider();
    const view = render(component(), { wrapper });
    fireEvent.change(view.container.ownerDocument.querySelector('input[type=file]')!, {
      target: { files: [new File(['fixture'], 'clip.webm')] },
    });
    await waitFor(() => expect(state.toast).toHaveBeenCalled());
    expect(state.toast.mock.calls.at(-1)?.[0]).toMatchObject({
      variant: 'destructive', description: expect.stringContaining(message),
    });
    expect(state.finalize).not.toHaveBeenCalled();
    expect(state.toast.mock.calls.every(([toast]) => toast.variant === 'destructive')).toBe(true);
  });

  it.each(['photo.png', 'clip.webm', 'certificate.pdf'])('uploads %s and retains the library on a fresh mount', async name => {
    const { wrapper, client } = provider();
    const view = render(component(), { wrapper });
    fireEvent.change(document.querySelector('input[type=file]')!, {
      target: { files: [new File(['fixture'], name)] },
    });
    await waitFor(() => expect(state.finalize).toHaveBeenCalledOnce());
    await screen.findByText(name);
    view.unmount();
    client.clear();
    // A new client has no cached assets, as on a page reload.
    render(component(), { wrapper: provider().wrapper });
    await screen.findByText(name);
  });

  it('shows library failure with retry instead of claiming it is empty', async () => {
    state.listError = new Error('Offline');
    const { wrapper } = provider();
    render(component(), { wrapper });
    await screen.findByText('تعذر تحميل الوسائط');
    state.listError = null;
    state.assets = [{ id: 7, objectPath: '/objects/uploads/persisted', contentType: 'application/pdf', originalName: 'retained.pdf', size: 20 }];
    fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }));
    await screen.findByText('retained.pdf');
  });
});

it('picker selects an extensionless WebM by stored MIME and filters/searches the library', async () => {
  state.assets = [
    { id: 1, objectPath: '/objects/uploads/extensionless', contentType: 'video/webm', originalName: 'movie.webm' },
    { id: 2, objectPath: '/objects/uploads/image', contentType: 'image/png', originalName: 'photo.png' },
  ];
  const selected: string[] = [];
  const closed: boolean[] = [];
  render(<MediaPicker open kind="video" onSelect={url => selected.push(url)} onOpenChange={value => closed.push(value)} />, { wrapper: provider().wrapper });
  await screen.findByText('movie.webm');
  expect(screen.queryByText('photo.png')).toBeNull();
  expect(document.querySelector('video')?.getAttribute('src')).toBe('/api/storage/objects/uploads/extensionless');
  fireEvent.change(screen.getByTestId('input-media-search'), { target: { value: 'absent' } });
  expect(screen.queryByText('movie.webm')).toBeNull();
  fireEvent.change(screen.getByTestId('input-media-search'), { target: { value: 'movie' } });
  fireEvent.click(screen.getByTestId('button-pick-media-1'));
  expect(selected).toEqual(['/api/storage/objects/uploads/extensionless']);
  expect(closed).toEqual([false]);
});

it('picker selects only a successfully finalized upload', async () => {
  const selected: string[] = [];
  const closed: boolean[] = [];
  state.finalize.mockRejectedValue({ status: 500 });
  render(<MediaPicker open onSelect={url => selected.push(url)} onOpenChange={value => closed.push(value)} />, { wrapper: provider().wrapper });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['fixture'], 'certificate.pdf')] } });
  await waitFor(() => expect(state.toast).toHaveBeenCalled());
  expect(selected).toEqual([]);
  expect(closed).toEqual([]);
  state.finalize.mockResolvedValue({ id: 1 });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['fixture'], 'certificate.pdf')] } });
  await waitFor(() => expect(selected).toEqual(['/api/storage/objects/uploads/test-object']));
  expect(closed).toEqual([false]);
});

it('clipboard denial never shows false success and offers the actual URL', async () => {
  state.assets = [{ id: 1, objectPath: '/objects/uploads/image', contentType: 'image/png', originalName: 'photo.png', size: 10 }];
  const { vi } = await import('vitest');
  const writeText = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<AdminMedia />, { wrapper: provider().wrapper });
  fireEvent.click(await screen.findByTestId('button-copy-1'));
  await waitFor(() => expect(state.toast).toHaveBeenCalledWith({
    title: 'المتصفح منع النسخ التلقائي', variant: 'destructive',
    description: `${window.location.origin}/api/storage/objects/uploads/image`,
  }));
  expect(state.toast.mock.calls.some(([toast]) => toast.title === 'تم نسخ الرابط')).toBe(false);
  writeText.mockResolvedValue(undefined);
  fireEvent.click(screen.getByTestId('button-copy-1'));
  await waitFor(() => expect(state.toast).toHaveBeenCalledWith({ title: 'تم نسخ الرابط' }));
});

describe('VideoPlayer', () => {
  it.each([
    [2, 'تعذر تحميل الفيديو'],
    [3, 'قد يكون ترميز الفيديو غير مدعوم'],
    [4, 'قد يكون ترميز الفيديو غير مدعوم'],
  ])('distinguishes media error %s, supports retry and retains the download URL', (code, message) => {
    const view = render(<VideoPlayer src="/api/storage/objects/uploads/movie" />);
    const video = view.container.querySelector('video')!;
    Object.defineProperty(video, 'error', { configurable: true, value: { code } });
    fireEvent.error(video);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(message);
    expect(within(alert).getByRole('link').getAttribute('href')).toBe('/api/storage/objects/uploads/movie');
    fireEvent.click(within(alert).getByRole('button', { name: 'إعادة المحاولة' }));
    expect(view.container.querySelector('video')).not.toBeNull();
    fireEvent.error(view.container.querySelector('video')!);
    view.rerender(<VideoPlayer src="/api/storage/objects/uploads/another" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(view.container.querySelector('video')?.getAttribute('src')).toBe('/api/storage/objects/uploads/another');
  });
});
