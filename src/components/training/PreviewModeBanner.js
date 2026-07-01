import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, X } from 'lucide-react-native';

/**
 * Amber banner shown at the top of ProgramDetail when source === 'library'.
 * Dismissible per session (no storage — returns on next open).
 *
 * Props:
 *   onEnroll {function} – optional shortcut to open EnrollmentConfirmSheet
 */
export default function PreviewModeBanner({ onEnroll }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <Eye size={18} color="#92400E" strokeWidth={2} />
        <View style={styles.textBlock}>
          <Text style={styles.label}>Preview mode</Text>
          <Text style={styles.sub}>Add to My Training to log progress</Text>
        </View>
        {onEnroll && (
          <TouchableOpacity style={styles.addBtn} onPress={onEnroll}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => setDismissed(true)}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          style={styles.closeHit}
        >
          <X size={16} color="#92400E" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textBlock: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  sub: { fontSize: 12, color: '#78350F', marginTop: 1 },
  addBtn: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  closeHit: { paddingLeft: 4 },
});
