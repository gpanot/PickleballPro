import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Globe, Apple } from 'lucide-react-native';
import { useOnboardingTheme } from '../onboarding/useOnboardingTheme';
import { signInWithGoogle, signInWithApple, isAppleSignInAvailable } from '../../lib/socialAuth';

/**
 * Renders Google (always) and Apple (iOS only when available) sign-in buttons.
 *
 * Props:
 *  onSuccess(session)  — called after a successful OAuth sign-in
 *  onError(error)      — called when sign-in fails (optional)
 *  onBeforeSignIn()    — called before the OAuth flow starts (e.g. to store metadata)
 *  step                — passed to useOnboardingTheme for correct colour ramp
 */
export default function SocialAuthButtons({ onSuccess, onError, onBeforeSignIn, step }) {
  const ot = useOnboardingTheme(step);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleGoogle = async () => {
    setError('');
    onBeforeSignIn?.();
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session === null) return;
      if (session) onSuccess?.(session);
    } catch (err) {
      const msg = err?.message || 'Google sign-in failed. Please try again.';
      setError(msg);
      onError?.(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setError('');
    onBeforeSignIn?.();
    setAppleLoading(true);
    try {
      const session = await signInWithApple();
      if (session) onSuccess?.(session);
    } catch (err) {
      // ERR_CANCELED means the user dismissed the sheet — not an error we surface
      if (err?.code === 'ERR_CANCELED') {
        setAppleLoading(false);
        return;
      }
      const msg = err?.message || 'Apple sign-in failed. Please try again.';
      setError(msg);
      onError?.(err);
    } finally {
      setAppleLoading(false);
    }
  };

  const isAnyLoading = googleLoading || appleLoading;

  return (
    <View style={styles.container}>
      {!!error && (
        <Text style={[styles.errorText, { color: '#b91c1c' }]}>{error}</Text>
      )}

      {/* Google */}
      <TouchableOpacity
        style={[
          styles.socialButton,
          { backgroundColor: ot.surface, borderColor: ot.borderColor },
          isAnyLoading && styles.disabledButton,
        ]}
        onPress={handleGoogle}
        disabled={isAnyLoading}
        activeOpacity={0.8}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color={ot.accent} />
        ) : (
          <Globe size={20} color={ot.textPrimary} strokeWidth={2} />
        )}
        <Text style={[styles.socialButtonText, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Apple — iOS only, when native API is available */}
      {appleAvailable && (
        <TouchableOpacity
          style={[
            styles.socialButton,
            { backgroundColor: ot.surface, borderColor: ot.borderColor },
            isAnyLoading && styles.disabledButton,
          ]}
          onPress={handleApple}
          disabled={isAnyLoading}
          activeOpacity={0.8}
        >
          {appleLoading ? (
            <ActivityIndicator size="small" color={ot.accent} />
          ) : (
            <Apple size={20} color={ot.textPrimary} strokeWidth={2} />
          )}
          <Text style={[styles.socialButtonText, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  socialButtonText: {
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
