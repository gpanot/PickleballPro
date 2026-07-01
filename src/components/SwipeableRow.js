import React, { useRef, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DELETE_WIDTH = 80;
const SWIPE_THRESHOLD = DELETE_WIDTH * 0.55;

/**
 * Wraps `children` with a swipe-left-to-reveal-delete gesture.
 *
 * Props:
 *   onDelete  – called when the red delete button (or confirmed swipe) is pressed
 *   children  – the card content
 */
export default function SwipeableRow({ onDelete, deleteLabel = 'Remove', children }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const close = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 30,
    }).start(() => { isOpen.current = false; });
  }, [translateX]);

  const open = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -DELETE_WIDTH,
      useNativeDriver: true,
      speed: 30,
    }).start(() => { isOpen.current = true; });
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const newX = Math.min(0, Math.max(-DELETE_WIDTH, (isOpen.current ? -DELETE_WIDTH : 0) + g.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, g) => {
        const currentX = isOpen.current ? -DELETE_WIDTH + g.dx : g.dx;
        if (currentX < -SWIPE_THRESHOLD) {
          open();
        } else {
          close();
        }
      },
    })
  ).current;

  const handleDelete = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      isOpen.current = false;
      onDelete?.();
    });
  }, [translateX, onDelete]);

  return (
    <View style={styles.container}>
      {/* Delete action shown behind */}
      <View style={styles.deleteAction}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteLabel}>{deleteLabel}</Text>
        </TouchableOpacity>
      </View>
      {/* Swipeable card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 16,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: DELETE_WIDTH,
    flex: 1,
    gap: 4,
  },
  deleteLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
