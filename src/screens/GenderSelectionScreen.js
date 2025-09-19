import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernIcon from '../components/ModernIcon';

const { width } = Dimensions.get('window');

export default function GenderSelectionScreen({ onComplete }) {
  const [selectedGender, setSelectedGender] = useState(null);
  const insets = useSafeAreaInsets();

  const genderOptions = [
    {
      id: 'female',
      title: 'Female',
      image: require('../../assets/images/female.png')
    },
    {
      id: 'male',
      title: 'Male',
      image: require('../../assets/images/male.png')
    }
  ];

  const handleGenderSelect = (genderId) => {
    setSelectedGender(genderId);
  };

  const handleContinue = () => {
    if (selectedGender) {
      onComplete({ gender: selectedGender });
    }
  };

  const renderGenderOption = (option) => {
    const isSelected = selectedGender === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.genderCard,
          isSelected && styles.genderCardSelected
        ]}
        onPress={() => handleGenderSelect(option.id)}
        activeOpacity={0.8}
      >
        <View style={styles.imageSection}>
          <Image 
            source={option.image}
            style={styles.genderImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.genderContent}>
          <Text style={[
            styles.genderTitle,
            isSelected && styles.genderTitleSelected
          ]}>
            {option.title.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '12.5%' }]} />
          </View>
        </View>
      </View>

      <View style={styles.contentSection}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your training experience
          </Text>
        </View>

        {/* Gender Selection */}
        <View style={styles.genderContainer}>
          {genderOptions.map(option => renderGenderOption(option))}
        </View>
      </View>

      {/* Button Area - Always reserve space */}
      <View style={styles.buttonArea}>
        {selectedGender && (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              CONTINUE
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  contentSection: {
    flex: 1,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 32,
  },
  genderCard: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E5E5E5',
    width: (width - 60) / 2, // Wider cards for better image display
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  genderCardSelected: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  imageSection: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  genderImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
  },
  genderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
  },
  genderTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
  },
  genderTitleSelected: {
    color: '#FFFFFF',
  },
  buttonArea: {
    minHeight: 80,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
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
