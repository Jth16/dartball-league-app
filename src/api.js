export const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';
export const DOWNLOAD_TOKEN = process.env.REACT_APP_DOWNLOAD_TOKEN || '';

export async function fetchWithToken(path, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(DOWNLOAD_TOKEN ? { 'X-Download-Token': DOWNLOAD_TOKEN } : {})
  };
  const opts = {
    ...options,
    headers: { ...(options.headers || {}), ...defaultHeaders }
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  return res;
}