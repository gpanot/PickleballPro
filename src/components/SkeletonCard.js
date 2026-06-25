import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';

function SkeletonBox({ style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.box, style, { opacity }]} />;
}

export function ProgramSkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBox style={styles.image} />
      <View style={styles.body}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.subtitleLine} />
        <SkeletonBox style={styles.pillLine} />
      </View>
    </View>
  );
}

export function CoachSkeletonCard() {
  return (
    <View style={styles.coachCard}>
      <SkeletonBox style={styles.avatar} />
      <View style={styles.coachBody}>
        <SkeletonBox style={styles.titleLine} />
        <SkeletonBox style={styles.subtitleLine} />
        <SkeletonBox style={{ height: 12, width: '60%', borderRadius: 6, marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Renders an Image with a shimmer placeholder while loading.
 * Drop-in replacement wherever a remote image is displayed.
 */
export function ImageWithSkeleton({ source, style, resizeMode = 'cover' }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loaded) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loaded, opacity]);

  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <View style={[{ overflow: 'hidden' }, flatStyle]}>
      {/* Shimmer shown while loading */}
      {!loaded && !error && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#E5E7EB', opacity },
          ]}
        />
      )}
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
        resizeMode={resizeMode}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(true); setError(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#E5E7EB', borderRadius: 8 },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  image: { width: '100%', height: 140, borderRadius: 0 },
  body: { padding: 12, gap: 8 },
  titleLine: { height: 14, width: '75%', borderRadius: 7 },
  subtitleLine: { height: 12, width: '50%', borderRadius: 6 },
  pillLine: { height: 20, width: '35%', borderRadius: 10, marginTop: 4 },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  coachBody: { flex: 1, gap: 8 },
});
