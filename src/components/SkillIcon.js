import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getSkillIconComponent } from '../lib/skillIcons';
import { getSkillColor } from '../lib/skillTaxonomy';

/**
 * Renders the Lucide icon for a canonical skill ID.
 */
export default function SkillIcon({ skillId, size = 20, color, strokeWidth = 2, style }) {
  const Icon = getSkillIconComponent(skillId);
  const iconColor = color ?? getSkillColor(skillId);
  return <Icon size={size} color={iconColor} strokeWidth={strokeWidth} style={style} />;
}

/**
 * Skill icon inside a soft tinted rounded square (picker rows, focus cards, tags).
 */
export function SkillIconBadge({
  skillId,
  size = 20,
  containerSize = 40,
  borderRadius = 12,
  color,
  style,
}) {
  const iconColor = color ?? getSkillColor(skillId);
  const backgroundColor = iconColor + '18';

  return (
    <View
      style={[
        styles.badge,
        { width: containerSize, height: containerSize, borderRadius, backgroundColor },
        style,
      ]}
    >
      <SkillIcon skillId={skillId} size={size} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
