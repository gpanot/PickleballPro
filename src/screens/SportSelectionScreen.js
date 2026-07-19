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
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { SPORTS } from '../lib/sportConfig';

// Currently available sports (slug must match a key in SPORTS)
const AVAILABLE_SPORTS = ['pickleball', 'padel'];

const SPORT_IMAGES = {
  pickleball: require('../../assets/images/onboarding/pickleball_intro.jpg'),
  padel: require('../../assets/images/onboarding/padel_intro.jpg'),
};

export default function SportSelectionScreen({ onComplete, onGoBack }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (sportId) => {
    if (onComplete) onComplete(sportId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {onGoBack ? (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 8, backgroundColor: theme.bgCard }]}
          onPress={onGoBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} strokeWidth={2.25} />
        </TouchableOpacity>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Choose your sport
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
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
                style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.primary }]}
                onPress={() => handleSelect(sportId)}
                activeOpacity={0.85}
              >
                <Image
                  source={SPORT_IMAGES[sportId]}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: theme.text }]}>
                    {sport.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coming soon placeholder — remove once more than 2 sports are live */}
        <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>
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
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  },
  comingSoon: {
    marginTop: 32,
    fontSize: 14,
    textAlign: 'center',
  },
});
