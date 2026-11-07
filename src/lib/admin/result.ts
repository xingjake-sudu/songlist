import type { ImportPreview } from '$lib/types';

export type AdminSuccessResult = {
  kind: 'success';
  adminMessage: string;
};

export type AdminPreviewReadyResult = {
  kind: 'preview-ready';
  adminMessage: string;
  importPreview: ImportPreview;
};

export type AdminErrorResult = {
  kind: 'error';
  adminError: string;
};

export type AdminPreviewParseErrorResult = {
  kind: 'preview-parse-error';
  adminError: string;
  pasteImport?: { pasteInput: string };
};

export type AdminPreviewImportErrorResult = {
  kind: 'preview-import-error';
  adminError: string;
  importPreview: ImportPreview;
};

export type AdminProfileErrorResult = {
  kind: 'profile-error';
  adminError: string;
};

export type AdminActionResult =
  | AdminSuccessResult
  | AdminPreviewReadyResult
  | AdminErrorResult
  | AdminPreviewParseErrorResult
  | AdminPreviewImportErrorResult
  | AdminProfileErrorResult;

export type AdminActionForm = AdminActionResult | null | undefined;

export const hasAdminMessage = (form: AdminActionForm): form is AdminSuccessResult | AdminPreviewReadyResult =>
  form?.kind === 'success' || form?.kind === 'preview-ready';

export const hasToastableError = (form: AdminActionForm): form is AdminErrorResult | AdminPreviewParseErrorResult =>
  form?.kind === 'error' || form?.kind === 'preview-parse-error';

export const hasImportPreview = (
  form: AdminActionForm
): form is AdminPreviewReadyResult | AdminPreviewImportErrorResult =>
  form?.kind === 'preview-ready' || form?.kind === 'preview-import-error';

export const startsOnPastePanel = (form: AdminActionForm) =>
  form?.kind === 'preview-ready' || form?.kind === 'preview-import-error' || form?.kind === 'preview-parse-error';

export const getPasteInputEcho = (form: AdminActionForm) => {
  if (form?.kind === 'preview-parse-error' && form.pasteImport) {
    return form.pasteImport.pasteInput;
  }
  if (form?.kind === 'preview-ready' || form?.kind === 'preview-import-error') {
    return form.importPreview.sourceInput;
  }
  return '';
};
