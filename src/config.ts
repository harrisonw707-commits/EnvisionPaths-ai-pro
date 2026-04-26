const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = (rawApiUrl && rawApiUrl !== 'undefined' ? rawApiUrl : '').trim().replace(/\/$/, '');

console.log('[CONFIG] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[CONFIG] Final API_URL:', API_URL || '(relative)');

// Helper to ensure we don't have double slashes if using relative paths
export const getApiUrl = (path: string) => {
  if (!API_URL) return path;
  if (API_URL.startsWith('http')) return `${API_URL}${path}`;
  return `${API_URL}${path}`.replace(/\/+/g, '/');
};
