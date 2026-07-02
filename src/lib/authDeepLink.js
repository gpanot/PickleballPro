import { Linking } from 'react-native';
import { supabase } from './supabase';

const AUTH_CALLBACK_PATTERNS = [
  '/auth/callback',
  'auth/callback',
];

function isAuthCallbackUrl(url) {
  if (!url) return false;
  return AUTH_CALLBACK_PATTERNS.some((p) => url.includes(p));
}

/**
 * Parses a Supabase auth callback URL (password-reset only — OAuth no longer
 * uses deep links) and sets the session so onAuthStateChange fires.
 */
async function createSessionFromUrl(url) {
  // Supabase puts tokens after # or ? depending on flow type
  const normalized = url.replace('#', '?');
  const params = Object.fromEntries(new URL(normalized).searchParams);

  const { access_token, refresh_token } = params;
  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

/**
 * Handles a deep-link URL for password recovery.
 * OAuth sign-in no longer uses deep links — native SDKs handle that directly.
 */
async function handleAuthDeepLink(url) {
  if (!isAuthCallbackUrl(url)) return false;

  console.log('🔐 [AuthDeepLink] Handling auth callback URL:', url);

  try {
    if (url.includes('type=recovery') || url.includes('#type=recovery')) {
      console.log('🔐 [AuthDeepLink] Password recovery flow detected');
      await createSessionFromUrl(url);
      // AuthContext onAuthStateChange will fire PASSWORD_RECOVERY
      return true;
    }

    // Any other auth/callback (e.g. email confirmation) — set session
    await createSessionFromUrl(url);
    return true;
  } catch (error) {
    console.error('🔐 [AuthDeepLink] Error handling auth deep link:', error);
    return false;
  }
}

/**
 * Initialise auth deep-link handling.
 * Call once from App.js. Returns a cleanup function.
 */
export function initializeAuthDeepLinkHandling() {
  const handler = ({ url }) => {
    handleAuthDeepLink(url);
  };

  const subscription = Linking.addEventListener('url', handler);

  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🔐 [AuthDeepLink] Initial URL on cold start:', url);
      handleAuthDeepLink(url);
    }
  });

  return () => subscription?.remove();
}
