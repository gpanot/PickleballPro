import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';

const PlatformMap = ({ 
  style, 
  initialRegion, 
  region, 
  onPress, 
  onMapReady, 
  onRegionChangeComplete,
  children,
  ...props 
}) => {
  const handleOpenMaps = () => {
    const lat = region?.latitude || initialRegion?.latitude || 0;
    const lng = region?.longitude || initialRegion?.longitude || 0;
    
    Alert.alert(
      'Open in Maps',
      'Maps are not available in Expo Go. Would you like to open this location in your device\'s map app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Maps', 
          onPress: () => {
            const url = `https://maps.google.com/?q=${lat},${lng}`;
            Linking.openURL(url);
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[
        style, 
        { 
          backgroundColor: '#F3F4F6', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          minHeight: 200
        }
      ]}
      onPress={handleOpenMaps}
    >
      <Text style={{ 
        color: '#6B7280', 
        textAlign: 'center', 
        padding: 20,
        fontSize: 16,
        fontWeight: '500'
      }}>
        📍 Map Preview
      </Text>
      <Text style={{ 
        color: '#9CA3AF', 
        textAlign: 'center', 
        fontSize: 14,
        marginTop: 8
      }}>
        Tap to open in Maps app
      </Text>
      {(region?.latitude || initialRegion?.latitude) && (
        <Text style={{ 
          color: '#4B5563', 
          textAlign: 'center', 
          fontSize: 12,
          marginTop: 8,
          fontFamily: 'monospace'
        }}>
          {(region?.latitude || initialRegion?.latitude)?.toFixed(6)}, {(region?.longitude || initialRegion?.longitude)?.toFixed(6)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const PlatformMarker = ({ coordinate, draggable, onDragEnd, ...props }) => {
  // Return null since we can't render markers in the fallback
  return null;
};

export { PlatformMap, PlatformMarker };
