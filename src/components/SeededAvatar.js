import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Deterministic hue from a string — always produces the same color for a name
const AVATAR_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' }, // indigo
  { bg: '#FCE7F3', text: '#9D174D' }, // pink
  { bg: '#D1FAE5', text: '#065F46' }, // green
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#DBEAFE', text: '#1E40AF' }, // blue
  { bg: '#F3E8FF', text: '#6B21A8' }, // purple
  { bg: '#FFEDD5', text: '#9A3412' }, // orange
  { bg: '#F0FDF4', text: '#166534' }, // emerald
];

function seededIndex(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

/**
 * Shows a circular avatar image if `uri` is provided and loads successfully.
 * Falls back to a seeded-color circle with the initials derived from `name`.
 *
 * Props:
 *   uri       – remote image URL (optional)
 *   name      – display name used for initials + color seed
 *   size      – diameter in px (default 44)
 *   style     – extra View style overrides
 *   fontSize  – override initial font size (default size/2.2)
 */
export default function SeededAvatar({ uri, name = '', size = 44, style, fontSize }) {
  const [imgError, setImgError] = React.useState(false);
  const idx = seededIndex(name);
  const { bg, text } = AVATAR_COLORS[idx];

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const showImage = uri && !imgError;

  return (
    <View style={[circleStyle, style]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgError(true)}
        />
      ) : (
        <Text style={{ fontSize: fontSize ?? size / 2.5, fontWeight: '700', color: text }}>
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}
