import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GameExplainerScreen from './GameExplainerScreen';

const { width, height } = Dimensions.get('window');

const VOLLEY_SHOT_OPTIONS = ['Dink/Drop', 'Block/Reset', 'Smash'];
const BACK_SHOT_OPTIONS = ['Serve', '3rd-Shot Drop', 'Return', 'Drive/Smash'];

export default function UITestGameScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { players: routePlayers } = route?.params || {};
  
  const [step, setStep] = useState(1); // 1 = Win selection, 2 = Error selection
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [history, setHistory] = useState([]);
  const [lastBackAction, setLastBackAction] = useState(null); // Stores the last back action for redo
  const [draggedItem, setDraggedItem] = useState(null); // { playerId, zone }
  const [currentDragPosition, setCurrentDragPosition] = useState({ x: 0, y: 0 });
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [currentShotOptions, setCurrentShotOptions] = useState(BACK_SHOT_OPTIONS);
  const [pendingWinShot, setPendingWinShot] = useState(null); // Stores step 1 selection
  const [showExplainer, setShowExplainer] = useState(false);
  const shotOptionsRefs = useRef({});
  const shotOptionsLayouts = useRef({});
  const zoneLayouts = useRef({});
  const zoneRefs = useRef({});
  const animatedValues = useRef({});
  const panResponders = useRef({});
  const shotOptionsRotateAnimations = useRef({}); // For flip animations

  // Transform players from route params (A1, A2, B1, B2 format) to internal format
  const players = routePlayers ? [
    { id: 'a1', name: routePlayers.A1?.name || 'Player A1', team: 'A', originalSlot: 'A1' },
    { id: 'a2', name: routePlayers.A2?.name || 'Player A2', team: 'A', originalSlot: 'A2' },
    { id: 'b1', name: routePlayers.B1?.name || 'Player B1', team: 'B', originalSlot: 'B1' },
    { id: 'b2', name: routePlayers.B2?.name || 'Player B2', team: 'B', originalSlot: 'B2' },
  ] : [
    // Fallback for testing without setup
    { id: 'a1', name: 'Alice', team: 'A', originalSlot: 'A1' },
    { id: 'a2', name: 'Bob', team: 'A', originalSlot: 'A2' },
    { id: 'b1', name: 'Tammy', team: 'B', originalSlot: 'B1' },
    { id: 'b2', name: 'Charlie', team: 'B', originalSlot: 'B2' },
  ];

  const zones = ['volley', 'back'];

  players.forEach(player => {
    zones.forEach(zone => {
      const key = `${player.id}_${zone}`;
      if (!animatedValues.current[key]) {
        animatedValues.current[key] = {
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          scale: new Animated.Value(1),
        };
      }
    });
  });

  // Remeasure shot options and zones when layout settles or options change
  useEffect(() => {
    // Initialize flip animations for shot options when options change
    currentShotOptions.forEach((shotType) => {
      if (!shotOptionsRotateAnimations.current[shotType]) {
        shotOptionsRotateAnimations.current[shotType] = new Animated.Value(0);
      }
    });

    // Clear old shot option layouts when options change
    shotOptionsLayouts.current = {};
    
    const remeasureAll = () => {
      // Measure shot options
      currentShotOptions.forEach(shotType => {
        shotOptionsRefs.current[shotType]?.measureInWindow((x, y, width, height) => {
          if (x !== undefined && y !== undefined) {
            shotOptionsLayouts.current[shotType] = { x, y, width, height };
            console.log(`Shot option ${shotType}:`, { x, y, width, height });
          }
        });
      });

      // Measure zones
      players.forEach(player => {
        zones.forEach(zone => {
          const key = `${player.id}_${zone}`;
          zoneRefs.current[key]?.measureInWindow((x, y, width, height) => {
            if (x !== undefined && y !== undefined) {
              zoneLayouts.current[key] = { x, y, width, height };
            }
          });
        });
      });
    };

    // Delay to ensure layout is complete - longer delay for reliable measurements
    const timer = setTimeout(remeasureAll, 800);
    return () => clearTimeout(timer);
  }, [currentShotOptions]);

  // Check if explainer should be shown on mount
  useEffect(() => {
    const checkExplainerStatus = async () => {
      try {
        const hasSeenExplainer = await AsyncStorage.getItem('hasSeenGameExplainer');
        if (!hasSeenExplainer) {
          setShowExplainer(true);
        }
      } catch (error) {
        console.error('Error checking explainer status:', error);
        // Show explainer on error to be safe
        setShowExplainer(true);
      }
    };
    checkExplainerStatus();
  }, []);

  const handlePointLogged = (playerId, zone, shotType) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Clear redo action when a new point is logged
    setLastBackAction(null);

    if (step === 1) {
      // Step 1: Record winning shot, move to step 2
      setPendingWinShot({
      player: playerId,
      zone,
      shotType,
        timestamp: Date.now(),
      });
      setStep(2);
      setFeedbackMessage('✅ Win recorded! Now select who made the error...');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } else if (step === 2) {
      // Step 2: Record error, complete the point
      const winRecord = {
        ...pendingWinShot,
        mode: 'win',
      };
      const errorRecord = {
        player: playerId,
        zone,
        shotType,
        mode: 'error',
      timestamp: Date.now(),
    };

      // Add both records to history as a single point
      const newPoint = { win: winRecord, error: errorRecord };
      const newHistory = [...history, newPoint];
      setHistory(newHistory);

      // Update score based on winning team
      const winningPlayer = players.find(p => p.id === pendingWinShot.player);
      let newScoreA = scoreA;
      let newScoreB = scoreB;
      
      if (winningPlayer) {
        if (winningPlayer.team === 'A') {
          newScoreA = scoreA + 1;
          setScoreA(newScoreA);
      } else {
          newScoreB = scoreB + 1;
          setScoreB(newScoreB);
      }
    }

      // Reset to step 1
      setPendingWinShot(null);
      setStep(1);
      
      // Trigger flip animation for shot cards
      flipShotCards();

      // Check if game is over (15 points)
      if (newScoreA >= 15 || newScoreB >= 15) {
        setTimeout(() => {
          navigateToSummary(newHistory, newScoreA, newScoreB);
        }, 500);
      }
    }
  };

  const navigateToSummary = (finalHistory, finalScoreA, finalScoreB) => {
    // Transform history into format expected by summary screen
    const allPoints = finalHistory.map((point, index) => {
      const winPlayer = players.find(p => p.id === point.win.player);
      const errorPlayer = players.find(p => p.id === point.error.player);
      
      // Map player IDs to slot format (A1, A2, B1, B2)
      const getSlot = (player) => {
        if (!player) return '?';
        const teamIndex = player.team === 'A' 
          ? players.filter(p => p.team === 'A').findIndex(p => p.id === player.id)
          : players.filter(p => p.team === 'B').findIndex(p => p.id === player.id);
        return `${player.team}${teamIndex + 1}`;
      };

      return {
        pointNumber: index + 1,
        winnerTeam: winPlayer?.team || '?',
        pointMaker: getSlot(winPlayer),
        errorMaker: getSlot(errorPlayer),
        errorShotType: point.error.shotType,
        errorShotTypeLabel: point.error.shotType,
        shotType: point.error.shotType,
        shotTypeLabel: point.error.shotType,
        timestamp: point.error.timestamp,
      };
    });

    // Map players back to slot format for summary screen
    const playersMap = routePlayers || {
      A1: players.find(p => p.id === 'a1'),
      A2: players.find(p => p.id === 'a2'),
      B1: players.find(p => p.id === 'b1'),
      B2: players.find(p => p.id === 'b2'),
    };

    navigation.navigate('SixPointSummary', {
      players: playersMap,
      points: allPoints.slice(0, 15), // First 15 points
      allPoints: allPoints,
      teamAScore: finalScoreA,
      teamBScore: finalScoreB,
    });
  };

  const handleBack = () => {
    if (step === 2 && pendingWinShot) {
      // In step 2: Go back to step 1, clear pending win shot
      const backupAction = {
        type: 'step2_to_step1',
        pendingWinShot: pendingWinShot,
        step: step,
      };
      setLastBackAction(backupAction);
      setPendingWinShot(null);
      setStep(1);
      setFeedbackMessage('');
    } else if (step === 1 && history.length > 0) {
      // In step 1: Undo last completed point
      const lastPoint = history[history.length - 1];
      const winningPlayer = players.find(p => p.id === lastPoint.win.player);
      
      const backupAction = {
        type: 'undo_point',
        point: lastPoint,
        step: step,
        pendingWinShot: pendingWinShot,
        scoreA: scoreA,
        scoreB: scoreB,
      };
      setLastBackAction(backupAction);
      
      handleUndo();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastPoint = history[history.length - 1];
    const winningPlayer = players.find(p => p.id === lastPoint.win.player);

    // Revert score
    if (winningPlayer) {
      if (winningPlayer.team === 'A') {
        setScoreA(prev => Math.max(0, prev - 1));
      } else {
        setScoreB(prev => Math.max(0, prev - 1));
      }
    }

    // Go back to step 2 with the pending win shot
    setPendingWinShot({
      player: lastPoint.win.player,
      zone: lastPoint.win.zone,
      shotType: lastPoint.win.shotType,
      timestamp: lastPoint.win.timestamp,
    });
    setStep(2);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (!lastBackAction) return;

    if (lastBackAction.type === 'step2_to_step1') {
      // Restore step 2 with the pending win shot
      setPendingWinShot(lastBackAction.pendingWinShot);
      setStep(2);
      setFeedbackMessage('✅ Win recorded! Now select who made the error...');
      setTimeout(() => setFeedbackMessage(''), 2000);
    } else if (lastBackAction.type === 'undo_point') {
      // Restore the undone point
      const restoredPoint = lastBackAction.point;
      setHistory(prev => [...prev, restoredPoint]);
      
      // Restore scores
      setScoreA(lastBackAction.scoreA);
      setScoreB(lastBackAction.scoreB);
      
      // Reset to step 1
      setPendingWinShot(null);
      setStep(1);
    }

    setLastBackAction(null);
  };

  const handleExitGame = () => {
    Alert.alert(
      'Quit Game?',
      'Do you really want to quit and terminate the game?\n(Game data will be lost)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  const flipShotCards = () => {
    // Create animated sequences for each shot option
    const animations = currentShotOptions.map((shotType) => {
      const animValue = shotOptionsRotateAnimations.current[shotType];
      if (!animValue) return null;

      return Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]);
    }).filter(Boolean);

    // Stagger the animations for a cascading flip effect
    Animated.stagger(50, animations).start();
  };

  const handleCloseExplainer = () => {
    setShowExplainer(false);
  };

  const handleDontShowExplainer = async () => {
    try {
      await AsyncStorage.setItem('hasSeenGameExplainer', 'true');
    } catch (error) {
      console.error('Error saving explainer status:', error);
    }
  };

  const isPointInShotOption = (x, y) => {
    for (const [shotType, layout] of Object.entries(shotOptionsLayouts.current)) {
      if (!layout) continue;

      const { x: optionX, y: optionY, width: optionWidth, height: optionHeight } = layout;

      if (
        x >= optionX &&
        x <= optionX + optionWidth &&
        y >= optionY &&
        y <= optionY + optionHeight
      ) {
        return shotType;
      }
    }

    return null;
  };

  const createPanResponder = (playerId, zone) => {
    const key = `${playerId}_${zone}`;
    const animValues = animatedValues.current[key];
    const player = players.find(p => p.id === playerId);

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;

        // Update shot options based on zone type
        const shotOptions = zone === 'volley' ? VOLLEY_SHOT_OPTIONS : BACK_SHOT_OPTIONS;
        setCurrentShotOptions(shotOptions);

        // Immediately remeasure shot options for accurate hit detection
        setTimeout(() => {
          shotOptions.forEach(shotType => {
            shotOptionsRefs.current[shotType]?.measureInWindow((x, y, width, height) => {
              if (x !== undefined && y !== undefined) {
                shotOptionsLayouts.current[shotType] = { x, y, width, height };
                console.log(`Remeasured ${shotType}:`, { x, y, width, height });
              }
            });
          });
        }, 100);

        setDraggedItem({ playerId, zone });
        setCurrentDragPosition({ x: pageX, y: pageY });
        const stepLabel = step === 1 ? 'Win' : 'Error';
        setFeedbackMessage(`[${stepLabel}] Dragging ${player?.name ?? 'Player'} ${zone === 'volley' ? 'Volley' : 'Baseline'}...`);

        Animated.spring(animValues.scale, {
          toValue: 1.08,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        const { pageX, pageY } = evt.nativeEvent;
        const { dx, dy } = gestureState;

        if (pageX === undefined || pageY === undefined) {
          return;
        }

        // Use gesture deltas for smooth movement
        animValues.x.setValue(dx);
        animValues.y.setValue(dy);

        setCurrentDragPosition({ x: pageX, y: pageY });

        const hoveredShot = isPointInShotOption(pageX, pageY);
        if (hoveredShot) {
          const prefix = step === 2 ? 'Bad ' : '';
          setFeedbackMessage(`✨ Did a ${prefix}${hoveredShot}!`);
        } else {
          const stepLabel = step === 1 ? 'Win' : 'Error';
          setFeedbackMessage(`[${stepLabel}] Dragging ${player?.name ?? 'Player'} ${zone === 'volley' ? 'Volley' : 'Baseline'}...`);
        }
      },
      onPanResponderRelease: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;

        const hoveredShot = isPointInShotOption(pageX, pageY);

        Animated.parallel([
          Animated.spring(animValues.scale, {
            toValue: 1,
            useNativeDriver: false,
          }),
          Animated.spring(animValues.x, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(animValues.y, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();

        if (hoveredShot) {
          handlePointLogged(playerId, zone, hoveredShot);
        }

        setDraggedItem(null);
        setFeedbackMessage('');
        setCurrentDragPosition({ x: 0, y: 0 });
        setCurrentShotOptions(BACK_SHOT_OPTIONS); // Reset to default options
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(animValues.scale, {
            toValue: 1,
            useNativeDriver: false,
          }),
          Animated.spring(animValues.x, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(animValues.y, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();

        setDraggedItem(null);
        setFeedbackMessage('');
        setCurrentDragPosition({ x: 0, y: 0 });
        setCurrentShotOptions(BACK_SHOT_OPTIONS); // Reset to default options
      },
    });
  };

  const isDragging = !!draggedItem;
  const hoveredShotType = isDragging
    ? isPointInShotOption(currentDragPosition.x, currentDragPosition.y)
    : null;

  // Determine the winning team to hide/fade in step 2
  const winningTeam = step === 2 && pendingWinShot 
    ? players.find(p => p.id === pendingWinShot.player)?.team 
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Score */}
      <View style={styles.headerWithScore}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleExitGame}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreTeamText, { color: '#14B8A6' }]}>Team A</Text>
          <Text style={[styles.scoreValue, { color: '#FFFFFF' }]}>{scoreA}</Text>
          <Text style={styles.scoreDivider}> - </Text>
          <Text style={[styles.scoreValue, { color: '#FFFFFF' }]}>{scoreB}</Text>
          <Text style={[styles.scoreTeamText, { color: '#3B82F6' }]}>Team B</Text>
        </View>
      </View>

      {/* Step Instructions */}
      <View style={styles.stepInstructionsBar}>
        <Text style={styles.stepInstructionsText}>
          {step === 1 
            ? ' Step 1: Select who made the winning shot' 
            : ' Step 2: Select who made the error'}
        </Text>
      </View>

      {/* Player Zones Grid */}
      <View style={styles.playersContainer}>
        {/* Team A */}
        <View style={[styles.teamContainer, { backgroundColor: 'rgba(20, 184, 166, 0.08)' }]}>
        <View style={styles.teamRow}>
          {players.filter(p => p.team === 'A').map(player => {
              const baseColor = '#14B8A6';

            return (
              <View key={player.id} style={styles.playerTile}>
                <View style={styles.playerHeader}> 
                    <Text style={[styles.playerName, { color: baseColor }]}>{player.name}</Text>
                </View>
                <View style={styles.zonesContainer}>
                  {['back', 'volley'].map((zone, index) => {
                    const key = `${player.id}_${zone}`;
                    const animValues = animatedValues.current[key];
                    const storedResponder = panResponders.current[key];
                      const responder = (!storedResponder || storedResponder.step !== step)
                      ? createPanResponder(player.id, zone)
                      : storedResponder.responder;

                      if (!storedResponder || storedResponder.step !== step) {
                        panResponders.current[key] = { responder, step };
                    }

                    const panResponder = responder;
                    const isDraggingThis = draggedItem?.playerId === player.id && draggedItem?.zone === zone;
                      const isWinningTeam = winningTeam && player.team === winningTeam;
                      const stepColorSolid = step === 1 ? '#8B5CF6' : '#EF4444';

                    return (
                      <Animated.View
                        key={zone}
                        ref={ref => {
                          if (ref) {
                            zoneRefs.current[key] = ref;
                          }
                        }}
                        style={[
                          styles.zoneButton,
                            isDraggingThis && {
                              backgroundColor: '#1E293B',
                              borderColor: stepColorSolid,
                              borderWidth: 1.5,
                              shadowColor: stepColorSolid,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.5,
                              shadowRadius: 8,
                            },
                          isDraggingThis && {
                            zIndex: 2000,
                            elevation: 15,
                          },
                            isWinningTeam && { opacity: 0.1 },
                          {
                            transform: [
                              { translateX: animValues?.x ?? 0 },
                              { translateY: animValues?.y ?? 0 },
                              { scale: animValues?.scale ?? 1 },
                            ],
                          },
                        ]}
                        {...panResponder?.panHandlers}
                          pointerEvents={isWinningTeam ? 'none' : 'auto'}
                      onLayout={() => {
                        setTimeout(() => {
                          zoneRefs.current[key]?.measureInWindow((x, y, width, height) => {
                            if (x !== undefined && y !== undefined) {
                              zoneLayouts.current[key] = { x, y, width, height };
                            }
                          });
                        }, 300);
                      }}
                      >
                        <Text style={styles.zoneLabel}>
                            {zone === 'volley' ? 'Volley' : 'Baseline'}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          </View>
        </View>

        {/* Shot Options Between Teams */}
        <View style={styles.shotOptionsContainer} pointerEvents="box-none">
          <View style={styles.shotOptionsGrid} pointerEvents="box-none">
            {currentShotOptions.map((shotType) => {
              const isHovered = hoveredShotType === shotType;
              const label = step === 2 ? `Bad ${shotType}` : shotType;
              const stepColor = step === 1 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'; // Purple for win, Red for error - with transparency
              const stepColorHover = step === 1 ? '#8B5CF6' : '#EF4444'; // Solid colors for hover
              const rotateAnim = shotOptionsRotateAnimations.current[shotType];

              // Create rotation interpolation for flip effect
              const rotate = rotateAnim?.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) || '0deg';

              return (
                <Animated.View
                  key={shotType}
                  ref={ref => {
                    if (ref) {
                      shotOptionsRefs.current[shotType] = ref;
                    }
                  }}
                  onLayout={() => {
                    setTimeout(() => {
                      shotOptionsRefs.current[shotType]?.measureInWindow((x, y, width, height) => {
                        if (x !== undefined && y !== undefined) {
                          shotOptionsLayouts.current[shotType] = { x, y, width, height };
                          console.log(`Shot option ${shotType} layout:`, { x, y, width, height });
                        }
                      });
                    }, 500);
                  }}
                  style={[
                    styles.shotOption,
                    { borderColor: stepColor },
                    isHovered && { backgroundColor: stepColorHover, borderColor: stepColorHover },
                    { transform: [{ rotate }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.shotOptionText,
                      isHovered && styles.shotOptionTextHovered,
                    ]}
                  >
                    {label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Team B */}
        <View style={[styles.teamContainer, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
        <View style={styles.teamRow}>
          {players.filter(p => p.team === 'B').map(player => {
            const baseColor = '#3B82F6';

            return (
              <View key={player.id} style={styles.playerTile}>
                <View style={styles.zonesContainer}>
                  {['volley', 'back'].map((zone, index) => {
                    const key = `${player.id}_${zone}`;
                    const animValues = animatedValues.current[key];
                    const storedResponder = panResponders.current[key];
                      const responder = (!storedResponder || storedResponder.step !== step)
                      ? createPanResponder(player.id, zone)
                      : storedResponder.responder;

                      if (!storedResponder || storedResponder.step !== step) {
                        panResponders.current[key] = { responder, step };
                    }

                    const panResponder = responder;
                    const isDraggingThis = draggedItem?.playerId === player.id && draggedItem?.zone === zone;
                      const isWinningTeam = winningTeam && player.team === winningTeam;
                      const stepColorSolid = step === 1 ? '#8B5CF6' : '#EF4444';

                    return (
                      <Animated.View
                        key={zone}
                        ref={ref => {
                          if (ref) {
                            zoneRefs.current[key] = ref;
                          }
                        }}
                        style={[
                          styles.zoneButton,
                            isDraggingThis && {
                              backgroundColor: '#1E293B',
                              borderColor: stepColorSolid,
                              borderWidth: 1.5,
                              shadowColor: stepColorSolid,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.5,
                              shadowRadius: 8,
                            },
                          isDraggingThis && {
                            zIndex: 2000,
                            elevation: 15,
                          },
                            isWinningTeam && { opacity: 0.1 },
                          {
                            transform: [
                              { translateX: animValues?.x ?? 0 },
                              { translateY: animValues?.y ?? 0 },
                              { scale: animValues?.scale ?? 1 },
                            ],
                          },
                        ]}
                        {...panResponder?.panHandlers}
                          pointerEvents={isWinningTeam ? 'none' : 'auto'}
                      onLayout={() => {
                        setTimeout(() => {
                          zoneRefs.current[key]?.measureInWindow((x, y, width, height) => {
                            if (x !== undefined && y !== undefined) {
                              zoneLayouts.current[key] = { x, y, width, height };
                            }
                          });
                        }, 300);
                      }}
                      >
                        <Text style={styles.zoneLabel}>
                            {zone === 'volley' ? 'Volley' : 'Baseline'}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
                <View style={[styles.playerHeader, { marginTop: 10, marginBottom: 0 }]}> 
                    <Text style={[styles.playerName, { color: baseColor }]}>{player.name}</Text>
                </View>
              </View>
            );
          })}
          </View>
        </View>
      </View>

      {/* Feedback Message */}
      {feedbackMessage && (
        <View style={[
          styles.feedbackBox,
          { 
            borderColor: step === 1 ? '#8B5CF6' : '#EF4444',
            shadowColor: step === 1 ? '#8B5CF6' : '#EF4444',
          }
        ]}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { bottom: 24 + insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (step === 1 && history.length === 0 || (step === 2 && !pendingWinShot)) && styles.actionButtonDisabled
          ]}
          onPress={handleBack}
          disabled={step === 1 && history.length === 0 || (step === 2 && !pendingWinShot)}
        >
          <Ionicons name="arrow-undo" size={16} color="#94A3B8" />
          <Text style={styles.actionButtonText}>Undo</Text>
        </TouchableOpacity>

        {lastBackAction && (
        <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRedo}
        >
            <Ionicons name="arrow-redo" size={16} color="#94A3B8" />
            <Text style={styles.actionButtonText}>Redo</Text>
        </TouchableOpacity>
        )}
      </View>

      {/* Explainer Modal */}
      <GameExplainerScreen
        visible={showExplainer}
        onClose={handleCloseExplainer}
        onDontShowAgain={handleDontShowExplainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  headerWithScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  scoreTeamText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreDivider: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stepInstructionsBar: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginTop: 8,
  },
  stepInstructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  playersContainer: {
    flex: 1,
    padding: 12,
    gap: 8,
    paddingBottom: 80,
  },
  teamContainer: {
    borderRadius: 20,
    padding: 16,
    flex: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 0,
    minHeight: 179,
    maxHeight: 204,
  },
  playerTile: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    height: 179,
  },
  playerHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  zonesContainer: {
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    gap: 6,
  },
  zoneButton: {
    flex: 1,
    width: '100%',
    minHeight: 58,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  shotOptionsContainer: {
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    flex: 0,
    height: 106,
    zIndex: 1,
  },
  shotOptionsGrid: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 0,
    flexWrap: 'nowrap',
  },
  shotOption: {
    flex: 1,
    height: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotOptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  shotOptionTextHovered: {
    color: '#FFFFFF',
  },
  feedbackBox: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  feedbackText: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

