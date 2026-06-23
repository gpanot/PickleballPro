import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function Pagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <View style={styles.container}>
      {/* Left: count + page size selector */}
      <View style={styles.left}>
        <Text style={styles.countText}>
          {totalItems === 0
            ? `No ${itemLabel}`
            : `${start}–${end} of ${totalItems.toLocaleString()} ${itemLabel}`}
        </Text>
        <View style={styles.pageSizeRow}>
          <Text style={styles.pageSizeLabel}>Rows:</Text>
          {PAGE_SIZE_OPTIONS.map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.pageSizeBtn, pageSize === size && styles.pageSizeBtnActive]}
              onPress={() => { onPageSizeChange(size); onPageChange(1); }}
            >
              <Text style={[styles.pageSizeBtnText, pageSize === size && styles.pageSizeBtnTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Right: page navigation */}
      <View style={styles.right}>
        <TouchableOpacity
          style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
          onPress={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back-outline" size={12} color={currentPage === 1 ? '#D1D5DB' : '#374151'} />
          <Ionicons name="chevron-back-outline" size={12} color={currentPage === 1 ? '#D1D5DB' : '#374151'} style={{ marginLeft: -6 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back-outline" size={14} color={currentPage === 1 ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <View key={`ellipsis-${idx}`} style={styles.ellipsis}>
              <Text style={styles.ellipsisText}>…</Text>
            </View>
          ) : (
            <TouchableOpacity
              key={page}
              style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
              onPress={() => onPageChange(page)}
            >
              <Text style={[styles.pageBtnText, currentPage === page && styles.pageBtnTextActive]}>
                {page}
              </Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward-outline" size={14} color={currentPage === totalPages ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
          onPress={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward-outline" size={12} color={currentPage === totalPages ? '#D1D5DB' : '#374151'} />
          <Ionicons name="chevron-forward-outline" size={12} color={currentPage === totalPages ? '#D1D5DB' : '#374151'} style={{ marginLeft: -6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  countText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  pageSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageSizeLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  pageSizeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  pageSizeBtnActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  pageSizeBtnText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  pageSizeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  navBtnDisabled: {
    borderColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  pageBtn: {
    minWidth: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  pageBtnActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  pageBtnText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ellipsis: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
