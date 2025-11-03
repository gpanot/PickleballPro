import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function TestPlayerTile({ 
  player, 
  mode, 
  onPointLogged, 
  onDragStart, 
  onDragMove, 
  onDragEnd,
  isDragging,
}) {
  const [showFeedback, setShowFeedback] = useState(null);
  const initialPositionRef = useRef({ x: 0, y: 0 });
  const currentZoneRef = useRef(null);


  const getTouchCoordinates = (nativeEvent) => {
    const { pageX, pageY, moveX, moveY, clientX, clientY } = nativeEvent;
    const x = pageX ?? moveX ?? clientX;
    const y = pageY ?? moveY ?? clientY;
    if (x === undefined || y === undefined) {
      return null;
    }
    return { x, y };
  };

  const createPanResponderForZone = (zone) => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start dragging if moved more than a small threshold
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 5 || Math.abs(dy) > 5;
      },
      onPanResponderGrant: (evt) => {
        const coords = getTouchCoordinates(evt.nativeEvent);
        if (!coords || !onDragStart) {
          return true;
        }
        const { x, y } = coords;
        
        initialPositionRef.current = { x, y };
        currentZoneRef.current = zone;
        
        // Start drag immediately on touch
        onDragStart(player.id, zone, { x, y });
      },
      onPanResponderMove: (evt) => {
        const coords = getTouchCoordinates(evt.nativeEvent);
        if (!coords || !onDragMove) {
          return;
        }
        const { x, y } = coords;

        onDragMove({ x, y });
      },
      onPanResponderRelease: (evt) => {
        const coords = getTouchCoordinates(evt.nativeEvent);
        if (!coords || !onDragEnd) {
          return;
        }
        const { x, y } = coords;
        
        onDragEnd({ x, y });
          currentZoneRef.current = null;
      },
      onPanResponderTerminate: () => {
        if (onDragEnd && currentZoneRef.current) {
          // Use last known position or initial position
          onDragEnd(initialPositionRef.current);
          currentZoneRef.current = null;
        }
      },
    });
    
    return responder;
  };

  const panResponderVolley = useRef(
    createPanResponderForZone('volley')
  ).current;

  const panResponderBack = useRef(
    createPanResponderForZone('back')
  ).current;


  const baseColor = player.team === 'A' ? '#10B981' : '#3B82F6';
  const feedbackColor = mode === 'win' ? '#10B981' : '#EF4444';

  return (
    <View style={styles.container}>
      <View style={[styles.tile, { borderColor: baseColor }]}>
        {/* Player Name */}
        <View style={[styles.playerHeader, { backgroundColor: baseColor + '33' }]}>
          <View style={styles.playerHeaderContent}>
            <Text style={[styles.teamLabel, { color: baseColor }]}>
              {player.team}
            </Text>
            <Text style={styles.playerName}>{player.name}</Text>
          </View>
        </View>

        {/* Zones */}
        <View style={styles.zones}>
          {/* Volley Zone */}
          <View
            style={[
              styles.zone,
              styles.volleyZone,
              { backgroundColor: baseColor + '20' },
              isDragging && currentZoneRef.current === 'volley' && {
                backgroundColor: feedbackColor + '40',
              },
              showFeedback?.zone === 'volley' && {
                backgroundColor: feedbackColor + '50',
              },
            ]}
            {...panResponderVolley.panHandlers}
          >
            <Text style={styles.zoneLabel}>Volley (Net)</Text>
            <Text style={styles.zoneHint}>Drag to option</Text>

            {showFeedback?.zone === 'volley' && (
              <View style={styles.feedbackOverlay}>
                <Text style={styles.feedbackText}>
                  {showFeedback.shot} {mode === 'win' ? '✅' : '❌'}
                </Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Back Zone */}
          <View
            style={[
              styles.zone,
              styles.backZone,
              { backgroundColor: baseColor + '10' },
              isDragging && currentZoneRef.current === 'back' && {
                backgroundColor: feedbackColor + '40',
              },
              showFeedback?.zone === 'back' && {
                backgroundColor: feedbackColor + '50',
              },
            ]}
            {...panResponderBack.panHandlers}
          >
            <Text style={styles.zoneLabel}>Back (Baseline)</Text>
            <Text style={styles.zoneHint}>Drag to option</Text>

            {showFeedback?.zone === 'back' && (
              <View style={styles.feedbackOverlay}>
                <Text style={styles.feedbackText}>
                  {showFeedback.shot} {mode === 'win' ? '✅' : '❌'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  tile: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  playerHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  playerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  zones: {
    flex: 1,
  },
  zone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72,
    position: 'relative',
  },
  volleyZone: {
    // Volley zone styles
  },
  backZone: {
    // Back zone styles
  },
  zoneLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  zoneHint: {
    fontSize: 9,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

