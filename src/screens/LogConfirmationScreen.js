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

  const gradientColors = isDark ? ['#C5F22A', '#A8D422'] : ['#B48ACA', '#CF8FAD'];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: t.bg }]}>
      <LinearGradient colors={gradientColors} style={styles.backgroundGradient} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Success icon */}
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
        <Text style={[styles.successMessage, { color: 'rgba(255,255,255,0.88)', fontFamily: t.fontBody }]}>
          Great work! Your session has been logged. Keep it up!
        </Text>

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)' }]}
          onPress={goToLogbook}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaButtonText, { fontFamily: t.fontBodySemibold }]}>
            View My Logbook
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  successTitle: { fontSize: 28, marginBottom: 10, textAlign: 'center' },
  successMessage: { fontSize: 15, textAlign: 'center', marginBottom: 48, lineHeight: 22 },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ctaButtonText: { fontSize: 16, color: '#fff' },
});
