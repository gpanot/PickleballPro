import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

// @react-native-google-signin is a native module — not available in Expo Go.
// Wrap the import so the module doesn't crash at load time.
let GoogleSignin = null;
let statusCodes = {};
try {
  const pkg = require('@react-native-google-signin/google-signin');
  GoogleSignin = pkg.GoogleSignin;
  statusCodes = pkg.statusCodes ?? {};
  GoogleSignin.configure({
    // Web client ID — from Google Console, Web application type
    webClientId: '140906288105-4hn6pluvlt699197qi97tv2357ielb75.apps.googleusercontent.com',
    // iOS client ID — from GoogleService-Info.plist CLIENT_ID
    iosClientId: '140906288105-akv9va24o1jggs7g23bjciagglel55h8.apps.googleusercontent.com',
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
} catch {
  // Running in Expo Go or environment where native module is unavailable.
}

/**
 * Native Google Sign-In using the Google Identity SDK.
 * Works on both iOS and Android without any browser redirect.
 */
export async function signInWithGoogle() {
  if (!GoogleSignin) {
    throw new Error(
      'Google Sign-In is not available in this build. Please use a development or production build.'
    );
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    throw new Error('Google Play Services not available on this device.');
  }

  let userInfo;
  try {
    userInfo = await GoogleSignin.signIn();
  } catch (err) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    if (err?.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in is already in progress.');
    }
    if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available on this device.');
    }
    const message = err?.message || '';
    if (message.includes('DEVELOPER_ERROR') || err?.code === '10') {
      throw new Error(
        'Google Sign-In is not configured for this release build. ' +
        'Register the release SHA-1 fingerprint in Google Cloud Console.'
      );
    }
    throw err;
  }

  const idToken = userInfo.data?.idToken;

  if (!idToken) {
    throw new Error('No ID token returned from Google Sign-In.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  return data.session;
}

/**
 * Returns true when Sign in with Apple is available on the current device.
 * Always false on Android.
 */
export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Native Sign in with Apple sheet — iOS only.
 * Uses expo-apple-authentication + signInWithIdToken.
 */
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('No identity token returned from Apple');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only provides name on first sign-in; attach it to user metadata
  const fullName = credential.fullName;
  if (fullName?.givenName || fullName?.familyName) {
    const name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ');
    await supabase.auth.updateUser({ data: { full_name: name, name } });
  }

  return data.session;
}

export { statusCodes };
export { GoogleSignin };
