import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowLeft } from 'lucide-react-native';

function CollapsibleSubtitle({
  subtitle,
  collapsible,
  collapsedLines,
  tokens,
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [truncatable, setTruncatable] = React.useState(false);

  React.useEffect(() => {
    setExpanded(false);
    setTruncatable(false);
  }, [subtitle]);

  const textStyle = {
    color: tokens.textMuted,
    fontFamily: tokens.fontBody,
    fontSize: tokens.screenSubtitleSize,
    lineHeight: Math.round((tokens.screenSubtitleSize || 14) * 1.4),
  };

  if (!collapsible) {
    return <Text style={[styles.subtitle, textStyle]}>{subtitle}</Text>;
  }

  const handleMeasure = (event) => {
    const lineCount = event?.nativeEvent?.lines?.length ?? 0;
    setTruncatable(lineCount > collapsedLines);
  };

  return (
    <TouchableOpacity
      activeOpacity={truncatable ? 0.7 : 1}
      disabled={!truncatable}
      onPress={() => setExpanded((prev) => !prev)}
      hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
    >
      <View style={styles.subtitleWrap}>
        <Text
          style={[styles.subtitleMeasure, textStyle]}
          onTextLayout={handleMeasure}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {subtitle}
        </Text>

        <Text
          style={[
            styles.subtitle,
            textStyle,
            !expanded && truncatable && styles.subtitleCollapsed,
          ]}
          numberOfLines={!expanded && truncatable ? collapsedLines : undefined}
          ellipsizeMode="clip"
        >
          {subtitle}
          {expanded && truncatable ? (
            <Text style={[styles.subtitleMore, { color: tokens.textMuted }]}> less</Text>
          ) : null}
        </Text>

        {!expanded && truncatable ? (
          <Text style={[styles.subtitleMoreOverlay, textStyle, { backgroundColor: tokens.surface }]}>
            more
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/**
 * ScreenHeader — title row only. No safe-area or background handling.
 *
 * Props:
 *   tokens        — theme object from useTheme()
 *   isDark        — boolean
 *   title         — string (light: displayed as-is, dark: uppercased)
 *   titleDark     — optional override for dark uppercase title
 *   subtitle      — optional string shown below title
 *   eyebrow       — optional small all-caps label above title
 *   onBack        — if provided, renders a back chevron on the left
 *   rightAction   — optional React node anchored to the right
 *   topAccessory  — optional React node rendered above the title row (e.g. progress bar)
 *   children      — optional content rendered below the title row (tabs, search, filters)
 *   style         — optional extra style for the outer wrapper
 */
export default function ScreenHeader({
  tokens,
  isDark,
  title,
  titleDark,
  subtitle,
  subtitleCollapsible = false,
  subtitleCollapsedLines = 2,
  eyebrow,
  onBack,
  rightAction,
  topAccessory,
  children,
  style,
}) {
  const displayTitle = isDark ? (titleDark || title.toUpperCase()) : title;
  const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

  return (
    <View style={[
      styles.wrapper,
      {
        paddingHorizontal: tokens.headerPaddingH,
        paddingTop: tokens.headerPaddingTop,
        paddingBottom: tokens.headerPaddingBottom,
      },
      style,
    ]}>
      {topAccessory ? <View style={styles.topAccessory}>{topAccessory}</View> : null}

      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackIcon size={24} color={tokens.accentPurple} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.titleBlock, onBack && styles.titleBlockWithBack]}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, {
              color: isDark ? tokens.textMuted : '#C4A8D0',
              fontFamily: tokens.fontBodySemibold,
              letterSpacing: tokens.sectionLabelTracking,
            }]}>
              {eyebrow.toUpperCase()}
            </Text>
          ) : null}

          <Text style={[styles.title, {
            color: tokens.textPrimary,
            fontFamily: tokens.fontDisplay,
            fontSize: tokens.screenTitleSize,
            lineHeight: tokens.screenTitleLineHeight,
          }]}>
            {displayTitle}
          </Text>

          {subtitle ? (
            <CollapsibleSubtitle
              subtitle={subtitle}
              collapsible={subtitleCollapsible}
              collapsedLines={subtitleCollapsedLines}
              tokens={tokens}
            />
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : onBack ? (
          <View style={styles.backSpacer} />
        ) : null}
      </View>

      {children ? <View style={styles.childrenArea}>{children}</View> : null}
    </View>
  );
}

/**
 * ScreenHeaderShell — full top-bar shell: handles safe-area inset, background,
 * optional bottom border, and renders ScreenHeader inside.
 *
 * Props: all ScreenHeader props plus:
 *   background   — 'surface' (default) | 'bg' | 'transparent' | explicit color string
 *   bordered     — boolean, adds a bottom border (default true)
 *
 * Usage:
 *   <ScreenHeaderShell tokens={t} isDark={isDark} title="My Screen" onBack={...}>
 *     {optionalTabsOrSearchRow}
 *   </ScreenHeaderShell>
 */
export function ScreenHeaderShell({
  tokens,
  isDark,
  background = 'surface',
  bordered = true,
  // forwarded to ScreenHeader:
  title,
  titleDark,
  subtitle,
  subtitleCollapsible = false,
  subtitleCollapsedLines = 2,
  eyebrow,
  onBack,
  rightAction,
  topAccessory,
  children,
  style,
}) {
  const insets = useSafeAreaInsets();

  const bgColor =
    background === 'surface' ? tokens.surface :
    background === 'bg'      ? tokens.bg :
    background === 'transparent' ? 'transparent' :
    background; // raw color string

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
      style,
    ]}>
      <ScreenHeader
        tokens={tokens}
        isDark={isDark}
        title={title}
        titleDark={titleDark}
        subtitle={subtitle}
        subtitleCollapsible={subtitleCollapsible}
        subtitleCollapsedLines={subtitleCollapsedLines}
        eyebrow={eyebrow}
        onBack={onBack}
        rightAction={rightAction}
        topAccessory={topAccessory}
      >
        {children}
      </ScreenHeader>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  shell: {},
  topAccessory: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 6,
    marginLeft: -4,
  },
  backSpacer: {
    width: 28,
  },
  titleBlock: {
    flex: 1,
  },
  titleBlockWithBack: {
    marginLeft: 0,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {},
  subtitle: {
    marginTop: 3,
  },
  subtitleCollapsed: {
    paddingRight: 40,
  },
  subtitleWrap: {
    position: 'relative',
    width: '100%',
  },
  subtitleMeasure: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    zIndex: -1,
    pointerEvents: 'none',
  },
  subtitleMore: {
    fontWeight: '700',
  },
  subtitleMoreOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    fontWeight: '700',
    paddingLeft: 6,
  },
  rightAction: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childrenArea: {
    marginTop: 8,
  },
});
