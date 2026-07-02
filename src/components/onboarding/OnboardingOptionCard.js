import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ModernIcon from '../ModernIcon';
import { useOnboardingTheme } from './useOnboardingTheme';

/**
 * Unified selection card for goal / time / intensity / rating options.
 */
export default function OnboardingOptionCard({
  step,
  title,
  description,
  icon: Icon,
  iconName,
  selected,
  onPress,
  trailing,
  children,
}) {
  const ot = useOnboardingTheme(step);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: ot.surface,
          borderColor: selected ? ot.accent : ot.borderColor,
          shadowColor: selected ? ot.accent : '#000',
        },
        selected && styles.cardSelected,
        ot.t.cardShadow,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        {(Icon || iconName) && (
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: selected ? ot.accentMuted : ot.isDark ? ot.t.surfaceRaised : '#F8F9FA' },
            ]}
          >
            {Icon ? (
              <Icon size={20} color={selected ? ot.accent : ot.iconMuted} strokeWidth={2} />
            ) : (
              <ModernIcon name={iconName} size={28} color={selected ? ot.accent : ot.iconMuted} />
            )}
          </View>
        )}

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: selected ? ot.accent : ot.textPrimary, fontFamily: ot.t.fontBodySemibold },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.description,
                { color: selected ? ot.accent : ot.textSecondary, fontFamily: ot.t.fontBody },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {trailing}

        {selected && (
          <View style={[styles.check, { backgroundColor: ot.accent }]}>
            <ModernIcon name="checkmark" size={16} color={ot.primaryButtonTextColor} />
          </View>
        )}
      </View>

      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  cardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
