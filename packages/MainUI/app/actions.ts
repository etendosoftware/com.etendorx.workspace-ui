'use server';

export async function getApiUrl() {
  return process.env['ETENDO_CLASSIC_URL'] || 'http://localhost:8080/etendo';
}
