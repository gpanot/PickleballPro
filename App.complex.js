import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Simple inline components to avoid import issues
const SimpleAuthScreen = ({ onAuthenticate }) => (
  <View style={styles.authContainer}>
    <Text style={styles.title}>🎾 PicklePro</Text>
    <Text style={styles.subtitle}>Train Smart. Play Better.</Text>
    <TouchableOpacity style={styles.signInButton} onPress={onAuthenticate}>
      <Text style={styles.signInButtonText}>Sign In (Mock)</Text>
    </TouchableOpacity>
  </View>
);

const SimpleMainScreen = () => (
  <View style={styles.mainContainer}>
    <Text style={styles.welcomeText}>Welcome to PicklePro!</Text>
    <Text style={styles.duprText}>DUPR Rating: 3.2</Text>
    <Text style={styles.tierText}>Intermediate Tier</Text>
    <Text style={styles.progressText}>Continue your training journey...</Text>
  </View>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {!isAuthenticated ? (
        <SimpleAuthScreen onAuthenticate={() => setIsAuthenticated(true)} />
      ) : (
        <SimpleMainScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  duprText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  tierText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    color: '#4B5563',
  },
});
