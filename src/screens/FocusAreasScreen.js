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
import skillsData from '../data/Commun_skills_tags.json';
import { useUser } from '../context/UserContext';

export default function FocusAreasScreen({ onComplete }) {
  const [selectedFocus, setSelectedFocus] = useState([]);
  const insets = useSafeAreaInsets();
  const { updateOnboardingData } = useUser();

  // Get first 8 skills from the skills data
  const getFirst8Skills = () => {
    const allSkills = [];
    
    // Collect all skills from all categories
    Object.values(skillsData.skillCategories).forEach(category => {
      allSkills.push(...category.skills);
    });
    
    // Return first 8 skills mapped to focus areas format
    return allSkills.slice(0, 8).map(skill => ({
      id: skill.id,
      title: skill.name,
      emoji: skill.emoji,
      color: skill.color,
      description: skill.description
    }));
  };

  const focusAreas = getFirst8Skills();

  const handleFocusSelect = (focusId) => {
    setSelectedFocus(prev => {
      if (prev.includes(focusId)) {
        // Remove if already selected
        return prev.filter(id => id !== focusId);
      } else {
        // Add if not selected
        return [...prev, focusId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedFocus.length > 0) {
      // Save focus areas data to UserContext
      console.log('FocusAreasScreen: Saving focus areas to UserContext:', selectedFocus);
      await updateOnboardingData({ focus_areas: selectedFocus });
      
      onComplete({ focus_areas: selectedFocus });
    }
  };

  const renderFocusOption = (area) => {
    const isSelected = selectedFocus.includes(area.id);
    
    return (
      <TouchableOpacity
        key={area.id}
        style={[
          styles.focusCard,
          isSelected && styles.focusCardSelected
        ]}
        onPress={() => handleFocusSelect(area.id)}
      >
        <View style={styles.focusContent}>
          <Text style={styles.focusEmoji}>{area.emoji}</Text>
          <Text style={[
            styles.focusTitle,
            isSelected && styles.focusTitleSelected
          ]}>
            {area.title}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <ModernIcon name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Phone Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={[styles.container, { 
        paddingTop: insets.top,
        paddingBottom: insets.bottom 
      }]}>          
        {/* Progress Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '87.5%' }]} />
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What are your goals?</Text>
            <Text style={styles.subtitle}>
              Choose one or multiple focus areas
            </Text>
          </View>

          {/* Focus Areas Grid */}
          <View style={styles.focusContainer}>
            <View style={styles.focusRow}>
              {focusAreas.slice(0, 2).map(area => renderFocusOption(area))}
            </View>
            <View style={styles.focusRow}>
              {focusAreas.slice(2, 4).map(area => renderFocusOption(area))}
            </View>
            <View style={styles.focusRow}>
              {focusAreas.slice(4, 6).map(area => renderFocusOption(area))}
            </View>
            <View style={styles.focusRow}>
              {focusAreas.slice(6, 8).map(area => renderFocusOption(area))}
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity 
        style={[
          styles.continueButton,
          selectedFocus.length === 0 && styles.continueButtonDisabled
        ]}
        onPress={handleContinue}
        disabled={selectedFocus.length === 0}
      >
        <Text style={[
          styles.continueButtonText,
          selectedFocus.length === 0 && styles.continueButtonTextDisabled
        ]}>
          CONTINUE
        </Text>
          </TouchableOpacity>
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
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
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
  focusContainer: {
    gap: 12,
    flex: 1,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  focusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 16,
  },
  focusTitleSelected: {
    color: '#007AFF',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#666666',
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
