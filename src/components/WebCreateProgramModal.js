import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function WebCreateProgramModal({ visible, onClose, onSuccess, editingProgram }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [rating, setRating] = useState(4.0);
  const [userCount, setUserCount] = useState(0);
  const [exploreCategory, setExploreCategory] = useState('Fundamentals');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [exploreCategories, setExploreCategories] = useState([]);
  const [status, setStatus] = useState('draft');
  const [isCoachProgram, setIsCoachProgram] = useState(false);

  const isEditing = !!editingProgram;

  // Default categories from ExploreTrainingScreen
  const defaultCategories = ['Pro Training', 'Fundamentals'];

  useEffect(() => {
    if (visible) {
      fetchExploreCategories();
      // Populate fields when editing
      if (editingProgram) {
        setProgramName(editingProgram.name || '');
        setProgramDescription(editingProgram.description || '');
        setExploreCategory(editingProgram.category || 'Fundamentals');
        setRating(editingProgram.rating || 4.0);
        setUserCount(editingProgram.added_count || 0);
        setStatus(editingProgram.is_published ? 'published' : 'draft');
        setIsCoachProgram(editingProgram.is_coach_program || false);
        if (editingProgram.thumbnail_url) {
          setThumbnail(editingProgram.thumbnail_url);
        }
      } else {
        // Reset fields when creating new
        setProgramName('');
        setProgramDescription('');
        setExploreCategory('Fundamentals');
        setRating(4.0);
        setUserCount(0);
        setStatus('draft');
        setIsCoachProgram(false);
        setThumbnail(null);
        setCustomCategory('');
        setShowCustomCategory(false);
      }
    }
  }, [visible, editingProgram]);

  const fetchExploreCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // Get unique categories and combine with defaults
      const uniqueCategories = [...new Set([
        ...defaultCategories,
        ...data.map(item => item.category).filter(cat => cat && cat !== 'Custom')
      ])];

      setExploreCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories
      setExploreCategories(defaultCategories);
    }
  };

  const handleClose = () => {
    setProgramName('');
    setProgramDescription('');
    setThumbnail(null);
    setRating(4.0);
    setUserCount(0);
    setExploreCategory('Fundamentals');
    setCustomCategory('');
    setShowCustomCategory(false);
    setStatus('draft');
    onClose();
  };

  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.8,
      });

      if (!result.canceled) {
        setThumbnail(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !exploreCategories.includes(customCategory.trim())) {
      const newCategories = [...exploreCategories, customCategory.trim()];
      setExploreCategories(newCategories);
      setExploreCategory(customCategory.trim());
      setCustomCategory('');
      setShowCustomCategory(false);
    }
  };

  const uploadThumbnailToStorage = async (imageUri) => {
    try {
      console.log('📸 Starting thumbnail upload to storage...', imageUri);
      
      // Generate a unique filename with user folder structure
      let fileExt = 'jpg'; // Default extension
      
      // Try to extract extension from URI, but handle blob URLs
      if (!imageUri.startsWith('blob:')) {
        const uriParts = imageUri.split('.');
        if (uriParts.length > 1) {
          fileExt = uriParts.pop().toLowerCase();
        }
      }
      
      // Generate filename with user folder structure for better organization
      const sanitizedProgramName = programName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const fileName = `${user.id}/${sanitizedProgramName}_${Date.now()}.${fileExt}`;
      
      console.log('📁 File path:', fileName);
      
      // For web, we need to convert the image to a blob
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Blob size:', blob.size, 'bytes, type:', blob.type);
        
        const { data, error } = await supabase.storage
          .from('program_thumbnails')
          .upload(fileName, blob, {
            contentType: blob.type || `image/${fileExt}`,
            upsert: true // Allow overwriting existing files
          });
          
        if (error) {
          console.error('❌ Storage upload error:', error);
          throw error;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('program_thumbnails')
          .getPublicUrl(fileName);
          
        console.log('✅ Thumbnail uploaded successfully:', publicUrl);
        
        // Verify the URL is valid (not a blob URL)
        if (publicUrl.startsWith('blob:')) {
          throw new Error('Generated URL is still a blob URL - upload may have failed');
        }
        
        return publicUrl;
      } else {
        // For mobile, use the file URI directly
        const { data, error } = await supabase.storage
          .from('program_thumbnails')
          .upload(fileName, {
            uri: imageUri,
            type: `image/${fileExt}`,
            name: fileName.split('/').pop(),
          });
          
        if (error) {
          console.error('❌ Storage upload error:', error);
          throw error;
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('program_thumbnails')
          .getPublicUrl(fileName);
          
        console.log('✅ Thumbnail uploaded successfully:', publicUrl);
        return publicUrl;
      }
    } catch (error) {
      console.error('❌ Error uploading thumbnail:', error);
      
      // Provide more specific error messages
      if (error.message.includes('row-level security policy')) {
        throw new Error('Storage bucket permissions not configured. Please check the program_thumbnails bucket setup.');
      } else if (error.message.includes('bucket') && error.message.includes('not found')) {
        throw new Error('Program thumbnails storage bucket not found. Please create the program_thumbnails bucket.');
      } else {
        throw new Error(`Failed to upload thumbnail: ${error.message}`);
      }
    }
  };

  const handleCreateProgram = async () => {
    if (!programName.trim()) {
      Alert.alert('Error', 'Please enter a program name');
      return;
    }

    const finalCategory = showCustomCategory ? customCategory.trim() : exploreCategory;
    if (!finalCategory) {
      Alert.alert('Error', 'Please select or enter a category');
      return;
    }

    try {
      setLoading(true);
      
      // Debug: Check current user details
      console.log('Current user:', user);
      
      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else {
        console.log('User profile:', profile);
      }
      
      // Upload thumbnail to storage if provided
      let thumbnailUrl = null;
      if (thumbnail) {
        if (typeof thumbnail === 'string') {
          // Check if it's a blob URL (local) - these should be re-uploaded
          if (thumbnail.startsWith('blob:')) {
            console.log('🔄 Detected blob URL, re-uploading to storage...');
            thumbnailUrl = await uploadThumbnailToStorage(thumbnail);
          } else {
            // If it's already a proper storage URL, keep it
            thumbnailUrl = thumbnail;
          }
        } else if (thumbnail.uri) {
          // If it's a new image object, upload it to storage
          thumbnailUrl = await uploadThumbnailToStorage(thumbnail.uri);
        }
      }
      
      // Validate thumbnail URL before saving
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
        console.warn('⚠️ Blob URL detected, not saving to database:', thumbnailUrl);
        thumbnailUrl = null; // Don't save blob URLs
        Alert.alert('Warning', 'Thumbnail upload failed. Program will be saved without thumbnail.');
      }

      // Create the program data
      const programData = {
        name: programName.trim(),
        description: programDescription.trim() || 'New training program',
        category: finalCategory,
        tier: 'Beginner',
        rating: rating,
        added_count: userCount,
        is_published: status === 'published',
        thumbnail_url: thumbnailUrl,
        is_coach_program: isCoachProgram,
      };

      // Add created_by only for new programs
      if (!isEditing) {
        programData.created_by = user.id;
      }

      let data, error;

      if (isEditing) {
        // Update existing program using database function
        const result = await supabase
          .rpc('update_program_as_admin', {
            program_id: editingProgram.id,
            program_name: programData.name,
            program_description: programData.description,
            program_category: programData.category,
            program_tier: programData.tier,
            program_rating: programData.rating,
            program_added_count: programData.added_count,
            program_is_published: programData.is_published,
            program_thumbnail_url: programData.thumbnail_url,
            program_is_coach_program: programData.is_coach_program
          });
        data = result.data;
        error = result.error;
      } else {
        // Create new program using database function
        const result = await supabase
          .rpc('create_program_as_admin', {
            program_name: programData.name,
            program_description: programData.description,
            program_category: programData.category,
            program_tier: programData.tier,
            program_rating: programData.rating,
            program_added_count: programData.added_count,
            program_is_published: programData.is_published,
            program_thumbnail_url: programData.thumbnail_url,
            program_is_coach_program: programData.is_coach_program
          });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Program "${programName}" ${isEditing ? 'updated' : 'created'} successfully!`);
      handleClose();
      onSuccess && onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} program:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} program: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={handleClose}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Program' : 'Create Program'}</Text>
          <TouchableOpacity
            style={[styles.modalCreateButton, !programName.trim() && styles.modalCreateButtonDisabled]}
            onPress={handleCreateProgram}
            disabled={!programName.trim() || loading}
          >
            <Text style={[styles.modalCreateText, !programName.trim() && styles.modalCreateTextDisabled]}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            <Text style={styles.modalLabel}>Program Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={programName}
              onChangeText={setProgramName}
              placeholder="e.g., Advanced Dinking Strategies"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={programDescription}
              onChangeText={setProgramDescription}
              placeholder="Brief description of the program..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.modalLabel}>Thumbnail (Square)</Text>
            <TouchableOpacity style={styles.thumbnailSelector} onPress={handleSelectImage}>
              {thumbnail ? (
                <Image 
                  source={{ uri: typeof thumbnail === 'string' ? thumbnail : thumbnail.uri }} 
                  style={styles.thumbnailPreview} 
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.thumbnailPlaceholderText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>Rating</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={24}
                        color={star <= rating ? "#FFB800" : "#D1D5DB"}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.modalLabel}>User Count</Text>
                <TextInput
                  style={styles.modalInput}
                  value={userCount.toString()}
                  onChangeText={(text) => setUserCount(parseInt(text) || 0)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>Explore Category *</Text>
            <View style={styles.categoryContainer}>
              {exploreCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    exploreCategory === category && !showCustomCategory && styles.categoryOptionSelected
                  ]}
                  onPress={() => {
                    setExploreCategory(category);
                    setShowCustomCategory(false);
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    exploreCategory === category && !showCustomCategory && styles.categoryOptionTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  styles.addCategoryOption,
                  showCustomCategory && styles.categoryOptionSelected
                ]}
                onPress={() => setShowCustomCategory(true)}
              >
                <Ionicons name="add" size={16} color="#3B82F6" />
                <Text style={[styles.categoryOptionText, { color: '#3B82F6' }]}>Add New</Text>
              </TouchableOpacity>
            </View>

            {showCustomCategory && (
              <View style={styles.customCategoryContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Enter new category name"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.customCategoryButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addButton, !customCategory.trim() && styles.addButtonDisabled]}
                    onPress={handleAddCustomCategory}
                    disabled={!customCategory.trim()}
                  >
                    <Text style={[styles.addButtonText, !customCategory.trim() && styles.addButtonTextDisabled]}>
                      Add Category
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === 'draft' && styles.statusOptionSelected
                ]}
                onPress={() => setStatus('draft')}
              >
                <View style={styles.statusOptionContent}>
                  <Ionicons 
                    name="document-outline" 
                    size={20} 
                    color={status === 'draft' ? '#3B82F6' : '#6B7280'} 
                  />
                  <View style={styles.statusOptionTextContainer}>
                    <Text style={[
                      styles.statusOptionTitle,
                      status === 'draft' && styles.statusOptionTitleSelected
                    ]}>
                      Draft
                    </Text>
                    <Text style={[
                      styles.statusOptionDescription,
                      status === 'draft' && styles.statusOptionDescriptionSelected
                    ]}>
                      Save as draft for later editing
                    </Text>
                  </View>
                </View>
                {status === 'draft' && (
                  <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === 'published' && styles.statusOptionSelectedPublished
                ]}
                onPress={() => setStatus('published')}
              >
                <View style={styles.statusOptionContent}>
                  <Ionicons 
                    name="globe-outline" 
                    size={20} 
                    color={status === 'published' ? '#10B981' : '#6B7280'} 
                  />
                  <View style={styles.statusOptionTextContainer}>
                    <Text style={[
                      styles.statusOptionTitle,
                      status === 'published' && styles.statusOptionTitleSelectedPublished
                    ]}>
                      Published
                    </Text>
                    <Text style={[
                      styles.statusOptionDescription,
                      status === 'published' && styles.statusOptionDescriptionSelectedPublished
                    ]}>
                      Make available to users immediately
                    </Text>
                  </View>
                </View>
                {status === 'published' && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Coach Program Only</Text>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsCoachProgram(!isCoachProgram)}
            >
              <View style={[styles.checkbox, isCoachProgram && styles.checkboxChecked]}>
                {isCoachProgram && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxLabel}>This program is for coaches only</Text>
                <Text style={styles.checkboxDescription}>
                  Coach programs will be separated from student programs to keep content organized
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {status === 'draft' 
                    ? 'Program will be saved as a draft. You can publish it later from the programs list.'
                    : 'Program will be published immediately and available to users in the Explore section.'
                  }
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="eye-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  Published programs appear on the Explore screen under their selected category.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'ios' && {
      paddingTop: 60, // Account for status bar
    }),
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 17,
    color: '#EF4444',
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateButtonDisabled: {
    opacity: 0.4,
  },
  modalCreateText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCreateTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalForm: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  formColumn: {
    flex: 1,
  },
  thumbnailSelector: {
    height: 120,
    width: 120, // Make it square
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start', // Align to start so it doesn't stretch
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover', // Ensure image covers the container properly
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  addCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderStyle: 'dashed',
    borderColor: '#3B82F6',
  },
  customCategoryContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customCategoryButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#D1D5DB',
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  statusOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  statusOptionSelectedPublished: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusOptionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusOptionTitleSelected: {
    color: '#3B82F6',
  },
  statusOptionTitleSelectedPublished: {
    color: '#10B981',
  },
  statusOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  statusOptionDescriptionSelected: {
    color: '#1E40AF',
  },
  statusOptionDescriptionSelectedPublished: {
    color: '#059669',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});
