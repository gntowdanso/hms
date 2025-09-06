// Simple auth utility using localStorage for demo purposes
// Simple auth utility using localStorage for demo purposes
// Adds an expiresAt timestamp to the stored user and treats sessions as expired after ttl (default 1 hour)
const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour

export function setAuth(user: any, ttlMs: number = DEFAULT_TTL_MS) {
  if (typeof window !== 'undefined') {
    const expiresAt = Date.now() + ttlMs;
    // keep user shape but add expiresAt
    const toStore = { ...user, expiresAt };
    localStorage.setItem('smsapp_user', JSON.stringify(toStore));
  }
}

export function getAuth() {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('smsapp_user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        // session expired
        localStorage.removeItem('smsapp_user');
        return null;
      }
      return parsed;
    } catch (err) {
      localStorage.removeItem('smsapp_user');
      return null;
    }
  }
  return null;
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('smsapp_user');
  }
}

export function authExpiresInMs() {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem('smsapp_user');
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.expiresAt) return 0;
    return Math.max(0, parsed.expiresAt - Date.now());
  } catch (err) {
    return 0;
  }
}
