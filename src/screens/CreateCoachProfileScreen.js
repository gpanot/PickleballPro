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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ModernIcon from '../components/ModernIcon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CreateCoachProfileScreen({ navigation }) {
  const { user: authUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: authUser?.user_metadata?.full_name || '',
    email: authUser?.email || '',
    bio: '',
    duprRating: '',
    hourlyRate: '',
    location: '',
    phone: '',
    specialties: [],
    isVerified: false,
    isActive: true,
    isAcceptingStudents: false // Default to not published
  });

  const handleSaveCoach = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Check if user already has a coach profile
      const { data: existingCoach, error: checkError } = await supabase
        .from('coaches')
        .select('id')
        .eq('email', formData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error which is expected
        throw checkError;
      }

      if (existingCoach) {
        Alert.alert(
          'Coach Profile Already Exists',
          'You already have a coach profile with this email address. Please contact support if you need to update your existing profile.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      const coachData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio || '',
        dupr_rating: formData.duprRating ? parseFloat(formData.duprRating) : null,
        hourly_rate: formData.hourlyRate ? parseInt(formData.hourlyRate) * 100 : null, // Convert to cents
        location: formData.location || '',
        phone: formData.phone || '',
        specialties: formData.specialties || [],
        is_verified: false, // New coach profiles start as unverified
        is_active: formData.isActive !== false, // Default to true
        is_accepting_students: formData.isAcceptingStudents, // User's choice to publish
        rating_avg: 0,
        rating_count: 0
      };

      const { data, error } = await supabase
        .from('coaches')
        .insert([coachData])
        .select();

      if (error) throw error;

      const successMessage = formData.isAcceptingStudents 
        ? 'Your coach profile has been created successfully! It will be reviewed by our team before being published in the coach directory.'
        : 'Your coach profile has been created successfully! You can publish it in the coach directory anytime by updating your profile.';
        
      Alert.alert(
        'Success', 
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating coach profile:', error);
      Alert.alert('Error', 'Failed to create coach profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Your Coach Profile</Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveCoach}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Earn More with PicklePro</Text>
            <Text style={styles.introDescription}>
              Share your pickleball expertise and help others improve their game. Fill out your profile to get started.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Email Address *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={false} // Pre-filled from auth user
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Tell us about your background, experience, and coaching philosophy..."
                value={formData.bio}
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
                value={formData.duprRating}
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
                value={formData.hourlyRate}
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
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Specialties</Text>
              <Text style={styles.formDescription}>Select your areas of expertise</Text>
              <View style={styles.specialtyPicker}>
                {['Technique', 'Mental Game', 'Beginners', 'Advanced', 'Competition', 'Youth', 'Fitness', 'Strategy'].map(specialty => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.specialtyOption,
                      formData.specialties.includes(specialty) && styles.specialtyOptionSelected
                    ]}
                    onPress={() => {
                      const newSpecialties = formData.specialties.includes(specialty)
                        ? formData.specialties.filter(s => s !== specialty)
                        : [...formData.specialties, specialty];
                      setFormData({...formData, specialties: newSpecialties});
                    }}
                  >
                    <Text style={[
                      styles.specialtyOptionText,
                      formData.specialties.includes(specialty) && styles.specialtyOptionTextSelected
                    ]}>{specialty}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Availability & Visibility</Text>
            
            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}
                  onPress={() => setFormData({...formData, isActive: !formData.isActive})}
                >
                  {formData.isActive && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Available for new students</Text>
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isAcceptingStudents && styles.checkboxChecked]}
                  onPress={() => setFormData({...formData, isAcceptingStudents: !formData.isAcceptingStudents})}
                >
                  {formData.isAcceptingStudents && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>Publish my profile in the coach directory</Text>
                  <Text style={styles.checkboxDescription}>
                    When checked, your profile will be visible to students looking for coaches. You can change this anytime.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.disclaimerSection}>
            <View style={styles.disclaimerCard}>
              <ModernIcon name="help" size={20} color="#059669" />
              <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerTitle}>Profile Review & Publishing</Text>
                <Text style={styles.disclaimerText}>
                  Your coach profile will be reviewed by our team before it can be published. This typically takes 1-2 business days. You can choose to publish your profile in the coach directory once it's approved, or keep it private until you're ready.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { outline: 'none' }
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  specialtyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  specialtyOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  specialtyOptionText: {
    fontSize: 14,
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
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  disclaimerSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  disclaimerContent: {
    flex: 1,
    marginLeft: 12,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
});
