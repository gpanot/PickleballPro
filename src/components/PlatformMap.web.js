import React from 'react';
import { View, Text } from 'react-native';

const PlatformMap = ({ style, ...props }) => {
  return (
    <View style={[style, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#6B7280', textAlign: 'center', padding: 20 }}>
        Map view is not available on web. Please use the coordinate inputs below.
      </Text>
    </View>
  );
};

const PlatformMarker = () => {
  return null;
};

export { PlatformMap, PlatformMarker };
