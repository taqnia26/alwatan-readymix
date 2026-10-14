import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCases, provider, resetMedia, state, UploadXHR } from './media-support';
import { mediaUploadError, uploadContentType, useMediaUpload, validateFile } from '@/hooks/use-media-upload';

beforeEach(resetMedia);

describe('useMediaUpload contract', () => {
  it.each([
    ['photo.PNG', '', 'image/png'],
    ['clip.webm', '', 'video/webm'],
    ['certificate.pdf', 'application/octet-stream', 'application/pdf'],
    ['photo.jpg', 'image/pjpeg', 'image/jpeg'],
  ])('uploads %s with inferred MIME at all three stages', async (name, type, contentType) => {
    const file = new File(['fixture-bytes'], name, { type });
    const { wrapper, client } = provider();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(useMediaUpload, { wrapper });
    let uploaded: any;
    await act(async () => { uploaded = await result.current.upload(file, 'test alt'); });
    expect(uploadContentType(file)).toBe(contentType);
    expect(state.request).toHaveBeenCalledWith({ data: { name, size: file.size, contentType } });
    const xhr = UploadXHR.instances[0];
    expect(xhr.open).toHaveBeenCalledWith('PUT', '/api/storage/uploads/direct?token=isolated-test');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', contentType);
    expect(xhr.send).toHaveBeenCalledWith(file);
    expect(xhr.timeout).toBe(120_000);
    expect(state.finalize).toHaveBeenCalledWith({ data: {
      objectPath: '/objects/uploads/test-object', originalName: name, size: file.size, contentType, altText: 'test alt',
    } });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['media'] });
    expect(uploaded.url).toBe('/api/storage/objects/uploads/test-object');
    expect(result.current.progress).toBe(50);
    expect(result.current.isUploading).toBe(false);
  });

  it.each(errorCases)('PUT %s never finalizes and yields a useful error', async (failure, message) => {
    UploadXHR.result = failure;
    const { wrapper, client } = provider();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(useMediaUpload, { wrapper });
    let error: unknown;
    await act(async () => {
      try { await result.current.upload(new File(['bytes'], 'clip.webm')); } catch (e) { error = e; }
    });
    expect(mediaUploadError(error, 'ar')).toContain(message);
    expect(state.finalize).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
  });

  it.each(
    (['request', 'finalize'] as const).flatMap(stage =>
      errorCases.filter(([failure]) => typeof failure === 'number').map(([status, message]) => ({ stage, status, message }))
    )
  )('propagates HTTP $status from $stage without false completion', async ({ stage, status, message }) => {
    state[stage].mockRejectedValue({ status });
    const { wrapper, client } = provider();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(useMediaUpload, { wrapper });
    await act(async () => {
      await expect(result.current.upload(new File(['bytes'], 'photo.png'))).rejects.toEqual({ status });
    });
    if (stage === 'request') expect(UploadXHR.instances).toHaveLength(0);
    expect(invalidate).not.toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
    expect(mediaUploadError({ status }, 'ar')).toContain(message);
  });

  it('exposes pending progress and clears busy state on abort', async () => {
    UploadXHR.result = 'pending';
    const { wrapper } = provider();
    const { result } = renderHook(useMediaUpload, { wrapper });
    let promise: Promise<any>;
    act(() => { promise = result.current.upload(new File(['bytes'], 'photo.png')); });
    await waitFor(() => expect(UploadXHR.instances).toHaveLength(1));
    expect(result.current.isUploading).toBe(true);
    await act(async () => {
      UploadXHR.instances[0].onabort();
      await expect(promise).rejects.toThrow('تم إلغاء الرفع');
    });
    expect(result.current.isUploading).toBe(false);
    expect(state.finalize).not.toHaveBeenCalled();
  });

  it.each([
    ['empty.png', '', 0], ['unknown.bin', '', 1], ['unsafe.svg', 'image/svg+xml', 1],
    ['photo.png', '', 10 * 1024 * 1024 + 1],
    ['clip.webm', '', 100 * 1024 * 1024 + 1],
    ['certificate.pdf', '', 25 * 1024 * 1024 + 1],
  ])('rejects invalid %s before requesting storage', async (name, type, size) => {
    const file = new File(size ? ['x'] : [], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    expect(validateFile(file, 'ar')).toBeTruthy();
    const { wrapper } = provider();
    const { result } = renderHook(useMediaUpload, { wrapper });
    await act(async () => { await expect(result.current.upload(file)).rejects.toThrow(); });
    expect(state.request).not.toHaveBeenCalled();
  });
});
