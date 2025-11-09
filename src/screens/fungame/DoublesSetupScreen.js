import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
  Animated,
  Image,
  Share,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useUser } from '../../context/UserContext';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width } = Dimensions.get('window');

// Generate a random 6-character code
const generateJoinCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function DoublesSetupScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const scanMode = route?.params?.scanMode || false;
  const initialPlayers = route?.params?.players || null;
  const [permission, requestPermission] = useCameraPermissions();
  const [joinCode] = useState(generateJoinCode());
  
  // Initialize players from route params if provided
  const getInitialPlayers = () => {
    if (initialPlayers) {
      return {
        A1: initialPlayers.A1 || null,
        A2: initialPlayers.A2 || null,
        B1: initialPlayers.B1 || null,
        B2: initialPlayers.B2 || null,
      };
    }
    return {
      A1: null,
      A2: null,
      B1: null,
      B2: null,
    };
  };
  
  // Initialize connectedPlayers from route params if provided
  const getInitialConnectedPlayers = () => {
    if (initialPlayers) {
      const connected = [];
      if (initialPlayers.A1) connected.push(initialPlayers.A1);
      if (initialPlayers.A2) connected.push(initialPlayers.A2);
      if (initialPlayers.B1) connected.push(initialPlayers.B1);
      if (initialPlayers.B2) connected.push(initialPlayers.B2);
      return connected;
    }
    return [];
  };
  
  const [players, setPlayers] = useState(getInitialPlayers());
  const [connectedPlayers, setConnectedPlayers] = useState(getInitialConnectedPlayers());
  const [serveOrder, setServeOrder] = useState(['A1', 'A2', 'B1', 'B2']);
  const [startServer, setStartServer] = useState('A1');
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(scanMode);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Handle manual code entry
  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character code.');
      return;
    }
    
    const code = manualCode.trim().toUpperCase();
    handleJoinCode(code);
  };

  // Handle QR code scan or manual code entry
  const handleJoinCode = (code) => {
    // Prevent multiple scans
    if (scannedCode) return;
    
    try {
      // Validate the code
      if (code && code.length === 6) {
        setScannedCode(code);
        setIsScanning(false);
        setShowManualEntry(false);
        // TODO: Join the game session using the code
        // For now, show an alert
        Alert.alert(
          'Game Found',
          `Would you like to join game ${code}?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {
              setScannedCode(null);
              setIsScanning(false);
            }},
            { 
              text: 'Join', 
              onPress: () => {
                // Navigate to join flow
                // You can implement the join logic here
                console.log('Joining game:', code);
                setScannedCode(null);
                setIsScanning(false);
                // For now, just close scanner - join logic can be added later
              }
            }
          ]
        );
      } else {
        Alert.alert('Invalid Code', 'Please enter a valid 6-character code.');
      }
    } catch (error) {
      console.error('Error processing code:', error);
      Alert.alert('Error', 'Failed to process join code.');
    }
  };

  // Handle QR code scan
  const handleBarCodeScanned = ({ data }) => {
    if (scannedCode) return;
    
    try {
      // Parse the deep link: pickleballhero://doubles/join/CODE
      if (data && data.startsWith('pickleballhero://doubles/join/')) {
        const code = data.split('/').pop();
        handleJoinCode(code);
      } else {
        Alert.alert('Invalid QR Code', 'Please scan a valid game QR code.');
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert('Error', 'Failed to parse QR code.');
    }
  };


  // Generate random serve order
  const generateRandomServeOrder = () => {
    const slots = ['A1', 'A2', 'B1', 'B2'];
    const shuffled = [...slots].sort(() => Math.random() - 0.5);
    setServeOrder(shuffled);
    setStartServer(shuffled[0]);
  };

  useEffect(() => {
    // Generate initial random serve order
    generateRandomServeOrder();
    
    // Auto-assign first player to A1 if they're the host and no players were pre-populated
    if (user && connectedPlayers.length === 0 && !initialPlayers) {
      handlePlayerJoin({
        id: user.id,
        name: user.name || 'You',
        avatar_url: user.avatar_url,
      });
    }
  }, []);

  // Simulate player joining via QR code or join code
  // In production, this would be handled via WebSocket/Realtime
  const simulatePlayerJoin = () => {
    const mockPlayers = [
      { id: '2', name: 'Alice', avatar_url: null },
      { id: '3', name: 'Bob', avatar_url: null },
      { id: '4', name: 'Charlie', avatar_url: null },
    ];
    
    if (connectedPlayers.length < 4) {
      const playerIndex = connectedPlayers.length - 1; // -1 because first player (host) is already added
      if (playerIndex >= 0 && playerIndex < mockPlayers.length) {
        handlePlayerJoin(mockPlayers[playerIndex]);
      }
    }
  };

  const handlePlayerJoin = (player) => {
    const newConnectedPlayers = [...connectedPlayers, player];
    setConnectedPlayers(newConnectedPlayers);

    // Auto-assign: first two to A1/A2, next two to B1/B2
    if (newConnectedPlayers.length === 1) {
      setPlayers({ ...players, A1: player });
    } else if (newConnectedPlayers.length === 2) {
      setPlayers({ ...players, A1: players.A1 || newConnectedPlayers[0], A2: player });
    } else if (newConnectedPlayers.length === 3) {
      setPlayers({ ...players, A1: players.A1 || newConnectedPlayers[0], A2: players.A2 || newConnectedPlayers[1], B1: player });
    } else if (newConnectedPlayers.length === 4) {
      setPlayers({ ...players, A1: players.A1 || newConnectedPlayers[0], A2: players.A2 || newConnectedPlayers[1], B1: players.B1 || newConnectedPlayers[2], B2: player });
    }
    
    // Generate new random serve order when players change
    generateRandomServeOrder();
  };

  const handleDragStart = (slot) => {
    if (players[slot]) {
      setDraggedPlayer({ player: players[slot], fromSlot: slot });
    }
  };

  const handleDrop = (toSlot) => {
    if (!draggedPlayer) return;

    const { player, fromSlot } = draggedPlayer;
    
    // Swap players if target slot is occupied
    if (players[toSlot]) {
      setPlayers({
        ...players,
        [fromSlot]: players[toSlot],
        [toSlot]: player,
      });
    } else {
      setPlayers({
        ...players,
        [fromSlot]: null,
        [toSlot]: player,
      });
    }
    
    setDraggedPlayer(null);
    
    // Generate new random serve order when players change
    generateRandomServeOrder();
  };

  const handleCopyLink = async () => {
    const link = `pickleballhero://doubles/join/${joinCode}`;
    try {
      if (Platform.OS !== 'web') {
        await Share.share({
          message: `Join my doubles game! Code: ${joinCode}\nLink: ${link}`,
        });
      } else {
        // For web, try clipboard API
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(link);
          Alert.alert('Copied!', 'Join link copied to clipboard');
        } else {
          Alert.alert('Join Code', `Code: ${joinCode}\n\nLink: ${link}`);
        }
      }
    } catch (error) {
      console.error('Error sharing/copying:', error);
      // Fallback: show alert with code
      Alert.alert('Join Code', `Code: ${joinCode}\n\nLink: ${link}`);
    }
  };

  const handleStartGame = () => {
    // Validate that all 4 slots are filled
    if (!players.A1 || !players.A2 || !players.B1 || !players.B2) {
      Alert.alert('Not Ready', 'Please assign all 4 players before starting the game.');
      return;
    }

    // Navigate to UITestGame (6-Point Tracker)
    navigation.navigate('UITestGame', { players });
  };

  const renderSlot = (slot, isTeamA) => {
    const player = players[slot];
    const isDragged = draggedPlayer?.fromSlot === slot;
    const canDrop = draggedPlayer && draggedPlayer.fromSlot !== slot;
    const isStartServer = startServer === slot;

    return (
      <TouchableOpacity
        style={[
          styles.slotCard,
          isTeamA ? styles.teamASlot : styles.teamBSlot,
          isDragged && styles.slotDragged,
          canDrop && styles.slotDropTarget,
        ]}
        onPress={() => {
          if (draggedPlayer && draggedPlayer.fromSlot !== slot) {
            handleDrop(slot);
          } else if (player) {
            handleDragStart(slot);
          }
        }}
        onLongPress={() => player && handleDragStart(slot)}
        activeOpacity={0.7}
      >
        {player ? (
          <>
            <View style={[
              styles.slotCircle,
              isTeamA ? styles.teamACircle : styles.teamBCircle
            ]}>
              <Text style={styles.slotCircleText}>{slot}</Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            {isStartServer && (
              <Text style={styles.startingServerBadge}>Starting Server</Text>
            )}
          </>
        ) : (
          <>
            <View style={[
              styles.slotCircle,
              styles.emptySlotCircle
            ]}>
              <Text style={styles.emptySlotCircleText}>{slot}</Text>
            </View>
            <Text style={styles.emptySlotText}>Tap to assign</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  // Render scanner view
  if (isScanning) {
    // Check permissions
    if (!permission) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setIsScanning(false);
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan to Join</Text>
          </View>
          <View style={styles.scannerContainer}>
            <Text style={styles.permissionText}>Checking camera permission...</Text>
          </View>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setIsScanning(false);
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan to Join</Text>
          </View>
          <View style={styles.scannerContainer}>
            <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
            <Text style={styles.permissionSubtext}>Please grant camera permission in your device settings.</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Request Camera Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Render camera scanner
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, styles.scannerHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsScanning(false);
              setShowManualEntry(false);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, styles.scannerHeaderTitle]}>Scan to Join Game</Text>
          {!showManualEntry && (
            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={() => setShowManualEntry(true)}
            >
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        {!showManualEntry ? (
          <View style={styles.scannerWrapper}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={scannedCode ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame}>
                  <View style={[styles.scannerCorner, styles.scannerCornerTopLeft]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerTopRight]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerBottomLeft]} />
                  <View style={[styles.scannerCorner, styles.scannerCornerBottomRight]} />
                </View>
                <Text style={styles.scannerHint}>
                  Position the QR code within the frame
                </Text>
              </View>
            </CameraView>
          </View>
        ) : (
          <View style={styles.manualEntryContainer}>
            <View style={styles.manualEntryCard}>
              <Text style={styles.manualEntryTitle}>Enter Join Code</Text>
              <Text style={styles.manualEntrySubtext}>
                Enter the 6-character game code manually
              </Text>
              <TextInput
                style={styles.manualEntryInput}
                value={manualCode}
                onChangeText={setManualCode}
                placeholder="ABCD12"
                placeholderTextColor="#9CA3AF"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <View style={styles.manualEntryButtons}>
                <TouchableOpacity
                  style={[styles.manualEntryButtonAction, styles.manualEntryButtonCancel]}
                  onPress={() => {
                    setShowManualEntry(false);
                    setManualCode('');
                  }}
                >
                  <Text style={styles.manualEntryButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualEntryButtonAction, styles.manualEntryButtonSubmit]}
                  onPress={handleManualCodeSubmit}
                >
                  <Text style={styles.manualEntryButtonSubmitText}>Join Game</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Doubles 15-Point Setup</Text>
          <Text style={styles.headerSubtext}>
            Set up your doubles game. Drag players to rearrange slots.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connect Row - Hidden for now */}
        {/* <View style={styles.connectRow}>
          <View style={styles.qrCard}>
            <QRCode
              value={`pickleballhero://doubles/join/${joinCode}`}
              size={120}
              color="#1F2937"
              backgroundColor="#FFFFFF"
            />
            <Text style={styles.qrLabel}>Scan to join</Text>
            {connectedPlayers.length < 4 && (
              <TouchableOpacity
                style={styles.simulateJoinButton}
                onPress={simulatePlayerJoin}
              >
                <Text style={styles.simulateJoinButtonText}>
                  Test: Add Player ({connectedPlayers.length}/4)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Join Code</Text>
            <Text style={styles.codeValue}>{joinCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
              <Text style={styles.copyButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Court Grid */}
        <View style={styles.courtContainer}>
          <Text style={styles.courtTitle}>Court Setup</Text>

          {/* Team A Row */}
          <View style={styles.teamRow}>
            <View style={styles.slotsRow}>
              {renderSlot('A1', true)}
              {renderSlot('A2', true)}
            </View>
          </View>

          {/* Net Divider - Below Team A */}
          <View style={styles.netDivider}>
            <View style={styles.netLine} />
            <Text style={styles.netText}>NET</Text>
            <View style={styles.netLine} />
          </View>

          {/* Team B Row */}
          <View style={styles.teamRow}>
            <View style={styles.slotsRow}>
              {renderSlot('B1', false)}
              {renderSlot('B2', false)}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.startGameButton,
            (!players.A1 || !players.A2 || !players.B1 || !players.B2) && styles.startGameButtonDisabled
          ]}
          onPress={handleStartGame}
          disabled={!players.A1 || !players.A2 || !players.B1 || !players.B2}
        >
          <Text style={styles.startGameButtonText}>Start 15-Point Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  scannerHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scannerHeaderTitle: {
    color: '#FFFFFF',
    flex: 1,
  },
  manualEntryButton: {
    padding: 4,
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  connectRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  qrCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  qrLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 12,
    marginBottom: 8,
  },
  simulateJoinButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  simulateJoinButtonText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  codeCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  codeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  courtContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  courtTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  netDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
  },
  netLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#334155',
  },
  netText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginHorizontal: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  teamRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  slotsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  slotCard: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#0A0E1A',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  teamASlot: {
    borderColor: '#14B8A6',
  },
  teamBSlot: {
    borderColor: '#3B82F6',
  },
  slotDragged: {
    opacity: 0.5,
  },
  slotDropTarget: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
    borderStyle: 'solid',
  },
  slotCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  teamACircle: {
    backgroundColor: '#14B8A6',
  },
  teamBCircle: {
    backgroundColor: '#3B82F6',
  },
  emptySlotCircle: {
    backgroundColor: '#1E293B',
  },
  slotCircleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySlotCircleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  startingServerBadge: {
    fontSize: 10,
    color: '#14B8A6',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  startGameButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  startGameButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  startGameButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scannerWrapper: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0A0E1A',
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#14B8A6',
    borderWidth: 3,
  },
  scannerCornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  scannerCornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  scannerCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  scannerCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerHint: {
    marginTop: 32,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  manualEntryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0A0E1A',
  },
  manualEntryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  manualEntryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  manualEntrySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  manualEntryInput: {
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 24,
    backgroundColor: '#0A0E1A',
  },
  manualEntryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualEntryButtonAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualEntryButtonCancel: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualEntryButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  manualEntryButtonSubmit: {
    backgroundColor: '#3B82F6',
  },
  manualEntryButtonSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

