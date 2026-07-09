import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hand, X } from 'lucide-react-native';

const WELCOMED_KEY = '@academypro_myTrainingWelcomed';
const LEGACY_WELCOMED_KEY = '@pickleHero_myTrainingWelcomed';

/**
 * One-time welcome card shown above the My Training empty state after onboarding.
 * Dismissed via AsyncStorage so it only appears once.
 *
 * Props:
 *   force {boolean} – show even if already dismissed (for testing)
 */
export default function WelcomeCard({ force = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (force) { setVisible(true); return; }
    const checkWelcomed = async () => {
      let val = await AsyncStorage.getItem(WELCOMED_KEY);
      if (val === null) {
        val = await AsyncStorage.getItem(LEGACY_WELCOMED_KEY);
        if (val !== null) {
          await AsyncStorage.setItem(WELCOMED_KEY, val);
        }
      }
      if (!val) setVisible(true);
    };
    checkWelcomed();
  }, [force]);

  const dismiss = async () => {
    setVisible(false);
    await AsyncStorage.setItem(WELCOMED_KEY, 'true');
  };

  if (!visible) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Hand size={24} color="#4338CA" strokeWidth={2} />
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <X size={18} color="#6B7280" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Your program is ready</Text>
      <Text style={styles.body}>
        Start your first session — progress and mood are saved every time you log.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
});
