import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Reusable empty-state illustration block.
 *
 * Props:
 *   emoji      – large emoji used as the illustration (e.g. '🏓')
 *   title      – bold heading
 *   subtitle   – descriptive body copy
 *   ctaLabel   – optional CTA button label
 *   onCta      – optional CTA handler
 *   style      – outer container overrides
 */
export default function EmptyState({ emoji, title, subtitle, ctaLabel, onCta, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* Illustration circle */}
      <View style={styles.iconCircle}>
        <Text style={styles.emoji}>{emoji || '📭'}</Text>
      </View>

      <Text style={styles.title}>{title || 'Nothing here yet'}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {ctaLabel && onCta ? (
        <TouchableOpacity style={styles.ctaButton} onPress={onCta} activeOpacity={0.85}>
          <Text style={styles.ctaLabel}>{ctaLabel}</Text>
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
    backgroundColor: '#EEF2FF',
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
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
