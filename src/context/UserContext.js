import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    duprRating: null, // Will be set after rating selection
    tier: null, // Will be calculated based on rating
    joinedDate: '2024-01-15',
    ratingType: null, // 'dupr', 'self', or 'none'
    gender: null, // 'male', 'female'
    // Onboarding data
    goal: null, // 'dupr', 'basics', 'consistency', 'tournament'
    timeCommitment: null, // 'low', 'medium', 'high'
    focusAreas: [], // array of focus tags like ['dinks', 'power']
    coachPreference: null, // 'yes', 'no'
    badges: [
      { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
      { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
      { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
      { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
    ],
  });

  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [hasSelectedGender, setHasSelectedGender] = useState(false);
  const [hasSetRating, setHasSetRating] = useState(false);
  const [hasCompletedPersonalProgram, setHasCompletedPersonalProgram] = useState(false);
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

  const updateOnboardingData = (data) => {
    setUser(prevUser => ({
      ...prevUser,
      ...data
    }));
  };

  const updateUserName = (name) => {
    setUser(prevUser => ({
      ...prevUser,
      name
    }));
  };

  const completePersonalProgram = () => {
    setHasCompletedPersonalProgram(true);
  };

  const completeIntro = () => {
    setHasCompletedIntro(true);
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

  const getTierFromRating = (rating) => {
    if (rating >= 2.0 && rating < 3.0) return 'Beginner';
    if (rating >= 3.0 && rating < 4.0) return 'Intermediate';
    if (rating >= 4.0 && rating < 5.0) return 'Advanced';
    if (rating >= 5.0) return 'Pro';
    return 'Beginner'; // Default fallback
  };

  const value = {
    user,
    hasCompletedIntro,
    hasSelectedGender,
    hasSetRating,
    hasCompletedPersonalProgram,
    hasCompletedOnboarding,
    updateUserRating,
    updateUserName,
    updateOnboardingData,
    completeIntro,
    goBackToIntro,
    completeGenderSelection,
    completePersonalProgram,
    completeOnboarding,
    setUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
