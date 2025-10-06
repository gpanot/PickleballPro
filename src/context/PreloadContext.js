import React, { createContext, useContext, useState, useEffect } from 'react';
import preloadingService from '../lib/preloadingService';
import { useAuth } from './AuthContext';

const PreloadContext = createContext();

export const usePreload = () => {
  const context = useContext(PreloadContext);
  if (!context) {
    throw new Error('usePreload must be used within a PreloadProvider');
  }
  return context;
};

export const PreloadProvider = ({ children }) => {
  const [preloadedData, setPreloadedData] = useState({
    programs: null,
    coaches: null,
    logbook: null,
  });
  
  const [loadingStates, setLoadingStates] = useState({
    programs: false,
    coaches: false,
    logbook: false,
    all: false,
  });
  
  const [errors, setErrors] = useState({
    programs: null,
    coaches: null,
    logbook: null,
  });

  const { isAuthenticated, user } = useAuth();

  // Trigger preloading when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🚀 PreloadContext: User authenticated, starting preload...');
      // Add a small delay to ensure auth state is fully settled
      const timeoutId = setTimeout(() => {
        preloadAllData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (!isAuthenticated) {
      // Clear preloaded data when user signs out
      console.log('🧹 PreloadContext: User signed out, clearing preloaded data...');
      clearAllData();
    }
  }, [isAuthenticated, user]);

  const preloadAllData = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, all: true }));
      
      console.log('📦 PreloadContext: Starting to preload all data...');
      const cachedData = await preloadingService.preloadAllData();
      
      // Update state with preloaded data
      setPreloadedData({
        programs: cachedData.programs,
        coaches: cachedData.coaches,
        logbook: cachedData.logbook,
      });
      
      // Update loading states
      setLoadingStates({
        programs: preloadingService.isLoading('programs'),
        coaches: preloadingService.isLoading('coaches'),
        logbook: preloadingService.isLoading('logbook'),
        all: false,
      });
      
      // Update errors
      setErrors({
        programs: preloadingService.getError('programs'),
        coaches: preloadingService.getError('coaches'),
        logbook: preloadingService.getError('logbook'),
      });
      
      console.log('✅ PreloadContext: All data preloaded successfully');
    } catch (error) {
      console.error('❌ PreloadContext: Failed to preload data:', error);
      setLoadingStates(prev => ({ ...prev, all: false }));
    }
  };

  const clearAllData = () => {
    setPreloadedData({
      programs: null,
      coaches: null,
      logbook: null,
    });
    
    setLoadingStates({
      programs: false,
      coaches: false,
      logbook: false,
      all: false,
    });
    
    setErrors({
      programs: null,
      coaches: null,
      logbook: null,
    });
    
    preloadingService.clearCache();
  };

  const refreshData = async (type) => {
    try {
      setLoadingStates(prev => ({ ...prev, [type]: true }));
      setErrors(prev => ({ ...prev, [type]: null }));
      
      const refreshedData = await preloadingService.refreshData(type);
      
      setPreloadedData(prev => ({
        ...prev,
        [type]: refreshedData,
      }));
      
      setLoadingStates(prev => ({ ...prev, [type]: false }));
      
      console.log(`✅ PreloadContext: ${type} data refreshed successfully`);
      return refreshedData;
    } catch (error) {
      console.error(`❌ PreloadContext: Failed to refresh ${type} data:`, error);
      setErrors(prev => ({ ...prev, [type]: error.message }));
      setLoadingStates(prev => ({ ...prev, [type]: false }));
      throw error;
    }
  };

  const getPreloadedData = (type) => {
    return preloadedData[type];
  };

  const isDataLoading = (type) => {
    return loadingStates[type] || false;
  };

  const hasPreloadedData = (type) => {
    return preloadedData[type] !== null;
  };

  const getDataError = (type) => {
    return errors[type];
  };

  const isAllDataLoading = () => {
    return loadingStates.all;
  };

  // Helper function to get data with fallback to service cache
  const getDataWithFallback = (type) => {
    // First try preloaded data from context
    if (preloadedData[type] !== null) {
      return preloadedData[type];
    }
    
    // Fallback to service cache
    return preloadingService.getCachedData(type);
  };

  const value = {
    // Data access
    getPreloadedData,
    getDataWithFallback,
    hasPreloadedData,
    
    // Loading states
    isDataLoading,
    isAllDataLoading,
    loadingStates,
    
    // Error handling
    getDataError,
    errors,
    
    // Actions
    preloadAllData,
    refreshData,
    clearAllData,
    
    // Direct data access (for convenience)
    programs: preloadedData.programs,
    coaches: preloadedData.coaches,
    logbook: preloadedData.logbook,
    
    // Debug info
    getCacheStatus: () => preloadingService.getCacheStatus(),
  };

  return (
    <PreloadContext.Provider value={value}>
      {children}
    </PreloadContext.Provider>
  );
};
