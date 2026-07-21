/**
 * CropImage
 * Generic rectangle image cropper (pan + pinch).
 * Default output ratio: 16:9 (offering thumbnails).
 *
 * Route params:
 *   imageUri  — local URI from ImagePicker
 *   aspectW   — crop width ratio  (default 16)
 *   aspectH   — crop height ratio (default 9)
 *
 * On "Choose", calls getCropImageCallback() → (croppedUri) then goBack().
 */
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

// Output size: 1280 wide, height derived from ratio
const OUTPUT_W   = 1280;
const MAX_BYTES  = 200 * 1024; // 200 KB

// ─── Callback registry ────────────────────────────────────────────────────────
let _cropImageCallback = null;
export const setCropImageCallback = (fn) => { _cropImageCallback = fn; };
export const getCropImageCallback = ()  => _cropImageCallback;

export default function CropImage({ route, navigation }) {
  const { imageUri, aspectW = 16, aspectH = 9 } = route.params ?? {};
  const insets = useSafeAreaInsets();

  // Frame dimensions — fill screen width with correct ratio
  const FRAME_W = screenW - 32;
  const FRAME_H = Math.round((FRAME_W * aspectH) / aspectW);
  const OUTPUT_H = Math.round((OUTPUT_W * aspectH) / aspectW);

  const [isSaving,     setIsSaving]     = useState(false);
  const [canvasLayout, setCanvasLayout] = useState(null);
  const [imgNative,    setImgNative]    = useState(null);
  const [imgDisplay,   setImgDisplay]   = useState(null);
  const [transform,    setTransform]    = useState({ x: 0, y: 0, scale: 1 });

  const viewShotRef = useRef(null);

  const imgX     = useRef(0);
  const imgY     = useRef(0);
  const imgScale = useRef(1);
  const lastX    = useRef(0);
  const lastY    = useRef(0);
  const lastScale   = useRef(1);
  const lastDist    = useRef(null);

  // Get native image size
  useEffect(() => {
    Image.getSize(imageUri, (w, h) => setImgNative({ w, h }));
  }, [imageUri]);

  // Initial fit-to-frame (cover)
  useEffect(() => {
    if (!canvasLayout || !imgNative) return;
    const { width: cw, height: ch } = canvasLayout;
    const coverScale = Math.max(FRAME_W / imgNative.w, FRAME_H / imgNative.h);
    const dw = imgNative.w * coverScale;
    const dh = imgNative.h * coverScale;
    setImgDisplay({ w: dw, h: dh });

    const frameLeft = (cw - FRAME_W) / 2;
    const frameTop  = (ch - FRAME_H) / 2;
    imgX.current = frameLeft + (FRAME_W - dw) / 2;
    imgY.current = frameTop  + (FRAME_H - dh) / 2;
    imgScale.current = 1;
    setTransform({ x: imgX.current, y: imgY.current, scale: 1 });
  }, [canvasLayout, imgNative]);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const clampPosition = (x, y, scale) => {
    if (!canvasLayout || !imgDisplay) return { x, y };
    const { width: cw, height: ch } = canvasLayout;
    const scaledW = imgDisplay.w * scale;
    const scaledH = imgDisplay.h * scale;
    const frameLeft = (cw - FRAME_W) / 2;
    const frameTop  = (ch - FRAME_H) / 2;

    return {
      x: clamp(x, frameLeft + FRAME_W - scaledW, frameLeft),
      y: clamp(y, frameTop  + FRAME_H - scaledH, frameTop),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        lastX.current     = imgX.current;
        lastY.current     = imgY.current;
        lastScale.current = imgScale.current;
        lastDist.current  = null;
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx   = touches[0].pageX - touches[1].pageX;
          const dy   = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastDist.current === null) { lastDist.current = dist; return; }
          const ratio    = dist / lastDist.current;
          const newScale = clamp(lastScale.current * ratio, 1, 8);
          const clamped  = clampPosition(imgX.current, imgY.current, newScale);
          imgScale.current = newScale;
          imgX.current = clamped.x;
          imgY.current = clamped.y;
          setTransform({ x: clamped.x, y: clamped.y, scale: newScale });
        } else {
          lastDist.current = null;
          const clamped = clampPosition(
            lastX.current + gestureState.dx,
            lastY.current + gestureState.dy,
            imgScale.current,
          );
          imgX.current = clamped.x;
          imgY.current = clamped.y;
          setTransform({ x: clamped.x, y: clamped.y, scale: imgScale.current });
        }
      },

      onPanResponderRelease: () => {
        lastDist.current  = null;
        lastScale.current = imgScale.current;
      },
    })
  ).current;

  const handleCrop = async () => {
    if (!imgDisplay || !canvasLayout) {
      Alert.alert('Please wait', 'Image not ready yet.');
      return;
    }
    try {
      setIsSaving(true);
      const capturedUri = await viewShotRef.current.capture();

      const qualities = [0.88, 0.75, 0.60, 0.45, 0.30, 0.15];
      let result = null;
      let finalSize = 0;

      for (const q of qualities) {
        result = await ImageManipulator.manipulateAsync(
          capturedUri,
          [{ resize: { width: OUTPUT_W, height: OUTPUT_H } }],
          { compress: q, format: ImageManipulator.SaveFormat.JPEG }
        );
        const buf = await (await fetch(result.uri)).arrayBuffer();
        finalSize = buf.byteLength;
        if (finalSize <= MAX_BYTES) break;
      }

      const cb = getCropImageCallback();
      if (typeof cb === 'function') await cb(result.uri);
      navigation.goBack();
    } catch (e) {
      console.error('CropImage error:', e);
      Alert.alert('Error', `Failed to save image: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Move and Scale</Text>
        <TouchableOpacity onPress={handleCrop} disabled={isSaving} style={styles.headerBtn}>
          <Text style={[styles.chooseText, isSaving && { opacity: 0.4 }]}>
            {isSaving ? 'Saving…' : 'Choose'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>Recommended: 1280 × 720 px (16:9)</Text>
      </View>

      {/* Canvas */}
      <View
        style={styles.canvas}
        onLayout={(e) => setCanvasLayout(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {/* Image layer */}
        {imgDisplay && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left:   transform.x,
              top:    transform.y,
              width:  imgDisplay.w * transform.scale,
              height: imgDisplay.h * transform.scale,
            }}
          >
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
          </View>
        )}

        {/* Dark overlays outside the frame */}
        {canvasLayout && (() => {
          const { width: cw, height: ch } = canvasLayout;
          const fl = (cw - FRAME_W) / 2;
          const ft = (ch - FRAME_H) / 2;
          return (
            <>
              {/* top */}
              <View pointerEvents="none" style={[styles.overlay, { top: 0,       left: 0,  right: 0,     height: ft }]} />
              {/* bottom */}
              <View pointerEvents="none" style={[styles.overlay, { bottom: 0,    left: 0,  right: 0,     height: ft }]} />
              {/* left */}
              <View pointerEvents="none" style={[styles.overlay, { top: ft,      left: 0,  width: fl,    height: FRAME_H }]} />
              {/* right */}
              <View pointerEvents="none" style={[styles.overlay, { top: ft,      right: 0, width: fl,    height: FRAME_H }]} />

              {/* Frame border */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: ft, left: fl,
                  width: FRAME_W, height: FRAME_H,
                  borderWidth: 2, borderColor: '#fff',
                  backgroundColor: 'transparent',
                }}
              />

              {/* Rule-of-thirds grid */}
              {[1, 2].map(i => (
                <React.Fragment key={i}>
                  <View pointerEvents="none" style={{ position: 'absolute', top: ft + (FRAME_H * i) / 3, left: fl, width: FRAME_W, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  <View pointerEvents="none" style={{ position: 'absolute', top: ft, left: fl + (FRAME_W * i) / 3, width: StyleSheet.hairlineWidth, height: FRAME_H, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </React.Fragment>
              ))}

              {/* Hidden ViewShot capture zone */}
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'jpg', quality: 1, result: 'tmpfile' }}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -9999, left: -9999,
                  width: FRAME_W, height: FRAME_H,
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                }}
              >
                {imgDisplay && (
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      position: 'absolute',
                      left:   transform.x - fl,
                      top:    transform.y - ft,
                      width:  imgDisplay.w * transform.scale,
                      height: imgDisplay.h * transform.scale,
                    }}
                    resizeMode="stretch"
                  />
                )}
              </ViewShot>
            </>
          );
        })()}

        <View style={styles.instructionsContainer} pointerEvents="none">
          <Text style={styles.instructions}>Drag to move · Pinch to zoom</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
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
  headerBtn:    { paddingVertical: 8, paddingHorizontal: 4, minWidth: 80 },
  cancelText:   { fontSize: 16, color: '#6B7280' },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  chooseText:   { fontSize: 16, color: '#3B82F6', fontWeight: '600', textAlign: 'right' },
  hintBar:      { backgroundColor: '#111', paddingVertical: 6, alignItems: 'center' },
  hintText:     { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  canvas:       { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  overlay:      { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)' },
  instructionsContainer: { position: 'absolute', bottom: 36, left: 0, right: 0, alignItems: 'center' },
  instructions: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
});
