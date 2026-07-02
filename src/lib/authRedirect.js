export const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Returns the deep-link URI for Supabase password-reset email redirects.
 * Always returns the production custom scheme — native OAuth no longer
 * uses this, only the forgot-password email flow does.
 */
export function getAuthRedirectUri() {
  return `pickleballhero://${AUTH_CALLBACK_PATH}`;
}
