import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getCurrentMonthLabel } from '../../lib/logbookHelpers';

export default function LogbookHeader({ tokens, user, onAvatarPress }) {
  const monthLabel = getCurrentMonthLabel();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isLight = tokens.bg !== '#0C0C0C';

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={[styles.monthLabel, {
          color: isLight ? '#C4A8D0' : tokens.textMuted,
          fontFamily: tokens.fontBodySemibold,
          letterSpacing: tokens.sectionLabelTracking,
        }]}>
          {monthLabel.toUpperCase()}
        </Text>
        <Text style={[
          styles.screenTitle,
          {
            color: tokens.textPrimary,
            fontFamily: tokens.fontDisplay,
            fontSize: tokens.screenTitleSize,
            lineHeight: tokens.screenTitleLineHeight,
          },
        ]}>
          {isLight ? 'Your Logbook' : 'LOGBOOK'}
        </Text>
      </View>

      <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7} style={styles.avatarButton}>
        <View style={[
          styles.avatarContainer,
          {
            backgroundColor: isLight ? tokens.accentPurpleMuted : tokens.surfaceRaised,
            borderWidth: 1,
            borderColor: isLight ? tokens.borderSubtle : tokens.border,
          },
        ]}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.avatarText, {
              color: isLight ? tokens.accentPurple : tokens.accentPurple,
              fontFamily: tokens.fontBodyBold,
            }]}>
              {initials}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleBlock: {
    flex: 1,
  },
  monthLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  screenTitle: {},
  avatarButton: {
    marginTop: 4,
    padding: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
