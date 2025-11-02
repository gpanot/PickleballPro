import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Winning shot types (for point maker)
const WINNING_SHOT_TYPES = [
  { id: 'skip', icon: '⏭️', label: 'Skip', color: '#6B7280' },
  { id: 'serve', icon: '🎯', label: 'Serve', color: '#3B82F6' },
  { id: 'drop', icon: '🏓', label: 'Drop', color: '#10B981' },
  { id: 'return', icon: '↩️', label: 'Return', color: '#8B5CF6' },
  { id: 'smash', icon: '🔥', label: 'Smash', color: '#EF4444' },
  { id: 'attack', icon: '⚡', label: 'Attack', color: '#F59E0B' },
];

// Error shot types (for error maker)
const ERROR_SHOT_TYPES = [
  { id: 'skip', icon: '⏭️', label: 'Skip', color: '#6B7280' },
  { id: 'serve', icon: '🎯', label: 'Bad Serve', color: '#3B82F6' },
  { id: 'drop', icon: '🏓', label: 'Bad Drop', color: '#10B981' },
  { id: 'return', icon: '↩️', label: 'Bad Return', color: '#8B5CF6' },
  { id: 'smash', icon: '🔥', label: 'Bad Smash', color: '#EF4444' },
  { id: 'out', icon: '⬅️', label: 'Out', color: '#9CA3AF' },
];

// Keep SHOT_TYPES for backward compatibility in summary screen
const SHOT_TYPES = ERROR_SHOT_TYPES;

