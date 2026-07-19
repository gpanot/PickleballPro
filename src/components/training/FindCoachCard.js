import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function FindCoachCard({ onPress, style }) {
  const { logbookTheme: t } = useTheme();
  const styles = React.useMemo(() => createStyles(t.training), [t]);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="search" size={24} color="#3B82F6" style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.title}>Find Your Coach</Text>
        <Text style={styles.description}>Browse certified coaches near you</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const createStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  icon: {
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: c.sectionTitle,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: c.sectionSubtitle,
    lineHeight: 20,
  },
});
