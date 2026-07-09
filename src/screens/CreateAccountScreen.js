import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../lib/legalUrls';
import { ONBOARDING_STEPS } from '../lib/onboardingSteps';
import OnboardingShell from '../components/onboarding/OnboardingShell';
import { useOnboardingTheme } from '../components/onboarding/useOnboardingTheme';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

export default function CreateAccountScreen({
  navigation,
  route,
  onContinueWithEmail,
  onSignIn,
}) {
  const { user } = useUser();
  const { setPendingOAuthMetadata } = useAuth();
  const ot = useOnboardingTheme(ONBOARDING_STEPS.CREATE_ACCOUNT);
  const previousData = route?.params?.previousData || {};
  const userName = previousData?.name || user?.name || '';

  const handleBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const openLegalUrl = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const handleContinueWithEmail = () => {
    if (navigation?.navigate) {
      navigation.navigate('SignUp', {
        previousData: { ...previousData, prefilledName: userName },
      });
    } else if (onContinueWithEmail) {
      onContinueWithEmail({ ...previousData, prefilledName: userName });
    }
  };

  const handleSocialAuthStart = () => {
    // Store onboarding data collected so far so fetchOrCreateUserProfile can
    // merge it into the new user's profile row after SIGNED_IN fires.
    setPendingOAuthMetadata({
      name: userName || undefined,
      ...previousData,
    });
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.CREATE_ACCOUNT}
      title="Create an account"
      subtitle="Save your workouts, progress, settings, and more."
      onBack={handleBack}
      contentStyle={styles.content}
    >
      {/* Social sign-in options */}
      <SocialAuthButtons
        step={ONBOARDING_STEPS.CREATE_ACCOUNT}
        onBeforeSignIn={handleSocialAuthStart}
      />

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: ot.borderColor }]} />
        <Text style={[styles.dividerText, { color: ot.textMuted, fontFamily: ot.t.fontBody }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: ot.borderColor }]} />
      </View>

      {/* Email registration */}
      <TouchableOpacity
        style={[styles.emailButton, { borderColor: ot.borderColor, backgroundColor: ot.surface }]}
        onPress={handleContinueWithEmail}
        activeOpacity={0.85}
      >
        <Text style={[styles.emailButtonText, { color: ot.textPrimary, fontFamily: ot.t.fontBodySemibold }]}>
          Register via email
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: ot.textSecondary, fontFamily: ot.t.fontBody }]}>
          By continuing you are agreeing to AcademyPro's{' '}
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => openLegalUrl(PRIVACY_POLICY_URL)}>
            <Text style={[styles.footerLink, { color: ot.accent }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: ot.textSecondary }]}> and </Text>
          <TouchableOpacity onPress={() => openLegalUrl(TERMS_URL)}>
            <Text style={[styles.footerLink, { color: ot.accent }]}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      {onSignIn && (
        <View style={styles.signInRow}>
          <Text style={[styles.footerText, { color: ot.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity onPress={onSignIn}>
            <Text style={[styles.signInLink, { color: ot.accent, fontFamily: ot.t.fontBodyBold }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  emailButton: {
    borderRadius: 30,
    paddingVertical: 15,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