export default function SixPointTrackerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { players } = route.params || { players: { A1: null, A2: null, B1: null, B2: null } };
  
  const [currentStep, setCurrentStep] = useState(1); // 1: team win, 2: point maker, 3: point shot type, 4: error maker, 5: error shot type
  const [selectedTeam, setSelectedTeam] = useState(null); // 'A' or 'B'
  const [pointMaker, setPointMaker] = useState(null); // 'A1', 'A2', 'B1', 'B2'
  const [pointShotType, setPointShotType] = useState(null); // Shot type for winning point
  const [errorMaker, setErrorMaker] = useState(null);
  const [errorShotType, setErrorShotType] = useState(null); // Shot type for error
  const [points, setPoints] = useState([]); // Array of point data
  const [currentPoint, setCurrentPoint] = useState(1); // 1-6
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [highlightAnimations, setHighlightAnimations] = useState({});
  const scrollViewRef = React.useRef(null);

  // Initialize highlight animations for each player
  useEffect(() => {
    const anims = {};
    ['A1', 'A2', 'B1', 'B2'].forEach(slot => {
      anims[slot] = {
        green: new Animated.Value(0),
        red: new Animated.Value(0),
      };
    });
    setHighlightAnimations(anims);
  }, []);

  const flashGreen = (slot) => {
    if (highlightAnimations[slot]) {
      Animated.sequence([
        Animated.timing(highlightAnimations[slot].green, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnimations[slot].green, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const flashRed = (slot) => {
    if (highlightAnimations[slot]) {
      Animated.sequence([
        Animated.timing(highlightAnimations[slot].red, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnimations[slot].red, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setCurrentStep(2);
  };

  const handlePointMakerSelect = (slot) => {
    // Ensure point maker is from winning team
    if (selectedTeam === 'A' && !['A1', 'A2'].includes(slot)) return;
    if (selectedTeam === 'B' && !['B1', 'B2'].includes(slot)) return;
    
    setPointMaker(slot);
    flashGreen(slot);
    setCurrentStep(3); // Move to point shot type selection
  };

  const handlePointMakerChange = (slot) => {
    // Change point maker during shot type selection (step 3)
    // Ensure point maker is from winning team
    if (selectedTeam === 'A' && !['A1', 'A2'].includes(slot)) return;
    if (selectedTeam === 'B' && !['B1', 'B2'].includes(slot)) return;
    
    // Clear previous green flash
    if (pointMaker && highlightAnimations[pointMaker]?.green) {
      highlightAnimations[pointMaker].green.setValue(0);
    }
    
    setPointMaker(slot);
    setPointShotType(null); // Clear shot type when changing player
    flashGreen(slot);
    // Stay on step 3 (shot type selection)
  };

  const handlePointShotTypeSelect = (type) => {
    setPointShotType(type);
    setCurrentStep(4); // Move to error maker selection
  };

  const handleErrorMakerSelect = (slot) => {
    // Error maker must be from losing team
    if (selectedTeam === 'A' && !['B1', 'B2'].includes(slot)) return;
    if (selectedTeam === 'B' && !['A1', 'A2'].includes(slot)) return;
    
    setErrorMaker(slot);
    flashRed(slot);
    setCurrentStep(5); // Move to error shot type selection
    
    // Scroll down to show error type options after a short delay
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleErrorMakerChange = (slot) => {
    // Change error maker during error shot type selection (step 5)
    // Error maker must be from losing team
    if (selectedTeam === 'A' && !['B1', 'B2'].includes(slot)) return;
    if (selectedTeam === 'B' && !['A1', 'A2'].includes(slot)) return;
    
    // Clear previous red flash
    if (errorMaker && highlightAnimations[errorMaker]?.red) {
      highlightAnimations[errorMaker].red.setValue(0);
    }
    
    setErrorMaker(slot);
    setErrorShotType(null); // Clear shot type when changing player
    flashRed(slot);
    // Stay on step 5 (error shot type selection)
  };

  const handleErrorShotTypeSelect = (type) => {
    setErrorShotType(type);
  };

  const handleGoBack = () => {
    if (currentStep === 2) {
      // Go back to team selection
      setCurrentStep(1);
      setSelectedTeam(null);
      setPointMaker(null);
      setPointShotType(null);
    } else if (currentStep === 3) {
      // Go back to point maker selection
      setCurrentStep(2);
      setPointShotType(null);
    } else if (currentStep === 4) {
      // Go back to point shot type selection
      setCurrentStep(3);
      setErrorMaker(null);
      setErrorShotType(null);
    } else if (currentStep === 5) {
      // Go back to error maker selection
      setCurrentStep(4);
      setErrorShotType(null);
    }
  };

  const handleConfirmPoint = () => {
    if (!selectedTeam || !pointMaker || !pointShotType || !errorMaker || !errorShotType) return;

    const pointData = {
      pointNumber: currentPoint,
      winnerTeam: selectedTeam,
      pointMaker,
      pointShotType,
      pointShotTypeLabel: WINNING_SHOT_TYPES.find(s => s.id === pointShotType)?.label || pointShotType,
      errorMaker,
      errorShotType,
      errorShotTypeLabel: ERROR_SHOT_TYPES.find(s => s.id === errorShotType)?.label || errorShotType,
      timestamp: Date.now(),
    };

    setPoints([...points, pointData]);
    
    // Update scores and check if game is over
    const newTeamAScore = selectedTeam === 'A' ? teamAScore + 1 : teamAScore;
    const newTeamBScore = selectedTeam === 'B' ? teamBScore + 1 : teamBScore;
    
    // Scroll back to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    if (newTeamAScore >= 6 || newTeamBScore >= 6) {
      // Game over - navigate to summary
      setTeamAScore(newTeamAScore);
      setTeamBScore(newTeamBScore);
      navigation.navigate('SixPointSummary', {
        players,
        points: [...points, pointData],
        allPoints: [...points, pointData],
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
      });
    } else {
      // Continue game - reset for next point
      setTeamAScore(newTeamAScore);
      setTeamBScore(newTeamBScore);
      setCurrentPoint(currentPoint + 1);
      setCurrentStep(1);
      setSelectedTeam(null);
      setPointMaker(null);
      setPointShotType(null);
      setErrorMaker(null);
      setErrorShotType(null);
    }
  };

  const renderPlayerSlot = (slot, isTeamA) => {
    const player = players[slot];
    const isSelected = pointMaker === slot || errorMaker === slot;
    const isPointMaker = pointMaker === slot;
    const isErrorMaker = errorMaker === slot;
    
    // Grey out unselected player from winning team when point maker is selected
    const isUnselectedFromWinningTeam = 
      currentStep === 3 && 
      selectedTeam && 
      pointMaker && 
      ((selectedTeam === 'A' && isTeamA && pointMaker !== slot) || 
       (selectedTeam === 'B' && !isTeamA && pointMaker !== slot));
    
    // Grey out unselected player from losing team when error maker is selected
    const isUnselectedFromLosingTeam = 
      currentStep === 5 && 
      selectedTeam && 
      errorMaker && 
      ((selectedTeam === 'A' && !isTeamA && errorMaker !== slot) || 
       (selectedTeam === 'B' && isTeamA && errorMaker !== slot));
    
    // Determine if this slot should be disabled
    // Disable player slots during step 1 (team selection) so tapping court sides works
    let isDisabled = !player || currentStep === 1 || (currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5);
    if (currentStep === 2 && selectedTeam) {
      // Point maker must be from winning team
      if (selectedTeam === 'A' && !isTeamA) isDisabled = true;
      if (selectedTeam === 'B' && isTeamA) isDisabled = true;
    }
    if (currentStep === 3 && selectedTeam) {
      // During shot type selection, allow changing point maker (must be from winning team)
      if (selectedTeam === 'A' && !isTeamA) isDisabled = true;
      if (selectedTeam === 'B' && isTeamA) isDisabled = true;
    }
    if (currentStep === 4 && selectedTeam) {
      // Error maker must be from losing team
      if (selectedTeam === 'A' && isTeamA) isDisabled = true;
      if (selectedTeam === 'B' && !isTeamA) isDisabled = true;
    }
    if (currentStep === 5 && selectedTeam) {
      // During error shot type selection, allow changing error maker (must be from losing team)
      if (selectedTeam === 'A' && isTeamA) isDisabled = true;
      if (selectedTeam === 'B' && !isTeamA) isDisabled = true;
    }
    
    const greenOpacity = highlightAnimations[slot]?.green || new Animated.Value(0);
    const redOpacity = highlightAnimations[slot]?.red || new Animated.Value(0);

    // Get shot icon for this point if already selected
    const previousPoint = points.find(p => p.pointMaker === slot || p.errorMaker === slot);
    let shotIcon = null;
    if (previousPoint) {
      if (previousPoint.pointMaker === slot && previousPoint.pointShotType) {
        shotIcon = WINNING_SHOT_TYPES.find(s => s.id === previousPoint.pointShotType)?.icon || null;
      } else if (previousPoint.errorMaker === slot && previousPoint.errorShotType) {
        shotIcon = ERROR_SHOT_TYPES.find(s => s.id === previousPoint.errorShotType)?.icon || null;
      }
    }

    return (
      <TouchableOpacity
        style={styles.playerSlot}
        onPress={() => {
          if (currentStep === 2) {
            handlePointMakerSelect(slot);
          } else if (currentStep === 3 && selectedTeam) {
            // Allow changing point maker during shot type selection
            if ((selectedTeam === 'A' && isTeamA) || (selectedTeam === 'B' && !isTeamA)) {
              handlePointMakerChange(slot);
            }
          } else if (currentStep === 4) {
            handleErrorMakerSelect(slot);
          } else if (currentStep === 5 && selectedTeam) {
            // Allow changing error maker during error shot type selection
            if ((selectedTeam === 'A' && !isTeamA) || (selectedTeam === 'B' && isTeamA)) {
              handleErrorMakerChange(slot);
            }
          }
        }}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.circleContainer}>
          <View
            style={[
              styles.slotCircle,
              isTeamA ? styles.teamACircle : styles.teamBCircle,
              isSelected && (isPointMaker ? styles.winnerCircle : styles.errorCircle),
              isDisabled && styles.slotCircleDisabled,
              (isUnselectedFromWinningTeam || isUnselectedFromLosingTeam) && styles.slotCircleGreyed,
            ]}
          >
            <Animated.View
              style={[
                styles.circleOverlay,
                {
                  opacity: greenOpacity,
                  backgroundColor: '#10B981',
                },
              ]}
            />
            <Animated.View
              style={[
                styles.circleOverlay,
                {
                  opacity: redOpacity,
                  backgroundColor: '#E74C3C',
                },
              ]}
            />
            <Text style={styles.slotCircleText}>{slot}</Text>
          </View>
          {shotIcon && (
            <View style={styles.shotIconBadge}>
              <Text style={styles.shotIconText}>{shotIcon}</Text>
            </View>
          )}
        </View>
          {player ? (
          <Text style={[
            styles.playerName,
            isDisabled && styles.playerNameDisabled
          ]} numberOfLines={1}>
            {player.name}
          </Text>
        ) : (
          <Text style={styles.emptySlotText}>{slot}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderStepPrompt = () => {
    switch (currentStep) {
      case 1:
        return <Text style={styles.promptText}>Who won the point?</Text>;
      case 2:
        return <Text style={styles.promptText}>Who made the winning shot?</Text>;
      case 3:
        return <Text style={styles.promptText}>Winning Shot Type</Text>;
      case 4:
        return <Text style={styles.promptText}>Who made the error?</Text>;
      case 5:
        return <Text style={styles.promptText}>Error Type</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>6-Point Tracker</Text>
          <Text style={styles.headerSubtext}>Tap winner, point maker, and error maker</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Scoreboard */}
        <View style={styles.scoreboardContainer}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, teamAScore > teamBScore && styles.scoreValueLeading]}>
              {teamAScore}
            </Text>
            <Text style={styles.scoreLabel}>Team A</Text>
          </View>
          <Text style={styles.scoreDivider}>-</Text>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreValue, teamBScore > teamAScore && styles.scoreValueLeading]}>
              {teamBScore}
            </Text>
            <Text style={styles.scoreLabel}>Team B</Text>
          </View>
        </View>

        {/* Prompt with Back Button */}
        <View style={styles.promptContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handleGoBack}
            >
              <Ionicons name="chevron-back" size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
          <Text style={styles.promptText}>{renderStepPrompt()}</Text>
        </View>

        {/* Court Grid */}
        <View style={styles.courtContainer}>
          {/* Team A Row - Tappable when step 1 */}
          <TouchableOpacity
            style={[
              styles.teamRow,
              currentStep === 1 && styles.teamRowTappable,
              currentStep === 1 && selectedTeam === 'A' && styles.teamRowSelected,
            ]}
            onPress={() => currentStep === 1 && handleTeamSelect('A')}
            disabled={currentStep !== 1}
            activeOpacity={currentStep === 1 ? 0.7 : 1}
          >
            {currentStep === 1 && (
              <View style={styles.teamLabelContainer}>
                <Ionicons name="trophy" size={32} color="#27AE60" />
                <Text style={styles.teamLabelText}>TEAM A</Text>
              </View>
            )}
            <View style={styles.slotsRow}>
              {renderPlayerSlot('A1', true)}
              {renderPlayerSlot('A2', true)}
            </View>
          </TouchableOpacity>

          {/* Net Divider */}
          <View style={styles.netDivider}>
            <View style={styles.netLine} />
            <Text style={styles.netText}>NET</Text>
            <View style={styles.netLine} />
          </View>

          {/* Team B Row - Tappable when step 1 */}
          <TouchableOpacity
            style={[
              styles.teamRow,
              currentStep === 1 && styles.teamRowTappable,
              currentStep === 1 && selectedTeam === 'B' && styles.teamRowSelected,
            ]}
            onPress={() => currentStep === 1 && handleTeamSelect('B')}
            disabled={currentStep !== 1}
            activeOpacity={currentStep === 1 ? 0.7 : 1}
          >
            {currentStep === 1 && (
              <View style={styles.teamLabelContainer}>
                <Ionicons name="trophy" size={32} color="#2D9CDB" />
                <Text style={styles.teamLabelText}>TEAM B</Text>
              </View>
            )}
            <View style={styles.slotsRow}>
              {renderPlayerSlot('B1', false)}
              {renderPlayerSlot('B2', false)}
            </View>
          </TouchableOpacity>
        </View>

        {/* Point Shot Type Selection */}
        {currentStep === 3 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.shotTypesScrollView}
            contentContainerStyle={styles.shotTypesScrollContent}
          >
            <View style={styles.shotTypesContainer}>
              <View style={styles.shotTypesRow}>
                {WINNING_SHOT_TYPES.slice(0, 3).map((shot) => (
                  <TouchableOpacity
                    key={shot.id}
                    style={[
                      styles.shotTypeButton,
                      pointShotType === shot.id && styles.shotTypeButtonSelected,
                      { borderColor: shot.color },
                    ]}
                    onPress={() => handlePointShotTypeSelect(shot.id)}
                  >
                    <Text style={styles.shotTypeIcon}>{shot.icon}</Text>
                    <Text style={styles.shotTypeLabel}>{shot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.shotTypesRow}>
                {WINNING_SHOT_TYPES.slice(3).map((shot) => (
                  <TouchableOpacity
                    key={shot.id}
                    style={[
                      styles.shotTypeButton,
                      pointShotType === shot.id && styles.shotTypeButtonSelected,
                      { borderColor: shot.color },
                    ]}
                    onPress={() => handlePointShotTypeSelect(shot.id)}
                  >
                    <Text style={styles.shotTypeIcon}>{shot.icon}</Text>
                    <Text style={styles.shotTypeLabel}>{shot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Error Shot Type Selection */}
        {currentStep === 5 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.shotTypesScrollView}
            contentContainerStyle={styles.shotTypesScrollContent}
          >
            <View style={styles.shotTypesContainer}>
              <View style={styles.shotTypesRow}>
                {ERROR_SHOT_TYPES.slice(0, 3).map((shot) => (
                  <TouchableOpacity
                    key={shot.id}
                    style={[
                      styles.shotTypeButton,
                      errorShotType === shot.id && styles.shotTypeButtonSelected,
                      { borderColor: shot.color },
                    ]}
                    onPress={() => handleErrorShotTypeSelect(shot.id)}
                  >
                    <Text style={styles.shotTypeIcon}>{shot.icon}</Text>
                    <Text style={styles.shotTypeLabel}>{shot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.shotTypesRow}>
                {ERROR_SHOT_TYPES.slice(3).map((shot) => (
                  <TouchableOpacity
                    key={shot.id}
                    style={[
                      styles.shotTypeButton,
                      errorShotType === shot.id && styles.shotTypeButtonSelected,
                      { borderColor: shot.color },
                    ]}
                    onPress={() => handleErrorShotTypeSelect(shot.id)}
                  >
                    <Text style={styles.shotTypeIcon}>{shot.icon}</Text>
                    <Text style={styles.shotTypeLabel}>{shot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </ScrollView>

      {/* Confirm Button */}
      {currentStep === 5 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedTeam || !pointMaker || !pointShotType || !errorMaker || !errorShotType) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirmPoint}
            disabled={!selectedTeam || !pointMaker || !pointShotType || !errorMaker || !errorShotType}
          >
            <Text style={styles.confirmButtonText}>✅ Confirm Point</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180, // Extra padding to prevent overlap with confirm button
  },
  scoreboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  scoreValueLeading: {
    color: '#27AE60',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  scoreDivider: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backStepButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  courtContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  teamRow: {
    flexDirection: 'row',
    marginVertical: 8,
    position: 'relative',
  },
  teamRowTappable: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  teamRowSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FDF4',
  },
  slotsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  teamLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    zIndex: 10,
    gap: 8,
  },
  teamLabelText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1F2937',
  },
  netDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
  },
  netLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#9CA3AF',
  },
  netText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginHorizontal: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  playerSlot: {
    alignItems: 'center',
    flex: 1,
  },
  slotCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  teamACircle: {
    backgroundColor: '#27AE60',
  },
  teamBCircle: {
    backgroundColor: '#2D9CDB',
  },
  slotCircleDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  slotCircleGreyed: {
    opacity: 0.4,
  },
  winnerCircle: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  errorCircle: {
    borderWidth: 3,
    borderColor: '#E74C3C',
  },
  circleContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  circleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
  },
  slotCircleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    zIndex: 1,
  },
  shotIconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    zIndex: 10,
  },
  shotIconText: {
    fontSize: 12,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  playerNameDisabled: {
    color: '#9CA3AF',
    opacity: 0.6,
  },
  playerNameGreyed: {
    opacity: 0.5,
  },
  emptySlotText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  shotTypesScrollView: {
    marginTop: 8,
    marginBottom: 16, // Add margin to prevent overlap
    maxHeight: 160, // Limit height to prevent overlap
  },
  shotTypesScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    paddingBottom: 8,
  },
  shotTypesContainer: {
    gap: 12,
    width: Math.max(600, width * 1.5), // Ensure enough width for horizontal scroll
    paddingBottom: 8,
  },
  shotTypesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shotTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    gap: 8,
    minWidth: 140,
  },
  shotTypeButtonSelected: {
    backgroundColor: '#EBF5FF',
  },
  shotTypeIcon: {
    fontSize: 20,
  },
  shotTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  confirmButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

