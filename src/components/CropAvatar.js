import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';

const { width: screenW } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(screenW - 40, 340);
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const OUTPUT_SIZE = 500;
const MAX_BYTES = 100 * 1024;

export default function CropAvatar({ route, navigation }) {
  const { imageUri } = route.params;
  const insets = useSafeAreaInsets();

  const [isSaving, setIsSaving] = useState(false);
  const [canvasLayout, setCanvasLayout] = useState(null);
  const [imgNative, setImgNative] = useState(null);
  const [imgDisplay, setImgDisplay] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  // ViewShot ref — points at the circle capture zone only
  const viewShotRef = useRef(null);

  const imgX = useRef(0);
  const imgY = useRef(0);
  const imgScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastScale = useRef(1);
  const lastDist = useRef(null);

  useEffect(() => {
    Image.getSize(imageUri, (w, h) => {
      setImgNative({ w, h });
    });
  }, [imageUri]);

  useEffect(() => {
    if (!canvasLayout || !imgNative) return;
    const { width: cw, height: ch } = canvasLayout;
    const coverScale = Math.max(CIRCLE_SIZE / imgNative.w, CIRCLE_SIZE / imgNative.h);
    const dw = imgNative.w * coverScale;
    const dh = imgNative.h * coverScale;
    setImgDisplay({ w: dw, h: dh });

    // Center image in canvas
    imgX.current = (cw - dw) / 2;
    imgY.current = (ch - dh) / 2;
    imgScale.current = 1;
    setTransform({ x: imgX.current, y: imgY.current, scale: 1 });
  }, [canvasLayout, imgNative]);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const clampPosition = (x, y, scale) => {
    if (!canvasLayout || !imgDisplay) return { x, y };
    const { width: cw, height: ch } = canvasLayout;
    const scaledW = imgDisplay.w * scale;
    const scaledH = imgDisplay.h * scale;
    const circleLeft = (cw - CIRCLE_SIZE) / 2;
    const circleTop = (ch - CIRCLE_SIZE) / 2;

    const minX = circleLeft + CIRCLE_SIZE - scaledW;
    const maxX = circleLeft;
    const minY = circleTop + CIRCLE_SIZE - scaledH;
    const maxY = circleTop;

    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        lastX.current = imgX.current;
        lastY.current = imgY.current;
        lastScale.current = imgScale.current;
        lastDist.current = null;
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (lastDist.current === null) {
            lastDist.current = dist;
            return;
          }

          const ratio = dist / lastDist.current;
          const newScale = clamp(lastScale.current * ratio, 1, 8);
          const clamped = clampPosition(imgX.current, imgY.current, newScale);
          imgScale.current = newScale;
          imgX.current = clamped.x;
          imgY.current = clamped.y;
          setTransform({ x: clamped.x, y: clamped.y, scale: newScale });
        } else {
          lastDist.current = null;
          const newX = lastX.current + gestureState.dx;
          const newY = lastY.current + gestureState.dy;
          const clamped = clampPosition(newX, newY, imgScale.current);
          imgX.current = clamped.x;
          imgY.current = clamped.y;
          setTransform({ x: clamped.x, y: clamped.y, scale: imgScale.current });
        }
      },

      onPanResponderRelease: () => {
        lastDist.current = null;
        lastScale.current = imgScale.current;
      },
    })
  ).current;

  const handleCrop = async () => {
    if (!imgDisplay || !canvasLayout) {
      Alert.alert('Please wait', 'Image not ready.');
      return;
    }

    try {
      setIsSaving(true);

      // Capture exactly what is visible inside the circle — pure WYSIWYG
      const capturedUri = await viewShotRef.current.capture();

      console.log('[CropDebug] Captured URI:', capturedUri);

      // Resize to 500x500 and compress under 100KB
      const qualities = [0.85, 0.7, 0.55, 0.4, 0.25, 0.1];
      let result = null;
      let finalSize = 0;
      let finalQuality = 0;

      for (const q of qualities) {
        result = await ImageManipulator.manipulateAsync(
          capturedUri,
          [{ resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE } }],
          { compress: q, format: ImageManipulator.SaveFormat.JPEG }
        );
        const res = await fetch(result.uri);
        const buf = await res.arrayBuffer();
        finalSize = buf.byteLength;
        finalQuality = q;
        if (finalSize <= MAX_BYTES) break;
      }

      console.log('[CropDebug] Saved:', {
        finalSizeKB: (finalSize / 1024).toFixed(1),
        finalQuality,
        outputSize: OUTPUT_SIZE,
        uri: result.uri,
      });

      const { getCropCompleteCallback } = require('../screens/ProfileScreen');
      const onCropComplete = getCropCompleteCallback();
      if (typeof onCropComplete === 'function') {
        await onCropComplete(result.uri);
      }

      navigation.goBack();
    } catch (e) {
      console.error('CropAvatar error:', e);
      Alert.alert('Error', `Failed to save image. ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Move and Scale</Text>
        <TouchableOpacity onPress={handleCrop} disabled={isSaving} style={styles.headerBtn}>
          <Text style={[styles.chooseText, isSaving && { opacity: 0.4 }]}>
            {isSaving ? 'Saving...' : 'Choose'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full canvas for gesture handling */}
      <View
        style={styles.canvas}
        onLayout={(e) => setCanvasLayout(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {/* Image layer — fills full canvas, gestures move it */}
        {imgDisplay && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: transform.x,
              top: transform.y,
              width: imgDisplay.w * transform.scale,
              height: imgDisplay.h * transform.scale,
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="stretch"
            />
          </View>
        )}

        {/* Black overlays around the circle */}
        {canvasLayout && (
          <>
            <View
              style={[
                styles.overlay,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: (canvasLayout.height - CIRCLE_SIZE) / 2,
                },
              ]}
              pointerEvents="none"
            />
            <View
              style={[
                styles.overlay,
                {
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: (canvasLayout.height - CIRCLE_SIZE) / 2,
                },
              ]}
              pointerEvents="none"
            />
            <View
              style={[
                styles.overlay,
                {
                  top: (canvasLayout.height - CIRCLE_SIZE) / 2,
                  left: 0,
                  width: (canvasLayout.width - CIRCLE_SIZE) / 2,
                  height: CIRCLE_SIZE,
                },
              ]}
              pointerEvents="none"
            />
            <View
              style={[
                styles.overlay,
                {
                  top: (canvasLayout.height - CIRCLE_SIZE) / 2,
                  right: 0,
                  width: (canvasLayout.width - CIRCLE_SIZE) / 2,
                  height: CIRCLE_SIZE,
                },
              ]}
              pointerEvents="none"
            />

            {/* White circle border */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_RADIUS,
                borderWidth: 2,
                borderColor: '#fff',
                top: (canvasLayout.height - CIRCLE_SIZE) / 2,
                left: (canvasLayout.width - CIRCLE_SIZE) / 2,
                backgroundColor: 'transparent',
              }}
            />

            {/*
              ViewShot capture zone — sits exactly over the circle,
              captures only the image pixels inside it, no black overlay.
              pointerEvents="none" so it does not block gestures.
            */}
            <ViewShot
              ref={viewShotRef}
              options={{
                format: 'jpg',
                quality: 1,
                result: 'tmpfile',
              }}
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_RADIUS,
                overflow: 'hidden',
                top: -9999,
                left: -9999,
                backgroundColor: 'transparent',
              }}
            >
              {/*
                Re-render the image inside ViewShot at the same relative position
                as it appears in the canvas, offset by the circle's top-left.
              */}
              {imgDisplay && (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    position: 'absolute',
                    left: transform.x - (canvasLayout.width - CIRCLE_SIZE) / 2,
                    top: transform.y - (canvasLayout.height - CIRCLE_SIZE) / 2,
                    width: imgDisplay.w * transform.scale,
                    height: imgDisplay.h * transform.scale,
                  }}
                  resizeMode="stretch"
                />
              )}
            </ViewShot>
          </>
        )}

        <View style={styles.instructionsContainer} pointerEvents="none">
          <Text style={styles.instructions}>Drag to move · Pinch to zoom</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 80 },
  cancelText: { fontSize: 16, color: '#6B7280' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  chooseText: { fontSize: 16, color: '#3B82F6', fontWeight: '600', textAlign: 'right' },
  canvas: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  overlay: { position: 'absolute', backgroundColor: '#000' },
  instructionsContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
});
