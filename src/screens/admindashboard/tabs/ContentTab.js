import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import ProgramsTable from '../components/ProgramsTable';
import ExercisesTable from '../components/ExercisesTable';
import RoutinesTable from '../components/RoutinesTable';
import CategoriesTable from '../components/CategoriesTable';
import styles from '../adminDashboardStyles';

export default function ContentTab({
  sessionRole,
  academyId,
  coachId,
  isMobile,
  user,
  setBannerMessage,
  // callbacks to open parent-owned modals
  onCreateProgram,
  onCreateRoutine,
  onCreateExercise,
  onViewProgramStructure,
  onEditProgramStructure,
  onEditRoutine,
  onEditExercise,
}) {
  const isManagerSession = sessionRole === 'manager';
  const isCoachSession = sessionRole === 'coach';

  // ── Content data ──────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contentTab, setContentTab] = useState('programs');

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [contentStatusFilter, setContentStatusFilter] = useState('all');
  const [showContentFilterDropdown, setShowContentFilterDropdown] = useState(false);
  const [programSortField, setProgramSortField] = useState(null);
  const [programSortDirection, setProgramSortDirection] = useState('asc');
  const [exerciseSortField, setExerciseSortField] = useState(null);
  const [exerciseSortDirection, setExerciseSortDirection] = useState('asc');
  const [exerciseFilterProgram, setExerciseFilterProgram] = useState(null);
  const [exerciseFilterRoutine, setExerciseFilterRoutine] = useState(null);
  const [exerciseProgramOptions, setExerciseProgramOptions] = useState([]);
  const [exerciseRoutineOptions, setExerciseRoutineOptions] = useState([]);
  const [showProgramFilterDropdown, setShowProgramFilterDropdown] = useState(false);
  const [showRoutineFilterDropdown, setShowRoutineFilterDropdown] = useState(false);
  const [routineFilterProgram, setRoutineFilterProgram] = useState(null);
  const [routineProgramOptions, setRoutineProgramOptions] = useState([]);
  const [showRoutineProgramFilterDropdown, setShowRoutineProgramFilterDropdown] = useState(false);
  const [routineSortField, setRoutineSortField] = useState(null);
  const [routineSortDirection, setRoutineSortDirection] = useState('asc');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const contentSearchInputRef = useRef(null);

  // ── Publish / reorder state ───────────────────────────────────────────────
  const [publishingProgramId, setPublishingProgramId] = useState(null);
  const [unpublishingProgramId, setUnpublishingProgramId] = useState(null);
  const [reorderingProgramId, setReorderingProgramId] = useState(null);

  // ── Delete program ────────────────────────────────────────────────────────
  const [programToDelete, setProgramToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);

  // ── Delete exercise ───────────────────────────────────────────────────────
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showDeleteExerciseConfirmation, setShowDeleteExerciseConfirmation] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState(false);

  // ── Category state ────────────────────────────────────────────────────────
  const [hasUnsavedCategoryChanges, setHasUnsavedCategoryChanges] = useState(false);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showDeleteCategory1, setShowDeleteCategory1] = useState(false);
  const [showDeleteCategory2, setShowDeleteCategory2] = useState(false);

  useEffect(() => {
    if (contentTab === 'programs') fetchPrograms();
    else if (contentTab === 'routines') fetchRoutines();
    else if (contentTab === 'exercises') fetchExercises();
    else if (contentTab === 'categories') fetchCategories();
  }, [contentTab]);

  // Build exercise filter options from exercises
  useEffect(() => {
    const programSet = new Set();
    const routineSet = new Set();
    exercises.forEach(ex => {
      ex.linkedPrograms?.forEach(p => { if (p.id && p.name) programSet.add(JSON.stringify(p)); });
      ex.linkedRoutines?.forEach(r => { if (r.id && r.name) routineSet.add(JSON.stringify(r)); });
    });
    setExerciseProgramOptions([...programSet].map(s => JSON.parse(s)));
    setExerciseRoutineOptions([...routineSet].map(s => JSON.parse(s)));
  }, [exercises]);

  useEffect(() => {
    const programSet = new Set();
    routines.forEach(r => {
      if (r.programs?.name && r.program_id) programSet.add(JSON.stringify({ id: r.program_id, name: r.programs.name }));
    });
    setRoutineProgramOptions([...programSet].map(s => JSON.parse(s)));
  }, [routines]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let q = supabase.from('programs').select('*').order('category', { ascending: true }).order('order_index', { ascending: true }).order('created_at', { ascending: false });
      if (isManagerSession) q = q.eq('academy_id', academyId);
      else if (isCoachSession) q = q.eq('created_by', user.id);
      const { data: programsData, error } = await q;
      if (error) throw error;

      const programIds = (programsData || []).map(p => p.id);
      const [routinesBatch, exercisesBatch] = await Promise.all([
        programIds.length > 0 ? supabase.from('routines').select('id, program_id').in('program_id', programIds) : Promise.resolve({ data: [] }),
        programIds.length > 0 ? supabase.from('routines').select('id, program_id, routine_exercises(id)').in('program_id', programIds) : Promise.resolve({ data: [] }),
      ]);
      const routineCount = {};
      const exerciseCount = {};
      (routinesBatch.data || []).forEach(r => { routineCount[r.program_id] = (routineCount[r.program_id] || 0) + 1; });
      (exercisesBatch.data || []).forEach(r => { exerciseCount[r.program_id] = (exerciseCount[r.program_id] || 0) + (r.routine_exercises?.length || 0); });

      let finalPrograms = (programsData || []).map(p => ({ ...p, routine_count: routineCount[p.id] || 0, exercise_count: exerciseCount[p.id] || 0 }));
      if (isManagerSession && finalPrograms.length > 0) {
        const authorIds = [...new Set(finalPrograms.map(p => p.created_by).filter(Boolean))];
        const { data: authorRows } = await supabase.from('users').select('id, name, email').in('id', authorIds);
        const authorMap = (authorRows || []).reduce((acc, u) => { acc[u.id] = u.name || u.email || 'Unknown'; return acc; }, {});
        finalPrograms = finalPrograms.map(p => ({ ...p, _authorName: authorMap[p.created_by] || null, _isOwnProgram: p.created_by === user.id }));
      }
      setPrograms(finalPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('Error', 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('routines').select('*, programs(name)').order('created_at', { ascending: false });
      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch routines');
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('exercises').select('*, users:created_by(name, email)').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;

      const exercisesData = data || [];
      const exerciseIds = exercisesData.map(ex => ex.id).filter(Boolean);
      let routineLinksByExercise = {};

      if (exerciseIds.length > 0) {
        const BATCH = 40;
        const routineLinks = [];
        for (let i = 0; i < exerciseIds.length; i += BATCH) {
          const { data: batchLinks } = await supabase.from('routine_exercises').select('id, exercise_id, routine_id').in('exercise_id', exerciseIds.slice(i, i + BATCH));
          if (batchLinks?.length) routineLinks.push(...batchLinks);
        }
        if (routineLinks.length > 0) {
          const routineIds = [...new Set(routineLinks.map(l => l.routine_id).filter(Boolean))];
          const { data: routinesData } = await supabase.from('routines').select('id, name, program_id').in('id', routineIds);
          const programIds = [...new Set((routinesData || []).map(r => r.program_id).filter(Boolean))];
          let programsById = {};
          if (programIds.length > 0) {
            const { data: programsData } = await supabase.from('programs').select('id, name').in('id', programIds);
            programsById = (programsData || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
          }
          const routinesById = (routinesData || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
          routineLinksByExercise = routineLinks.reduce((acc, link) => {
            if (!link?.exercise_id) return acc;
            const routine = routinesById[link.routine_id];
            const program = routine?.program_id ? programsById[routine.program_id] : null;
            if (!acc[link.exercise_id]) acc[link.exercise_id] = [];
            acc[link.exercise_id].push({ id: routine?.id || link.routine_id, name: routine?.name || null, routine_exercise_id: link.id, program: program ? { id: program.id, name: program.name } : null });
            return acc;
          }, {});
        }
      }

      setExercises(exercisesData.map(ex => {
        const linked = (routineLinksByExercise[ex.id] || []).filter(r => r.id).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const programMap = new Map();
        linked.forEach(r => { if (r.program?.id) programMap.set(r.program.id, r.program.name || ''); });
        const linkedPrograms = [...programMap.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return { ...ex, linkedRoutines: linked, linkedPrograms, primaryRoutineName: linked[0]?.name || null, primaryProgramName: linkedPrograms[0]?.name || null, routine_id: linked[0]?.id || null, program_id: linkedPrograms[0]?.id || null, routine_exercise_id: linked[0]?.routine_exercise_id || null };
      }));
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('categories').select('id, name, order_index, is_published').order('order_index', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  // ── Program handlers ──────────────────────────────────────────────────────

  const handlePublishProgram = async (program) => {
    if (!program || publishingProgramId) return;
    setPublishingProgramId(program.id);
    try {
      const { error } = await supabase.from('programs').update({ is_published: true }).eq('id', program.id).eq('academy_id', academyId);
      if (error) throw error;
      await fetchPrograms();
      supabase.functions.invoke('notify-on-publish', { body: { programId: program.id, programName: program.name, authorUserId: program.created_by } })
        .then(({ error: fnError }) => {
          if (fnError) {
            setBannerMessage?.('Program published. Notification to coach may not have delivered.');
            setTimeout(() => setBannerMessage?.(''), 5000);
          }
        });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to publish program');
    } finally {
      setPublishingProgramId(null);
    }
  };

  const handleUnpublishProgram = async (program) => {
    if (!program || unpublishingProgramId) return;
    setUnpublishingProgramId(program.id);
    try {
      const { error } = await supabase.from('programs').update({ is_published: false }).eq('id', program.id).eq('academy_id', academyId);
      if (error) throw error;
      await fetchPrograms();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to unpublish program');
    } finally {
      setUnpublishingProgramId(null);
    }
  };

  const handleDeleteProgram = (program) => { setProgramToDelete(program); setShowDeleteConfirmation(true); };

  const handleConfirmDelete = async () => {
    if (!programToDelete) return;
    setDeletingProgram(true);
    setShowDeleteConfirmation(false);
    try {
      const { data: userProfile, error: userError } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      if (userError) throw new Error(`User profile check failed: ${userError.message}`);
      if (!userProfile?.is_admin) throw new Error('You do not have admin privileges');
      const { data, error } = await supabase.rpc('delete_program_as_admin', { program_id: programToDelete.id });
      if (error) throw error;
      if (data === true) {
        Alert.alert('Success', `Program "${programToDelete.name}" has been deleted successfully.`);
        fetchPrograms();
      } else {
        throw new Error(`Delete operation returned: ${data}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to delete program: ${error.message}`);
    } finally {
      setDeletingProgram(false);
      setProgramToDelete(null);
    }
  };

  const handleProgramSaved = () => fetchPrograms();

  const handleViewProgramStructure = async (program) => {
    const { data, error } = await supabase.from('programs').select(`*, routines(*, routine_exercises(id, order_index, custom_target_value, exercises(*)))`).eq('id', program.id).single();
    if (error || !data) { Alert.alert('Error', 'Failed to fetch program details'); return; }
    const transformed = {
      ...data,
      routines: data.routines.sort((a, b) => a.order_index - b.order_index).map(r => ({
        ...r,
        exercises: r.routine_exercises.sort((a, b) => a.order_index - b.order_index).map(re => ({
          routineExerciseId: re.id, exerciseId: re.exercises.id, id: re.exercises.code, name: re.exercises.title,
          target: `${re.custom_target_value || re.exercises.target_value} ${re.exercises.target_unit}`,
          difficulty: re.exercises.difficulty, description: re.exercises.description, order_index: re.order_index,
        })),
      })),
    };
    onViewProgramStructure?.(transformed);
  };

  const handleEditProgramStructure = async (program) => {
    const { data, error } = await supabase.from('programs').select(`*, routines(*, routine_exercises(id, order_index, custom_target_value, exercises(*)))`).eq('id', program.id).single();
    if (error || !data) { Alert.alert('Error', 'Failed to fetch program details'); return; }
    const transformed = {
      ...data,
      routines: data.routines.sort((a, b) => a.order_index - b.order_index).map(r => ({
        ...r,
        exercises: r.routine_exercises.sort((a, b) => a.order_index - b.order_index).map(re => ({
          routineExerciseId: re.id, exerciseId: re.exercises.id, id: re.exercises.code, name: re.exercises.title,
          target: `${re.custom_target_value || re.exercises.target_value} ${re.exercises.target_unit}`,
          difficulty: re.exercises.difficulty, description: re.exercises.description, order_index: re.order_index,
        })),
      })),
    };
    onEditProgramStructure?.(transformed);
  };

  const reorderProgram = async (programId, direction) => {
    setReorderingProgramId(programId);
    try {
      const currentPrograms = [...programs];
      const currentProgram = currentPrograms.find(p => p.id === programId);
      if (!currentProgram) throw new Error('Program not found');
      const categoryPrograms = currentPrograms.filter(p => p.category === currentProgram.category);
      const currentIndex = categoryPrograms.findIndex(p => p.id === programId);
      let targetIndex;
      if (direction === 'up' && currentIndex > 0) targetIndex = currentIndex - 1;
      else if (direction === 'down' && currentIndex < categoryPrograms.length - 1) targetIndex = currentIndex + 1;
      else { setReorderingProgramId(null); return; }
      const targetProgram = categoryPrograms[targetIndex];
      await Promise.all([
        supabase.from('programs').update({ order_index: targetProgram.order_index }).eq('id', currentProgram.id),
        supabase.from('programs').update({ order_index: currentProgram.order_index }).eq('id', targetProgram.id),
      ]);
      await fetchPrograms();
    } catch (error) {
      Alert.alert('Error', `Failed to reorder program: ${error.message}`);
    } finally {
      setReorderingProgramId(null);
    }
  };

  // ── Exercise handlers ─────────────────────────────────────────────────────

  const togglePublishStatus = async (type, id, currentStatus) => {
    try {
      const { error } = await supabase.from(type === 'program' ? 'programs' : 'exercises').update({ is_published: !currentStatus }).eq('id', id);
      if (error) throw error;
      if (type === 'program') fetchPrograms(); else fetchExercises();
      Alert.alert('Success', `${type} ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update publish status');
    }
  };

  const handleDeleteExercise = (exercise) => { setExerciseToDelete(exercise); setShowDeleteExerciseConfirmation(true); setActiveDropdown(null); };

  const handleConfirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    setDeletingExercise(true);
    setShowDeleteExerciseConfirmation(false);
    try {
      const { data: userProfile, error: userError } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
      if (userError) throw new Error(`User profile check: ${userError.message}`);
      if (!userProfile?.is_admin) throw new Error('You do not have admin privileges');
      const { error: deleteError } = await supabase.from('exercises').delete().eq('id', exerciseToDelete.id);
      if (deleteError) throw deleteError;
      Alert.alert('Success', `Exercise "${exerciseToDelete.title}" has been deleted successfully.`);
      fetchExercises();
    } catch (error) {
      Alert.alert('Error', `Failed to delete exercise: ${error.message}`);
    } finally {
      setDeletingExercise(false);
      setExerciseToDelete(null);
    }
  };

  const handleEditRoutineLocal = (routine) => onEditRoutine?.(routine);
  const handleEditExerciseLocal = (exercise) => onEditExercise?.(exercise);

  // ── Category handlers ─────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    const name = newCategoryNameInput.trim();
    if (!name) { Alert.alert('Error', 'Category name cannot be empty.'); return; }
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) { Alert.alert('Error', 'A category with this name already exists.'); return; }
    try {
      const { data, error } = await supabase.from('categories').insert({ name, order_index: categories.length, is_published: false }).select().single();
      if (error) throw error;
      setCategories(prev => [...prev, data]);
      setNewCategoryNameInput('');
      setShowCreateCategoryModal(false);
      Alert.alert('Success', `Category "${name}" created as Draft.`);
    } catch (error) {
      Alert.alert('Error', `Failed to create category: ${error.message}`);
    }
  };

  const handleToggleCategoryVisibility = async (category) => {
    const newValue = !category.is_published;
    try {
      const { error } = await supabase.from('categories').update({ is_published: newValue }).eq('id', category.id);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, is_published: newValue } : c));
    } catch (error) {
      Alert.alert('Error', `Failed to update visibility: ${error.message}`);
    }
  };

  const handleDeleteCategory1 = (category) => { setCategoryToDelete(category); setShowDeleteCategory1(true); };
  const handleDeleteCategory2 = () => { setShowDeleteCategory1(false); setShowDeleteCategory2(true); };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryToDelete.id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setShowDeleteCategory2(false);
      setCategoryToDelete(null);
      Alert.alert('Deleted', `Category "${categoryToDelete.name}" has been deleted.`);
    } catch (error) {
      Alert.alert('Error', `Failed to delete category: ${error.message}`);
    }
  };

  const handleEditCategory = (category) => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); };
  const handleCancelCategoryEdit = () => { setEditingCategoryId(null); setEditingCategoryName(''); };

  const handleSaveCategoryName = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) { Alert.alert('Error', 'Category name cannot be empty'); return; }
    try {
      const cat = categories.find(c => c.id === editingCategoryId);
      if (!cat) throw new Error('Category not found');
      const oldName = cat.name;
      const newName = editingCategoryName.trim();
      if (oldName === newName) { setEditingCategoryId(null); setEditingCategoryName(''); return; }
      if (categories.find(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== editingCategoryId)) { Alert.alert('Error', 'A category with this name already exists'); return; }
      const { error: catError } = await supabase.from('categories').update({ name: newName }).eq('id', editingCategoryId);
      if (catError) throw catError;
      const { error: progError } = await supabase.from('programs').update({ category: newName }).eq('category', oldName);
      if (progError) throw progError;
      setCategories(prev => prev.map(c => c.id === editingCategoryId ? { ...c, name: newName } : c));
      setEditingCategoryId(null);
      setEditingCategoryName('');
      Alert.alert('Success', `Category renamed to "${newName}"`);
    } catch (error) {
      Alert.alert('Error', `Failed to update category name: ${error.message}`);
    }
  };

  const reorderCategory = async (categoryId, direction) => {
    try {
      const cats = [...categories];
      const currentIndex = cats.findIndex(c => c.id === categoryId);
      if (currentIndex === -1) return;
      let targetIndex;
      if (direction === 'up' && currentIndex > 0) targetIndex = currentIndex - 1;
      else if (direction === 'down' && currentIndex < cats.length - 1) targetIndex = currentIndex + 1;
      else return;
      const updated = [...cats];
      [updated[currentIndex], updated[targetIndex]] = [updated[targetIndex], updated[currentIndex]];
      updated[currentIndex].order_index = currentIndex;
      updated[targetIndex].order_index = targetIndex;
      setCategories(updated);
      setHasUnsavedCategoryChanges(true);
    } catch (error) {
      Alert.alert('Error', `Failed to reorder category: ${error.message}`);
    }
  };

  const saveCategoryOrder = async () => {
    try {
      setSavingCategoryOrder(true);
      const results = await Promise.all(categories.map((cat, i) => supabase.from('categories').update({ order_index: i }).eq('id', cat.id)));
      if (results.find(r => r.error)) throw results.find(r => r.error).error;
      setHasUnsavedCategoryChanges(false);
      Alert.alert('Success', 'Category order saved!');
    } catch (error) {
      Alert.alert('Error', `Failed to save category order: ${error.message}`);
    } finally {
      setSavingCategoryOrder(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const CONTENT_TABS = [
    { id: 'programs', label: isMobile ? 'Programs' : 'Programs', icon: 'library-outline' },
    { id: 'exercises', label: 'Exercises', icon: 'fitness-outline' },
    { id: 'routines', label: 'Routines', icon: 'play-outline' },
    { id: 'categories', label: isMobile ? 'Categories' : 'Category Order (Library Tab)', icon: 'reorder-three-outline' },
  ];

  return (
    <View style={styles.content}>
      {isMobile && (
        <View style={[styles.dashboardQuickActions, styles.dashboardQuickActionsCompact]}>
          <TouchableOpacity style={[styles.dashboardPrimaryAction, styles.dashboardActionCompact]} onPress={onCreateProgram}>
            <Ionicons name="add" size={16} color="white" />
            <Text style={[styles.dashboardPrimaryActionText, styles.dashboardActionTextCompact]}>Program</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dashboardSecondaryAction, styles.dashboardActionCompact]} onPress={onCreateRoutine}>
            <Ionicons name="add" size={16} color="#6B7280" />
            <Text style={[styles.dashboardSecondaryActionText, styles.dashboardActionTextCompact]}>Routine</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dashboardSecondaryAction, styles.dashboardActionCompact]} onPress={onCreateExercise}>
            <Ionicons name="add" size={16} color="#6B7280" />
            <Text style={[styles.dashboardSecondaryActionText, styles.dashboardActionTextCompact]}>Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.contentStatsGrid}>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}><Ionicons name="library-outline" size={18} color="#3B82F6" /></View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : programs.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Programs</Text>
          <Text style={styles.contentStatSubtext}>{loading ? '—' : programs.filter(p => p.is_published).length} published</Text>
        </View>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}><Ionicons name="play-outline" size={18} color="#10B981" /></View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : routines.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Routines</Text>
          <Text style={styles.contentStatSubtext}>{loading ? '—' : routines.filter(r => r.is_published).length} published</Text>
        </View>
        <View style={styles.contentStatCard}>
          <View style={styles.contentStatIcon}><Ionicons name="fitness-outline" size={18} color="#F59E0B" /></View>
          <Text style={styles.contentStatNumber}>{loading ? '—' : exercises.length.toLocaleString()}</Text>
          <Text style={styles.contentStatLabel}>Exercises</Text>
          <Text style={styles.contentStatSubtext}>{loading ? '—' : exercises.filter(e => e.is_published).length} published</Text>
        </View>
      </View>

      {/* Sub-tabs */}
      {isMobile ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contentTabsScroll} contentContainerStyle={styles.contentTabsScrollContent}>
          {CONTENT_TABS.map(tab => (
            <TouchableOpacity key={tab.id} style={[styles.contentTab, contentTab === tab.id && styles.activeContentTab]} onPress={() => setContentTab(tab.id)}>
              <Ionicons name={tab.icon} size={20} color={contentTab === tab.id ? '#000000' : '#6B7280'} />
              <Text style={[styles.contentTabText, contentTab === tab.id && styles.activeContentTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.contentTabs}>
          {CONTENT_TABS.map(tab => (
            <TouchableOpacity key={tab.id} style={[styles.contentTab, contentTab === tab.id && styles.activeContentTab]} onPress={() => setContentTab(tab.id)}>
              <Ionicons name={tab.icon} size={20} color={contentTab === tab.id ? '#000000' : '#6B7280'} />
              <Text style={[styles.contentTabText, contentTab === tab.id && styles.activeContentTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search + Filter */}
      <View style={[styles.searchFilterBar, isMobile && styles.searchFilterBarMobile, !isMobile && showContentFilterDropdown && styles.searchFilterBarActive]}>
        <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            ref={contentSearchInputRef}
            style={styles.searchInput}
            placeholder={`Search ${contentTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        {contentTab !== 'categories' && (
          <View style={[styles.coachFilterButtonWrap, isMobile && styles.coachFilterButtonWrapMobile]}>
            <TouchableOpacity
              style={[styles.filterButton, isMobile && styles.filterButtonMobile, contentStatusFilter !== 'all' && styles.filterButtonActive]}
              onPress={() => setShowContentFilterDropdown(prev => !prev)}
            >
              <Ionicons name="funnel-outline" size={18} color={contentStatusFilter !== 'all' ? '#0369A1' : '#6B7280'} />
              {!isMobile && (
                <Text style={[styles.filterButtonText, contentStatusFilter !== 'all' && styles.filterButtonTextActive]}>
                  {contentStatusFilter === 'published' ? 'Published' : contentStatusFilter === 'draft' ? 'Drafts' : 'Filter'}
                </Text>
              )}
              {contentStatusFilter !== 'all' ? <View style={styles.filterActiveDot} /> : null}
            </TouchableOpacity>
            {!isMobile && showContentFilterDropdown && (
              <View style={styles.coachFilterDropdown}>
                <Text style={styles.coachFilterSectionLabel}>Status</Text>
                {[{ label: 'All', value: 'all' }, { label: 'Published', value: 'published' }, { label: 'Drafts', value: 'draft' }].map(option => (
                  <TouchableOpacity key={option.value} style={[styles.coachFilterOption, contentStatusFilter === option.value && styles.coachFilterOptionActive]} onPress={() => { setContentStatusFilter(option.value); setShowContentFilterDropdown(false); }}>
                    <Text style={[styles.coachFilterOptionText, contentStatusFilter === option.value && styles.coachFilterOptionTextActive]}>{option.label}</Text>
                    {contentStatusFilter === option.value ? <Ionicons name="checkmark" size={16} color="#0369A1" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Mobile filter modal */}
      {isMobile && contentTab !== 'categories' && (
        <Modal visible={showContentFilterDropdown} transparent animationType="fade" onRequestClose={() => setShowContentFilterDropdown(false)}>
          <Pressable style={styles.filterModalOverlay} onPress={() => setShowContentFilterDropdown(false)}>
            <Pressable style={styles.filterModalSheet} onPress={e => e.stopPropagation()}>
              <Text style={styles.filterModalTitle}>Filter by status</Text>
              {[{ label: 'All', value: 'all' }, { label: 'Published', value: 'published' }, { label: 'Drafts', value: 'draft' }].map(option => (
                <TouchableOpacity key={option.value} style={[styles.coachFilterOption, contentStatusFilter === option.value && styles.coachFilterOptionActive]} onPress={() => { setContentStatusFilter(option.value); setShowContentFilterDropdown(false); }}>
                  <Text style={[styles.coachFilterOptionText, contentStatusFilter === option.value && styles.coachFilterOptionTextActive]}>{option.label}</Text>
                  {contentStatusFilter === option.value ? <Ionicons name="checkmark" size={16} color="#0369A1" /> : null}
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Sub-table content */}
      {contentTab === 'programs' && (
        <ProgramsTable
          programs={programs} loading={loading} searchQuery={searchQuery} statusFilter={contentStatusFilter}
          programSortField={programSortField} programSortDirection={programSortDirection}
          setProgramSortField={setProgramSortField} setProgramSortDirection={setProgramSortDirection}
          reorderingProgramId={reorderingProgramId} reorderProgram={reorderProgram}
          handleViewProgramStructure={handleViewProgramStructure} handleEditProgramStructure={handleEditProgramStructure}
          handleDeleteProgram={handleDeleteProgram} handlePublishProgram={handlePublishProgram}
          publishingProgramId={publishingProgramId} handleUnpublishProgram={handleUnpublishProgram}
          unpublishingProgramId={unpublishingProgramId} sessionRole={sessionRole}
          activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} styles={styles}
        />
      )}
      {contentTab === 'exercises' && (
        <ExercisesTable
          exercises={exercises} loading={loading} searchQuery={searchQuery} statusFilter={contentStatusFilter}
          exerciseSortField={exerciseSortField} exerciseSortDirection={exerciseSortDirection}
          setExerciseSortField={setExerciseSortField} setExerciseSortDirection={setExerciseSortDirection}
          exerciseFilterProgram={exerciseFilterProgram} setExerciseFilterProgram={setExerciseFilterProgram}
          exerciseFilterRoutine={exerciseFilterRoutine} setExerciseFilterRoutine={setExerciseFilterRoutine}
          exerciseProgramOptions={exerciseProgramOptions} exerciseRoutineOptions={exerciseRoutineOptions}
          showProgramFilterDropdown={showProgramFilterDropdown} setShowProgramFilterDropdown={setShowProgramFilterDropdown}
          showRoutineFilterDropdown={showRoutineFilterDropdown} setShowRoutineFilterDropdown={setShowRoutineFilterDropdown}
          togglePublishStatus={togglePublishStatus} handleEditExercise={handleEditExerciseLocal}
          handleDeleteExercise={handleDeleteExercise} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} styles={styles}
        />
      )}
      {contentTab === 'routines' && (
        <RoutinesTable
          routines={routines} loading={loading} searchQuery={searchQuery} statusFilter={contentStatusFilter}
          routineFilterProgram={routineFilterProgram} setRoutineFilterProgram={setRoutineFilterProgram}
          routineProgramOptions={routineProgramOptions} showRoutineProgramFilterDropdown={showRoutineProgramFilterDropdown}
          setShowRoutineProgramFilterDropdown={setShowRoutineProgramFilterDropdown}
          routineSortField={routineSortField} routineSortDirection={routineSortDirection}
          setRoutineSortField={setRoutineSortField} setRoutineSortDirection={setRoutineSortDirection}
          handleEditRoutine={handleEditRoutineLocal} styles={styles}
        />
      )}
      {contentTab === 'categories' && (
        <CategoriesTable
          categories={categories} programs={programs} searchQuery={searchQuery}
          hasUnsavedCategoryChanges={hasUnsavedCategoryChanges} savingCategoryOrder={savingCategoryOrder}
          saveCategoryOrder={saveCategoryOrder} reorderCategory={reorderCategory}
          editingCategoryId={editingCategoryId} editingCategoryName={editingCategoryName}
          setEditingCategoryName={setEditingCategoryName} handleEditCategory={handleEditCategory}
          handleCancelCategoryEdit={handleCancelCategoryEdit} handleSaveCategoryName={handleSaveCategoryName}
          onCreateCategory={() => { setNewCategoryNameInput(''); setShowCreateCategoryModal(true); }}
          onDeleteCategory={handleDeleteCategory1} onToggleVisibility={handleToggleCategoryVisibility} styles={styles}
        />
      )}

      {/* Delete Program Modal */}
      {showDeleteConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Program</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{programToDelete?.name}"?{'\n\n'}This action cannot be undone and will also delete all associated routines and exercises.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowDeleteConfirmation(false); setProgramToDelete(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleConfirmDelete} disabled={deletingProgram}>
                {deletingProgram ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteModalConfirmText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Exercise Modal */}
      {showDeleteExerciseConfirmation && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Exercise</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{exerciseToDelete?.title}"?{'\n\n'}This action cannot be undone and will remove the exercise from any routines that use it.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowDeleteExerciseConfirmation(false); setExerciseToDelete(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleConfirmDeleteExercise} disabled={deletingExercise}>
                {deletingExercise ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.deleteModalConfirmText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="add-circle-outline" size={24} color="#6366F1" />
              <Text style={[styles.deleteModalTitle, { color: '#1F2937' }]}>New Category</Text>
            </View>
            <Text style={[styles.deleteModalMessage, { marginBottom: 12 }]}>
              Enter a name for the new category. It will be created as{' '}
              <Text style={{ fontWeight: '700', color: '#F59E0B' }}>Draft</Text> (not visible in the Library until published).
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1F2937', backgroundColor: '#F9FAFB', marginBottom: 20 }}
              value={newCategoryNameInput} onChangeText={setNewCategoryNameInput}
              placeholder="e.g. Serve & Return" placeholderTextColor="#9CA3AF"
              autoFocus onSubmitEditing={handleCreateCategory} returnKeyType="done"
            />
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => setShowCreateCategoryModal(false)}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteModalConfirmButton, { backgroundColor: '#6366F1' }]} onPress={handleCreateCategory}>
                <Text style={styles.deleteModalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Category Step 1 */}
      {showDeleteCategory1 && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Delete Category</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete the category{' '}
              <Text style={{ fontWeight: '700' }}>"{categoryToDelete?.name}"</Text>?{'\n\n'}Programs in this category will NOT be deleted but will have no category assigned.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowDeleteCategory1(false); setCategoryToDelete(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleDeleteCategory2}>
                <Text style={styles.deleteModalConfirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Delete Category Step 2 */}
      {showDeleteCategory2 && (
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Confirm Deletion</Text>
            </View>
            <Text style={styles.deleteModalMessage}>
              This action <Text style={{ fontWeight: '700' }}>cannot be undone</Text>.{'\n\n'}Permanently delete{' '}
              <Text style={{ fontWeight: '700' }}>"{categoryToDelete?.name}"</Text>?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancelButton} onPress={() => { setShowDeleteCategory2(false); setCategoryToDelete(null); }}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={handleConfirmDeleteCategory}>
                <Text style={styles.deleteModalConfirmText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
