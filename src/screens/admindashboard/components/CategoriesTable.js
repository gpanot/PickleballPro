import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoriesTable({
  categories,
  programs,
  searchQuery,
  hasUnsavedCategoryChanges,
  savingCategoryOrder,
  saveCategoryOrder,
  reorderCategory,
  editingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  handleEditCategory,
  handleCancelCategoryEdit,
  handleSaveCategoryName,
  styles
}) {
  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Category Order</Text>
          <Text style={styles.sectionSubtitle}>Manage the order of program categories in the app</Text>
        </View>
        {hasUnsavedCategoryChanges && (
          <TouchableOpacity
            style={[styles.primaryButton, savingCategoryOrder && styles.primaryButtonDisabled]}
            onPress={saveCategoryOrder}
            disabled={savingCategoryOrder}
          >
            {savingCategoryOrder ? (
              <ActivityIndicator size="small" color="#fafafa" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#fafafa" />
            )}
            <Text style={styles.primaryButtonText}>
              {savingCategoryOrder ? 'Saving...' : 'Save Order'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.modernTable}>
        <View style={styles.modernTableHeader}>
          <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
            <Text style={styles.modernTableHeaderText}>Category</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Programs</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Order</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Actions</Text>
          </View>
        </View>

        <ScrollView style={styles.modernTableBody}>
          {filteredCategories.length > 0 ? filteredCategories.map((category, index) => {
            const programCount = programs.filter(p => p.category === category.name).length;

            return (
              <View key={category.id} style={styles.modernTableRow}>
                <View style={[styles.modernTableCell, { flex: 2 }]}>
                  <View style={styles.categoryInfoContainer}>
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryIconText}>
                        {category.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.categoryDetails}>
                      {editingCategoryId === category.id ? (
                        <View style={styles.categoryEditContainer}>
                          <TextInput
                            style={styles.categoryEditInput}
                            value={editingCategoryName}
                            onChangeText={setEditingCategoryName}
                            placeholder="Category name"
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                            onSubmitEditing={handleSaveCategoryName}
                          />
                          <View style={styles.categoryEditButtons}>
                            <TouchableOpacity
                              style={styles.categoryEditSaveButton}
                              onPress={handleSaveCategoryName}
                            >
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.categoryEditCancelButton}
                              onPress={handleCancelCategoryEdit}
                            >
                              <Ionicons name="close" size={14} color="#6B7280" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.categoryName}>{category.name}</Text>
                          <Text style={styles.categoryMeta}>Position: {index + 1}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <Text style={styles.programCountText}>{programCount} programs</Text>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                      onPress={() => reorderCategory(category.id, 'up')}
                      disabled={index === 0}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={14}
                        color={index === 0 ? '#D1D5DB' : '#6B7280'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.reorderButton,
                        index === filteredCategories.length - 1 && styles.reorderButtonDisabled
                      ]}
                      onPress={() => reorderCategory(category.id, 'down')}
                      disabled={index === filteredCategories.length - 1}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color={index === filteredCategories.length - 1 ? '#D1D5DB' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.modernTableCell, { flex: 1 }]}>
                  <View style={styles.modernActionButtons}>
                    {editingCategoryId === category.id ? (
                      <Text style={styles.editingText}>Editing...</Text>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.modernActionButton}
                          onPress={() => handleEditCategory(category)}
                        >
                          <Ionicons name="create-outline" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modernActionButton}>
                          <Ionicons name="eye-outline" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          }) : (
            <View style={styles.comingSoon}>
              <Ionicons name="reorder-three-outline" size={48} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>No categories found</Text>
              <Text style={styles.comingSoonSubtext}>Categories are created automatically from programs</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
