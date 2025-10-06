import { getPrograms, transformProgramData, getCoaches, transformCoachData, getLogbookEntries } from './supabase';

/**
 * Preloading service to fetch data for main screens during authentication
 * This makes the app feel super fast by loading data in the background
 */
class PreloadingService {
  constructor() {
    this.cache = {
      programs: null,
      coaches: null,
      logbook: null,
      categoryOrder: null,
    };
    this.loadingStates = {
      programs: false,
      coaches: false,
      logbook: false,
    };
    this.errors = {
      programs: null,
      coaches: null,
      logbook: null,
    };
  }

  /**
   * Preload all data for main screens
   * This is called during authentication to make screens load instantly
   */
  async preloadAllData() {
    console.log('🚀 PreloadingService: Starting to preload all data...');
    
    // Start all requests in parallel for maximum speed
    const promises = [
      this.preloadPrograms(),
      this.preloadCoaches(),
      this.preloadLogbook(),
    ];

    // Wait for all to complete (or fail)
    const results = await Promise.allSettled(promises);
    
    // Log results
    results.forEach((result, index) => {
      const types = ['programs', 'coaches', 'logbook'];
      if (result.status === 'fulfilled') {
        console.log(`✅ PreloadingService: ${types[index]} preloaded successfully`);
      } else {
        console.log(`❌ PreloadingService: ${types[index]} preload failed:`, result.reason);
      }
    });

    console.log('🏁 PreloadingService: Preloading complete');
    return this.cache;
  }

  /**
   * Preload programs data for ExploreTrainingScreen
   */
  async preloadPrograms() {
    if (this.loadingStates.programs) {
      console.log('⏳ Programs already loading, skipping...');
      return this.cache.programs;
    }

    try {
      this.loadingStates.programs = true;
      this.errors.programs = null;

      console.log('📚 PreloadingService: Fetching programs...');
      const { data, error } = await getPrograms();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        this.cache.programs = [];
        return this.cache.programs;
      }
      
      // Transform the data to match app structure
      const transformedPrograms = transformProgramData(data);
      this.cache.programs = transformedPrograms;
      
      console.log(`✅ PreloadingService: Cached ${transformedPrograms.length} programs`);
      return this.cache.programs;
    } catch (error) {
      console.error('❌ PreloadingService: Failed to preload programs:', error);
      this.errors.programs = error.message || 'Failed to load programs';
      this.cache.programs = [];
      return this.cache.programs;
    } finally {
      this.loadingStates.programs = false;
    }
  }

  /**
   * Preload coaches data for CoachScreen
   */
  async preloadCoaches() {
    if (this.loadingStates.coaches) {
      console.log('⏳ Coaches already loading, skipping...');
      return this.cache.coaches;
    }

    try {
      this.loadingStates.coaches = true;
      this.errors.coaches = null;

      console.log('👨‍🏫 PreloadingService: Fetching coaches...');
      const { data, error } = await getCoaches();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        this.cache.coaches = [];
        return this.cache.coaches;
      }
      
      // Transform the data to match app structure
      const transformedCoaches = transformCoachData(data);
      this.cache.coaches = transformedCoaches;
      
      console.log(`✅ PreloadingService: Cached ${transformedCoaches.length} coaches`);
      return this.cache.coaches;
    } catch (error) {
      console.error('❌ PreloadingService: Failed to preload coaches:', error);
      this.errors.coaches = error.message || 'Failed to load coaches';
      this.cache.coaches = [];
      return this.cache.coaches;
    } finally {
      this.loadingStates.coaches = false;
    }
  }

  /**
   * Preload logbook data for LogbookScreen
   */
  async preloadLogbook() {
    if (this.loadingStates.logbook) {
      console.log('⏳ Logbook already loading, skipping...');
      return this.cache.logbook;
    }

    try {
      this.loadingStates.logbook = true;
      this.errors.logbook = null;

      console.log('📖 PreloadingService: Fetching logbook entries...');
      const { data, error } = await getLogbookEntries();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        this.cache.logbook = [];
        return this.cache.logbook;
      }
      
      // Transform Supabase data to match local format (same as LogbookContext)
      const transformedEntries = data.map(entry => {
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
          hours: entry.hours,
          sessionType: entry.session_type,
          trainingFocus: trainingFocus,
          difficulty: difficulty,
          feeling: entry.feeling,
          notes: entry.notes,
          location: entry.location,
          createdAt: entry.created_at
        };
      });
      
      this.cache.logbook = transformedEntries;
      
      console.log(`✅ PreloadingService: Cached ${transformedEntries.length} logbook entries`);
      return this.cache.logbook;
    } catch (error) {
      console.error('❌ PreloadingService: Failed to preload logbook:', error);
      this.errors.logbook = error.message || 'Failed to load logbook';
      this.cache.logbook = [];
      return this.cache.logbook;
    } finally {
      this.loadingStates.logbook = false;
    }
  }

  /**
   * Get cached data for a specific type
   */
  getCachedData(type) {
    return this.cache[type] || null;
  }

  /**
   * Check if data is currently loading
   */
  isLoading(type) {
    return this.loadingStates[type] || false;
  }

  /**
   * Get error for a specific type
   */
  getError(type) {
    return this.errors[type] || null;
  }

  /**
   * Check if data is available in cache
   */
  hasData(type) {
    return this.cache[type] !== null;
  }

  /**
   * Clear cache for a specific type or all types
   */
  clearCache(type = null) {
    if (type) {
      this.cache[type] = null;
      this.errors[type] = null;
    } else {
      this.cache = {
        programs: null,
        coaches: null,
        logbook: null,
        categoryOrder: null,
      };
      this.errors = {
        programs: null,
        coaches: null,
        logbook: null,
      };
    }
  }

  /**
   * Refresh specific data type
   */
  async refreshData(type) {
    console.log(`🔄 PreloadingService: Refreshing ${type} data...`);
    
    // Clear existing cache for this type
    this.clearCache(type);
    
    // Reload the data
    switch (type) {
      case 'programs':
        return await this.preloadPrograms();
      case 'coaches':
        return await this.preloadCoaches();
      case 'logbook':
        return await this.preloadLogbook();
      default:
        console.warn(`Unknown data type: ${type}`);
        return null;
    }
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    return {
      cache: {
        programs: this.cache.programs ? this.cache.programs.length : 0,
        coaches: this.cache.coaches ? this.cache.coaches.length : 0,
        logbook: this.cache.logbook ? this.cache.logbook.length : 0,
      },
      loading: { ...this.loadingStates },
      errors: { ...this.errors },
    };
  }
}

// Create singleton instance
const preloadingService = new PreloadingService();

export default preloadingService;

