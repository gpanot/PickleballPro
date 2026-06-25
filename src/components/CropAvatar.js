/**
 * CropAvatar
 *
 * How it works:
 *  - The source image is displayed at its natural aspect ratio inside the dark
 *    fullscreen canvas.  It is initially scaled so its shorter side fills the
 *    circular crop window (same "cover" behaviour you'd expect, but calculated
 *    manually so we know the exact pixel math).
 *  - The user can pinch to zoom and drag to reposition.
 *  - "Choose" reverse-maps the current transform back to native pixel coordinates
 *    and passes the exact crop region to ImageManipulator — so what you see
 *    inside the circle is exactly what gets saved.
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
  Animated,
} from 'react-native';
import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// The circular crop viewport is a square of this side length, centred on screen.
const VIEWPORT = Math.min(screenWidth - 40, 340);

export default function CropAvatar({ route, navigation }) {
  const { imageUri, onCropComplete } = route.params;
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);

  // Native image dimensions — resolved after the <Image> loads
  const [imgNativeW, setImgNativeW] = useState(null);
  const [imgNativeH, setImgNativeH] = useState(null);

  // The "initial" display size for the image (natural aspect ratio, cover-fits
  // the viewport).  Set once image dimensions are known.
  const [imgDisplayW, setImgDisplayW] = useState(VIEWPORT);
  const [imgDisplayH, setImgDisplayH] = useState(VIEWPORT);

  // ── Animated values (drive live preview) ──────────────────────────────────
  const animScale = useRef(new Animated.Value(1)).current;
  const animTX    = useRef(new Animated.Value(0)).current;
  const animTY    = useRef(new Animated.Value(0)).current;

  // ── Committed (accumulated) transform ─────────────────────────────────────
  // Scale is relative to the initial imgDisplayW/H sizing.
  const cScale = useRef(1);
  const cTX    = useRef(0);
  const cTY    = useRef(0);

  // Resolve image dimensions and set the initial cover-fit scale
  useEffect(() => {
    Image.getSize(
      imageUri,
      (w, h) => {
        setImgNativeW(w);
        setImgNativeH(h);

        // Cover-fit: scale image so its shorter side equals VIEWPORT
        const coverScale = Math.max(VIEWPORT / w, VIEWPORT / h);
        const dW = w * coverScale;
        const dH = h * coverScale;
        setImgDisplayW(dW);
        setImgDisplayH(dH);
      },
      (err) => {
        console.error('Image.getSize error:', err);
      }
    );
  }, [imageUri]);

  // ── Pinch ──────────────────────────────────────────────────────────────────
  const onPinchEvent = (e) => {
    // Multiply accumulated scale by live pinch delta, clamp, set animScale
    const delta = e.nativeEvent.scale;
    const liveScale = Math.max(0.5, Math.min(8, cScale.current * delta));
    animScale.setValue(liveScale);
  };

  const onPinchStateChange = (e) => {
    if (e.nativeEvent.oldState === State.ACTIVE) {
      // Commit the final scale
      const newScale = Math.max(0.5, Math.min(8, cScale.current * e.nativeEvent.scale));
      cScale.current = newScale;
      animScale.setValue(newScale);
    }
  };

  // ── Pan ────────────────────────────────────────────────────────────────────
  // Use setOffset so each new gesture's translationX/Y starts from 0 but adds
  // to the previously committed position.
  const onPanEvent = (e) => {
    animTX.setValue(cTX.current + e.nativeEvent.translationX);
    animTY.setValue(cTY.current + e.nativeEvent.translationY);
  };

  const onPanStateChange = (e) => {
    if (e.nativeEvent.oldState === State.ACTIVE) {
      cTX.current += e.nativeEvent.translationX;
      cTY.current += e.nativeEvent.translationY;
      animTX.setValue(cTX.current);
      animTY.setValue(cTY.current);
    }
  };

  // ── Compute crop region in native pixels ──────────────────────────────────
  //
  // Layout:
  //  • The image wrapper is centred in the viewport (both are squares of VIEWPORT).
  //  • The image itself is imgDisplayW × imgDisplayH (natural aspect, cover-fit).
  //  • The total transform applied to the image wrapper is:
  //      translate(cTX, cTY)  then  scale(cScale)
  //    All transforms are applied around the centre of the wrapper (RN default).
  //
  // We need to find, in native pixels, the rectangle of the original image that
  // is currently visible inside the VIEWPORT × VIEWPORT circle.
  //
  // Step 1 — work in "display units at scale=1" (dp).
  //   The image occupies imgDisplayW × imgDisplayH dp at cScale=1.
  //   Its top-left in dp relative to the viewport centre is:
  //     imgLeft_dp = -imgDisplayW/2  (centred, no translation at rest)
  //     imgTop_dp  = -imgDisplayH/2
  //
  // Step 2 — apply current transform.
  //   After translate(cTX, cTY) + scale(cScale):
  //     actualImgLeft = cTX - (imgDisplayW * cScale) / 2
  //     actualImgTop  = cTY - (imgDisplayH * cScale) / 2
  //   (all relative to viewport centre)
  //
  // Step 3 — the viewport window in dp (relative to viewport centre):
  //     windowLeft = -VIEWPORT/2,  windowRight = VIEWPORT/2
  //     windowTop  = -VIEWPORT/2,  windowBottom = VIEWPORT/2
  //
  // Step 4 — express the viewport corners in IMAGE display coords:
  //     imageX = (viewportX - cTX) / cScale + imgDisplayW/2
  //     imageY = (viewportY - cTY) / cScale + imgDisplayH/2
  //
  // Step 5 — scale from display dp to native pixels:
  //     nativeX = imageX * (nativeW / imgDisplayW)
  //     nativeY = imageY * (nativeH / imgDisplayH)
  const computeCrop = () => {
    const s  = cScale.current;
    const tx = cTX.current;
    const ty = cTY.current;

    // Viewport corners in viewport-centred dp
    const vL = -VIEWPORT / 2;
    const vT = -VIEWPORT / 2;
    const vR =  VIEWPORT / 2;
    const vB =  VIEWPORT / 2;

    // Map to image display coords (dp, origin = image top-left)
    const imgL = (vL - tx) / s + imgDisplayW / 2;
    const imgT = (vT - ty) / s + imgDisplayH / 2;
    const imgR = (vR - tx) / s + imgDisplayW / 2;
    const imgB = (vB - ty) / s + imgDisplayH / 2;

    // Convert dp → native pixels
    const scaleToNativeX = imgNativeW / imgDisplayW;
    const scaleToNativeY = imgNativeH / imgDisplayH;

    let originX = imgL * scaleToNativeX;
    let originY = imgT * scaleToNativeY;
    let cropW   = (imgR - imgL) * scaleToNativeX;
    let cropH   = (imgB - imgT) * scaleToNativeY;

    // Clamp to image bounds
    originX = Math.max(0, originX);
    originY = Math.max(0, originY);
    cropW   = Math.min(cropW, imgNativeW - originX);
    cropH   = Math.min(cropH, imgNativeH - originY);

    // Force square (take the smaller side)
    const side = Math.min(cropW, cropH);

    return {
      originX: Math.round(originX),
      originY: Math.round(originY),
      width:   Math.round(side),
      height:  Math.round(side),
    };
  };

  // ── "Choose" handler ───────────────────────────────────────────────────────
  const handleCrop = async () => {
    if (!imgNativeW || !imgNativeH) {
      Alert.alert('Please wait', 'Image is still loading.');
      return;
    }
    try {
      setIsProcessing(true);
      const cropRegion = computeCrop();

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: cropRegion },
          { resize: { width: 400, height: 400 } },
        ],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      onCropComplete(result.uri);
      navigation.goBack();
    } catch (error) {
      console.error('CropAvatar error:', error);
      Alert.alert('Error', 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Move and Scale</Text>

        <TouchableOpacity
          style={[styles.headerBtn, isProcessing && styles.headerBtnDisabled]}
          onPress={handleCrop}
          disabled={isProcessing}
        >
          <Text style={[styles.chooseText, isProcessing && styles.chooseTextDisabled]}>
            {isProcessing ? 'Saving…' : 'Choose'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <View style={styles.canvas}>

        {/* Gesture layer — full canvas so pinch/pan work anywhere */}
        <PinchGestureHandler
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.View style={StyleSheet.absoluteFillObject}>
            <PanGestureHandler
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanStateChange}
              minPointers={1}
              maxPointers={1}
            >
              {/* Centring wrapper — image starts in the middle of the canvas */}
              <Animated.View style={[StyleSheet.absoluteFillObject, styles.imageLayer]}>
                <Animated.View
                  style={{
                    width: imgDisplayW,
                    height: imgDisplayH,
                    transform: [
                      { translateX: animTX },
                      { translateY: animTY },
                      { scale: animScale },
                    ],
                  }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: imgDisplayW, height: imgDisplayH }}
                    resizeMode="stretch"
                  />
                </Animated.View>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {/* Dim overlay with circular cutout using a shadow trick:
            Four rectangles around the circle + a transparent circle */}
        <View style={styles.overlayContainer} pointerEvents="none">
          {/* Top strip */}
          <View style={[styles.overlayStrip, { height: (screenHeight - VIEWPORT) / 2 }]} />
          {/* Middle row */}
          <View style={styles.overlayMiddleRow}>
            <View style={[styles.overlaySide, { width: (screenWidth - VIEWPORT) / 2 }]} />
            {/* Transparent circle in the middle */}
            <View style={[styles.circleHole, { width: VIEWPORT, height: VIEWPORT, borderRadius: VIEWPORT / 2 }]} />
            <View style={[styles.overlaySide, { width: (screenWidth - VIEWPORT) / 2 }]} />
          </View>
          {/* Bottom strip */}
          <View style={[styles.overlayStrip, { flex: 1 }]} />
        </View>

        {/* Circle border */}
        <View
          pointerEvents="none"
          style={[
            styles.circleBorder,
            {
              width: VIEWPORT,
              height: VIEWPORT,
              borderRadius: VIEWPORT / 2,
              top: '50%',
              left: '50%',
              marginTop: -VIEWPORT / 2,
              marginLeft: -VIEWPORT / 2,
            },
          ]}
        />

        {/* Instructions */}
        <View style={styles.instructionsContainer} pointerEvents="none">
          <Text style={styles.instructions}>
            Drag to move · Pinch to zoom
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
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
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 80,
  },
  headerBtnDisabled: { opacity: 0.4 },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
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
  chooseTextDisabled: { color: '#9CA3AF' },

  // Canvas fills everything below the header
  canvas: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // The layer that contains the image — centred so transforms rotate around canvas centre
  imageLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dim overlay — four strips around the circle
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  overlayStrip: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlaySide: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignSelf: 'stretch',
  },
  circleHole: {
    backgroundColor: 'transparent',
  },

  // White ring around the crop circle
  circleBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },

  instructionsContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
