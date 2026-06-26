import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Derives a URL-safe slug from a display name
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);

export default function StartAcademyModal({ visible, onClose, onSuccess }) {
  // Step 1 = form, Step 2 = confirmation
  const [step, setStep] = useState(1);

  const [academyName, setAcademyName] = useState('');
  const [academySlug, setAcademySlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const [programCount, setProgramCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-derive slug from name unless the user has manually edited it
  useEffect(() => {
    if (!slugEdited) {
      setAcademySlug(slugify(academyName));
    }
  }, [academyName]);

  // Fetch the count of programs that will be bulk-claimed when reaching the confirm step
  useEffect(() => {
    if (step === 2) fetchProgramCount();
  }, [step]);

  const fetchProgramCount = async () => {
    setLoadingCount(true);
    try {
      // Count only the current user's unscoped programs — those are the ones
      // that will be bulk-claimed by become_academy_manager.
      const { data: { user } } = await supabase.auth.getUser();
      const { count } = await supabase
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .is('academy_id', null);
      setProgramCount(count ?? 0);
    } catch {
      setProgramCount(null);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleNameChange = (v) => {
    setAcademyName(v);
    setError('');
  };

  const handleSlugChange = (v) => {
    setSlugEdited(true);
    setAcademySlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'));
    setError('');
  };

  const handleContinue = () => {
    if (!academyName.trim()) { setError('Please enter an academy name.'); return; }
    if (!academySlug.trim()) { setError('Please enter a URL slug.'); return; }
    setError('');
    setStep(2);
  };

  const handleConfirmCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('become_academy_manager', {
        academy_name: academyName.trim(),
        academy_slug: academySlug.trim(),
        academy_logo_url: logoUrl.trim() || null,
      });

      if (rpcError) {
        // Surface the friendly RPC pre-check messages directly
        setError(rpcError.message || 'Failed to create academy.');
        setStep(1);
        return;
      }

      resetForm();
      onSuccess(data); // pass the new academy row back to caller
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAcademyName('');
    setAcademySlug('');
    setSlugEdited(false);
    setLogoUrl('');
    setError('');
    setProgramCount(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="school-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {step === 1 ? 'Start Your Academy' : 'Confirm Academy Creation'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {step === 1 ? 'Set up your coaching brand' : 'Review before creating'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {step === 1 ? (
              /* ── STEP 1: Form ── */
              <View style={styles.formBlock}>
                <View style={styles.field}>
                  <Text style={styles.label}>Academy Name <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={academyName}
                    onChangeText={handleNameChange}
                    placeholder="e.g. Tanner Pickleball Academy"
                    placeholderTextColor="#9CA3AF"
                    maxLength={80}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>URL Slug <Text style={styles.required}>*</Text></Text>
                  <View style={styles.slugRow}>
                    <Text style={styles.slugPrefix}>@</Text>
                    <TextInput
                      style={[styles.input, styles.slugInput]}
                      value={academySlug}
                      onChangeText={handleSlugChange}
                      placeholder="tanner-pickleball-academy"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={48}
                    />
                  </View>
                  <Text style={styles.hint}>Lowercase letters, numbers, and hyphens only. Cannot be changed later.</Text>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Logo URL <Text style={styles.optional}>(optional)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={logoUrl}
                    onChangeText={setLogoUrl}
                    placeholder="https://example.com/logo.png"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.hint}>Paste a public image URL. Logo upload will be available in a future update.</Text>
                </View>

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryButton, (!academyName.trim() || !academySlug.trim()) && styles.primaryButtonDisabled]}
                  onPress={handleContinue}
                  disabled={!academyName.trim() || !academySlug.trim()}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              /* ── STEP 2: Confirmation ── */
              <View style={styles.formBlock}>
                {/* Academy summary card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Name</Text>
                    <Text style={styles.summaryValue}>{academyName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Slug</Text>
                    <Text style={styles.summaryValue}>@{academySlug}</Text>
                  </View>
                  {logoUrl ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Logo</Text>
                      <Text style={styles.summaryValue} numberOfLines={1}>{logoUrl}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Bulk-claim warning (GAP-10) */}
                <View style={styles.warningCard}>
                  <Ionicons name="warning-outline" size={18} color="#92400E" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.warningTitle}>Your existing programs will be moved into this academy</Text>
                    <Text style={styles.warningBody}>
                      {loadingCount
                        ? 'Checking your programs…'
                        : programCount !== null && programCount > 0
                          ? `${programCount} program${programCount !== 1 ? 's' : ''} you created will be associated with ${academyName}. They'll become visible to other coaches you add to this academy.`
                          : `Any programs you create will be associated with ${academyName}. They'll become visible to other coaches you add to this academy.`
                      }
                    </Text>
                    <Text style={[styles.warningBody, { marginTop: 4, fontStyle: 'italic' }]}>
                      This action cannot be undone.
                    </Text>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => { setError(''); setStep(1); }}
                    disabled={loading}
                  >
                    <Ionicons name="arrow-back" size={16} color="#374151" />
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }, loading && styles.primaryButtonDisabled]}
                    onPress={handleConfirmCreate}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Ionicons name="school-outline" size={16} color="#FFFFFF" />
                    }
                    <Text style={styles.primaryButtonText}>
                      {loading ? 'Creating…' : 'Create My Academy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 560,
  },
  formBlock: {
    padding: 20,
    gap: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  optional: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  slugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slugPrefix: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  slugInput: {
    flex: 1,
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 50,
  },
  summaryValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 14,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
});
