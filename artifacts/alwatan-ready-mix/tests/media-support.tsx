import { vi } from 'vitest';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const state = vi.hoisted(() => ({
  language: 'ar' as 'ar' | 'en',
  assets: [] as any[],
  certificates: [] as any[],
  toast: vi.fn(),
  request: vi.fn(),
  finalize: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  listError: null as Error | null,
}));
export { state };

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({
    language: state.language, isRtl: state.language === 'ar',
    t: (ar: string, en: string) => state.language === 'ar' ? ar : en,
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock('@workspace/api-client-react', () => ({
  getListMediaQueryKey: () => ['media'],
  getListAdminCertificatesQueryKey: () => ['certificates'],
  useListMedia: () => useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      if (state.listError) throw state.listError;
      return [...state.assets];
    },
  }),
  useRequestMediaUpload: () => ({ mutateAsync: state.request }),
  useFinalizeMedia: () => ({ mutateAsync: state.finalize }),
  useDeleteMedia: () => ({ mutate: vi.fn() }),
  useListAdminCertificates: () => ({ data: state.certificates, isLoading: false }),
  useCreateCertificate: () => ({ mutate: state.create, isPending: false }),
  useUpdateCertificate: () => ({ mutate: state.update, isPending: false }),
  useDeleteCertificate: () => ({ mutate: vi.fn() }),
}));

export class UploadXHR {
  static instances: UploadXHR[] = [];
  static result: number | 'network' | 'timeout' | 'abort' | 'pending' = 204;
  upload = { onprogress: null as any };
  onload: any;
  onerror: any;
  ontimeout: any;
  onabort: any;
  timeout = 0;
  status = 0;
  responseText = '';
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn(() => {
    if (UploadXHR.result === 'pending') return;
    queueMicrotask(() => {
      this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
      if (typeof UploadXHR.result === 'number') {
        this.status = UploadXHR.result;
        this.responseText = '{"error":"Upload rejected"}';
        this.onload?.();
      } else if (UploadXHR.result === 'network') this.onerror?.();
      else if (UploadXHR.result === 'timeout') this.ontimeout?.();
      else this.onabort?.();
    });
  });
  constructor() { UploadXHR.instances.push(this); }
}

export function resetMedia() {
  state.language = 'ar';
  state.assets = [];
  state.certificates = [];
  state.listError = null;
  state.toast.mockReset();
  state.update.mockReset();
  state.create.mockReset();
  state.request.mockReset().mockResolvedValue({
    uploadURL: '/api/storage/uploads/direct?token=isolated-test',
    objectPath: '/objects/uploads/test-object',
  });
  state.finalize.mockReset().mockImplementation(async ({ data }) => {
    const asset = { ...data, id: state.assets.length + 1 };
    state.assets.push(asset);
    return asset;
  });
  UploadXHR.instances = [];
  UploadXHR.result = 204;
  vi.stubGlobal('XMLHttpRequest', UploadXHR);
}

export function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return {
    client,
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  };
}

export const errorCases = [
  [401, 'انتهت جلسة الدخول'],
  [403, 'رُفض طلب الرفع'],
  [413, 'الملف يتجاوز الحد المسموح'],
  [415, 'محتوى الملف لا يطابق صيغته'],
  [500, 'تعذر حفظ الملف على الخادم'],
  ['network', 'تعذر الاتصال بالخادم أثناء الرفع'],
  ['timeout', 'انتهت مهلة الرفع'],
] as const;
