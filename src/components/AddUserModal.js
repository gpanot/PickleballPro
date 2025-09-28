import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import skillsData from '../data/Commun_skills_tags.json';

export default function AddUserModal({ visible, onClose, onSuccess, user = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tier: '',
    goal: '',
    timeCommitment: '',
    duprRating: '',
    ratingType: 'self',
    isActive: true,
    focusAreas: []
  });

  // Initialize form data when user prop changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        tier: user.tier || '',
        goal: user.goal || '',
        timeCommitment: user.time_commitment || '',
        duprRating: user.dupr_rating ? user.dupr_rating.toString() : '',
        ratingType: user.rating_type || 'self',
        isActive: user.is_active !== false,
        focusAreas: user.focus_areas || []
      });
    } else {
      resetForm();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      tier: '',
      goal: '',
      timeCommitment: '',
      duprRating: '',
      ratingType: 'self',
      isActive: true,
      focusAreas: []
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userProfile = {
        email: formData.email.trim(),
        name: formData.name.trim(),
        tier: formData.tier || null,
        goal: formData.goal || null,
        time_commitment: formData.timeCommitment || null,
        dupr_rating: formData.duprRating ? parseFloat(formData.duprRating) : null,
        rating_type: formData.ratingType,
        is_active: formData.isActive,
        focus_areas: formData.focusAreas,
        updated_at: new Date().toISOString()
      };

      let data, error;

      if (user) {
        // Update existing user
        ({ data, error } = await supabase
          .from('users')
          .update(userProfile)
          .eq('id', user.id)
          .select());
      } else {
        // Create new user - first create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: 'TempPassword123!', // Temporary password - user will need to reset
          options: {
            data: {
              name: formData.name.trim()
            }
          }
        });

        if (authError && !authError.message.includes('User already registered')) {
          throw authError;
        }

        // Add creation fields for new users
        userProfile.onboarding_completed = false;
        userProfile.created_at = new Date().toISOString();
        
        // If we have auth data, use the auth user ID
        if (authData?.user?.id) {
          userProfile.id = authData.user.id;
        }

        ({ data, error } = await supabase
          .from('users')
          .insert([userProfile])
          .select());
      }

      if (error) {
        console.error(`${user ? 'Update' : 'Creation'} error:`, error);
        throw error;
      }

      // Close modal and refresh data immediately
      handleClose();
      onSuccess();
      
      // Show success message after modal closes
      const successMessage = user 
        ? `User "${formData.name}" updated successfully!`
        : `User "${formData.name}" created successfully! ${!user ? 'They will need to check their email to verify their account and set a new password.' : ''}`;

      Alert.alert('Success', successMessage);

    } catch (error) {
      console.error(`Error ${user ? 'updating' : 'creating'} user:`, error);
      Alert.alert('Error', `Failed to ${user ? 'update' : 'create'} user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
  const goalOptions = ['dupr', 'basics', 'consistency', 'tournament'];
  const timeCommitmentOptions = ['low', 'medium', 'high'];
  const ratingTypeOptions = ['dupr', 'self', 'none'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{user ? 'Edit User' : 'Add New User'}</Text>
          <TouchableOpacity
            style={[styles.createButton, (!formData.name.trim() || !formData.email.trim() || loading) && styles.createButtonDisabled]}
            onPress={handleSaveUser}
            disabled={!formData.name.trim() || !formData.email.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.createText, (!formData.name.trim() || !formData.email.trim()) && styles.createTextDisabled]}>
                {user ? 'Save' : 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="user@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Skill Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skill Level</Text>
              
              <Text style={styles.label}>Tier</Text>
              <View style={styles.optionsGrid}>
                {tierOptions.map((tier) => (
                  <TouchableOpacity
                    key={tier}
                    style={[styles.optionButton, formData.tier === tier && styles.optionButtonSelected]}
                    onPress={() => setFormData({...formData, tier})}
                  >
                    <Text style={[styles.optionText, formData.tier === tier && styles.optionTextSelected]}>
                      {tier}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>DUPR Rating (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.duprRating}
                onChangeText={(text) => setFormData({...formData, duprRating: text})}
                placeholder="e.g., 3.5"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Rating Type</Text>
              <View style={styles.optionsGrid}>
                {ratingTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.optionButton, formData.ratingType === type && styles.optionButtonSelected]}
                    onPress={() => setFormData({...formData, ratingType: type})}
                  >
                    <Text style={[styles.optionText, formData.ratingType === type && styles.optionTextSelected]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goals & Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Goals & Preferences</Text>
              
              <Text style={styles.label}>Primary Goal</Text>
              <View style={styles.optionsGrid}>
                {goalOptions.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.optionButton, formData.goal === goal && styles.optionButtonSelected]}
                    onPress={() => setFormData({...formData, goal})}
                  >
                    <Text style={[styles.optionText, formData.goal === goal && styles.optionTextSelected]}>
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Time Commitment</Text>
              <View style={styles.optionsGrid}>
                {timeCommitmentOptions.map((commitment) => (
                  <TouchableOpacity
                    key={commitment}
                    style={[styles.optionButton, formData.timeCommitment === commitment && styles.optionButtonSelected]}
                    onPress={() => setFormData({...formData, timeCommitment: commitment})}
                  >
                    <Text style={[styles.optionText, formData.timeCommitment === commitment && styles.optionTextSelected]}>
                      {commitment.charAt(0).toUpperCase() + commitment.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Skills & Focus Areas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills & Focus Areas</Text>
              <Text style={styles.sectionDescription}>
                Select the skills this user wants to focus on improving
              </Text>
              
              {Object.values(skillsData.skillCategories).map((category) => (
                <View key={category.name} style={styles.skillCategory}>
                  <Text style={styles.skillCategoryTitle}>{category.name}</Text>
                  <Text style={styles.skillCategoryDescription}>{category.description}</Text>
                  
                  <View style={styles.skillsGrid}>
                    {category.skills.map((skill) => {
                      const isSelected = formData.focusAreas.includes(skill.id);
                      return (
                        <TouchableOpacity
                          key={skill.id}
                          style={[
                            styles.skillButton, 
                            isSelected && [styles.skillButtonSelected, { borderColor: skill.color }]
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                focusAreas: formData.focusAreas.filter(id => id !== skill.id)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                focusAreas: [...formData.focusAreas, skill.id]
                              });
                            }
                          }}
                        >
                          <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                          <Text style={[
                            styles.skillButtonText, 
                            isSelected && [styles.skillButtonTextSelected, { color: skill.color }]
                          ]}>
                            {skill.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.skillSelectedIndicator}>
                              <Ionicons name="checkmark" size={12} color={skill.color} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              
              {formData.focusAreas.length > 0 && (
                <View style={styles.selectedSkillsPreview}>
                  <Text style={styles.selectedSkillsTitle}>
                    Selected Skills ({formData.focusAreas.length})
                  </Text>
                  <View style={styles.selectedSkillsContainer}>
                    {formData.focusAreas.map((skillId) => {
                      // Find skill from all categories
                      const allSkills = Object.values(skillsData.skillCategories)
                        .flatMap(cat => cat.skills);
                      const skill = allSkills.find(s => s.id === skillId);
                      
                      if (!skill) return null;
                      
                      return (
                        <View 
                          key={skill.id} 
                          style={[styles.selectedSkillTag, { backgroundColor: skill.color + '20' }]}
                        >
                          <Text style={styles.selectedSkillEmoji}>{skill.emoji}</Text>
                          <Text style={[styles.selectedSkillText, { color: skill.color }]}>
                            {skill.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Account Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Status</Text>
              
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setFormData({...formData, isActive: !formData.isActive})}
              >
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Active Account</Text>
                  <Text style={styles.toggleDescription}>User can access the app</Text>
                </View>
                <View style={[styles.toggle, formData.isActive && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, formData.isActive && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Info Box - only show for new users */}
            {!user && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Account Creation</Text>
                  <Text style={styles.infoDescription}>
                    A temporary password will be generated. The user will receive an email to verify their account and set a new password.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 17,
    color: '#EF4444',
    fontWeight: '400',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  createButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  createTextDisabled: {
    color: '#D1D5DB',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  
  // Skills & Focus Areas Styles
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  skillCategory: {
    marginBottom: 24,
  },
  skillCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillCategoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    position: 'relative',
  },
  skillButtonSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  skillEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  skillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  skillButtonTextSelected: {
    fontWeight: '600',
  },
  skillSelectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSkillsPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedSkillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  selectedSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedSkillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedSkillEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  selectedSkillText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
