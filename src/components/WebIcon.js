import React from 'react';
import { Text, Platform } from 'react-native';

// Web-compatible icon component with modern icons
export default function WebIcon({ name, size = 24, color = '#000', style }) {
  // Modern icon mapping for better visual appearance
  const iconMap = {
    'fitness': '●',
    'fitness-outline': '○',
    'people': '●',
    'people-outline': '○',
    'home': '●',
    'home-outline': '○',
    'person': '●',
    'person-outline': '○',
    'checkmark-circle': '✅',
    'lock-closed': '🔒',
    'search': '🔍',
    'star': '⭐',
    'location-outline': '📍',
    'settings-outline': '⚙️',
    'help-circle-outline': '❓',
    'information-circle-outline': 'ℹ️',
    'log-out-outline': '🚪',
    'pencil': '✏️',
    'refresh': '🔄',
    'chevron-forward': '▶️',
    'chevron-back': '◀️',
    'target': '🎯',
    'time': '⏰',
    'play': '▶️',
    'pause': '⏸️',
    'close-circle': '❌',
    'share': '📤',
    'add': '+',
    'remove': '−',
    'close': '×',
    'calendar': '📅',
    'document-text': '📄',
  };

  if (Platform.OS === 'web') {
    return (
      <Text style={[{ fontSize: size, color }, style]}>
        {iconMap[name] || '•'}
      </Text>
    );
  }

  // For native platforms, use a simple text fallback
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
}
