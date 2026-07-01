import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
  onCreateCategory,
  onDeleteCategory,
  onToggleVisibility,
  styles,
}) {
  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.contentSection}>
      {/* Header row */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Category Order</Text>
          <Text style={styles.sectionSubtitle}>
            Manage categories visible in the Library. Draft categories are hidden from users.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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

          {/* + Create Category */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', gap: 6 },
            ]}
            onPress={onCreateCategory}
          >
            <Ionicons name="add" size={18} color="#fafafa" />
            <Text style={styles.primaryButtonText}>Create Category</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modernTable}>
        {/* Table header */}
        <View style={styles.modernTableHeader}>
          <View style={[styles.modernTableHeaderCell, { flex: 2 }]}>
            <Text style={styles.modernTableHeaderText}>Category</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Programs</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Visibility</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Order</Text>
          </View>
          <View style={[styles.modernTableHeaderCell, { flex: 1 }]}>
            <Text style={styles.modernTableHeaderText}>Actions</Text>
          </View>
        </View>

        <View>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => {
              const programCount = programs.filter(p => p.category === category.name).length;
              const isPublished = category.is_published;

              return (
                <View key={category.id} style={styles.modernTableRow}>
                  {/* Category name */}
                  <View style={[styles.modernTableCell, { flex: 2 }]}>
                    <View style={styles.categoryInfoContainer}>
                      <View
                        style={[
                          styles.categoryIcon,
                          !isPublished && { backgroundColor: '#F3F4F6' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryIconText,
                            !isPublished && { color: '#9CA3AF' },
                          ]}
                        >
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
                            <Text
                              style={[
                                styles.categoryName,
                                !isPublished && { color: '#9CA3AF' },
                              ]}
                            >
                              {category.name}
                            </Text>
                            <Text style={styles.categoryMeta}>Position: {index + 1}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Program count */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <Text style={styles.programCountText}>{programCount} programs</Text>
                  </View>

                  {/* Visibility toggle */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <TouchableOpacity
                      onPress={() => onToggleVisibility(category)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingVertical: 4,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        backgroundColor: isPublished ? '#DCFCE7' : '#FEF3C7',
                        borderWidth: 1,
                        borderColor: isPublished ? '#86EFAC' : '#FCD34D',
                        alignSelf: 'flex-start',
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isPublished ? 'eye-outline' : 'eye-off-outline'}
                        size={13}
                        color={isPublished ? '#16A34A' : '#B45309'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: isPublished ? '#16A34A' : '#B45309',
                        }}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Reorder buttons */}
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
                          index === filteredCategories.length - 1 && styles.reorderButtonDisabled,
                        ]}
                        onPress={() => reorderCategory(category.id, 'down')}
                        disabled={index === filteredCategories.length - 1}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={14}
                          color={
                            index === filteredCategories.length - 1 ? '#D1D5DB' : '#6B7280'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Actions: edit + delete */}
                  <View style={[styles.modernTableCell, { flex: 1 }]}>
                    <View style={styles.modernActionButtons}>
                      {editingCategoryId === category.id ? (
                        <Text style={styles.editingText}>Editing…</Text>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.modernActionButton}
                            onPress={() => handleEditCategory(category)}
                          >
                            <Ionicons name="create-outline" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.modernActionButton,
                              { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
                            ]}
                            onPress={() => onDeleteCategory(category)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.comingSoon}>
              <Ionicons name="reorder-three-outline" size={48} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>No categories found</Text>
              <Text style={styles.comingSoonSubtext}>
                Click "+ Create Category" to add your first category
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
