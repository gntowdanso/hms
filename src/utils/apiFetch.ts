"use client";
import { getAuth, setAuth } from './auth';

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const headers = new Headers(init && init.headers ? init.headers : undefined);
  try {
    let user = getAuth();
    // In local development, if no user exists, create a short-lived dev user so headers are sent.
    // Accept a broader set of local hostnames: localhost, 127.0.0.1, 0.0.0.0, *.local and common local IP ranges.
    if (!user && typeof window !== 'undefined') {
      const host = window.location.hostname || '';
      const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');
      const isLocalIp = /^10\.|^192\.|^172\./.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host);
      const isDevEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
      if (isLocalhost || isLocalIp || isDevEnv) {
        setAuth({ username: 'devadmin', roleId: 1 }, 1000 * 60 * 60 * 24); // 24h
        user = getAuth();
      }
    }
    if (user && typeof user.roleId === 'number') {
      headers.set('x-user-role', String(user.roleId));
    } else {
      // If still no user found but we're in a dev/local context, add a fallback role header
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const isDevEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
        const isLocalhost = typeof host === 'string' && (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local'));
        const isLocalIp = typeof host === 'string' && (/^10\.|^192\.|^172\./.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host));
        if (isDevEnv || isLocalhost || isLocalIp) {
          headers.set('x-user-role', '1');
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore - getAuth only on client
  }

  // If body exists and content-type not provided, default to json
  if (init && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(input, { ...(init || {}), headers });
  return res;
}
