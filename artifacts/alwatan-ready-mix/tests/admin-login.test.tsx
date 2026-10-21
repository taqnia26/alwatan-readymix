import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminLogin from '../src/pages/admin/AdminLogin';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn(),
}));
vi.mock('@workspace/api-client-react', () => ({
  useLogin: () => ({ mutate: mocks.mutate, isPending: false }),
  getGetAuthMeQueryKey: () => ['/api/auth/me'],
}));
vi.mock('wouter', () => ({ useLocation: () => ['/admin/login', mocks.navigate] }));
vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ isRtl: true, t: (ar: string) => ar }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

const key = ['/api/auth/me'];
const user = { id: 1, username: 'fixture-admin', role: 'admin' };
function mount(client: QueryClient) {
  render(<QueryClientProvider client={client}><AdminLogin /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText('اسم المستخدم'), { target: { value: 'fixture-admin' } });
  fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'fixture-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
  return mocks.mutate.mock.calls[0][1];
}

describe('admin login session handoff', () => {
  beforeEach(() => vi.resetAllMocks());

  it('replaces a cached anonymous failure before entering the dashboard', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await client.fetchQuery({ queryKey: key, queryFn: () => Promise.reject(new Error('401')) }).catch(() => {});
    expect(client.getQueryState(key)?.status).toBe('error');
    mocks.navigate.mockImplementation(() => {
      expect(client.getQueryState(key)?.status).toBe('success');
      expect(client.getQueryData(key)).toEqual({ user });
    });
    const callbacks = mount(client);
    await act(() => callbacks.onSuccess({ user }));
    expect(mocks.navigate).toHaveBeenCalledWith('/admin');
    client.clear();
  });

  it('cancels an older anonymous request so it cannot replace the new session', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let rejectOld!: (error: Error) => void;
    const oldRequest = client.fetchQuery({
      queryKey: key,
      queryFn: () => new Promise((_, reject) => { rejectOld = reject; }),
    }).catch(() => {});
    const callbacks = mount(client);
    await act(() => callbacks.onSuccess({ user }));
    rejectOld(new Error('old anonymous request'));
    await oldRequest;
    expect(client.getQueryData(key)).toEqual({ user });
    expect(client.getQueryState(key)?.status).toBe('success');
    client.clear();
  });

  it.each([401, 403, 500, undefined])('does not call every failure a wrong password (%s)', async (status) => {
    const client = new QueryClient();
    const callbacks = mount(client);
    await act(() => callbacks.onError({ status }));
    const toast = mocks.toast.mock.calls[0][0];
    expect(toast.variant).toBe('destructive');
    expect(toast.description.includes('اسم المستخدم وكلمة المرور')).toBe(status === 401);
    expect(mocks.navigate).not.toHaveBeenCalled();
    client.clear();
  });
});
