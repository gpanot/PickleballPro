import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AddCoachModal({ visible, onClose, onSuccess, coach = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Initialize form data when coach prop changes
  React.useEffect(() => {
    if (coach) {
      setFormData({
        name: coach.name || '',
        email: coach.email || '',
        bio: coach.bio || '',
        duprRating: coach.dupr_rating ? coach.dupr_rating.toString() : '',
        hourlyRate: coach.hourly_rate ? (coach.hourly_rate / 100).toString() : '', // Convert from cents
        location: coach.location || '',
        phone: coach.phone || '',
        specialties: coach.specialties || [],
        isVerified: coach.is_verified || false,
        isActive: coach.is_active !== false
      });
    } else {
      setFormData({});
    }
  }, [coach]);

  const handleSaveCoach = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const coachData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio || '',
        dupr_rating: formData.duprRating ? parseFloat(formData.duprRating) : null,
        hourly_rate: formData.hourlyRate ? parseInt(formData.hourlyRate) * 100 : null, // Convert to cents
        location: formData.location || '',
        phone: formData.phone || '',
        specialties: formData.specialties || [],
        is_verified: formData.isVerified || false,
        is_active: formData.isActive !== false, // Default to true
      };

      let data, error;
      
      if (coach) {
        // Update existing coach
        ({ data, error } = await supabase
          .from('coaches')
          .update(coachData)
          .eq('id', coach.id)
          .select());
      } else {
        // Create new coach
        ({ data, error } = await supabase
          .from('coaches')
          .insert([{
            ...coachData,
            rating_avg: 0,
            rating_count: 0
          }])
          .select());
      }

      if (error) throw error;

      Alert.alert('Success', `Coach ${coach ? 'updated' : 'created'} successfully!`);
      setFormData({});
      onClose();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Error ${coach ? 'updating' : 'creating'} coach:`, error);
      Alert.alert('Error', `Failed to ${coach ? 'update' : 'create'} coach: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    onClose();
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
            style={styles.modalCloseButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{coach ? 'Edit Coach' : 'Add New Coach'}</Text>
          <TouchableOpacity 
            style={styles.modalSaveButton}
            onPress={handleSaveCoach}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.modalSaveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter coach's full name"
                value={formData.name || ''}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Email Address *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="coach@example.com"
                value={formData.email || ''}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="(555) 123-4567"
                value={formData.phone || ''}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Tell us about the coach's background and experience..."
                value={formData.bio || ''}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Professional Details</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>DUPR Rating</Text>
              <TextInput
                style={styles.formInput}
                placeholder="4.5"
                value={formData.duprRating || ''}
                onChangeText={(text) => setFormData({...formData, duprRating: text})}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Hourly Rate ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="75"
                value={formData.hourlyRate || ''}
                onChangeText={(text) => setFormData({...formData, hourlyRate: text})}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="City, State"
                value={formData.location || ''}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Specialties</Text>
              <View style={styles.specialtyPicker}>
                {['Technique', 'Mental Game', 'Beginners', 'Advanced', 'Competition', 'Youth', 'Fitness', 'Strategy'].map(specialty => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.specialtyOption,
                      (formData.specialties || []).includes(specialty) && styles.specialtyOptionSelected
                    ]}
                    onPress={() => {
                      const currentSpecialties = formData.specialties || [];
                      const newSpecialties = currentSpecialties.includes(specialty)
                        ? currentSpecialties.filter(s => s !== specialty)
                        : [...currentSpecialties, specialty];
                      setFormData({...formData, specialties: newSpecialties});
                    }}
                  >
                    <Text style={[
                      styles.specialtyOptionText,
                      (formData.specialties || []).includes(specialty) && styles.specialtyOptionTextSelected
                    ]}>{specialty}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Status</Text>
            
            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}
                  onPress={() => setFormData({...formData, isActive: !formData.isActive})}
                >
                  {formData.isActive && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Active (available for new students)</Text>
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isVerified && styles.checkboxChecked]}
                  onPress={() => setFormData({...formData, isVerified: !formData.isVerified})}
                >
                  {formData.isVerified && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Verified (admin approved)</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Modal Styles
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
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  modalSaveButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Form Styles
  formSection: {
    marginVertical: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    outlineStyle: 'none',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  specialtyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  specialtyOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  specialtyOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  specialtyOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
