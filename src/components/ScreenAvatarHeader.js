import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ScreenAvatarHeader
 *
 * A top-bar shell with a title on the left and a circular avatar on the right.
 * Handles safe-area inset, optional bottom border, and theme tokens.
 *
 * Props:
 *   tokens        — logbookTheme object from useTheme()
 *   isDark        — boolean
 *   title         — string displayed as the screen title
 *   user          — user object { name, avatarUrl }
 *   onAvatarPress — callback when avatar is tapped
 *   bordered      — boolean, adds a hairline bottom border (default false)
 *   background    — 'surface' | 'bg' | 'transparent' | raw color (default 'bg')
 *   children      — optional content rendered below the title row (tabs, search…)
 */
export default function ScreenAvatarHeader({
  tokens,
  isDark,
  title,
  user,
  onAvatarPress,
  bordered = false,
  background = 'bg',
  children,
}) {
  const insets = useSafeAreaInsets();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const bgColor =
    background === 'surface' ? tokens.surface :
    background === 'bg'      ? tokens.bg :
    background === 'transparent' ? 'transparent' :
    background;

  const borderColor = isDark ? tokens.border : '#E5E7EB';

  return (
    <View style={[
      styles.shell,
      {
        paddingTop: insets.top,
        backgroundColor: bgColor,
        borderBottomWidth: bordered ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: bordered ? borderColor : 'transparent',
      },
    ]}>
      <View style={[styles.row, { paddingHorizontal: tokens.headerPaddingH, paddingTop: tokens.headerPaddingTop, paddingBottom: tokens.headerPaddingBottom }]}>
        {/* Title */}
        <Text style={[
          styles.title,
          {
            color: tokens.textPrimary,
            fontFamily: tokens.fontDisplay,
            fontSize: tokens.screenTitleSize,
            lineHeight: tokens.screenTitleLineHeight,
          },
        ]}>
          {isDark ? title.toUpperCase() : title}
        </Text>

        {/* Avatar */}
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7} style={styles.avatarButton}>
          <View style={[
            styles.avatarContainer,
            {
              backgroundColor: isDark ? tokens.surfaceRaised : tokens.accentPurpleMuted || '#EDE9FE',
              borderWidth: 1,
              borderColor: isDark ? tokens.border : tokens.borderSubtle || '#DDD6FE',
            },
          ]}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={[styles.avatarText, { color: tokens.accentPurple, fontFamily: tokens.fontBodyBold }]}>
                {initials}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {children ? <View style={[styles.childrenArea, { paddingHorizontal: tokens.headerPaddingH }]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {},
  avatarButton: {
    padding: 2,
    marginLeft: 8,
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
  childrenArea: {
    paddingBottom: 8,
  },
});
