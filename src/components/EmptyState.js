import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable empty-state illustration block.
 *
 * Props:
 *   Icon       – optional Lucide icon component (preferred over emoji)
 *   emoji      – legacy emoji fallback (avoid in new code)
 *   title      – bold heading
 *   subtitle   – descriptive body copy
 *   ctaLabel   – optional CTA button label
 *   onCta      – optional CTA handler
 *   style      – outer container overrides
 */
export default function EmptyState({ Icon, emoji, title, subtitle, ctaLabel, onCta, style }) {
  const { logbookTheme: t, isDark } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.iconCircle,
        {
          backgroundColor: isDark ? t.accentPurpleMuted : (t.accentPurpleMuted || '#EDE9FE'),
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? t.border : 'transparent',
        },
      ]}>
        {Icon ? (
          <Icon size={40} color={t.accentPurple} strokeWidth={1.75} />
        ) : (
          <Text style={styles.emoji}>{emoji || '📭'}</Text>
        )}
      </View>

      <Text style={[styles.title, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
        {title || 'Nothing here yet'}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: t.textSecondary, fontFamily: t.fontBody }]}>
          {subtitle}
        </Text>
      ) : null}

      {ctaLabel && onCta ? (
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: t.accentPurple, shadowColor: t.accentPurple }]}
          onPress={onCta}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaLabel, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodyBold }]}>
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
