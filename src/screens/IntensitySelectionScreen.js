import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

export default function IntensitySelectionScreen({ onComplete }) {
  const [selectedIntensity, setSelectedIntensity] = useState(null);
  const insets = useSafeAreaInsets();
  const { updateOnboardingData } = useUser();

  const intensityOptions = [
    {
      id: 'short',
      title: 'Light & simple',
      duration: '~20 min',
      description: '2 drills/session',
      icon: 'time',
      emoji: '⚡',
      badge: 'QUICK'
    },
    {
      id: 'balanced',
      title: 'Balanced',
      duration: '~30–40 min',
      description: '3 drills/session',
      icon: 'target',
      emoji: '⚖️',
      badge: 'RECOMMENDED'
    },
    {
      id: 'full',
      title: 'Challenging',
      duration: '~45–60 min',
      description: '4+ drills/session',
      icon: 'fitness',
      emoji: '🔥',
      badge: null
    }
  ];

  const handleIntensitySelect = async (intensityId) => {
    setSelectedIntensity(intensityId);
    
    // Save intensity data to UserContext (note: this might not have a direct DB field)
    console.log('IntensitySelectionScreen: Saving intensity to UserContext:', intensityId);
    await updateOnboardingData({ intensity: intensityId });
    
    // Immediately proceed to next screen
    onComplete({ intensity: intensityId });
  };

  const renderIntensityOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.intensityCard,
        selectedIntensity === option.id && styles.intensityCardSelected
      ]}
      onPress={() => handleIntensitySelect(option.id)}
    >
      {option.badge && (
        <View style={[
          styles.badge,
          option.badge === 'RECOMMENDED' && styles.badgeRecommended,
          option.badge === 'QUICK' && styles.badgeQuick
        ]}>
          <Text style={styles.badgeText}>{option.badge}</Text>
        </View>
      )}
      
      <View style={styles.intensityHeader}>
        <View style={[
          styles.intensityIcon,
          selectedIntensity === option.id && styles.intensityIconSelected
        ]}>
          <Text style={styles.intensityEmoji}>{option.emoji}</Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={[
            styles.durationText,
            selectedIntensity === option.id && styles.durationTextSelected
          ]}>
            {option.duration}
          </Text>
        </View>
        {selectedIntensity === option.id && (
          <View style={styles.selectedIndicator}>
            <ModernIcon name="checkmark" size={16} color="white" />
          </View>
        )}
      </View>
      
      <View style={styles.intensityContent}>
        <Text style={[
          styles.intensityTitle,
          selectedIntensity === option.id && styles.intensityTitleSelected
        ]}>
          {option.title}
        </Text>
        <Text style={[
          styles.intensityDescription,
          selectedIntensity === option.id && styles.intensityDescriptionSelected
        ]}>
          {option.description}
        </Text>
      </View>

      {/* Benefits for each option */}
      <View style={styles.benefitsList}>
        {option.id === 'short' && (
          <>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Perfect for busy schedules</Text>
            </View>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Easy to stay consistent</Text>
            </View>
          </>
        )}
        {option.id === 'balanced' && (
          <>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Good variety & progress</Text>
            </View>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Manageable time commitment</Text>
            </View>
          </>
        )}
        {option.id === 'full' && (
          <>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Maximum skill development</Text>
            </View>
            <View style={styles.benefitItem}>
              <ModernIcon name="checkmark-circle" size={14} color="#007AFF" />
              <Text style={styles.benefitText}>Comprehensive training</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* Phone Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={[styles.container, { paddingTop: insets.top }]}>          
        {/* Progress Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>How intense should your sessions be?</Text>
        <Text style={styles.subtitle}>
          Choose the training intensity that fits your lifestyle
        </Text>
      </View>

      {/* Intensity Options */}
      <View style={styles.intensityContainer}>
        {intensityOptions.map(option => renderIntensityOption(option))}
      </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  intensityContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 16,
  },
  intensityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  intensityCardSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeRecommended: {
    backgroundColor: '#007AFF',
  },
  badgeQuick: {
    backgroundColor: '#FF9500',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  intensityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityIconSelected: {
    backgroundColor: '#E8F5FF',
  },
  intensityEmoji: {
    fontSize: 18,
  },
  durationContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  durationTextSelected: {
    color: '#007AFF',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityContent: {
    marginBottom: 8,
  },
  intensityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  intensityTitleSelected: {
    color: '#007AFF',
  },
  intensityDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  intensityDescriptionSelected: {
    color: '#007AFF',
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  statusBar: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
