import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Load entries from AsyncStorage on mount
  useEffect(() => {
    loadLogbookEntries();
  }, []);

  const loadLogbookEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setLogbookEntries(parsedEntries);
      }
    } catch (error) {
      console.error('Error loading logbook entries:', error);
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
  const sortedEntries = [...logbookEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  const addLogbookEntry = async (entry) => {
    const newEntries = [entry, ...logbookEntries];
    setLogbookEntries(newEntries);
    await saveLogbookEntries(newEntries);
  };

  const updateLogbookEntry = async (id, updatedEntry) => {
    const newEntries = logbookEntries.map(entry => 
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    );
    setLogbookEntries(newEntries);
    await saveLogbookEntries(newEntries);
  };

  const deleteLogbookEntry = async (id) => {
    const newEntries = logbookEntries.filter(entry => entry.id !== id);
    setLogbookEntries(newEntries);
    await saveLogbookEntries(newEntries);
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
    const entry = new Date(entryDate);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return entry >= start && entry <= end;
  };

  const getLogbookSummary = () => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    // Calculate total hours
    const totalHours = logbookEntries.reduce((sum, entry) => sum + entry.hours, 0);

    // Calculate this week's hours and sessions
    const thisWeekEntries = logbookEntries.filter(entry => 
      isDateInRange(entry.date, weekStart, now)
    );
    const thisWeekHours = thisWeekEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const weekSessions = thisWeekEntries.length;

    // Calculate this month's hours and sessions
    const thisMonthEntries = logbookEntries.filter(entry => 
      isDateInRange(entry.date, monthStart, now)
    );
    const thisMonthHours = thisMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const monthSessions = thisMonthEntries.length;

    // Calculate weekly average feeling
    const weeklyAverageFeeling = thisWeekEntries.length > 0 
      ? thisWeekEntries.reduce((sum, entry) => sum + entry.feeling, 0) / thisWeekEntries.length
      : 0;

    // Get first session date
    const sortedByDate = [...logbookEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstSessionDate = sortedByDate.length > 0 ? sortedByDate[0].date : new Date().toISOString().split('T')[0];

    return {
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
      thisWeekHours: Math.round(thisWeekHours * 10) / 10,
      thisMonthHours: Math.round(thisMonthHours * 10) / 10,
      weekSessions,
      monthSessions,
      weeklyAverageFeeling: Math.round(weeklyAverageFeeling * 10) / 10,
      firstSessionDate,
      totalSessions: logbookEntries.length,
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
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          hours: 0,
          sessions: 0,
          averageFeeling: 0,
          entries: [],
        };
      }
      
      months[monthKey].hours += entry.hours;
      months[monthKey].sessions += 1;
      months[monthKey].entries.push(entry);
    });

    // Calculate average feelings
    Object.keys(months).forEach(monthKey => {
      const month = months[monthKey];
      month.averageFeeling = month.entries.reduce((sum, entry) => sum + entry.feeling, 0) / month.sessions;
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
