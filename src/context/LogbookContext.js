import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createLogbookEntry, 
  getLogbookEntries, 
  updateLogbookEntry as updateSupabaseLogbookEntry, 
  deleteLogbookEntry as deleteSupabaseLogbookEntry 
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  CAL_PER_HOUR,
  feelingToMood,
  isMoodTrendingUp,
  parseEntryHours,
  parseEntryFeeling,
  parseEntryDate,
  getActivityAndFormat,
} from '../lib/logbookHelpers';

const LogbookContext = createContext();

export const useLogbook = () => {
  const context = useContext(LogbookContext);
  if (!context) {
    throw new Error('useLogbook must be used within a LogbookProvider');
  }
  return context;
};

const STORAGE_KEY = '@logbook_entries';

export const LogbookProvider = ({ children }) => {
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); // Get current authenticated user

  // On mount: load from local AsyncStorage immediately so the UI is never blank
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setLogbookEntries(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadLocal();
  }, []);

  // Once the authenticated user is available, sync from Supabase
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 [LogbookContext] User available, syncing from Supabase for:', user.id);
      loadLogbookEntries();
    }
  }, [user?.id]);

  const loadLogbookEntries = async () => {
    try {
      if (!user?.id) return;

      console.log('🔄 [LogbookContext] Loading logbook entries for user:', user.id);
      
      // Load from Supabase
      const { data: supabaseEntries, error } = await getLogbookEntries(user.id);
      
      if (supabaseEntries && !error) {
        console.log('✅ [LogbookContext] Successfully loaded', supabaseEntries.length, 'entries from Supabase');
        
        // Transform Supabase data to match local format
        const transformedEntries = supabaseEntries.map(entry => {
          // Parse JSON strings back to arrays for training_focus
          let trainingFocus = entry.training_focus;
          if (typeof trainingFocus === 'string') {
            try {
              trainingFocus = JSON.parse(trainingFocus);
            } catch (e) {
              console.warn('Failed to parse training_focus JSON:', trainingFocus);
              trainingFocus = [trainingFocus]; // Fallback to single item array
            }
          }
          
          // Parse JSON strings back to arrays for difficulty
          let difficulty = entry.difficulty;
          if (typeof difficulty === 'string') {
            try {
              difficulty = JSON.parse(difficulty);
            } catch (e) {
              console.warn('Failed to parse difficulty JSON:', difficulty);
              difficulty = [difficulty]; // Fallback to single item array
            }
          }
          
          return {
            id: entry.id,
            date: entry.date,
            hours: parseEntryHours(entry.hours, entry.duration_minutes),
            sessionType: entry.session_type,
            trainingFocus: trainingFocus,
            difficulty: difficulty,
            feeling: parseEntryFeeling(entry.feeling),
            notes: entry.notes,
            location: entry.location,
            createdAt: entry.created_at,
            exerciseDetails: entry.exercise_details || null
          };
        });
        
        setLogbookEntries(transformedEntries);
        // Also save to local storage as backup
        await saveLogbookEntries(transformedEntries);
      } else {
        // Fallback to local storage if Supabase fails
        console.log('⚠️ [LogbookContext] Supabase failed, loading from local storage:', error);
        const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          setLogbookEntries(parsedEntries);
        }
      }
    } catch (error) {
      console.error('Error loading logbook entries:', error);
      // Try local storage as final fallback
      try {
        const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedEntries) {
          const parsedEntries = JSON.parse(storedEntries);
          setLogbookEntries(parsedEntries);
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveLogbookEntries = async (entries) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving logbook entries:', error);
    }
  };

  // Sort entries by date (most recent first)
  const normalizeEntry = (entry) => ({
    ...entry,
    hours: parseEntryHours(entry.hours, entry.duration_minutes),
    feeling: parseEntryFeeling(entry.feeling),
  });

  const sortedEntries = [...logbookEntries].map(normalizeEntry).sort((a, b) => new Date(b.date) - new Date(a.date));

  const addLogbookEntry = async (entry) => {
    console.log('🎯 [LogbookContext] addLogbookEntry called with entry:', entry);
    
    try {
      // Transform entry to match Supabase format
      const supabaseEntry = {
        date: entry.date,
        hours: entry.hours,
        sessionType: entry.sessionType,
        trainingFocus: entry.trainingFocus,
        difficulty: entry.difficulty,
        feeling: entry.feeling,
        notes: entry.notes,
        location: entry.location,
        exerciseDetails: entry.exerciseDetails || null
      };

      console.log('🔄 [LogbookContext] Transformed entry for Supabase:', supabaseEntry);
      console.log('👤 [LogbookContext] Current user:', user);
      console.log('📤 [LogbookContext] Attempting to save to Supabase database...');

      // Try to save to Supabase first - pass user ID
      const userId = user?.id || null;
      console.log('🆔 [LogbookContext] Using user ID:', userId);
      const { data: savedEntry, error } = await createLogbookEntry(supabaseEntry, userId);
      
      console.log('📥 [LogbookContext] Supabase response:', { savedEntry, error });
      
      if (savedEntry && !error) {
        console.log('✅ [LogbookContext] Successfully saved to Supabase!');
        console.log('🔄 [LogbookContext] Transforming Supabase response back to local format...');
        
        // Transform back to local format
        let trainingFocus = savedEntry.training_focus;
        if (typeof trainingFocus === 'string') {
          try {
            trainingFocus = JSON.parse(trainingFocus);
          } catch (e) {
            console.warn('Failed to parse training_focus JSON:', trainingFocus);
            trainingFocus = [trainingFocus];
          }
        }
        
        let difficulty = savedEntry.difficulty;
        if (typeof difficulty === 'string') {
          try {
            difficulty = JSON.parse(difficulty);
          } catch (e) {
            console.warn('Failed to parse difficulty JSON:', difficulty);
            difficulty = [difficulty];
          }
        }
        
        const transformedEntry = {
          id: savedEntry.id,
          date: savedEntry.date,
          hours: parseEntryHours(savedEntry.hours, savedEntry.duration_minutes),
          sessionType: savedEntry.session_type,
          trainingFocus: trainingFocus,
          difficulty: difficulty,
          feeling: parseEntryFeeling(savedEntry.feeling),
          notes: savedEntry.notes,
          location: savedEntry.location,
          createdAt: savedEntry.created_at,
          exerciseDetails: savedEntry.exercise_details || null
        };
        
        console.log('📋 [LogbookContext] Transformed entry:', transformedEntry);
        console.log('💾 [LogbookContext] Updating local state and AsyncStorage...');
        
        const newEntries = [transformedEntry, ...logbookEntries];
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
        
        console.log('✅ [LogbookContext] Entry successfully saved to both Supabase and local storage!');
      } else {
        // Fallback to local-only save
        console.log('❌ [LogbookContext] Supabase save failed, saving locally only:', error);
        const entryWithId = { ...entry, id: Date.now().toString() };
        const newEntries = [entryWithId, ...logbookEntries];
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
        console.log('💾 [LogbookContext] Saved to local storage only');
      }
    } catch (error) {
      console.error('❌ [LogbookContext] Error adding logbook entry:', error);
      console.log('🔄 [LogbookContext] Falling back to local-only save...');
      // Fallback to local-only save
      const entryWithId = { ...entry, id: Date.now().toString() };
      const newEntries = [entryWithId, ...logbookEntries];
      setLogbookEntries(newEntries);
      await saveLogbookEntries(newEntries);
      console.log('💾 [LogbookContext] Saved to local storage only (error fallback)');
    }
  };

  const updateLogbookEntry = async (id, updatedEntry) => {
    console.log('🎯 [LogbookContext] updateLogbookEntry called with ID:', id, 'and updatedEntry:', updatedEntry);
    
    try {
      // Transform entry to match Supabase format
      const supabaseEntry = {
        date: updatedEntry.date,
        hours: updatedEntry.hours,
        sessionType: updatedEntry.sessionType,
        trainingFocus: updatedEntry.trainingFocus,
        difficulty: updatedEntry.difficulty,
        feeling: updatedEntry.feeling,
        notes: updatedEntry.notes,
        location: updatedEntry.location,
        exerciseDetails: updatedEntry.exerciseDetails || null
      };

      console.log('🔄 [LogbookContext] Transformed update for Supabase:', supabaseEntry);
      console.log('👤 [LogbookContext] Current user:', user);
      console.log('📤 [LogbookContext] Attempting to update in Supabase database...');

      // Try to update in Supabase first - pass user ID
      const userId = user?.id || null;
      console.log('🆔 [LogbookContext] Using user ID for update:', userId);
      const { data: updatedSupabaseEntry, error } = await updateSupabaseLogbookEntry(id, supabaseEntry, userId);
      
      console.log('📥 [LogbookContext] Supabase update response:', { updatedSupabaseEntry, error });
      
      if (updatedSupabaseEntry && !error) {
        console.log('✅ [LogbookContext] Successfully updated in Supabase!');
        console.log('🔄 [LogbookContext] Transforming Supabase response back to local format...');
        
        // Transform back to local format
        let trainingFocus = updatedSupabaseEntry.training_focus;
        if (typeof trainingFocus === 'string') {
          try {
            trainingFocus = JSON.parse(trainingFocus);
          } catch (e) {
            console.warn('Failed to parse training_focus JSON:', trainingFocus);
            trainingFocus = [trainingFocus];
          }
        }
        
        let difficulty = updatedSupabaseEntry.difficulty;
        if (typeof difficulty === 'string') {
          try {
            difficulty = JSON.parse(difficulty);
          } catch (e) {
            console.warn('Failed to parse difficulty JSON:', difficulty);
            difficulty = [difficulty];
          }
        }
        
        const transformedEntry = {
          id: updatedSupabaseEntry.id,
          date: updatedSupabaseEntry.date,
          hours: updatedSupabaseEntry.hours,
          sessionType: updatedSupabaseEntry.session_type,
          trainingFocus: trainingFocus,
          difficulty: difficulty,
          feeling: updatedSupabaseEntry.feeling,
          notes: updatedSupabaseEntry.notes,
          location: updatedSupabaseEntry.location,
          createdAt: updatedSupabaseEntry.created_at,
          exerciseDetails: updatedSupabaseEntry.exercise_details || null
        };
        
        console.log('📋 [LogbookContext] Transformed updated entry:', transformedEntry);
        console.log('💾 [LogbookContext] Updating local state and AsyncStorage...');
        
        const newEntries = logbookEntries.map(entry => 
          entry.id === id ? transformedEntry : entry
        );
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
        
        console.log('✅ [LogbookContext] Entry successfully updated in both Supabase and local storage!');
      } else {
        // Fallback to local-only update
        console.log('❌ [LogbookContext] Supabase update failed, updating locally only:', error);
        const newEntries = logbookEntries.map(entry => 
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        );
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
        console.log('💾 [LogbookContext] Updated in local storage only');
      }
    } catch (error) {
      console.error('❌ [LogbookContext] Error updating logbook entry:', error);
      console.log('🔄 [LogbookContext] Falling back to local-only update...');
      // Fallback to local-only update
      const newEntries = logbookEntries.map(entry => 
        entry.id === id ? { ...entry, ...updatedEntry } : entry
      );
      setLogbookEntries(newEntries);
      await saveLogbookEntries(newEntries);
      console.log('💾 [LogbookContext] Updated in local storage only (error fallback)');
    }
  };

  const deleteLogbookEntry = async (id) => {
    try {
      // Try to delete from Supabase first
      const { error } = await deleteSupabaseLogbookEntry(id);
      
      if (!error) {
        // If Supabase delete succeeded, update local state
        const newEntries = logbookEntries.filter(entry => entry.id !== id);
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
      } else {
        // Fallback to local-only delete
        console.log('Supabase delete failed, deleting locally only:', error);
        const newEntries = logbookEntries.filter(entry => entry.id !== id);
        setLogbookEntries(newEntries);
        await saveLogbookEntries(newEntries);
      }
    } catch (error) {
      console.error('Error deleting logbook entry:', error);
      // Fallback to local-only delete
      const newEntries = logbookEntries.filter(entry => entry.id !== id);
      setLogbookEntries(newEntries);
      await saveLogbookEntries(newEntries);
    }
  };

  // Helper functions for date calculations
  const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getMonthStart = (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const isDateInRange = (entryDate, startDate, endDate = new Date()) => {
    const entry = parseEntryDate(entryDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return entry >= start && entry <= end;
  };

  const getLogbookSummary = () => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    // Calculate total hours
    const totalHours = logbookEntries.reduce((sum, entry) => sum + parseEntryHours(entry.hours), 0);

    // Calculate this week's hours and sessions
    const thisWeekEntries = logbookEntries.filter(entry => 
      isDateInRange(entry.date, weekStart, now)
    );
    const thisWeekHours = thisWeekEntries.reduce((sum, entry) => sum + parseEntryHours(entry.hours), 0);
    const weekSessions = thisWeekEntries.length;

    // Calculate this month's hours and sessions
    const thisMonthEntries = logbookEntries.filter(entry => 
      isDateInRange(entry.date, monthStart, now)
    );
    const thisMonthHours = thisMonthEntries.reduce((sum, entry) => sum + parseEntryHours(entry.hours), 0);
    const monthSessions = thisMonthEntries.length;

    // Calculate weekly average feeling
    const weeklyAverageFeeling = thisWeekEntries.length > 0 
      ? thisWeekEntries.reduce((sum, entry) => sum + entry.feeling, 0) / thisWeekEntries.length
      : 0;

    // Calculate last 5 sessions average mood
    const last5Sessions = sortedEntries.slice(0, 5);
    const last5AverageFeeling = last5Sessions.length > 0 
      ? last5Sessions.reduce((sum, entry) => sum + entry.feeling, 0) / last5Sessions.length
      : 0;

    // Get first session date
    const sortedByDate = [...logbookEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstSessionDate = sortedByDate.length > 0 ? sortedByDate[0].date : new Date().toISOString().split('T')[0];

    // Calculate strong skills (most frequent in trainingFocus)
    const skillCounts = {};
    logbookEntries.forEach(entry => {
      // Handle both old single focus and new multiple focus formats
      const entryFocuses = Array.isArray(entry.trainingFocus) 
        ? entry.trainingFocus 
        : [entry.trainingFocus].filter(Boolean);
      
      entryFocuses.forEach(skill => {
        if (skill) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      });
    });

    // Calculate weak skills (most frequent in difficulty)
    const weaknessCounts = {};
    logbookEntries.forEach(entry => {
      if (entry.difficulty) {
        // Handle both old single difficulty and new multiple difficulty formats
        const entryDifficulties = Array.isArray(entry.difficulty) 
          ? entry.difficulty 
          : [entry.difficulty].filter(Boolean);
        
        entryDifficulties.forEach(skill => {
          if (skill) {
            weaknessCounts[skill] = (weaknessCounts[skill] || 0) + 1;
          }
        });
      }
    });

    // Get top 3 strong skills
    const topStrongSkills = Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([skill, count]) => ({ skill, count }));

    // Get top 3 weak skills
    const topWeakSkills = Object.entries(weaknessCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([skill, count]) => ({ skill, count }));

    // Calculate hours by session type
    const sessionTypeHours = {};
    logbookEntries.forEach(entry => {
      const sessionType = entry.sessionType || 'training'; // Default to 'training' if not set
      sessionTypeHours[sessionType] = (sessionTypeHours[sessionType] || 0) + parseEntryHours(entry.hours);
    });

    // Round session type hours
    Object.keys(sessionTypeHours).forEach(type => {
      sessionTypeHours[type] = Math.round(sessionTypeHours[type] * 10) / 10;
    });

    // Current month session-type hours (for donut)
    const monthSessionTypeHours = {};
    thisMonthEntries.forEach(entry => {
      const type = entry.sessionType || 'training';
      monthSessionTypeHours[type] = (monthSessionTypeHours[type] || 0) + parseEntryHours(entry.hours);
    });
    Object.keys(monthSessionTypeHours).forEach(type => {
      monthSessionTypeHours[type] = Math.round(monthSessionTypeHours[type] * 10) / 10;
    });

    // Calories for the current month
    const monthCalories = Math.round(thisMonthHours * CAL_PER_HOUR);

    // Last 5 sessions (oldest → newest) with mood key/label/color
    const last5Sorted = sortedEntries.slice(0, 5).reverse();
    const last5Moods = last5Sorted.map(entry => feelingToMood(entry.feeling));
    const moodTrendUp = isMoodTrendingUp(last5Sorted);

    // Fallback to all-time stats when current month has no entries but user has history
    const useAllTime = monthSessions === 0 && logbookEntries.length > 0;
    const summaryEntries = useAllTime ? logbookEntries : thisMonthEntries;

    // Legacy entries may lack hours — default to 1h per session for display only
    const sumHoursWithFallback = (entries) =>
      entries.reduce((sum, entry) => {
        const h = parseEntryHours(entry.hours, entry.duration_minutes);
        return sum + (h > 0 ? h : 1);
      }, 0);

    let displayHours = useAllTime
      ? Math.round(sumHoursWithFallback(logbookEntries) * 10) / 10
      : Math.round((thisMonthHours > 0 ? thisMonthHours : sumHoursWithFallback(thisMonthEntries)) * 10) / 10;

    const displaySessions = useAllTime ? logbookEntries.length : monthSessions;

    const displaySessionTypeHours = {};
    summaryEntries.forEach(entry => {
      const { activity } = getActivityAndFormat(entry);
      const h = parseEntryHours(entry.hours, entry.duration_minutes) || 1;
      displaySessionTypeHours[activity] = (displaySessionTypeHours[activity] || 0) + h;
    });
    Object.keys(displaySessionTypeHours).forEach(type => {
      displaySessionTypeHours[type] = Math.round(displaySessionTypeHours[type] * 10) / 10;
    });

    const displayCalories = Math.round(displayHours * CAL_PER_HOUR);
    const displayPeriod = useAllTime ? 'all time' : 'this month';

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      thisWeekHours: Math.round(thisWeekHours * 10) / 10,
      thisMonthHours: Math.round(thisMonthHours * 10) / 10,
      weekSessions,
      monthSessions,
      weeklyAverageFeeling: Math.round(weeklyAverageFeeling * 10) / 10,
      last5AverageFeeling: Math.round(last5AverageFeeling * 10) / 10,
      firstSessionDate,
      totalSessions: logbookEntries.length,
      topStrongSkills,
      topWeakSkills,
      sessionTypeHours,
      monthSessionTypeHours,
      monthCalories,
      last5Moods,
      moodTrendUp,
      displayHours,
      displaySessions,
      displaySessionTypeHours,
      displayCalories,
      displayPeriod,
    };
  };

  // Get entries for a specific date range
  const getEntriesInDateRange = (startDate, endDate) => {
    return logbookEntries.filter(entry => 
      isDateInRange(entry.date, startDate, endDate)
    );
  };

  // Get monthly breakdown
  const getMonthlyBreakdown = () => {
    const months = {};
    
    logbookEntries.forEach(entry => {
      const date = parseEntryDate(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const hours = parseEntryHours(entry.hours, entry.duration_minutes);

      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          hours: 0,
          calories: 0,
          sessions: 0,
          averageFeeling: 0,
          entries: [],
        };
      }

      months[monthKey].hours += hours;
      months[monthKey].calories += Math.round(hours * CAL_PER_HOUR);
      months[monthKey].sessions += 1;
      months[monthKey].entries.push(entry);
    });

    Object.keys(months).forEach(monthKey => {
      const month = months[monthKey];
      const feelings = month.entries.map(e => parseEntryFeeling(e.feeling));
      month.averageFeeling = feelings.reduce((sum, f) => sum + f, 0) / month.sessions;
      month.hours = Math.round(month.hours * 10) / 10;
      month.averageFeeling = Math.round(month.averageFeeling * 10) / 10;
    });

    return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
  };

  // Get progress trends
  const getProgressTrends = () => {
    const recent30Days = logbookEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return entryDate >= thirtyDaysAgo;
    });

    const recentAvgFeeling = recent30Days.length > 0 
      ? recent30Days.reduce((sum, entry) => sum + entry.feeling, 0) / recent30Days.length
      : 0;

    const recentHoursPerWeek = recent30Days.reduce((sum, entry) => sum + entry.hours, 0) / 4; // Approximate weeks

    return {
      recentAverageFeeling: Math.round(recentAvgFeeling * 10) / 10,
      recentHoursPerWeek: Math.round(recentHoursPerWeek * 10) / 10,
      recentSessions: recent30Days.length,
    };
  };

  const value = {
    logbookEntries: sortedEntries,
    isLoading,
    addLogbookEntry,
    updateLogbookEntry,
    deleteLogbookEntry,
    refreshLogbook: loadLogbookEntries,
    getLogbookSummary,
    getEntriesInDateRange,
    getMonthlyBreakdown,
    getProgressTrends,
  };

  return (
    <LogbookContext.Provider value={value}>
      {children}
    </LogbookContext.Provider>
  );
};
