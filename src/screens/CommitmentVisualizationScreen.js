import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CommitmentVisualizationScreen({ onComplete }) {
  const insets = useSafeAreaInsets();

  const handleCommitmentSelect = () => {
    // Proceed to next screen with commitment data
    onComplete({ commitment_level: 'committed' });
  };

  return (
    <>
      {/* Phone Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={[styles.wrapper, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          {/* Content Area */}
          <View style={styles.contentArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>A 3-month commitment builds solid progress.</Text>
            </View>

            {/* Progress Visualization */}
            <View style={styles.visualizationContainer}>
              <Image 
                source={require('../../assets/images/3monthsprogress.png')} 
                style={styles.progressImage}
                resizeMode="contain"
              />
              <Text style={styles.progressLabel}>Your progress</Text>
            </View>
          </View>

          {/* Button Area */}
          <View style={styles.buttonArea}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleCommitmentSelect}
            >
              <Text style={styles.continueButtonText}>
                I'm Committed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 40,
    paddingBottom: 30,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    paddingHorizontal: 10,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressImage: {
    width: '90%',
    height: 280,
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonArea: {
    paddingTop: 40,
    paddingBottom: 10,
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
});
