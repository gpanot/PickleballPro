import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CROP_SIZE = screenWidth - 40; // 20px margin on each side

export default function CropAvatar({ route, navigation }) {
  const { imageUri, onCropComplete } = route.params;
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Improved gesture handling
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Base values to track accumulated transforms
  const baseScale = useRef(1);
  const baseTranslateX = useRef(0);
  const baseTranslateY = useRef(0);
  
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        // Clamp the scale during the gesture
        const { scale: gestureScale } = event.nativeEvent;
        const newScale = Math.max(0.5, Math.min(3, baseScale.current * gestureScale));
        scale.setValue(newScale);
      }
    }
  );
  
  const onPanGestureEvent = Animated.event(
    [{ 
      nativeEvent: { 
        translationX: translateX, 
        translationY: translateY 
      } 
    }],
    { 
      useNativeDriver: true,
      listener: (event) => {
        const { translationX: tx, translationY: ty } = event.nativeEvent;
        translateX.setValue(baseTranslateX.current + tx);
        translateY.setValue(baseTranslateY.current + ty);
      }
    }
  );
  
  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Save the final scale value
      const finalScale = Math.max(0.5, Math.min(3, baseScale.current * event.nativeEvent.scale));
      baseScale.current = finalScale;
      scale.setOffset(0);
      scale.setValue(finalScale);
    }
  };
  
  const onPanHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Save the final translation values
      baseTranslateX.current += event.nativeEvent.translationX;
      baseTranslateY.current += event.nativeEvent.translationY;
      
      translateX.setOffset(0);
      translateY.setOffset(0);
      translateX.setValue(baseTranslateX.current);
      translateY.setValue(baseTranslateY.current);
    }
  };
  const handleCrop = async () => {
    try {
      setIsProcessing(true);
      
      // Get image info
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const { width, height } = imageInfo;
      
      // Calculate square crop dimensions (use the smaller dimension)
      const cropSize = Math.min(width, height);
      const cropX = (width - cropSize) / 2;
      const cropY = (height - cropSize) / 2;
      
      // Crop to square and resize for avatar
      const croppedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropSize,
              height: cropSize,
            },
          },
          { resize: { width: 300, height: 300 } }, // Resize to avatar size
        ],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Return the cropped image
      onCropComplete(croppedImage.uri);
      navigation.goBack();
      
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* White Status Bar Area */}
      <View style={styles.statusBarArea} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Move and Scale</Text>
        
        <TouchableOpacity 
          style={[styles.headerButton, isProcessing && styles.headerButtonDisabled]} 
          onPress={handleCrop}
          disabled={isProcessing}
        >
          <Text style={[styles.chooseText, isProcessing && styles.chooseTextDisabled]}>
            {isProcessing ? 'Processing...' : 'Choose'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Crop Area */}
      <View style={styles.cropContainer}>
        <View style={styles.imageContainer}>
          {/* Pinch handler as the outer handler for better pinch responsiveness */}
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
            minPointers={2}
          >
            <Animated.View style={StyleSheet.absoluteFillObject}>
              <PanGestureHandler
                onGestureEvent={onPanGestureEvent}
                onHandlerStateChange={onPanHandlerStateChange}
                minPointers={1}
                maxPointers={1}
                avgTouches={true}
              >
                <Animated.View
                  style={[
                    styles.imageWrapper,
                    {
                      transform: [
                        { translateX: translateX },
                        { translateY: translateY },
                        { scale: scale },
                      ],
                    },
                  ]}
                >
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.image}
                    resizeMode="cover"
                    onLoad={() => console.log('Image loaded with improved gestures')}
                  />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
          
          {/* Crop Overlay */}
          <View style={styles.cropOverlay} pointerEvents="none">
            <View style={styles.cropFrame} />
          </View>
        </View>
        
        {/* Instructions */}
        <Text style={styles.instructions}>
          Drag to move • Pinch to zoom • Position your photo within the circle
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusBarArea: {
    height: 0, // Will be handled by paddingTop
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  chooseText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'right',
  },
  chooseTextDisabled: {
    color: '#9CA3AF',
  },
  cropContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    position: 'relative',
    marginBottom: 40,
    overflow: 'hidden',
    borderRadius: CROP_SIZE / 2,
    backgroundColor: '#1F2937',
  },
  imageWrapper: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: CROP_SIZE,
    height: CROP_SIZE,
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  instructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
