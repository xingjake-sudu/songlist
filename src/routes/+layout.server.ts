import { getSettings } from '$lib/server/settings';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const settings = await getSettings();

  return {
    isAdmin: locals.isAdmin,
    siteTitle: settings.heroTitle
  };
};
