import React from 'react';
import { View, Platform } from 'react-native';

// Web-compatible LinearGradient component
export default function WebLinearGradient({ colors, style, children, ...props }) {
  if (Platform.OS === 'web') {
    // Use CSS gradient for web
    const webStyle = {
      ...style,
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    };
    
    return (
      <View style={webStyle} {...props}>
        {children}
      </View>
    );
  }
  
  // For native platforms, we'll just use a solid color fallback
  return (
    <View style={[style, { backgroundColor: colors[0] }]} {...props}>
      {children}
    </View>
  );
}
