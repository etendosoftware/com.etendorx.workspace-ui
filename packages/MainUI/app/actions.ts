'use server';

import { FALLBACK_URL } from '@/utils/constants';

export async function getApiUrl() {
  const url = process.env['ETENDO_CLASSIC_URL'];

  return url || FALLBACK_URL;
}
