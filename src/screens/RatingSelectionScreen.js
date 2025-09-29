import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

export default function RatingSelectionScreen({ navigation, onComplete, onGoBack }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [ratingInput, setRatingInput] = useState('');
  const { updateUserRating } = useUser();
  const insets = useSafeAreaInsets();

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === 'none') {
      // Default rating of 2.0 for users without rating
      updateUserRating(2.0, 'none');
      onComplete();
    }
  };

  const handleRatingSubmit = () => {
    if (!ratingInput.trim()) {
      Alert.alert('Invalid Rating', 'Please enter a valid rating.');
      return;
    }

    const rating = parseFloat(ratingInput);
    
    if (isNaN(rating) || rating < 2.0 || rating > 8.0) {
      Alert.alert('Invalid Rating', 'Please enter a rating between 2.0 and 8.0');
      return;
    }

    updateUserRating(rating, 'dupr');
    onComplete();
  };

  const renderOption = (option, title, description, icon) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        selectedOption === option && styles.optionCardSelected
      ]}
      onPress={() => handleOptionSelect(option)}
    >
      <View style={styles.optionIcon}>
        <ModernIcon name={icon} size={32} color={selectedOption === option ? '#007AFF' : '#666666'} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          selectedOption === option && styles.optionTitleSelected
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.optionDescription,
          selectedOption === option && styles.optionDescriptionSelected
        ]}>
          {description}
        </Text>
      </View>
      {selectedOption === option && (
        <View style={styles.selectedIndicator}>
          <ModernIcon name="checkmark" size={24} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Phone Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={[styles.wrapper, { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom 
      }]}>
        {/* Progress Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.progressContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (onGoBack) {
                  onGoBack();
                } else if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
                size={24} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>What's your rating?</Text>
        <Text style={styles.subtitle}>
          Help us personalize your training experience
        </Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {renderOption(
          'dupr',
          'Enter your official DUPR rating',
          'I have an official DUPR account',
          'star'
        )}
        
        {renderOption(
          'none',
          "I don't have a rating",
          "I'm new to pickleball",
          'help'
        )}
      </View>

      {/* Rating Input */}
      {selectedOption === 'dupr' && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Enter your DUPR rating
          </Text>
          <TextInput
            style={styles.ratingInput}
            placeholder="e.g., 3.500"
            placeholderTextColor="#9CA3AF"
            value={ratingInput}
            onChangeText={setRatingInput}
            keyboardType="decimal-pad"
            maxLength={5}
            autoFocus
          />
          <Text style={styles.inputHint}>
            Rating should be between 2.0 and 8.0
          </Text>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleRatingSubmit}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedOption === 'none' && (
        <View style={styles.defaultRatingInfo}>
          <ModernIcon name="help" size={20} color="#666666" />
          <Text style={styles.defaultRatingText}>
            We'll start you at rating 2.0. You can update this anytime in your profile.
          </Text>
        </View>
      )}
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionCardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  optionDescriptionSelected: {
    color: '#007AFF',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  inputSection: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    width: '100%',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  inputHint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  defaultRatingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  defaultRatingText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontWeight: '400',
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});
