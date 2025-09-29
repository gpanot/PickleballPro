import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../components/WebIcon';
import { useLogbook } from '../context/LogbookContext';
import skillsData from '../data/Commun_skills_tags.json';

export default function AddTrainingSessionScreen({ navigation, route }) {
  const { addLogbookEntry } = useLogbook();
  const insets = useSafeAreaInsets();
  
  // Get prefill data from route params
  const prefillData = route?.params?.prefillData;
  const isTrainingSession = prefillData?.sessionType === 'training';
  
  // Get difficulty emoji based on difficulty level
  function getDifficultyEmoji(difficulty) {
    const difficultyMap = {
      1: '🤩', // Very Easy
      2: '😊', // Easy  
      3: '😐', // Moderate
      4: '😕', // Hard
      5: '😓'  // Very Hard
    };
    return difficultyMap[difficulty] || '😐';
  }
  
  // Form state
  const [hours, setHours] = useState(prefillData?.hours || 1.0); // Default to 1 hour
  const [date, setDate] = useState(new Date());
  const [feeling, setFeeling] = useState(3); // 1-5 scale
  const [trainingFocus, setTrainingFocus] = useState(['dinks']); // Array for multiple selections
  const [difficulty, setDifficulty] = useState(['dinks']); // Array for multiple selections
  const [sessionType, setSessionType] = useState(prefillData?.sessionType || 'single'); // Single selection only
  const [notes, setNotes] = useState(prefillData ? generateInitialNotes(prefillData) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper function to generate initial notes with exercise logs
  function generateInitialNotes(data) {
    let initialNotes = '';
    
    if (data.routineName && data.programName) {
      initialNotes += `${data.programName} - ${data.routineName}\n\n`;
    }
    
    if (data.exerciseLogs && data.exerciseLogs.length > 0) {
      initialNotes += 'Exercise Results:\n';
      data.exerciseLogs.forEach((log, index) => {
        console.log(`Exercise log ${index}:`, JSON.stringify(log, null, 2)); // Debug logging
        const exerciseName = log.exerciseName || log.name || log.title || `Exercise ${index + 1}`;
        const difficultyEmoji = log.difficulty ? ` ${getDifficultyEmoji(log.difficulty)}` : '';
        initialNotes += `• ${exerciseName}: ${log.result}${difficultyEmoji}`;
        if (log.target) {
          initialNotes += ` (Target: ${log.target})`;
        }
        if (log.notes) {
          initialNotes += ` - ${log.notes}`;
        }
        initialNotes += '\n';
      });
    }
    
    return initialNotes;
  }

  // Feeling options
  const feelingOptions = [
    { value: 1, emoji: '😓', label: 'Struggling', color: '#EF4444' },
    { value: 2, emoji: '😕', label: 'Difficult', color: '#F97316' },
    { value: 3, emoji: '😐', label: 'Neutral', color: '#6B7280' },
    { value: 4, emoji: '😊', label: 'Good', color: '#10B981' },
    { value: 5, emoji: '🤩', label: 'Excellent', color: '#8B5CF6' },
  ];

  // Training focus options - extracted from common skills data
  const trainingFocusOptions = [
    ...skillsData.skillCategories.technical.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    })),
    ...skillsData.skillCategories.movement.skills.map(skill => ({
      value: skill.id,
      emoji: skill.emoji,
      label: skill.name,
      color: skill.color
    }))
  ];

  // Session type options
  const sessionTypeOptions = [
    { value: 'training', emoji: '🏋️', label: 'Training', color: '#EF4444' },
    { value: 'social', emoji: '🎉', label: 'Social', color: '#8B5CF6' },
    { value: 'class', emoji: '🎓', label: 'Class', color: '#F59E0B' },
    { value: 'single', emoji: '👤', label: 'Single', color: '#3B82F6' },
    { value: 'double', emoji: '👥', label: 'Double', color: '#10B981' },
  ];

  // Helper functions
  const incrementHours = () => {
    setHours(prev => Math.min(prev + 0.5, 5));
  };

  const decrementHours = () => {
    setHours(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSubmit = () => {
    if (!hours || !date) {
      Alert.alert('Missing Information', 'Please fill in the hours and date fields.');
      return;
    }

    if (hours < 0.5 || hours > 5) {
      Alert.alert('Invalid Hours', 'Hours must be between 0.5 and 5.');
      return;
    }

    const entry = {
      id: Date.now().toString(),
      date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      hours: hours,
      feeling,
      trainingFocus,
      difficulty,
      sessionType,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    addLogbookEntry(entry);
    
    // Navigate to the new confirmation screen instead of showing alerts
    navigation.navigate('LogConfirmation', { 
      entry: entry,
      isTrainingSession: isTrainingSession 
    });
  };

  const toggleTrainingFocus = (focusValue) => {
    setTrainingFocus(prev => {
      if (prev.includes(focusValue)) {
        // Remove if already selected, but ensure at least one is always selected
        return prev.length > 1 ? prev.filter(f => f !== focusValue) : prev;
      } else {
        // Add if not selected
        return [...prev, focusValue];
      }
    });
  };

  const toggleDifficulty = (difficultyValue) => {
    setDifficulty(prev => {
      if (prev.includes(difficultyValue)) {
        // Remove if already selected, but ensure at least one is always selected
        return prev.length > 1 ? prev.filter(d => d !== difficultyValue) : prev;
      } else {
        // Add if not selected
        return [...prev, difficultyValue];
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTrainingSession ? 'Save Training Session' : 'Log Training Session'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notes section - moved to top for training sessions */}
        {isTrainingSession && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Training Session Notes</Text>
            <Text style={styles.inputHint}>
              Review your exercise results and add any additional notes about your session
            </Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about your training session..."
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Session Type - hidden for training sessions */}
        {!isTrainingSession && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Session Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.sessionTypeScrollView}
            >
              <View style={styles.sessionTypeSelector}>
              {sessionTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sessionTypeOption,
                    sessionType === option.value && { 
                      backgroundColor: option.color + '20',
                      borderColor: option.color,
                    }
                  ]}
                  onPress={() => setSessionType(option.value)}
                >
                  <Text style={styles.sessionTypeOptionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.sessionTypeOptionLabel,
                    sessionType === option.value && { color: option.color }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hours Trained</Text>
              <View style={styles.hoursInputContainer}>
                <TouchableOpacity
                  style={[styles.hoursButton, hours <= 0.5 && styles.hoursButtonDisabled]}
                  onPress={decrementHours}
                  disabled={hours <= 0.5}
                >
                  <WebIcon name="remove" size={16} color={hours <= 0.5 ? "#D1D5DB" : "#6B7280"} />
                </TouchableOpacity>
                
                <View style={styles.hoursDisplay}>
                  <Text style={styles.hoursValue}>{hours}h</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.hoursButton, hours >= 5 && styles.hoursButtonDisabled]}
                  onPress={incrementHours}
                  disabled={hours >= 5}
                >
                  <WebIcon name="add" size={16} color={hours >= 5 ? "#D1D5DB" : "#6B7280"} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateValue}>{formatDateForDisplay(date)}</Text>
                <WebIcon name="calendar" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>How did you feel about your progress?</Text>
            <View style={styles.feelingSelector}>
              {feelingOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.feelingOption,
                    feeling === option.value && { 
                      backgroundColor: option.color + '20',
                      borderColor: option.color,
                    }
                  ]}
                  onPress={() => setFeeling(option.value)}
                >
                  <Text style={styles.feelingOptionEmoji}>{option.emoji}</Text>
                  <Text style={[
                    styles.feelingOptionLabel,
                    feeling === option.value && { color: option.color }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What was good for you this session?</Text>
            <View style={styles.trainingFocusSelector}>
              {trainingFocusOptions.map((option) => {
                const isSelected = trainingFocus.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.trainingFocusOption,
                      isSelected && { 
                        backgroundColor: option.color + '20',
                        borderColor: option.color,
                      }
                    ]}
                    onPress={() => toggleTrainingFocus(option.value)}
                  >
                    <Text style={styles.trainingFocusOptionLabel}>{option.label}</Text>
                    {isSelected && (
                      <View style={styles.selectionIndicator}>
                        <Text style={styles.selectionCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What was the most difficult?</Text>
            <View style={styles.trainingFocusSelector}>
              {trainingFocusOptions.map((option) => {
                const isSelected = difficulty.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.trainingFocusOption,
                      isSelected && { 
                        backgroundColor: option.color + '20',
                        borderColor: option.color,
                      }
                    ]}
                    onPress={() => toggleDifficulty(option.value)}
                  >
                    <Text style={styles.trainingFocusOptionLabel}>{option.label}</Text>
                    {isSelected && (
                      <View style={styles.selectionIndicator}>
                        <Text style={styles.selectionCheck}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes section - only show for non-training sessions */}
          {!isTrainingSession && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="What did you work on? Any insights or goals for next time?"
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
          >
            <Text style={styles.saveButtonText}>Save Training Session</Text>
          </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -4, // Align with iOS guidelines
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  // Hours input styles
  hoursInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  hoursButton: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  hoursButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  hoursDisplay: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  hoursValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Date input styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dateValue: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  feelingSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  feelingOption: {
    flex: 1,
    minWidth: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  feelingOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  feelingOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  // Training focus selector styles
  trainingFocusSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  trainingFocusOption: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  trainingFocusOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheck: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  // Session type selector styles
  sessionTypeScrollView: {
    flexGrow: 0,
    height: 100, // Fixed height to prevent wrapping
  },
  sessionTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  sessionTypeOption: {
    width: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sessionTypeOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  sessionTypeOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  // Save button styles
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 60, // Same width as back button to center the title
  },
});
