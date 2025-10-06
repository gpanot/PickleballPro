import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreload } from '../context/PreloadContext';

/**
 * Debug component to show preloading status
 * Only use this during development for testing
 */
export default function PreloadDebugInfo() {
  const { getCacheStatus, isAllDataLoading } = usePreload();
  
  if (!__DEV__) {
    return null; // Don't show in production
  }
  
  const status = getCacheStatus();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Preload Status</Text>
      <Text style={styles.text}>
        Programs: {status.cache.programs} items {status.loading.programs ? '(loading...)' : '✅'}
      </Text>
      <Text style={styles.text}>
        Coaches: {status.cache.coaches} items {status.loading.coaches ? '(loading...)' : '✅'}
      </Text>
      <Text style={styles.text}>
        Logbook: {status.cache.logbook} items {status.loading.logbook ? '(loading...)' : '✅'}
      </Text>
      {isAllDataLoading() && (
        <Text style={styles.loadingText}>🔄 Preloading all data...</Text>
      )}
      {Object.keys(status.errors).some(key => status.errors[key]) && (
        <Text style={styles.errorText}>
          ❌ Errors: {Object.entries(status.errors)
            .filter(([_, error]) => error)
            .map(([key, error]) => `${key}: ${error}`)
            .join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
    zIndex: 9999,
    maxWidth: 200,
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    color: 'white',
    fontSize: 10,
    marginBottom: 2,
  },
  loadingText: {
    color: 'yellow',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 10,
    marginTop: 4,
  },
});

