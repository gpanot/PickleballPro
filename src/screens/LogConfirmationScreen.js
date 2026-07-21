import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function LogConfirmationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logbookTheme: t, isDark } = useTheme();

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const goToLogbook = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', state: { routes: [{ name: 'Logbook' }], index: 0 } }],
    });
  };

  const gradientColors = isDark ? ['#C5F22A', '#A8D422'] : t.gradientPrimary;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient colors={gradientColors} style={styles.heroGradient}>
          <View style={styles.successIconContainer}>
            <View style={[styles.ripple2, { backgroundColor: isDark ? 'rgba(197,242,42,0.06)' : 'rgba(180,138,202,0.08)' }]} />
            <View style={[styles.ripple1, { backgroundColor: isDark ? 'rgba(197,242,42,0.12)' : 'rgba(180,138,202,0.15)' }]} />
            <View style={[styles.successIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)' }]}>
              <CheckCircle size={48} color="#fff" strokeWidth={2} />
            </View>
          </View>

          <Text style={[styles.successTitle, { color: '#fff', fontFamily: t.fontDisplay }]}>
            {isDark ? 'SESSION SAVED!' : 'Session Saved!'}
          </Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 24,
            backgroundColor: t.bg,
          },
        ]}
      >
        <Text style={[styles.successMessage, { color: t.textSecondary, fontFamily: t.fontBody }]}>
          Great work! Your session has been logged. Keep it up!
        </Text>

        <LinearGradient
          colors={t.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ctaButton, { borderRadius: isDark ? 12 : 100 }]}
        >
          <TouchableOpacity onPress={goToLogbook} style={styles.ctaButtonInner} activeOpacity={0.85}>
            <Text
              style={[
                styles.ctaButtonText,
                {
                  fontFamily: isDark ? t.fontDisplay : t.fontBodySemibold,
                  color: isDark ? t.bg : '#FFFFFF',
                  letterSpacing: isDark ? 1 : 0,
                  textTransform: isDark ? 'uppercase' : 'none',
                },
              ]}
            >
              View My Logbook
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    flex: 1,
    minHeight: height * 0.52,
  },
  heroGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  successIconContainer: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ripple2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  ripple1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 28, textAlign: 'center' },
  successMessage: { fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22, maxWidth: 300 },
  ctaButton: {
    width: '100%',
    maxWidth: 320,
  },
  ctaButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  ctaButtonText: { fontSize: 16 },
});
