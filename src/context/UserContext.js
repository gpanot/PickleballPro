import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
  loadOnboardingFinishState,
  markOnboardingFinishComplete,
  resetOnboardingFinishState,
} from '../lib/onboardingFinishState';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const ONBOARDING_STORAGE_KEY = '@academypro_onboarding_state';
const LEGACY_ONBOARDING_KEY = '@picklepro_onboarding_state';

const DEFAULT_USER = {
  id: null,
  name: null,
  email: null,
  gender: null,
  duprRating: null,
  ratingType: null,
  tier: null,
  goal: null,
  timeCommitment: null,
  intensity: null,
  focus_areas: [],
  coachPreference: null,
  personalizedProgram: null,
  avatarUrl: null,
  sportId: 'pickleball',
  role: null,  // 'player' | 'coach'
  badges: [
    { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
    { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
    { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
    { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
  ],
};

export const UserProvider = ({ children }) => {
  const { updateProfile, user: authUser, profile, isAuthenticated } = useAuth();

  const [user, setUser] = useState(DEFAULT_USER);

  // ── Player onboarding flags ────────────────────────────────────────────────
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false);
  const [hasSelectedSport, setHasSelectedSport] = useState(false);
  const [hasSelectedGender, setHasSelectedGender] = useState(false);
  const [hasSetRating, setHasSetRating] = useState(false);
  const [hasSetName, setHasSetName] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // ── Shared / coach onboarding flags ───────────────────────────────────────
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
  const [hasCompletedCoachBenefits, setHasCompletedCoachBenefits] = useState(false);
  const [hasCompletedCoachProfile, setHasCompletedCoachProfile] = useState(false);

  // True once the initial AsyncStorage read is done — App waits on this to avoid routing flash
  const [isOnboardingHydrated, setIsOnboardingHydrated] = useState(false);

  // Skip persisting during the initial hydration read
  const skipPersist = useRef(true);

  // ── Hydrate from AsyncStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const loadOnboarding = async () => {
      // Dual-read migration: try new key, fall back to legacy key
      let raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (raw === null) {
        raw = await AsyncStorage.getItem(LEGACY_ONBOARDING_KEY);
        if (raw !== null) {
          await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, raw);
        }
      }
      return raw;
    };

    Promise.all([
      loadOnboarding(),
      loadOnboardingFinishState(),
    ])
      .then(([raw, finishState]) => {
        let saved = null;
        if (raw) {
          try {
            saved = JSON.parse(raw);
            if (saved.flags) {
              if (saved.flags.hasSelectedSport)   setHasSelectedSport(true);
              // Backward compat: users who completed intro before sport selection was added
              if (saved.flags.hasCompletedIntro)  setHasSelectedSport(true);
              if (saved.flags.hasCompletedIntro)    setHasCompletedIntro(true);
              if (saved.flags.hasSelectedGender)    setHasSelectedGender(true);
              if (saved.flags.hasSetRating)         setHasSetRating(true);
              if (saved.flags.hasSetName)           setHasSetName(true);
              if (saved.flags.hasCompletedOnboarding) setHasCompletedOnboarding(true);

              // Role flags (v2)
              if (saved.flags.hasSelectedRole)          setHasSelectedRole(true);
              if (saved.flags.hasCompletedCoachBenefits) setHasCompletedCoachBenefits(true);
              if (saved.flags.hasCompletedCoachProfile)  setHasCompletedCoachProfile(true);

              // Migration: existing users who already passed sport/intro have implicitly
              // chosen the player path — treat them as role=player, hasSelectedRole=true
              // so they are not shown RoleSelectionScreen on upgrade.
              if (!saved.flags.hasSelectedRole) {
                const alreadyProgressed =
                  saved.flags.hasSelectedSport ||
                  saved.flags.hasCompletedIntro ||
                  saved.flags.hasSelectedGender ||
                  saved.flags.hasSetRating ||
                  saved.flags.hasCompletedOnboarding;
                if (alreadyProgressed) {
                  setHasSelectedRole(true);
                }
              }
            }
            if (saved.user) {
              setUser(prev => ({
                ...prev,
                ...saved.user,
                // Migration: if no role saved but sport/intro flags existed, default to player
                role: saved.user.role ?? (prev.role ?? null),
              }));
            }
          } catch (e) {
            console.warn('UserContext: Failed to parse onboarding state', e);
          }
        }

        // Only trust finish-state "completed" when the user is not mid pre-auth onboarding.
        // Stale finish markers must not skip Goals → Sign-up after the Name step.
        if (finishState.completed) {
          const inProgressPreAuth = saved?.flags && (
            (saved.flags.hasSelectedRole ||
             saved.flags.hasSelectedSport ||
             saved.flags.hasCompletedIntro ||
             saved.flags.hasSelectedGender ||
             saved.flags.hasSetRating ||
             saved.flags.hasSetName) &&
            !saved.flags.hasCompletedOnboarding
          );
          if (!inProgressPreAuth) {
            setHasCompletedOnboarding(true);
          }
        }
      })
      .catch((e) => console.warn('UserContext: Failed to load onboarding state', e))
      .finally(() => {
        skipPersist.current = false;
        setIsOnboardingHydrated(true);
      });
  }, []);

  // ── Persist whenever flags or relevant user fields change ──────────────────
  // We use a ref to batch all the individual setters into one write per render cycle.
  const persistTimerRef = useRef(null);

  const schedulePersist = (
    flags,
    userData,
  ) => {
    if (skipPersist.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const payload = {
        flags,
        user: {
          name: userData.name,
          gender: userData.gender,
          duprRating: userData.duprRating,
          ratingType: userData.ratingType,
          tier: userData.tier,
          goal: userData.goal,
          timeCommitment: userData.timeCommitment,
          intensity: userData.intensity,
          sportId: userData.sportId,
          role: userData.role,
        },
      };
      AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload)).catch(
        (e) => console.warn('UserContext: Failed to persist onboarding state', e),
      );
    }, 100);
  };

  // ── Sync UserContext with AuthContext when authentication state changes ─────
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const syncedUser = {
        ...user,
        id: authUser.id,
        name: profile?.name || user?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        joinedDate: authUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        // TODO(multi-sport): map sport_id UUID → slug via a sports lookup instead of hardcoding.
        // Safe for now because only 'pickleball' is an active sport.
        sportId: profile?.sport_id ? 'pickleball' : (user?.sportId || 'pickleball'),
        duprRating: profile?.dupr_rating || user?.duprRating || null,
        tier: profile?.tier || user?.tier || null,
        ratingType: profile?.rating_type || user?.ratingType || null,
        gender: profile?.gender || user?.gender || null,
        goal: profile?.goal || user?.goal || null,
        timeCommitment: profile?.time_commitment || user?.timeCommitment || null,
        intensity: profile?.intensity || user?.intensity || null,
        focus_areas: profile?.focus_areas || user?.focus_areas || [],
        coachPreference: profile?.coach_preference || user?.coachPreference || null,
        personalizedProgram: null,
        avatarUrl: profile?.avatar_url ?? user?.avatarUrl ?? null,
        badges: [
          { id: 1, name: 'Level 1 Complete', emoji: '🎯', unlocked: true },
          { id: 2, name: 'Level 2 Complete', emoji: '🚀', unlocked: true },
          { id: 3, name: 'Beginner Champion', emoji: '🏆', unlocked: true },
          { id: 4, name: 'Level 6 Complete', emoji: '⭐', unlocked: false },
        ],
      };
      setUser(syncedUser);
    } else {
      if (user?.id) {
        setUser(prevUser => ({
          ...prevUser,
          id: null,
          email: null,
          joinedDate: null,
        }));
      }
    }
  }, [isAuthenticated, authUser, profile]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getTierFromRating = (rating) => {
    if (rating >= 2.0 && rating < 3.0) return 'Beginner';
    if (rating >= 3.0 && rating < 4.0) return 'Intermediate';
    if (rating >= 4.0 && rating < 5.0) return 'Advanced';
    if (rating >= 5.0) return 'Pro';
    return 'Beginner';
  };

  const updateUserRating = (rating, ratingType) => {
    const tier = getTierFromRating(rating);
    setUser(prevUser => {
      const next = { ...prevUser, duprRating: rating, ratingType, tier };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating: true, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
    setHasSetRating(true);
  };

  const completeSportSelection = (sportId = 'pickleball') => {
    setHasSelectedSport(true);
    setUser(prevUser => {
      const next = { ...prevUser, sportId };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport: true, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  const resetSportSelection = () => {
    setHasSelectedSport(false);
    setUser(prevUser => {
      const next = { ...prevUser, sportId: 'pickleball' };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport: false, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  // ── Role selection (v2) ─────────────────────────────────────────────────────

  const completeRoleSelection = (role) => {
    setHasSelectedRole(true);
    // Fresh funnel — clear any stale finish marker so Name doesn't jump to Main
    setHasCompletedOnboarding(false);
    resetOnboardingFinishState().catch(() => {});
    setUser(prevUser => {
      const next = { ...prevUser, role };
      schedulePersist(
        {
          hasSelectedRole: true,
          hasSelectedSport,
          hasCompletedIntro,
          hasSelectedGender,
          hasSetRating,
          hasSetName,
          hasCompletedOnboarding: false,
          hasCompletedCoachBenefits,
          hasCompletedCoachProfile,
        },
        next,
      );
      return next;
    });
  };

  const resetRoleSelection = () => {
    setHasSelectedRole(false);
    setHasSelectedSport(false);
    setHasCompletedCoachBenefits(false);
    setUser(prevUser => {
      const next = { ...prevUser, role: null, sportId: 'pickleball' };
      schedulePersist(
        { hasSelectedRole: false, hasSelectedSport: false, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits: false, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  // ── Coach onboarding flags (v2) ────────────────────────────────────────────

  const completeCoachBenefits = () => {
    setHasCompletedCoachBenefits(true);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits: true, hasCompletedCoachProfile },
      user,
    );
  };

  const resetCoachBenefits = () => {
    setHasCompletedCoachBenefits(false);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits: false, hasCompletedCoachProfile },
      user,
    );
  };

  const completeCoachProfile = () => {
    setHasCompletedCoachProfile(true);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile: true },
      user,
    );
  };

  const updateOnboardingData = async (data) => {
    setUser(prevUser => {
      const next = { ...prevUser, ...data };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });

    if (isAuthenticated && authUser && updateProfile) {
      try {
        const result = await updateProfile(data);
        if (result.error) {
          console.error('UserContext: Error saving onboarding data to database:', result.error);
        }
      } catch (error) {
        console.error('UserContext: Error saving onboarding data to database:', error);
      }
    }
  };

  const updateUserName = (name) => {
    setUser(prevUser => {
      const next = { ...prevUser, name };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName: true, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
    setHasSetName(true);
  };

  const completeNameSelection = () => {
    setHasSetName(true);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName: true, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
      user,
    );
  };

  const storePersonalizedProgram = (program) => {
    setUser(prevUser => ({ ...prevUser, personalizedProgram: program }));
    console.log('Personalized program stored in user context:', program);
  };

  const completeIntro = () => {
    console.log('UserContext: completeIntro called');
    setHasCompletedIntro(true);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro: true, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
      user,
    );
  };

  const goBackToIntro = () => {
    setHasCompletedIntro(false);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro: false, hasSelectedGender, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
      user,
    );
  };

  const completeGenderSelection = () => {
    setHasSelectedGender(true);
    schedulePersist(
      { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender: true, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
      user,
    );
  };

  const resetGenderSelection = () => {
    console.log('UserContext: Resetting gender selection');
    setHasSelectedGender(false);
    setUser(prevUser => {
      const next = { ...prevUser, gender: null };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender: false, hasSetRating, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  const resetRatingSelection = () => {
    console.log('UserContext: Resetting rating selection');
    setHasSetRating(false);
    setUser(prevUser => {
      const next = { ...prevUser, duprRating: null, ratingType: null, tier: null };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating: false, hasSetName, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  const resetNameSelection = () => {
    console.log('UserContext: Resetting name selection');
    setHasSetName(false);
    setUser(prevUser => {
      const next = { ...prevUser, name: null };
      schedulePersist(
        { hasSelectedRole, hasSelectedSport, hasCompletedIntro, hasSelectedGender, hasSetRating, hasSetName: false, hasCompletedOnboarding, hasCompletedCoachBenefits, hasCompletedCoachProfile },
        next,
      );
      return next;
    });
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    markOnboardingFinishComplete().catch((e) => {
      console.warn('UserContext: Failed to persist onboarding finish state', e);
    });
    // Pre-auth onboarding scratch state is no longer needed once finish is done.
    AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY).catch(() => {});
  };

  const resetAllOnboarding = () => {
    console.log('UserContext: Resetting all onboarding state');
    setHasSelectedRole(false);
    setHasSelectedSport(false);
    setHasCompletedIntro(false);
    setHasSelectedGender(false);
    setHasSetRating(false);
    setHasSetName(false);
    setHasCompletedOnboarding(false);
    setHasCompletedCoachBenefits(false);
    setHasCompletedCoachProfile(false);
    setUser(prev => ({ ...prev, role: null }));
    AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY).catch(() => {});
    resetOnboardingFinishState().catch(() => {});
  };

  const getOnboardingData = () => {
    if (!user) return {};
    const data = {};
    if (user.name)       data.name         = user.name;
    if (user.gender)     data.gender       = user.gender;
    if (user.duprRating !== null && user.duprRating !== undefined) data.dupr_rating = user.duprRating;
    if (user.ratingType) data.rating_type  = user.ratingType;
    if (user.tier)       data.tier         = user.tier;
    if (user.goal)       data.goal         = user.goal;
    if (user.timeCommitment) data.time_commitment = user.timeCommitment;
    if (user.intensity)  data.intensity    = user.intensity;
    if (user.focus_areas && user.focus_areas.length > 0) data.focus_areas = user.focus_areas;
    if (user.coachPreference)    data.coach_preference   = user.coachPreference;
    if (user.personalizedProgram) data.personalized_program = user.personalizedProgram;
    console.log('UserContext: getOnboardingData returning:', data);
    return data;
  };

  const value = {
    user,
    isOnboardingHydrated,
    // Player flags
    hasSelectedSport,
    hasCompletedIntro,
    hasSelectedGender,
    hasSetRating,
    hasSetName,
    hasCompletedOnboarding,
    // Shared / coach flags (v2)
    hasSelectedRole,
    hasCompletedCoachBenefits,
    hasCompletedCoachProfile,
    // Handlers
    updateUserRating,
    updateUserName,
    updateOnboardingData,
    storePersonalizedProgram,
    completeSportSelection,
    resetSportSelection,
    completeIntro,
    goBackToIntro,
    completeGenderSelection,
    resetGenderSelection,
    resetRatingSelection,
    resetNameSelection,
    completeNameSelection,
    completeOnboarding,
    resetAllOnboarding,
    // Role handlers (v2)
    completeRoleSelection,
    resetRoleSelection,
    completeCoachBenefits,
    resetCoachBenefits,
    completeCoachProfile,
    setUser,
    getOnboardingData,
    getTierFromRating,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
