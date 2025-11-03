import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SHOT_POSITIONS = [
  { angle: -90, label: 'Serve' },      // Top
  { angle: 0, label: 'Smash' },        // Right
  { angle: 90, label: 'Drop' },        // Bottom
  { angle: 180, label: 'Return' },      // Left
];

const RADIUS = 100;
const MIN_DISTANCE = 40;

export default function TestRadialMenu({ mode, position, touchPosition, hoveredShot, onCancel }) {
  const cancelTimeoutRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate menu appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for center circle
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }
      pulseAnimation.stop();
    };
  }, []);

  const currentTouch = touchPosition || position;
  const deltaX = currentTouch.x - position.x;
  const deltaY = currentTouch.y - position.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

  const getSegmentPosition = (index) => {
    const angle = SHOT_POSITIONS[index].angle;
    const radian = (angle * Math.PI) / 180;
    return {
      x: position.x + Math.cos(radian) * RADIUS,
      y: position.y + Math.sin(radian) * RADIUS,
    };
  };

  const getShotAtIndex = (index) => {
    return SHOT_POSITIONS[index].label;
  };

  const themeColor = mode === 'win' ? '#10B981' : '#EF4444';
  const themeColorLight = mode === 'win' ? '#34D399' : '#F87171';

  return (
    <Animated.View 
      style={[styles.overlay, { opacity: fadeAnim }]}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Center pulse */}
      <View style={[styles.centerPulse, { left: position.x - 32, top: position.y - 32 }]}>
        <Animated.View
          style={[
            styles.centerCircle,
            {
              backgroundColor: themeColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.centerRipple,
            {
              borderColor: themeColorLight,
              opacity: fadeAnim,
            },
          ]}
        />
      </View>

      {/* Shot segments */}
      {[0, 1, 2, 3].map((index) => {
        const pos = getSegmentPosition(index);
        const shot = getShotAtIndex(index);
        const isHovered = hoveredShot === shot;
        const label = mode === 'error' ? `Bad ${shot}` : shot;

        return (
          <View
            key={shot}
            style={[
              styles.menuItem,
              {
                left: pos.x - 48,
                top: pos.y - 24,
                backgroundColor: isHovered ? themeColorLight : themeColor,
                transform: [{ scale: isHovered ? 1.15 : 1 }],
              },
            ]}
          >
            <Text style={styles.menuItemText}>{label}</Text>
            {isHovered && (
              <View
                style={[
                  styles.menuItemGlow,
                  { backgroundColor: themeColorLight },
                ]}
              />
            )}
          </View>
        );
      })}

      {/* Visual indicator line from center to current touch */}
      {hoveredShot && distance > MIN_DISTANCE && (
        <View
          style={[
            styles.indicatorLine,
            {
              left: position.x,
              top: position.y,
              width: 2,
              height: distance,
              backgroundColor: themeColor,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'top center',
            },
          ]}
        />
      )}

      {/* Instruction text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {hoveredShot
            ? `Release to select ${mode === 'error' ? 'Bad ' : ''}${hoveredShot}`
            : 'Slide finger to select shot'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  centerPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'absolute',
    opacity: 0.8,
  },
  centerRipple: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    position: 'absolute',
    opacity: 0.8,
  },
  menuItem: {
    position: 'absolute',
    width: 96,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  menuItemGlow: {
    position: 'absolute',
    width: 96,
    height: 48,
    borderRadius: 12,
    opacity: 0.5,
    zIndex: -1,
    blur: 8,
  },
  indicatorLine: {
    position: 'absolute',
    opacity: 0.5,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 128,
    left: width / 2 - 120,
    width: 240,
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

