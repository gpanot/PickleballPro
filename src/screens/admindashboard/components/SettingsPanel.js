import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SportsPanel from './SportsPanel';

const SETTINGS_TABS = [
  { id: 'sports', label: 'Sports', icon: 'tennisball-outline' },
];

export default function SettingsPanel({ sessionRole, academyId }) {
  const [activeSettingsTab, setActiveSettingsTab] = React.useState('sports');
  const isSuperAdmin = !academyId && sessionRole !== 'coach' && sessionRole !== 'manager';

  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={40} color="#D1D5DB" />
          <Text style={styles.lockedText}>Settings are only available to superadmins.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {SETTINGS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeSettingsTab === tab.id && styles.tabActive]}
            onPress={() => setActiveSettingsTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeSettingsTab === tab.id ? '#18181b' : '#6B7280'}
            />
            <Text style={[styles.tabLabel, activeSettingsTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        {activeSettingsTab === 'sports' && (
          <SportsPanel sessionRole={sessionRole} academyId={academyId} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  lockedText: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 280 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  tabActive: { borderBottomColor: '#18181b' },
  tabLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabLabelActive: { color: '#18181b', fontWeight: '600' },
  content: { flex: 1 },
});
