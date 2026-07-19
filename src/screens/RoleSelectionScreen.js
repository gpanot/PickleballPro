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
import { User, GraduationCap, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const ROLES = [
  {
    id: 'player',
    name: 'Player',
    hint: 'Train, track progress,\njoin a program',
    image: require('../../assets/images/onboarding/student_intro.jpg'),
    Icon: User,
    highlighted: true,
  },
  {
    id: 'coach',
    name: 'Coach',
    hint: 'Build your academy, manage students',
    image: require('../../assets/images/onboarding/coach_intro.jpg'),
    Icon: GraduationCap,
    highlighted: false,
  },
];

export default function RoleSelectionScreen({ onComplete }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            How will you use AcademyPro?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            This sets up the right experience for you
          </Text>
        </View>

        <View style={styles.cards}>
          {ROLES.map((role) => {
            const RoleIcon = role.Icon;
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.bgCard,
                    borderColor: role.highlighted ? theme.primary : theme.border,
                    borderWidth: role.highlighted ? 2 : 1,
                  },
                ]}
                onPress={() => onComplete?.(role.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardImageWrap} pointerEvents="none">
                  <Image
                    source={role.image}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>

                <View style={[styles.cardLeft, { backgroundColor: theme.bgCard }]}>
                  <View>
                    <View style={[styles.iconBadge, { backgroundColor: theme.primary }]}>
                      <RoleIcon size={20} color="#FFFFFF" strokeWidth={2.25} />
                    </View>
                    <Text style={[styles.cardName, { color: theme.text }]}>
                      {role.name}
                    </Text>
                    <Text style={[styles.cardHint, { color: theme.textSecondary }]}>
                      {role.hint}
                    </Text>
                  </View>

                  <View style={[styles.arrowButton, { backgroundColor: theme.primaryLight }]}>
                    <ChevronRight size={18} color={theme.primary} strokeWidth={2.5} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
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
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 247,
    position: 'relative',
  },
  cardLeft: {
    flex: 1,
    zIndex: 2,
    maxWidth: '58%',
    minHeight: 247,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  cardImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
