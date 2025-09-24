import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

export default function TimeCommitmentScreen({ onComplete }) {
  const [selectedTime, setSelectedTime] = useState(null);
  const insets = useSafeAreaInsets();
  const { updateOnboardingData } = useUser();

  const timeOptions = [
    {
      id: 'low',
      title: '1–2 hours per week',
      description: 'Perfect for busy schedules',
      icon: 'time',
      emoji: '⏱',
      hours: '1-2h'
    },
    {
      id: 'medium',
      title: '3–4 hours per week',
      description: 'Steady improvement pace',
      icon: 'trending-up',
      emoji: '⏱',
      hours: '3-4h'
    },
    {
      id: 'high',
      title: '5+ hours per week',
      description: 'Accelerated training mode',
      icon: 'flash',
      emoji: '⏱',
      hours: '5+h'
    }
  ];

  const handleTimeSelect = async (timeId) => {
    setSelectedTime(timeId);
    
    // Save time commitment data to UserContext
    console.log('TimeCommitmentScreen: Saving time commitment to UserContext:', timeId);
    await updateOnboardingData({ timeCommitment: timeId });
    
    // Immediately proceed to next screen
    onComplete({ time_commitment: timeId });
  };

  const renderTimeOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.timeCard,
        selectedTime === option.id && styles.timeCardSelected
      ]}
      onPress={() => handleTimeSelect(option.id)}
    >
      <View style={styles.timeHeader}>
        <View style={[
          styles.timeIcon,
          selectedTime === option.id && styles.timeIconSelected
        ]}>
          <Text style={styles.timeEmoji}>{option.emoji}</Text>
        </View>
        <View style={styles.hoursContainer}>
          <Text style={[
            styles.hoursText,
            selectedTime === option.id && styles.hoursTextSelected
          ]}>
            {option.hours}
          </Text>
        </View>
        {selectedTime === option.id && (
          <View style={styles.selectedIndicator}>
            <ModernIcon name="checkmark" size={20} color="white" />
          </View>
        )}
      </View>
      <View style={styles.timeContent}>
        <Text style={[
          styles.timeTitle,
          selectedTime === option.id && styles.timeTitleSelected
        ]}>
          {option.title}
        </Text>
        <Text style={[
          styles.timeDescription,
          selectedTime === option.id && styles.timeDescriptionSelected
        ]}>
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>          

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>How often can you train?</Text>
        <Text style={styles.subtitle}>
          We'll create a plan that fits your schedule
        </Text>
      </View>

      {/* Time Options */}
      <View style={styles.timeContainer}>
        {timeOptions.map(option => renderTimeOption(option))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  timeContainer: {
    gap: 16,
    marginBottom: 24,
  },
  timeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeCardSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconSelected: {
    backgroundColor: '#E8F5FF',
  },
  timeEmoji: {
    fontSize: 24,
  },
  hoursContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  hoursTextSelected: {
    color: '#007AFF',
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContent: {
    marginTop: 8,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  timeTitleSelected: {
    color: '#007AFF',
  },
  timeDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  timeDescriptionSelected: {
    color: '#007AFF',
  },
});
