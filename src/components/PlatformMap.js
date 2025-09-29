import React from 'react';
import MapView, { Marker } from 'react-native-maps';

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
  return (
    <MapView
      style={style}
      provider="google"
      initialRegion={initialRegion}
      region={region}
      onPress={onPress}
      onMapReady={onMapReady}
      onRegionChangeComplete={onRegionChangeComplete}
      {...props}
    >
      {children}
    </MapView>
  );
};

const PlatformMarker = ({ coordinate, draggable, onDragEnd, ...props }) => {
  return (
    <Marker
      coordinate={coordinate}
      draggable={draggable}
      onDragEnd={onDragEnd}
      {...props}
    />
  );
};

export { PlatformMap, PlatformMarker };
