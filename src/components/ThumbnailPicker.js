/**
 * ThumbnailPicker
 *
 * A reusable component for picking, cropping, compressing, and uploading
 * a 16:9 offering thumbnail to Supabase `offerings` storage bucket.
 *
 * Props:
 *   thumbnailUrl  — current URL (string | null) to display
 *   onUploaded    — (publicUrl: string) => void   called after successful upload
 *   navigation    — react-navigation prop (required to push CropImage screen)
 *   offeringId    — uuid | null — used as storage folder; can be a temp id while creating
 *
 * Usage:
 *   <ThumbnailPicker
 *     thumbnailUrl={thumbnailUrl}
 *     onUploaded={(url) => setThumbnailUrl(url)}
 *     navigation={navigation}
 *     offeringId={offeringId ?? 'new'}
 *   />
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { setCropImageCallback } from './CropImage';

export default function ThumbnailPicker({ thumbnailUrl, onUploaded, navigation, offeringId = 'new' }) {
  const { logbookTheme: t, isDark } = useTheme();
  const [uploading, setUploading] = React.useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll access to upload a thumbnail.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];

      // Register callback out-of-band (avoids non-serializable navigation param)
      setCropImageCallback(async (croppedUri) => {
        setUploading(true);
        try {
          await uploadThumbnail(croppedUri);
        } catch (e) {
          console.error('ThumbnailPicker upload error:', e);
          Alert.alert('Upload failed', e.message || 'Could not upload thumbnail.');
        } finally {
          setUploading(false);
        }
      });

      navigation.navigate('CropImage', { imageUri: asset.uri });
    } catch (e) {
      console.error('ThumbnailPicker pick error:', e);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const uploadThumbnail = async (imageUri) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const fileName  = `${offeringId}/thumbnail_${Date.now()}.jpg`;
    const response  = await fetch(imageUri);
    const arrayBuf  = await response.arrayBuffer();

    const { error: upErr } = await supabase.storage
      .from('offerings')
      .upload(fileName, arrayBuf, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage
      .from('offerings')
      .getPublicUrl(fileName);

    onUploaded(publicUrl);
  };

  return (
    <View style={styles.container}>
      {/* Recommended dimension label */}
      <Text style={[styles.hint, { color: t.textMuted, fontFamily: t.fontBody }]}>
        Recommended: 1280 × 720 px (16:9 · JPG · max 200 KB)
      </Text>

      {/* Preview / placeholder */}
      <TouchableOpacity
        style={[
          styles.preview,
          {
            borderColor: isDark ? t.border : '#D1D5DB',
            backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6',
          },
        ]}
        onPress={pickImage}
        activeOpacity={0.75}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color={t.accentPurple} />
            <Text style={[styles.uploadingText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              Uploading…
            </Text>
          </View>
        ) : thumbnailUrl ? (
          <>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Edit overlay */}
            <View style={styles.editOverlay}>
              <Camera size={18} color="#fff" strokeWidth={2} />
              <Text style={styles.editText}>Change photo</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon size={32} color={t.textMuted} strokeWidth={1.5} />
            <Text style={[styles.placeholderText, { color: t.textMuted, fontFamily: t.fontBody }]}>
              Tap to add a cover photo
            </Text>
            <Text style={[styles.tapHint, { color: t.textMuted, fontFamily: t.fontBody }]}>
              (optional)
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const ASPECT_W = 16;
const ASPECT_H = 9;
const PREVIEW_W = '100%';

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  hint: {
    fontSize: 11,
    marginBottom: 6,
    textAlign: 'right',
  },
  preview: {
    width: PREVIEW_W,
    aspectRatio: ASPECT_W / ASPECT_H,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    gap: 6,
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.7,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  editText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
  },
});
