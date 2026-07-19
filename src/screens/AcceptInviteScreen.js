import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Building2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

/**
 * AcceptInviteScreen — shown when the user taps an academypro://invite/<token> deep link.
 * Reads route.params.token, calls accept_academy_invite RPC, and shows success or error.
 * On NO_COACH_PROFILE error, shows a CTA to navigate to CreateCoachProfileScreen.
 */
export default function AcceptInviteScreen({ route, navigation }) {
  const { token } = route.params || {};
  const { logbookTheme: t, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null); // { success, academy_name, role }
  const [error, setError] = useState(null);   // { code, message }

  useEffect(() => {
    if (token) {
      acceptInvite(token);
    } else {
      setError({ code: 'INVALID', message: 'No invite token provided.' });
      setLoading(false);
    }
  }, [token]);

  const acceptInvite = async (inviteToken) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('accept_academy_invite', {
        invite_token: inviteToken,
      });
      if (rpcError) throw rpcError;
      setResult(data);
    } catch (err) {
      const msg = err.message || '';
      let code = 'UNKNOWN';
      let userMessage = 'Something went wrong. Please try again.';

      if (msg.includes('INVITE_NOT_FOUND')) {
        code = 'INVITE_NOT_FOUND';
        userMessage = 'This invite link is not valid.';
      } else if (msg.includes('INVITE_EXPIRED')) {
        code = 'INVITE_EXPIRED';
        userMessage = 'This invite link has expired. Ask your manager to generate a new one.';
      } else if (msg.includes('INVITE_ALREADY_USED')) {
        code = 'INVITE_ALREADY_USED';
        userMessage = 'This invite has already been used.';
      } else if (msg.includes('ALREADY_MEMBER')) {
        code = 'ALREADY_MEMBER';
        userMessage = 'You already belong to an academy.';
      } else if (msg.includes('NO_COACH_PROFILE')) {
        code = 'NO_COACH_PROFILE';
        userMessage = 'You must complete your coach profile before joining an academy as a coach.';
      }

      setError({ code, message: userMessage });
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={t.accentPurple} />
            <Text style={[styles.loadingText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              Joining academy...
            </Text>
          </View>
        ) : result?.success ? (
          /* Success state */
          <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: `${t.accentPurple}15` }]}>
              <CheckCircle size={48} color={t.accentPurple} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
              Welcome aboard!
            </Text>
            <Text style={[styles.subtitle, { color: t.textSecondary, fontFamily: t.fontBody }]}>
              You've joined{' '}
              <Text style={{ fontFamily: t.fontBodyBold, color: t.textPrimary }}>
                {result.academy_name}
              </Text>{' '}
              as a{' '}
              <Text style={{ fontFamily: t.fontBodyBold }}>
                {roleLabel(result.role)}
              </Text>.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: t.accentPurple }]}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            >
              <Text style={[styles.primaryButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodyBold }]}>
                Go to My Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Error state */
          <View style={styles.center}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              {error?.code === 'NO_COACH_PROFILE' ? (
                <Building2 size={48} color="#EF4444" strokeWidth={1.5} />
              ) : (
                <AlertCircle size={48} color="#EF4444" strokeWidth={1.5} />
              )}
            </View>
            <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
              {error?.code === 'NO_COACH_PROFILE' ? 'Coach Profile Required' : 'Could not join'}
            </Text>
            <Text style={[styles.subtitle, { color: t.textSecondary, fontFamily: t.fontBody }]}>
              {error?.message || 'An unexpected error occurred.'}
            </Text>
            {error?.code === 'NO_COACH_PROFILE' && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: t.accentPurple }]}
                onPress={() => navigation.navigate('CreateCoachProfile')}
              >
                <Text style={[styles.primaryButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodyBold }]}>
                  Create Coach Profile
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: isDark ? t.border : '#E5E7EB' }]}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            >
              <Text style={[styles.secondaryButtonText, { color: t.textMuted, fontFamily: t.fontBodySemibold }]}>
                Go to App
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  center: { alignItems: 'center', gap: 16 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 24, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  loadingText: { marginTop: 16, fontSize: 15 },
  primaryButton: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, minWidth: 200, alignItems: 'center' },
  primaryButtonText: { fontSize: 15 },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, minWidth: 160, alignItems: 'center' },
  secondaryButtonText: { fontSize: 14 },
});
