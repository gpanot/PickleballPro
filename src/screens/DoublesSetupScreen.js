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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView } from 'expo-camera';
import { useUser } from '../context/UserContext';

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
  const [joinCode] = useState(generateJoinCode());
  const [players, setPlayers] = useState({
    A1: null,
    A2: null,
    B1: null,
    B2: null,
  });
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [serveOrder, setServeOrder] = useState(['A1', 'A2', 'B1', 'B2']);
  const [startServer, setStartServer] = useState('A1');
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [scannedCode, setScannedCode] = useState(null);
  const [isScanning, setIsScanning] = useState(scanMode);
  const [hasPermission, setHasPermission] = useState(null);

  // Request camera permission using native APIs
  const requestPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'PicklePro needs access to your camera to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS - CameraView handles permissions automatically
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  // Check camera permission if in scan mode
  useEffect(() => {
    if (scanMode) {
      (async () => {
        if (Platform.OS === 'android') {
          const checkPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
          );
          if (!checkPermission) {
            await requestPermission();
          } else {
            setHasPermission(true);
          }
        } else {
          // iOS - CameraView handles permissions automatically
          setHasPermission(true);
        }
      })();
    }
  }, [scanMode]);

  // Handle QR code scan
  const handleBarCodeScanned = ({ type, data }) => {
    try {
      // Parse the deep link: pickleballhero://doubles/join/CODE
      if (data.startsWith('pickleballhero://doubles/join/')) {
        const code = data.split('/').pop();
        if (code && code.length === 6) {
          setScannedCode(code);
          setIsScanning(false);
          // TODO: Join the game session using the code
          // For now, show an alert
          Alert.alert(
            'Game Found',
            `Would you like to join game ${code}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setIsScanning(false) },
              { 
                text: 'Join', 
                onPress: () => {
                  // Navigate to join flow
                  // You can implement the join logic here
                  console.log('Joining game:', code);
                  setIsScanning(false);
                  // For now, just close scanner - join logic can be added later
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Invalid QR Code', 'Please scan a valid game QR code.');
      }
    } catch (error) {
      console.error('Error parsing QR code:', error);
      Alert.alert('Error', 'Failed to parse QR code.');
    }
  };

  // Request camera permission if in scan mode
  useEffect(() => {
    if (scanMode) {
      (async () => {
        try {
          const { status } = await Camera.getCameraPermissionsAsync();
          setHasPermission(status === 'granted');
          setPermission({ granted: status === 'granted' });
          if (status !== 'granted') {
            await requestPermission();
          }
        } catch (error) {
          console.error('Error getting camera permissions:', error);
          setPermission({ granted: false });
        }
      })();
    }
  }, [scanMode]);

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
    
    // Auto-assign first player to A1 if they're the host
    if (user && connectedPlayers.length === 0) {
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

    // Navigate to 6-Point Tracker
    navigation.navigate('SixPointTracker', { players });
  };

  const renderSlot = (slot, isTeamA) => {
    const player = players[slot];
    const isDragged = draggedPlayer?.fromSlot === slot;
    const canDrop = draggedPlayer && draggedPlayer.fromSlot !== slot;

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
    if (hasPermission === null) {
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

    if (hasPermission === false) {
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

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.header, styles.scannerHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setIsScanning(false);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, styles.scannerHeaderTitle]}>Scan to Join Game</Text>
        </View>
        <View style={styles.scannerWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
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
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Doubles 6-Point Setup</Text>
          <Text style={styles.headerSubtext}>
            Scan or enter code to join. Drag players to slots.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connect Row */}
        <View style={styles.connectRow}>
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
        </View>

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

        {/* Suggested Serve Order */}
        <View style={styles.serveOrderContainer}>
          <Text style={styles.serveOrderTitle}>Suggested Serve Order</Text>
          <View style={styles.suggestedServerContainer}>
            <Text style={styles.suggestedServerLabel}>Starting Server:</Text>
            <View style={[
              styles.suggestedServerChip,
              startServer.startsWith('A') ? styles.teamAChip : styles.teamBChip
            ]}>
              <Text style={styles.suggestedServerText}>{startServer}</Text>
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
          <Text style={styles.startGameButtonText}>Start 6-Point Game</Text>
        </TouchableOpacity>
      </View>
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
  scannerHeader: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderBottomWidth: 0,
  },
  scannerHeaderTitle: {
    color: '#FFFFFF',
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
    paddingBottom: 100,
  },
  connectRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  qrCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  simulateJoinButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  simulateJoinButtonText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  codeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courtTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  teamASlot: {
    borderColor: '#27AE60',
  },
  teamBSlot: {
    borderColor: '#2D9CDB',
  },
  slotDragged: {
    opacity: 0.5,
  },
  slotDropTarget: {
    backgroundColor: '#EBF5FF',
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
    backgroundColor: '#27AE60',
  },
  teamBCircle: {
    backgroundColor: '#2D9CDB',
  },
  emptySlotCircle: {
    backgroundColor: '#E5E7EB',
  },
  slotCircleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySlotCircleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'center',
  },
  serveOrderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serveOrderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  suggestedServerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  suggestedServerLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestedServerChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedServerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  teamAChip: {
    backgroundColor: '#D1FAE5',
  },
  teamBChip: {
    backgroundColor: '#DBEAFE',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: '#F4F5F7',
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#6B7280',
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
    borderColor: '#27AE60',
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
});

