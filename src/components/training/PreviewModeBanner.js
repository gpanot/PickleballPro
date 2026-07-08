import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

function ShineAddButton({ onPress, btnColor }) {
  const shineX = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const runShine = () => {
      shineX.setValue(-40);
      Animated.timing(shineX, {
        toValue: 80,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    };

    runShine();
    const interval = setInterval(runShine, 5000);
    return () => clearInterval(interval);
  }, [shineX]);

  return (
    <TouchableOpacity style={[styles.addBtn, { backgroundColor: btnColor }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.addBtnText}>Add</Text>
      <Animated.View
        pointerEvents="none"
        style={[styles.shine, { transform: [{ translateX: shineX }] }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.65)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shineGradient}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

/**
 * Amber banner shown at the top of ProgramDetail when source === 'library'.
 * Dismissible per session (no storage — returns on next open).
 *
 * Props:
 *   onEnroll {function} – optional shortcut to open EnrollmentConfirmSheet
 */
export default function PreviewModeBanner({ onEnroll }) {
  const { logbookTheme: t } = useTheme();
  const c = t.training;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={[styles.banner, { backgroundColor: c.previewBannerBg, borderBottomColor: c.previewBannerBorder }]}>
      <View style={styles.row}>
        <Eye size={18} color={c.previewBannerText} strokeWidth={2} />
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: c.previewBannerText }]}>Preview mode</Text>
          <Text style={[styles.sub, { color: c.previewBannerSubtext }]}>Add to My Training to log progress</Text>
        </View>
        {onEnroll && <ShineAddButton onPress={onEnroll} btnColor={c.previewBannerBtn} />}
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          style={styles.closeHit}
        >
          <X size={16} color={c.previewBannerText} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textBlock: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 1 },
  addBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', zIndex: 1 },
  shine: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 22,
    zIndex: 2,
  },
  shineGradient: {
    flex: 1,
    width: '100%',
  },
  closeHit: { paddingLeft: 4 },
});
