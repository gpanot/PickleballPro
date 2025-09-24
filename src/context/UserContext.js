import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { updateProfile, user: authUser, profile, isAuthenticated } = useAuth();
  
  // Initialize user state for onboarding - will be populated from AuthContext when authenticated
  const [user, setUser] = useState({
    // Initialize with empty onboarding data structure
    id: null,
    name: null,
    email: null,
    gender: null,
    duprRating: null,
    ratingType: null,
    tier: null,
    goal: null,
    timeCommitment: null,
    intensity: null, // workout intensity preference
    focus_areas: [],
    coachPreference: null,
    personalizedProgram: null,
    badges: [
      { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
      { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
      { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
      { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
    ],
  });
  
  // Sync UserContext with AuthContext when authentication state changes
  useEffect(() => {
    console.log('UserContext: Auth state changed - isAuthenticated:', isAuthenticated);
    console.log('UserContext: AuthUser:', authUser?.email, 'Profile:', !!profile);
    
    if (isAuthenticated && authUser) {
      // Create user object from authenticated user and profile data
      // Preserve any local onboarding data that might not be in profile yet
      const syncedUser = {
        ...user, // Preserve existing local data
        id: authUser.id, // Real user ID from Supabase
        name: profile?.name || user?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        joinedDate: authUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        // Use profile data if available, otherwise keep local onboarding data
        duprRating: profile?.dupr_rating || user?.duprRating || null,
        tier: profile?.tier || user?.tier || null,
        ratingType: profile?.rating_type || user?.ratingType || null,
        gender: profile?.gender || user?.gender || null,
        goal: profile?.goal || user?.goal || null,
        timeCommitment: profile?.time_commitment || user?.timeCommitment || null,
        intensity: profile?.intensity || user?.intensity || null, // workout intensity preference
        focus_areas: profile?.focus_areas || user?.focus_areas || [],
        coachPreference: profile?.coach_preference || user?.coachPreference || null,
        personalizedProgram: profile?.personalized_program || user?.personalizedProgram || null,
        badges: [
          { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
          { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
          { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
          { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
        ],
      };
      
      console.log('UserContext: ✅ Syncing user data from AuthContext (preserving local onboarding):', syncedUser);
      setUser(syncedUser);
    } else {
      console.log('UserContext: User not authenticated, keeping onboarding data locally');
      // Don't clear user data during onboarding - just clear auth-specific fields
      if (user?.id) {
        setUser(prevUser => ({
          ...prevUser,
          id: null,
          email: null,
          joinedDate: null
        }));
      }
    }
  }, [isAuthenticated, authUser, profile]);

  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [hasSelectedGender, setHasSelectedGender] = useState(false);
  const [hasSetRating, setHasSetRating] = useState(false);
  const [hasSetName, setHasSetName] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const updateUserRating = (rating, ratingType) => {
    const tier = getTierFromRating(rating);
    setUser(prevUser => ({
      ...prevUser,
      duprRating: rating,
      ratingType,
      tier
    }));
    setHasSetRating(true);
  };

  const updateOnboardingData = async (data) => {
    console.log('UserContext: updateOnboardingData called with:', data);
    
    // Update local state
    setUser(prevUser => ({
      ...prevUser,
      ...data
    }));
    
    // Only save to database if user is authenticated
    if (isAuthenticated && authUser && updateProfile) {
      try {
        console.log('UserContext: User is authenticated - saving onboarding data to database:', data);
        const result = await updateProfile(data);
        if (result.error) {
          console.error('UserContext: Error saving onboarding data to database:', result.error);
        } else {
          console.log('UserContext: ✅ Onboarding data saved successfully to database');
        }
      } catch (error) {
        console.error('UserContext: Error saving onboarding data to database:', error);
      }
    } else {
      console.log('UserContext: User not authenticated - storing onboarding data locally only');
    }
  };

  const updateUserName = (name) => {
    setUser(prevUser => ({
      ...prevUser,
      name
    }));
    setHasSetName(true);
  };

  const completeNameSelection = () => {
    setHasSetName(true);
  };

  const storePersonalizedProgram = (program) => {
    setUser(prevUser => ({
      ...prevUser,
      personalizedProgram: program
    }));
    console.log('Personalized program stored in user context:', program);
  };


  const completeIntro = () => {
    console.log('UserContext: completeIntro called - setting hasCompletedIntro to true');
    setHasCompletedIntro(true);
    console.log('UserContext: hasCompletedIntro state should now be true');
  };

  const goBackToIntro = () => {
    setHasCompletedIntro(false);
  };

  const completeGenderSelection = () => {
    setHasSelectedGender(true);
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };

  const resetAllOnboarding = () => {
    console.log('UserContext: Resetting all onboarding state');
    setHasCompletedIntro(false);
    setHasSelectedGender(false);
    setHasSetRating(false);
    setHasSetName(false);
    setHasCompletedOnboarding(false);
  };

  const getTierFromRating = (rating) => {
    if (rating >= 2.0 && rating < 3.0) return 'Beginner';
    if (rating >= 3.0 && rating < 4.0) return 'Intermediate';
    if (rating >= 4.0 && rating < 5.0) return 'Advanced';
    if (rating >= 5.0) return 'Pro';
    return 'Beginner'; // Default fallback
  };

  // Function to get all onboarding data collected locally
  const getOnboardingData = () => {
    if (!user) return {};
    
    // Only include fields that have been set (not null/undefined)
    const data = {};
    
    if (user.name) data.name = user.name;
    if (user.gender) data.gender = user.gender;
    if (user.duprRating !== null && user.duprRating !== undefined) data.dupr_rating = user.duprRating;
    if (user.ratingType) data.rating_type = user.ratingType;
    if (user.tier) data.tier = user.tier;
    if (user.goal) data.goal = user.goal;
    if (user.timeCommitment) data.time_commitment = user.timeCommitment;
    if (user.intensity) data.intensity = user.intensity; // workout intensity preference
    if (user.focus_areas && user.focus_areas.length > 0) data.focus_areas = user.focus_areas;
    if (user.coachPreference) data.coach_preference = user.coachPreference;
    if (user.personalizedProgram) data.personalized_program = user.personalizedProgram;
    
    console.log('UserContext: getOnboardingData returning:', data);
    return data;
  };

  const value = {
    user,
    hasCompletedIntro,
    hasSelectedGender,
    hasSetRating,
    hasSetName,
    hasCompletedOnboarding,
    updateUserRating,
    updateUserName,
    updateOnboardingData,
    storePersonalizedProgram,
    completeIntro,
    goBackToIntro,
    completeGenderSelection,
    completeNameSelection,
    completeOnboarding,
    resetAllOnboarding,
    setUser,
    getOnboardingData,
    getTierFromRating
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
