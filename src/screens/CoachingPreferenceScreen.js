import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';
import { useUser } from '../context/UserContext';

// Optional import for tracking transparency (may not be available in all environments)
let requestTrackingPermission = null;
let getTrackingStatus = null;

try {
  const TrackingTransparency = require('react-native-tracking-transparency');
  requestTrackingPermission = TrackingTransparency.requestTrackingPermission;
  getTrackingStatus = TrackingTransparency.getTrackingStatus;
} catch (error) {
  console.log('CoachingPreferenceScreen: Tracking transparency not available:', error.message);
}

export default function CoachingPreferenceScreen({ onComplete }) {
  const [selectedPreference, setSelectedPreference] = useState(null);
  const insets = useSafeAreaInsets();
  const { updateOnboardingData } = useUser();

  const preferences = [
    {
      id: 'yes',
      title: 'Yes, I want coach recommendations',
      description: 'Get matched with qualified coaches in your area',
      icon: 'person',
      emoji: '👩‍🏫',
      badge: 'RECOMMENDED'
    },
    {
      id: 'no',
      title: 'Not now, I\'ll train solo',
      description: 'Focus on solo drills and self-guided training',
      icon: 'fitness',
      emoji: '🤹',
      badge: null
    }
  ];

  const handlePreferenceSelect = async (preferenceId) => {
    try {
      setSelectedPreference(preferenceId);
      
      // Note: App Tracking Transparency (ATT) request temporarily disabled
      // To enable, add NSUserTrackingUsageDescription to Info.plist and rebuild iOS app
      // if (Platform.OS === 'ios' && getTrackingStatus && requestTrackingPermission) {
      //   try {
      //     console.log('CoachingPreferenceScreen: Requesting ATT permission on iOS');
      //     const trackingStatus = await getTrackingStatus();
      //     console.log('CoachingPreferenceScreen: Current tracking status:', trackingStatus);
      //     
      //     if (trackingStatus === 'not-determined') {
      //       const permission = await requestTrackingPermission();
      //       console.log('CoachingPreferenceScreen: ATT permission result:', permission);
      //     }
      //   } catch (error) {
      //     console.error('CoachingPreferenceScreen: Error requesting ATT permission:', error);
      //   }
      // }
      
      // Save coaching preference data to UserContext
      console.log('CoachingPreferenceScreen: Saving coaching preference to UserContext:', preferenceId);
      await updateOnboardingData({ coachPreference: preferenceId });
      
      // Navigate to CreateAccountScreen with coaching preference data
      console.log('CoachingPreferenceScreen: Calling onComplete with:', { coach_preference: preferenceId });
      onComplete({ 
        coach_preference: preferenceId
      });
    } catch (error) {
      console.error('CoachingPreferenceScreen: Error in handlePreferenceSelect:', error);
      // Still try to navigate even if there's an error saving data
      onComplete({ 
        coach_preference: preferenceId
      });
    }
  };

  const renderPreferenceOption = (preference) => (
    <TouchableOpacity
      key={preference.id}
      style={[
        styles.preferenceCard,
        selectedPreference === preference.id && styles.preferenceCardSelected
      ]}
      onPress={() => handlePreferenceSelect(preference.id)}
    >
      {preference.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{preference.badge}</Text>
        </View>
      )}
      
      <View style={styles.preferenceHeader}>
        <View style={[
          styles.preferenceIcon,
          selectedPreference === preference.id && styles.preferenceIconSelected
        ]}>
          <Text style={styles.preferenceEmoji}>{preference.emoji}</Text>
        </View>
        {selectedPreference === preference.id && (
          <View style={styles.selectedIndicator}>
            <ModernIcon name="checkmark" size={20} color="white" />
          </View>
        )}
      </View>
      
      <View style={styles.preferenceContent}>
        <Text style={[
          styles.preferenceTitle,
          selectedPreference === preference.id && styles.preferenceTitleSelected
        ]}>
          {preference.title}
        </Text>
        <Text style={[
          styles.preferenceDescription,
          selectedPreference === preference.id && styles.preferenceDescriptionSelected
        ]}>
          {preference.description}
        </Text>
      </View>

      {preference.id === 'yes' && (
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <ModernIcon name="checkmark" size={16} color="#007AFF" />
            <Text style={styles.benefitText}>Personalized coaching</Text>
          </View>
          <View style={styles.benefitItem}>
            <ModernIcon name="checkmark" size={16} color="#007AFF" />
            <Text style={styles.benefitText}>Faster skill improvement</Text>
          </View>
          <View style={styles.benefitItem}>
            <ModernIcon name="checkmark" size={16} color="#007AFF" />
            <Text style={styles.benefitText}>Professional guidance</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top,
      paddingBottom: insets.bottom 
    }]}>          
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Do you want a coach?</Text>
        <Text style={styles.subtitle}>
          Professional coaching can accelerate your improvement
        </Text>
      </View>

      {/* Preference Options */}
      <View style={styles.preferenceContainer}>
        {preferences.map(preference => renderPreferenceOption(preference))}
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
  preferenceContainer: {
    gap: 20,
    marginBottom: 24,
  },
  preferenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  preferenceCardSelected: {
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
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  preferenceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceIconSelected: {
    backgroundColor: '#E8F5FF',
  },
  preferenceEmoji: {
    fontSize: 28,
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceContent: {
    marginBottom: 16,
  },
  preferenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  preferenceTitleSelected: {
    color: '#007AFF',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  preferenceDescriptionSelected: {
    color: '#007AFF',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
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
