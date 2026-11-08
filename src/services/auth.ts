import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firebaseProjectId = firebaseConfig.projectId || 'gen-lang-client-0506594677';

export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

const TOKEN_STORAGE_KEY = 'cfa_gmail_access_token';
const EXPIRY_STORAGE_KEY = 'cfa_gmail_token_expires_at';
const EMAIL_STORAGE_KEY = 'cfa_gmail_user_email';

let isSigningIn = false;
let cachedAccessToken: string | null = null;
const tokenListeners = new Set<(token: string | null, remainingMinutes: number) => void>();

export const getStoredAccessToken = (): {
  token: string | null;
  isExpired: boolean;
  remainingMinutes: number;
  email: string | null;
} => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiresAtStr = localStorage.getItem(EXPIRY_STORAGE_KEY);
    const email = localStorage.getItem(EMAIL_STORAGE_KEY);

    if (!token || !expiresAtStr) {
      return { token: null, isExpired: true, remainingMinutes: 0, email: null };
    }

    const expiresAt = Number(expiresAtStr);
    const now = Date.now();
    const remainingMs = expiresAt - now;
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

    // If token has expired, mark it expired
    if (now >= expiresAt) {
      return { token: null, isExpired: true, remainingMinutes: 0, email };
    }

    return { token, isExpired: false, remainingMinutes, email };
  } catch {
    return { token: null, isExpired: true, remainingMinutes: 0, email: null };
  }
};

export const saveStoredAccessToken = (
  token: string,
  expiresInSeconds: number = 3600,
  email?: string | null
) => {
  cachedAccessToken = token;
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(EXPIRY_STORAGE_KEY, expiresAt.toString());
    if (email) localStorage.setItem(EMAIL_STORAGE_KEY, email);
  } catch {}

  notifyTokenListeners();
};

export const clearStoredAccessToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
    localStorage.removeItem(EMAIL_STORAGE_KEY);
  } catch {}

  notifyTokenListeners();
};

const notifyTokenListeners = () => {
  const current = getStoredAccessToken();
  tokenListeners.forEach((listener) => {
    listener(current.token, current.remainingMinutes);
  });
};

// Periodic check (every 30 seconds) to notify UI when remaining time changes or token expires
if (typeof window !== 'undefined') {
  setInterval(() => {
    const current = getStoredAccessToken();
    if (cachedAccessToken && current.isExpired) {
      cachedAccessToken = null;
      notifyTokenListeners();
    } else if (cachedAccessToken) {
      notifyTokenListeners();
    }
  }, 30000);
}

export const subscribeToTokenStatus = (
  listener: (token: string | null, remainingMinutes: number) => void
) => {
  tokenListeners.add(listener);
  const current = getStoredAccessToken();
  listener(current.token, current.remainingMinutes);
  return () => {
    tokenListeners.delete(listener);
  };
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  // Restore valid token from localStorage if available
  const stored = getStoredAccessToken();
  if (stored.token && !stored.isExpired) {
    cachedAccessToken = stored.token;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const currentStored = getStoredAccessToken();
      if (currentStored.token && !currentStored.isExpired) {
        cachedAccessToken = currentStored.token;
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      // Don't wipe stored token on passive initial unresolved auth state
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const checkRedirectAuth = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        saveStoredAccessToken(credential.accessToken, 3600, result.user.email);
        return { user: result.user, accessToken: credential.accessToken };
      }
    }
  } catch (error: any) {
    console.error('Redirect result error:', error);
    throw error;
  }
  return null;
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    saveStoredAccessToken(credential.accessToken, 3600, result.user.email);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  isSigningIn = true;
  try {
    await signInWithRedirect(auth, provider);
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  const stored = getStoredAccessToken();
  if (stored.token && !stored.isExpired) {
    cachedAccessToken = stored.token;
    return stored.token;
  }
  return null;
};

export const setCachedAccessToken = (token: string | null) => {
  if (token) {
    saveStoredAccessToken(token, 3600);
  } else {
    clearStoredAccessToken();
  }
};

export const logout = async () => {
  await signOut(auth);
  clearStoredAccessToken();
};

