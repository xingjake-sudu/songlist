import { createHash } from 'node:crypto';

import { fail } from '@sveltejs/kit';

import { getPublicCatalog } from '$lib/server/catalog';
import { getErrorMessage, getValidationMessage } from '$lib/server/errors';
import { requestFormValuesSchema } from '$lib/server/form-schemas';
import { consumeRequestRateLimit } from '$lib/server/rate-limit';
import { createSongRequest } from '$lib/server/requests';
import { requestSchema } from '$lib/validators';

import type { Actions, PageServerLoad } from './$types';

const requestWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 5;
const rateLimitMessage = '提交过于频繁，请稍后再试。';

const createRateLimitKey = (clientId: string) => createHash('sha256').update(clientId).digest('hex');

const consumePublicActionRateLimit = (clientAddress: string) =>
  consumeRequestRateLimit({
    clientKey: createRateLimitKey(clientAddress),
    maxRequests: maxRequestsPerWindow,
    windowMs: requestWindowMs
  });

export const load: PageServerLoad = async () => ({
  catalog: await getPublicCatalog()
});

export const actions: Actions = {
  submitRequest: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const rawValues = requestFormValuesSchema.parse(formData);

    const parsed = requestSchema.safeParse(rawValues);

    if (!parsed.success) {
      return fail(400, {
        kind: 'error' as const,
        error: getValidationMessage(parsed.error),
        values: rawValues
      });
    }

    if (!(await consumePublicActionRateLimit(getClientAddress()))) {
      return fail(429, {
        kind: 'error' as const,
        error: rateLimitMessage,
        values: rawValues
      });
    }

    try {
      await createSongRequest(parsed.data);
    } catch (error) {
      return fail(500, {
        kind: 'error' as const,
        error: getErrorMessage(error),
        values: rawValues
      });
    }

    return {
      kind: 'submitted' as const,
      message: '愿望已提交，主播稍后会在后台处理。'
    };
  }
};
