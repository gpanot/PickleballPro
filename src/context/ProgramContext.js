import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProgramContext = createContext();

export const usePrograms = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('usePrograms must be used within a ProgramProvider');
  }
  return context;
};

// Storage keys for hybrid approach
const STORAGE_KEYS = {
  USER_PROGRAMS: '@user_programs',
  CREATED_PROGRAMS: '@user_created_programs',
  PROGRAM_SHARES: '@program_shares',
  SYNC_QUEUE: '@program_sync_queue'
};

export const ProgramProvider = ({ children }) => {
  const [userPrograms, setUserPrograms] = useState([]);
  const [createdPrograms, setCreatedPrograms] = useState([]);
  const [pendingShares, setPendingShares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState([]);
  const { user } = useAuth();

  // Load programs on mount (Database first, AsyncStorage fallback - same pattern as LogbookContext)
  useEffect(() => {
    if (user?.id) {
      loadUserPrograms();
      loadPendingShares();
    }
  }, [user?.id]);

  // =====================================================
  // LOADING FUNCTIONS (HYBRID APPROACH)
  // =====================================================

  const loadUserPrograms = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from database first (same pattern as LogbookContext)
      const { data: dbPrograms, error } = await supabase.rpc('get_user_programs');
      
      if (dbPrograms && !error) {
        console.log('✅ Loaded user programs from database:', dbPrograms);
        
        // Separate created vs added/shared programs
        const created = dbPrograms.filter(p => p.access_type === 'created' || p.created_by === user.id);
        const collected = dbPrograms.filter(p => p.access_type !== 'created' && p.created_by !== user.id);
        
        setCreatedPrograms(created);
        setUserPrograms(collected);
        
        // Save to local storage as backup (same pattern as LogbookContext)
        await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, created);
        await saveToLocalStorage(STORAGE_KEYS.USER_PROGRAMS, collected);
        
      } else {
        console.log('❌ Database failed, loading from local storage:', error);
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Error loading user programs:', error);
      await loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const [storedCreated, storedCollected] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CREATED_PROGRAMS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRAMS)
      ]);
      
      if (storedCreated) {
        setCreatedPrograms(JSON.parse(storedCreated));
      }
      if (storedCollected) {
        setUserPrograms(JSON.parse(storedCollected));
      }
    } catch (error) {
      console.error('Error loading from local storage:', error);
    }
  };

  const loadPendingShares = async () => {
    try {
      const { data: shares, error } = await supabase.rpc('get_pending_program_shares');
      
      if (shares && !error) {
        setPendingShares(shares);
        await saveToLocalStorage(STORAGE_KEYS.PROGRAM_SHARES, shares);
      } else {
        // Fallback to local storage
        const storedShares = await AsyncStorage.getItem(STORAGE_KEYS.PROGRAM_SHARES);
        if (storedShares) {
          setPendingShares(JSON.parse(storedShares));
        }
      }
    } catch (error) {
      console.error('Error loading pending shares:', error);
    }
  };

  const saveToLocalStorage = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to local storage:`, error);
    }
  };

  // =====================================================
  // PROGRAM CREATION FUNCTIONS (HYBRID APPROACH)
  // =====================================================

  const createProgram = async (programData) => {
    console.log('🎯 [ProgramContext] createProgram called with:', programData);
    
    try {
      // Try to save to database first (same pattern as LogbookContext)
      const { data: savedProgram, error } = await supabase.rpc('create_program_as_user', {
        program_name: programData.name,
        program_description: programData.description || 'Custom training program',
        program_category: programData.category || 'Custom',
        program_tier: programData.tier || 'Beginner',
        program_is_shareable: programData.is_shareable !== false,
        program_visibility: programData.visibility || 'private',
        program_thumbnail_url: programData.thumbnail_url
      });

      if (savedProgram && savedProgram.length > 0 && !error) {
        console.log('✅ Successfully saved program to database!');
        const program = savedProgram[0];
        
        // Add to local state and backup to AsyncStorage
        const newCreatedPrograms = [program, ...createdPrograms];
        setCreatedPrograms(newCreatedPrograms);
        await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
        
        return { success: true, program };
      } else {
        throw new Error(error?.message || 'Failed to save to database');
      }
    } catch (error) {
      console.error('❌ Database save failed, saving locally:', error);
      
      // Fallback: Save to local storage only (same pattern as LogbookContext)
      const localProgram = {
        ...programData,
        id: Date.now().toString(),
        created_by: user.id,
        program_type: 'user',
        is_published: false,
        is_shareable: programData.is_shareable !== false,
        visibility: 'private',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        needs_sync: true // Flag for later database sync
      };
      
      const newCreatedPrograms = [localProgram, ...createdPrograms];
      setCreatedPrograms(newCreatedPrograms);
      await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
      
      // Add to sync queue
      const newSyncQueue = [...syncQueue, { type: 'create', data: localProgram }];
      setSyncQueue(newSyncQueue);
      await saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, newSyncQueue);
      
      return { success: true, program: localProgram, isLocalOnly: true };
    }
  };

  const updateProgram = async (programId, updates) => {
    console.log('🎯 [ProgramContext] updateProgram called with:', programId, updates);
    
    try {
      // Try to update in database first
      const { data: updatedProgram, error } = await supabase.rpc('update_program_as_user', {
        program_id: programId,
        program_name: updates.name,
        program_description: updates.description,
        program_category: updates.category,
        program_tier: updates.tier,
        program_is_shareable: updates.is_shareable,
        program_visibility: updates.visibility,
        program_thumbnail_url: updates.thumbnail_url
      });

      if (updatedProgram && updatedProgram.length > 0 && !error) {
        console.log('✅ Successfully updated program in database!');
        const program = updatedProgram[0];
        
        // Update local state
        const newCreatedPrograms = createdPrograms.map(p => 
          p.id === programId ? program : p
        );
        setCreatedPrograms(newCreatedPrograms);
        await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
        
        return { success: true, program };
      } else {
        throw new Error(error?.message || 'Failed to update in database');
      }
    } catch (error) {
      console.error('❌ Database update failed, updating locally:', error);
      
      // Fallback: Update locally only
      const newCreatedPrograms = createdPrograms.map(p => 
        p.id === programId ? { ...p, ...updates, updated_at: new Date().toISOString(), needs_sync: true } : p
      );
      setCreatedPrograms(newCreatedPrograms);
      await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
      
      return { success: true, program: newCreatedPrograms.find(p => p.id === programId), isLocalOnly: true };
    }
  };

  const deleteProgram = async (programId) => {
    try {
      // Try to delete from database first
      const { data: success, error } = await supabase.rpc('delete_program_as_user', {
        program_id: programId
      });

      if (success && !error) {
        console.log('✅ Successfully deleted program from database!');
      } else {
        console.log('❌ Database delete failed, deleting locally only:', error);
      }
      
      // Update local state regardless (same pattern as LogbookContext)
      const newCreatedPrograms = createdPrograms.filter(p => p.id !== programId);
      setCreatedPrograms(newCreatedPrograms);
      await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting program:', error);
      
      // Fallback: Delete locally only
      const newCreatedPrograms = createdPrograms.filter(p => p.id !== programId);
      setCreatedPrograms(newCreatedPrograms);
      await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
      
      return { success: true, isLocalOnly: true };
    }
  };

  // =====================================================
  // PROGRAM COLLECTION FUNCTIONS
  // =====================================================

  const addProgramToCollection = async (program) => {
    console.log('🎯 [ProgramContext] addProgramToCollection called with:', program);
    
    try {
      // Try to add to database first
      const { data: result, error } = await supabase.rpc('add_program_to_user_collection', {
        program_id: program.id
      });

      if (result && result.length > 0 && !error) {
        console.log('✅ Successfully added program to collection!');
        
        // Add to local state (mark as 'added' from Explore)
        const programWithAccess = { ...program, access_type: 'added' };
        const newUserPrograms = [programWithAccess, ...userPrograms];
        setUserPrograms(newUserPrograms);
        await saveToLocalStorage(STORAGE_KEYS.USER_PROGRAMS, newUserPrograms);
        
        return { success: true };
      } else {
        throw new Error(error?.message || 'Failed to add to collection');
      }
    } catch (error) {
      console.error('❌ Database add failed, adding locally:', error);
      
      // Fallback: Add locally only
      const programWithAccess = { 
        ...program, 
        access_type: 'added',
        added_at: new Date().toISOString(),
        needs_sync: true
      };
      const newUserPrograms = [programWithAccess, ...userPrograms];
      setUserPrograms(newUserPrograms);
      await saveToLocalStorage(STORAGE_KEYS.USER_PROGRAMS, newUserPrograms);
      
      return { success: true, isLocalOnly: true };
    }
  };

  // =====================================================
  // PROGRAM SHARING FUNCTIONS
  // =====================================================

  const shareProgram = async (programId, targetEmail, message) => {
    try {
      const { data: result, error } = await supabase.rpc('share_program_as_user', {
        program_id: programId,
        target_user_email: targetEmail,
        share_message: message
      });

      if (result && result.length > 0 && !error) {
        console.log('✅ Successfully shared program!');
        
        // Update shared_count locally
        const newCreatedPrograms = createdPrograms.map(p => 
          p.id === programId ? { ...p, shared_count: (p.shared_count || 0) + 1 } : p
        );
        setCreatedPrograms(newCreatedPrograms);
        await saveToLocalStorage(STORAGE_KEYS.CREATED_PROGRAMS, newCreatedPrograms);
        
        return { success: true, shareData: result[0] };
      } else {
        throw new Error(error?.message || 'Failed to share program');
      }
    } catch (error) {
      console.error('Error sharing program:', error);
      return { success: false, error: error.message };
    }
  };

  const acceptSharedProgram = async (shareId) => {
    try {
      const { data: result, error } = await supabase.rpc('accept_shared_program', {
        share_id: shareId
      });

      if (result && result.length > 0 && !error) {
        console.log('✅ Successfully accepted shared program!');
        
        // Remove from pending shares
        const newPendingShares = pendingShares.filter(s => s.share_id !== shareId);
        setPendingShares(newPendingShares);
        await saveToLocalStorage(STORAGE_KEYS.PROGRAM_SHARES, newPendingShares);
        
        // Refresh user programs to include the newly shared program
        await loadUserPrograms();
        
        return { success: true, programData: result[0] };
      } else {
        throw new Error(error?.message || 'Failed to accept shared program');
      }
    } catch (error) {
      console.error('Error accepting shared program:', error);
      return { success: false, error: error.message };
    }
  };

  // =====================================================
  // SYNC FUNCTIONS (FOR OFFLINE SUPPORT)
  // =====================================================

  const syncPendingChanges = async () => {
    try {
      const storedSyncQueue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (!storedSyncQueue) return;

      const queue = JSON.parse(storedSyncQueue);
      const successfulSyncs = [];

      for (const item of queue) {
        try {
          if (item.type === 'create') {
            const { data, error } = await supabase.rpc('sync_local_program_to_database', {
              local_program_data: item.data
            });
            
            if (data && !error) {
              successfulSyncs.push(item);
            }
          }
          // Add other sync types (update, delete) as needed
        } catch (error) {
          console.error('Error syncing item:', item, error);
        }
      }

      // Remove successfully synced items from queue
      const remainingQueue = queue.filter(item => !successfulSyncs.includes(item));
      setSyncQueue(remainingQueue);
      await saveToLocalStorage(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);

      if (successfulSyncs.length > 0) {
        // Refresh programs after successful sync
        await loadUserPrograms();
      }

      return { success: true, syncedCount: successfulSyncs.length };
    } catch (error) {
      console.error('Error syncing pending changes:', error);
      return { success: false, error: error.message };
    }
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const getAllPrograms = () => {
    return [...createdPrograms, ...userPrograms];
  };

  const getProgramById = (programId) => {
    return getAllPrograms().find(p => p.id === programId);
  };

  const getUserCreatedPrograms = () => {
    return createdPrograms;
  };

  const getUserCollectedPrograms = () => {
    return userPrograms;
  };

  const getShareablePrograms = () => {
    return createdPrograms.filter(p => p.is_shareable);
  };

  const getProgramStats = () => {
    return {
      totalPrograms: getAllPrograms().length,
      createdPrograms: createdPrograms.length,
      addedPrograms: userPrograms.filter(p => p.access_type === 'added').length,
      sharedPrograms: userPrograms.filter(p => p.access_type === 'shared').length,
      pendingShares: pendingShares.length,
      needsSync: syncQueue.length > 0
    };
  };

  const value = {
    // Program data
    userPrograms,
    createdPrograms,
    pendingShares,
    isLoading,
    
    // CRUD operations (mirror admin functions)
    createProgram,
    updateProgram,
    deleteProgram,
    
    // Collection management
    addProgramToCollection,
    
    // Sharing functions
    shareProgram,
    acceptSharedProgram,
    
    // Utility functions
    getAllPrograms,
    getProgramById,
    getUserCreatedPrograms,
    getUserCollectedPrograms,
    getShareablePrograms,
    getProgramStats,
    
    // Sync functions
    syncPendingChanges,
    loadUserPrograms,
    loadPendingShares
  };

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};
