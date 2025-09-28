import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';

const { width } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import SkillsScreen from './SkillsScreen';
import BadgesScreen from './BadgesScreen';
import { generateAIProgram, validateUserForAIGeneration, saveAIProgram } from '../lib/aiProgramGenerator';

export default function ProgramScreen({ navigation, route }) {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = React.useState('programs'); // 'skills', 'programs', or 'badges'
  const [programs, setPrograms] = React.useState([]);
  const [showCreateProgramModal, setShowCreateProgramModal] = React.useState(false);
  const [newProgramName, setNewProgramName] = React.useState('');
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);

  // Handle new program added from Explore
  React.useEffect(() => {
    if (route.params?.newProgram) {
      const newProgram = route.params.newProgram;
      setPrograms(prev => {
        // Check if program already exists to avoid duplicates
        const exists = prev.some(p => p.name === newProgram.name);
        if (!exists) {
          return [...prev, newProgram];
        }
        return prev;
      });
      
      // Clear the parameter to avoid re-adding on subsequent navigations
      navigation.setParams({ newProgram: undefined });
    }
  }, [route.params?.newProgram, navigation]);

  // Static exercises for customized tab
  const staticExercises = {
    dinks: [
      { id: "1.1", name: "Dink Wall Drill", target: "15 consecutive soft dinks", difficulty: 2, description: "Practice consistent dinking against a wall" },
      { id: "1.2", name: "Cross-Court Dinks", target: "8 consecutive cross-court dinks", difficulty: 2, description: "Develop cross-court dinking accuracy" },
      { id: "1.3", name: "Dink Targets", target: "6/12 land in NVZ cones", difficulty: 3, description: "Precision dinking to specific targets" },
      { id: "s3.1", name: "Advanced Cross-Court Dinks", target: "12/15 in NVZ", difficulty: 3, description: "From Net Play Excellence session" }
    ],
    drives: [
      { id: "2.1", name: "FH Drive Depth", target: "7/10 beyond NVZ", difficulty: 2, description: "Forehand drive depth control" },
      { id: "2.2", name: "BH Drive Depth", target: "6/10 beyond NVZ", difficulty: 3, description: "Backhand drive depth control" },
      { id: "2.3", name: "Drive & Recover", target: "5-drive sequence", difficulty: 3, description: "Drive and return to ready position" },
      { id: "s4.1", name: "Power Drive Targets", target: "7/12 to corners", difficulty: 4, description: "From Power & Placement session" }
    ],
    serves: [
      { id: "6.1", name: "Deep Serve Mastery", target: "7/10 in back third", difficulty: 3, description: "Consistent deep serving" },
      { id: "6.2", name: "Spin Serve", target: "5/10 with visible spin", difficulty: 4, description: "Develop spin serve technique" },
      { id: "6.3", name: "Serve Placement Drill", target: "4/6 to chosen corner", difficulty: 3, description: "Precise serve placement" },
      { id: "s1.1", name: "Corner Placement Serves", target: "8/12 to chosen corners", difficulty: 3, description: "From Serve & Return Mastery session" }
    ],
    returns: [
      { id: "s1.2", name: "Deep Return Practice", target: "7/10 past midline", difficulty: 3, description: "Return serves deep into court" },
      { id: "s1.3", name: "Return & Approach", target: "5/8 successful approaches", difficulty: 4, description: "Return and move to net" },
      { id: "r1", name: "Defensive Returns", target: "6/10 successful defensive returns", difficulty: 3, description: "Master defensive return shots" }
    ],
    volleys: [
      { id: "s3.2", name: "Volley Positioning", target: "8/10 clean volleys", difficulty: 3, description: "Perfect volley positioning" },
      { id: "s3.3", name: "Attack the High Ball", target: "6/8 putaway attempts", difficulty: 4, description: "Aggressive high ball volleys" },
      { id: "v1", name: "Reflex Volleys", target: "10/15 quick volleys", difficulty: 4, description: "Improve volley reaction time" }
    ],
    others: [
      { id: "7.1", name: "Drop Consistency", target: "6/10 into NVZ", difficulty: 3, description: "Master the critical third shot" },
      { id: "7.2", name: "Target Drops", target: "4/10 to backhand corner", difficulty: 4, description: "Precision third shot drops" },
      { id: "s4.2", name: "Lob Placement", target: "5/8 over opponent", difficulty: 3, description: "Effective lob placement" },
      { id: "s5.3", name: "Court Positioning", target: "8/10 optimal positions", difficulty: 4, description: "Maintain optimal court position" },
      { id: "s6.3", name: "Endurance Rally", target: "25+ shot rallies", difficulty: 4, description: "Long rally endurance training" }
    ]
  };

  // Program management functions
  // AI Program Generation function
  const generateAIProgramHandler = async () => {
    // Validate user can generate AI program
    const validation = validateUserForAIGeneration(user);
    if (!validation.isValid) {
      Alert.alert('Cannot Generate AI Program', validation.message);
      return;
    }

    setIsGeneratingAI(true);

    try {
      console.log('🤖 Starting AI program generation...');
      
      // Generate the AI program
      const aiProgram = await generateAIProgram(user);
      
      // Save to local programs list
      saveAIProgram(aiProgram, setPrograms);
      
      Alert.alert(
        'AI Program Created! 🤖',
        `"${aiProgram.name}" has been created with ${aiProgram.routines.length} routines tailored to your DUPR ${user.duprRating} level and focus areas.`,
        [

          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
    } catch (error) {
      console.error('AI Program Generation Error:', error);
      
      let title = 'Generation Failed';
      let message = error.message || 'Unable to generate AI program. Please check your internet connection and try again.';
      
      // Provide more specific guidance for database-related errors
      if (error.message && error.message.includes('No exercises found')) {
        title = 'No Matching Exercises Found';
        message = `We couldn't find exercises in our database that match your DUPR ${user.duprRating} level and focus areas (${user.focus_areas?.join(', ') || 'none selected'}).\n\nThis could be because:\n• Your DUPR level needs exercises to be added to our database\n• Your focus areas need more exercise content\n\nPlease contact support or try updating your focus areas in settings.`;
      }
      
      Alert.alert(title, message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const createProgram = async () => {
    if (!newProgramName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }
    
    let compressedThumbnail = null;
    if (selectedImage) {
      try {
        // Compress the selected image
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        compressedThumbnail = manipResult;
      } catch (error) {
        console.error('Error compressing image:', error);
        Alert.alert('Error', 'Failed to process image. Program will be created without thumbnail.');
      }
    }
    
    const newProgram = {
      id: Date.now().toString(),
      name: newProgramName.trim(),
      thumbnail: compressedThumbnail,
      routines: [],
      createdAt: new Date().toISOString(),
    };
    
    setPrograms(prev => [...prev, newProgram]);
    setNewProgramName('');
    setSelectedImage(null);
    setShowCreateProgramModal(false);
  };

  // Image handling functions
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to add program thumbnails.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingImage(true);
        const asset = result.assets[0];
        
        try {
          // Ensure square crop and reasonable size
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 400, height: 400 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          
          setSelectedImage(manipResult);
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process the selected image.');
        } finally {
          setIsProcessingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker.');
      setIsProcessingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const deleteProgram = (programId) => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setPrograms(prev => prev.filter(p => p.id !== programId))
        }
      ]
    );
  };

  const navigateToProgram = (program) => {
    navigation.navigate('ProgramDetail', { 
      program,
      onUpdateProgram: (updatedProgram) => {
        setPrograms(prev => prev.map(p => 
          p.id === updatedProgram.id ? updatedProgram : p
        ));
      }
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Simulate refresh delay - in a real app, this would reload data from an API
    setTimeout(() => {
      // You can add any refresh logic here, such as:
      // - Reloading programs from a database
      // - Updating the PersonalizedProgramCard
      // - Syncing with cloud storage
      console.log('Programs refreshed');
      setRefreshing(false);
    }, 1000);
  }, []);


  // Check if user already has an AI-generated program
  const hasAIProgram = programs.some(program => program.is_ai_generated);

  const renderProgramsContent = () => (
    <View style={styles.customizedContainer}>
      {programs.length === 0 ? (
        <View style={styles.emptyCustomList}>
          <Text style={styles.emptyCustomListIcon}>✨</Text>
          <Text style={styles.emptyCustomListTitle}>Get Started with AI</Text>
          <Text style={styles.emptyCustomListDescription}>
            Let our AI create a personalized training program based on your DUPR rating and focus areas. Get started in seconds!
          </Text>
          <TouchableOpacity
            style={styles.aiGenerateButtonLarge}
            onPress={generateAIProgramHandler}
            disabled={isGeneratingAI}
          >
            <Text style={styles.aiGenerateButtonLargeText}>
              {isGeneratingAI ? 'Creating Your Program...' : 'Generate Your AI Program'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addFirstProgramButtonSecondary}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addFirstProgramButtonSecondaryText}>Or create custom program</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.programsList}
          contentContainerStyle={styles.programsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          <View style={styles.programsHeader}>
            <Text style={styles.programsSubtitle}>Tap to open • Long press to delete</Text>
          </View>
          
          {programs.map((program) => (
            <View key={program.id} style={styles.programCard}>
              <TouchableOpacity
                style={styles.programContent}
                onPress={() => navigateToProgram(program)}
                onLongPress={() => deleteProgram(program.id)}
              >
                <View style={styles.programThumbnailContainer}>
                  {program.thumbnail ? (
                    <Image 
                      source={{ 
                        uri: typeof program.thumbnail === 'string' 
                          ? program.thumbnail 
                          : program.thumbnail.uri 
                      }} 
                      style={styles.programThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.programPlaceholder}>
                      <Text style={styles.placeholderText}>🏆</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>{program.name}</Text>
                  {program.description ? (
                    <Text style={styles.programDescription}>{program.description}</Text>
                  ) : null}
                  <View style={styles.programStatsRow}>
                    <View style={styles.programStats}>
                      <Text style={styles.programStatsText}>
                        {program.routines.length} routine{program.routines.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.programStatsText}>•</Text>
                      <Text style={styles.programStatsText}>
                        {program.routines.reduce((total, routine) => total + (routine.exercises?.length || 0), 0)} exercises
                      </Text>
                    </View>
                    <View style={styles.programActions}>
                      <Text style={styles.chevronText}>{'>'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {!hasAIProgram && (
            <TouchableOpacity
              style={styles.aiGenerateButton}
              onPress={generateAIProgramHandler}
              disabled={isGeneratingAI}
            >
              <Text style={styles.aiGenerateButtonIcon}>🤖</Text>
              <Text style={styles.aiGenerateButtonText}>
                {isGeneratingAI ? 'Generating...' : 'Generate Your AI Program'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addMoreProgramsButton}
            onPress={() => setShowCreateProgramModal(true)}
          >
            <Text style={styles.addIconText}>+</Text>
            <Text style={styles.addMoreProgramsButtonText}>Create new program</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Level Up With Fun
          </Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setCurrentView('programs')}
            >
              <Text style={[styles.tabText, currentView === 'programs' && styles.activeTabText]}>
                Programs
              </Text>
              {currentView === 'programs' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setCurrentView('skills')}
            >
              <Text style={[styles.tabText, currentView === 'skills' && styles.activeTabText]}>
                DUPR 2{'->'} 3
              </Text>
              {currentView === 'skills' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setCurrentView('badges')}
            >
              <Text style={[styles.tabText, currentView === 'badges' && styles.activeTabText]}>
                Badges
              </Text>
              {currentView === 'badges' && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {currentView === 'skills' ? (
        <SkillsScreen navigation={navigation} />
      ) : currentView === 'badges' ? (
        <BadgesScreen navigation={navigation} />
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={["#3B82F6"]}
            />
          }
        >
          {renderProgramsContent()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Create Program Modal */}
      <Modal
        visible={showCreateProgramModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateProgramModal(false);
          setNewProgramName('');
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowCreateProgramModal(false);
                setNewProgramName('');
                setSelectedImage(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Program</Text>
            <TouchableOpacity
              style={[styles.modalCreateButton, !newProgramName.trim() && styles.modalCreateButtonDisabled]}
              onPress={createProgram}
              disabled={!newProgramName.trim()}
            >
              <Text style={[styles.modalCreateText, !newProgramName.trim() && styles.modalCreateTextDisabled]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Program Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={newProgramName}
                onChangeText={setNewProgramName}
                placeholder="e.g., Master the Soft Game (4 weeks)"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
              
              <Text style={styles.modalLabel}>Program Thumbnail</Text>
              <View style={styles.imageUploadSection}>
                {selectedImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image 
                      source={{ uri: selectedImage.uri }} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.uploadImageButton}
                    onPress={pickImage}
                    disabled={isProcessingImage}
                  >
                    <Text style={styles.uploadImageIcon}>📷</Text>
                    <Text style={styles.uploadImageText}>
                      {isProcessingImage ? 'Processing...' : 'Add Thumbnail'}
                    </Text>
                    <Text style={styles.uploadImageSubtext}>
                      Square images work best
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Programs styles
  customizedContainer: {
    flex: 1,
    position: 'relative',
  },
  emptyCustomList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyCustomListIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCustomListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCustomListDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  aiGenerateButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  aiGenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aiGenerateButtonLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiGenerateButtonLargeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  addFirstProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFirstProgramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addFirstProgramButtonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  addFirstProgramButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  programsList: {
    flex: 1,
  },
  programsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  programsHeader: {
    marginBottom: 16,
  },
  programsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  programsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  programCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programContent: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 0,
    alignItems: 'center',
  },
  programThumbnailContainer: {
    width: 60,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
  },
  programPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  programStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  programStatsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  programActions: {
    paddingLeft: 8,
  },
  addMoreProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addMoreProgramsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholderText: {
    fontSize: 24,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalCreateTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInputMultiline: {
    height: 80,
    paddingTop: 12,
  },
  // Image upload styles
  imageUploadSection: {
    marginBottom: 16,
  },
  uploadImageButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  uploadImageSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 24,
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
  },
  tab: {
    marginRight: 32,
    paddingBottom: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
});
