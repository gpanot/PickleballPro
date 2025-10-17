import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function FeedbackScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [whatYouLike, setWhatYouLike] = useState('');
  const [whatToAdd, setWhatToAdd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const feedbackOptions = [
    'The Librairy screen',
    'The Program screen',
    'The Coach screen',
    'The Logbook screen',
    'It is motivating',
    'Easy to use',
    'Help me to improve',
    'Great content'
  ];

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleLastTextInputFocus = () => {
    // Scroll to bottom when the last text input is focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating to continue.');
      return;
    }

    if (selectedOptions.length === 0 && !whatYouLike.trim() && !whatToAdd.trim()) {
      Alert.alert('Feedback Required', 'Please provide some feedback before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const feedbackData = {
        user_id: user?.id,
        rating: rating,
        selected_options: selectedOptions,
        what_you_like: whatYouLike.trim(),
        what_to_add: whatToAdd.trim(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('feedback')
        .insert([feedbackData]);

      if (error) throw error;

      Alert.alert(
        'Thank You! 💙',
        'Your feedback has been submitted successfully. We really appreciate you taking the time to help us improve the app!',
        [
          {
            text: 'You\'re Welcome!',
            style: 'default',
            onPress: () => {
              // Reset form
              setRating(0);
              setSelectedOptions([]);
              setWhatYouLike('');
              setWhatToAdd('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFD700' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How much are you enjoying the app?</Text>
            <Text style={styles.subtitle}>Your feedback helps us improve!</Text>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingSection}>
            {renderStars()}
          </View>

          {/* Feedback Options */}
          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>What's do you like the most?</Text>
            <View style={styles.optionsGrid}>
              {feedbackOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    selectedOptions.includes(option) && styles.optionButtonSelected
                  ]}
                  onPress={() => handleOptionToggle(option)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedOptions.includes(option) && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Text Feedback */}
          <View style={styles.textFeedbackSection}>
            <Text style={styles.sectionTitle}>Where the app is helping you to improve?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what you love or what could make it even better."
              placeholderTextColor="#9CA3AF"
              value={whatYouLike}
              onChangeText={setWhatYouLike}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.textFeedbackSection}>
            <Text style={styles.sectionTitle}>What shall we add to make it better for you?</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your ideas for new features or improvements..."
              placeholderTextColor="#9CA3AF"
              value={whatToAdd}
              onChangeText={setWhatToAdd}
              onFocus={handleLastTextInputFocus}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Sending...' : 'Send Feedback 💙'}
            </Text>
          </TouchableOpacity>

          {/* Thank you note */}
          <Text style={styles.thankYouText}>
            Thank you for helping us build a better pickleball training experience!
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 8,
  },
  optionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textFeedbackSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  thankYouText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
