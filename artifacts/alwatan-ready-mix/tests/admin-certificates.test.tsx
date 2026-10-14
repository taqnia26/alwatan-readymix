import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { errorCases, provider, resetMedia, state, UploadXHR } from './media-support';
import AdminCertificates from '@/pages/admin/AdminCertificates';

beforeEach(resetMedia);

const certificate = (imageUrl: string | null, fileUrl: string | null) => ({
  id: 31, titleAr: 'شهادة اختبار', titleEn: 'Test certificate', certificateNumber: null,
  descriptionAr: 'وصف الاختبار', descriptionEn: 'Test description',
  imageUrl, fileUrl, issuedBy: 'Test issuer', issuedDate: '2026-01-01',
});

async function edit() {
  render(<AdminCertificates />, { wrapper: provider().wrapper });
  // The edit and delete actions follow the optional PDF link in the card.
  const card = screen.getByText('شهادة اختبار').parentElement!;
  fireEvent.click(within(card).getAllByRole('button')[0]);
  return screen.getByRole('dialog');
}

it.each([
  ['', ''],
  [null, null],
  ['/api/storage/objects/uploads/preview', '/api/storage/objects/uploads/certificate'],
  ['/uploads/existing.png', '/uploads/existing.pdf'],
])('edits existing certificate with optional/local attachments (%s, %s)', async (imageUrl, fileUrl) => {
  state.certificates = [certificate(imageUrl, fileUrl)];
  const dialog = await edit();
  expect(screen.queryByRole('link', { name: 'PDF', hidden: true })?.getAttribute('href') ?? null).toBe(fileUrl || null);
  fireEvent.change(within(dialog).getByLabelText('العنوان بالإنجليزية'), { target: { value: 'Updated certificate' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }));
  await waitFor(() => expect(state.update).toHaveBeenCalledOnce());
  expect(state.update.mock.calls[0][0]).toMatchObject({
    id: 31, data: { titleEn: 'Updated certificate', imageUrl: imageUrl ?? '', fileUrl: fileUrl ?? '' },
  });
});

it('creates a certificate without generating an empty PDF link', async () => {
  render(<AdminCertificates />, { wrapper: provider().wrapper });
  fireEvent.click(screen.getByRole('button', { name: 'إضافة شهادة' }));
  const dialog = screen.getByRole('dialog');
  for (const [label, value] of [
    ['العنوان بالعربية', 'شهادة اختبار'], ['العنوان بالإنجليزية', 'Test certificate'],
    ['جهة الإصدار', 'Test issuer'], ['الوصف بالعربية', 'وصف'], ['الوصف بالإنجليزية', 'Description'],
  ]) fireEvent.change(within(dialog).getByLabelText(label), { target: { value } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }));
  await waitFor(() => expect(state.create).toHaveBeenCalledOnce());
  const [{ data }, callbacks] = state.create.mock.calls[0];
  expect(data.fileUrl).toBe('');
  expect(data.imageUrl).toBe('');
  // Render the saved response rather than asserting only the mutation.
  state.certificates = [certificate(data.imageUrl, data.fileUrl)];
  callbacks.onSuccess();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByRole('link', { name: 'PDF' })).toBeNull();
  expect(screen.getByText('لم يتم إرفاق PDF')).toBeTruthy();
});

it.each([
  ['photo.png', 'imageUrl', 'image/*'],
  ['certificate.pdf', 'fileUrl', 'application/pdf,.pdf'],
])('attaches %s with absent MIME and saves the verified local URL', async (name, field, accept) => {
  state.certificates = [certificate('', '')];
  const dialog = await edit();
  fireEvent.change(dialog.querySelector(`input[accept="${accept}"]`)!, { target: { files: [new File(['fixture'], name)] } });
  await waitFor(() => expect(state.toast).toHaveBeenCalledWith({ title: 'تم إرفاق الملف بنجاح' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }));
  await waitFor(() => expect(state.update).toHaveBeenCalledOnce());
  expect(state.update.mock.calls[0][0].data[field]).toBe('/api/storage/objects/uploads/test-object');
});

it.each(errorCases)('certificate upload %s retains the existing attachment and shows no success', async (failure, message) => {
  UploadXHR.result = failure;
  state.certificates = [certificate('', '/uploads/existing.pdf')];
  const dialog = await edit();
  fireEvent.change(dialog.querySelector('input[accept="application/pdf,.pdf"]')!, {
    target: { files: [new File(['fixture'], 'certificate.pdf')] },
  });
  await waitFor(() => expect(state.toast).toHaveBeenCalledWith(expect.objectContaining({
    variant: 'destructive', description: expect.stringContaining(message),
  })));
  expect(state.toast.mock.calls.every(([toast]) => toast.variant === 'destructive')).toBe(true);
  fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }));
  await waitFor(() => expect(state.update).toHaveBeenCalledOnce());
  expect(state.update.mock.calls[0][0].data.fileUrl).toBe('/uploads/existing.pdf');
});

it.each(['javascript:alert(1)', '//untrusted.invalid/file.pdf', '/uploads\\unsafe.pdf'])('rejects unsafe attachment link %s', async fileUrl => {
  state.certificates = [certificate('', '')];
  const dialog = await edit();
  fireEvent.change(within(dialog).getByLabelText('ملف الشهادة PDF'), { target: { value: fileUrl } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }));
  await screen.findByText('Must be a valid URL');
  expect(state.update).not.toHaveBeenCalled();
});
