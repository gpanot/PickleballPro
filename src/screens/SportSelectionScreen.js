import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPORTS } from '../lib/sportConfig';

// Currently available sports (slug must match a key in SPORTS)
const AVAILABLE_SPORTS = ['pickleball', 'padel'];

// Sport-specific imagery — add entries as new sports are added
const SPORT_IMAGES = {
  pickleball: require('../../assets/images/intro.png'),
  padel: require('../../assets/images/onboarding/slide_program.jpeg'),
};

export default function SportSelectionScreen({ onComplete }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (sportId) => {
    if (onComplete) onComplete(sportId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Choose your sport
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Pick your primary sport to personalise your experience
          </Text>
        </View>

        {/* Sport cards */}
        <View style={styles.cards}>
          {AVAILABLE_SPORTS.map((sportId) => {
            const sport = SPORTS[sportId];
            if (!sport) return null;
            return (
              <TouchableOpacity
                key={sportId}
                style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
                onPress={() => handleSelect(sportId)}
                activeOpacity={0.85}
              >
                <Image
                  source={SPORT_IMAGES[sportId]}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>
                    {sport.name}
                  </Text>
                  <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
                    Tap to get started
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coming soon placeholder — remove once more than 2 sports are live */}
        <Text style={[styles.comingSoon, { color: theme.colors.textSecondary }]}>
          More sports coming soon
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'stretch',
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  cards: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardBody: {
    padding: 20,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 14,
  },
  comingSoon: {
    marginTop: 32,
    fontSize: 14,
    textAlign: 'center',
  },
});
