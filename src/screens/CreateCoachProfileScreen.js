import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
    TextInput,
  Platform,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown, ArrowLeft, Check, MapPin, Phone } from 'lucide-react-native';
import { PlatformMap, PlatformMarker } from '../components/PlatformMap';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { getSport } from '../lib/sportConfig';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';

/**
 * fromOnboarding — true when reached from the coach onboarding path (post sign-up).
 *   On save OK or back, onSaved() is called so App.js can exit the gate and land on Profile.
 * onSaved — callback invoked after save OK or back from onboarding.
 */
export default function CreateCoachProfileScreen({ navigation, fromOnboarding, onSaved }) {
  const { user: authUser, profile: userProfile } = useAuth();
  const { user: contextUser } = useUser();
  const { logbookTheme: t, isDark } = useTheme();
  // Sport-aware rating system: use contextUser.sportId if available, else fall back to pickleball
  const ratingSystem = getSport(contextUser?.sportId || 'pickleball').ratingSystem;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: authUser?.user_metadata?.full_name || userProfile?.name || '',
    email: authUser?.email || '',
    bio: '',
    duprRating: userProfile?.dupr_rating ? userProfile.dupr_rating.toFixed(3) : '',
    hourlyRate: '',
    location: '',
    latitude: null,
    longitude: null,
    phone: '',
    specialties: [],
    coachingRadius: 5, // Default to 5km
    messagingPreferences: {
      whatsapp: false,
      imessage: false,
      zalo: false
    },
    isVerified: false,
    isActive: true,
    isAcceptingStudents: false // Default to not published
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [existingCoachProfile, setExistingCoachProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [coachIsVerified, setCoachIsVerified] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryDetectionLoading, setCountryDetectionLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  // Track if DUPR was manually edited to prevent auto-repopulation
  const duprManuallyEdited = useRef(false);

  // Messaging options configuration
  const messagingOptions = {
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      iconType: 'image',
      iconSource: require('../../assets/images/whatsapp_icon.png'),
      color: '#25D366',
      description: 'Message via WhatsApp',
      countries: ['US', 'VN'] // Available in both countries
    },
    imessage: {
      id: 'imessage',
      name: 'iMessage',
      iconType: 'emoji',
      icon: '💬',
      color: '#007AFF',
      description: 'Message via iMessage (iOS)',
      countries: ['US', 'VN'] // Available in both countries
    },
    zalo: {
      id: 'zalo',
      name: 'Zalo',
      iconType: 'image',
      iconSource: require('../../assets/images/zalo_icon.jpg'),
      color: '#0068FF',
      description: 'Message via Zalo',
      countries: ['VN'] // Only available in Vietnam
    }
  };

  // Get available messaging options based on selected country
  const getAvailableMessagingOptions = (countryCode) => {
    return Object.values(messagingOptions).filter(option => 
      option.countries.includes(countryCode)
    );
  };

  // Handle messaging preference change
  const handleMessagingPreferenceChange = (optionId, value) => {
    setFormData({
      ...formData,
      messagingPreferences: {
        ...formData.messagingPreferences,
        [optionId]: value
      }
    });
  };

  // Check if at least one messaging option is selected
  const isMessagingValid = () => {
    const availableOptions = getAvailableMessagingOptions(selectedCountry || 'VN');
    return availableOptions.some(option => 
      formData.messagingPreferences[option.id]
    );
  };

  // Phone country configurations with currency info
  const phoneCountries = {
    US: {
      name: 'United States',
      code: 'US',
      dialCode: '+1',
      flag: '🇺🇸',
      placeholder: '(555) 123-4567',
      currency: {
        symbol: '$',
        code: 'USD',
        placeholder: '75',
        description: 'Typical range: $30-150/hour',
        format: (amount) => `$${amount}`,
        validate: (amount) => {
          const num = parseFloat(amount);
          return !isNaN(num) && num >= 10 && num <= 500;
        }
      },
      format: (number) => {
        // Remove all non-digits
        const digits = number.replace(/\D/g, '');
        // Apply US format: (xxx) xxx-xxxx
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      },
      validate: (number) => {
        const digits = number.replace(/\D/g, '');
        return digits.length === 10;
      }
    },
    VN: {
      name: 'Vietnam',
      code: 'VN',
      dialCode: '+84',
      flag: '🇻🇳',
      placeholder: '0123 456 789',
      currency: {
        symbol: '₫',
        code: 'VND',
        placeholder: '500000',
        description: 'Typical range: 300,000-1,500,000₫/hour',
        format: (amount) => {
          // Format Vietnamese currency with thousand separators
          const num = parseFloat(amount);
          if (isNaN(num)) return amount;
          return num.toLocaleString('vi-VN') + '₫';
        },
        validate: (amount) => {
          const num = parseFloat(amount.replace(/[,\s₫]/g, ''));
          return !isNaN(num) && num >= 100000 && num <= 5000000;
        }
      },
      format: (number) => {
        // Remove all non-digits
        const digits = number.replace(/\D/g, '');
        // Remove leading 0 if present (Vietnamese numbers often start with 0)
        const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
        // Apply Vietnamese format: xxx xxx xxx
        if (cleanDigits.length <= 3) return cleanDigits;
        if (cleanDigits.length <= 6) return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3)}`;
        return `${cleanDigits.slice(0, 3)} ${cleanDigits.slice(3, 6)} ${cleanDigits.slice(6, 9)}`;
      },
      validate: (number) => {
        const digits = number.replace(/\D/g, '');
        const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
        return cleanDigits.length === 9;
      }
    }
  };

  // Detect country intelligently based on context
  useEffect(() => {
    // Skip country detection on iOS to prevent keyboard dismissal issues
    if (Platform.OS === 'ios') {
      // On iOS, default to Vietnam and let user change manually if needed
      setDetectedCountry('VN');
      setSelectedCountry('VN');
      setCountryDetectionLoading(false);
      return;
    }
    
    // Only run country detection if we have the necessary context
    if (isEditMode !== null) { // Wait for edit mode to be determined
      if (!isEditMode || !formData.phone) {
        // New profile or no existing phone number - detect country
        detectUserCountry();
      } else {
        // Editing existing profile with phone number - infer country from phone format
        const inferredCountry = inferCountryFromPhone(formData.phone);
        console.log('Inferred country from existing phone:', inferredCountry);
        setDetectedCountry(inferredCountry);
        setSelectedCountry(inferredCountry);
        setCountryDetectionLoading(false);
      }
    }
  }, [isEditMode]);

  // Check for existing coach profile when component mounts
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (authUser?.email) {
        try {
          console.log('Checking for existing coach profile...');
          const { data: existingCoach, error } = await supabase
            .from('coaches')
            .select('*')
            .eq('email', authUser.email)
            .single();

          if (error && error.code !== 'PGRST116') {
            // PGRST116 is "not found" error which is expected for new profiles
            console.error('Error checking existing coach profile:', error);
            return;
          }

          if (existingCoach) {
            console.log('Found existing coach profile:', existingCoach);
            setExistingCoachProfile(existingCoach);
            setIsEditMode(true);
            setCoachIsVerified(existingCoach.is_verified || false);
            
            // On iOS, infer country from existing phone (if present) to set correct country
            if (Platform.OS === 'ios' && existingCoach.phone) {
              const inferredCountry = inferCountryFromPhone(existingCoach.phone);
              console.log('iOS: Inferred country from existing phone:', inferredCountry);
              setDetectedCountry(inferredCountry);
              setSelectedCountry(inferredCountry);
            }
            
            // Populate form with existing data
            setFormData({
              name: existingCoach.name || '',
              email: existingCoach.email || '',
              bio: existingCoach.bio || '',
              duprRating: existingCoach.dupr_rating ? existingCoach.dupr_rating.toFixed(3) : '',
              hourlyRate: existingCoach.hourly_rate ? 
                (existingCoach.currency === 'VND' ? existingCoach.hourly_rate.toString() : (existingCoach.hourly_rate / 100).toString()) 
                : '',
              location: existingCoach.location || '',
              latitude: existingCoach.latitude,
              longitude: existingCoach.longitude,
              phone: existingCoach.phone || '',
              specialties: existingCoach.specialties || [],
              coachingRadius: existingCoach.coaching_radius || 5,
              messagingPreferences: existingCoach.messaging_preferences || {
                whatsapp: false,
                imessage: false,
                zalo: false
              },
              isVerified: existingCoach.is_verified || false,
              isActive: existingCoach.is_active !== false, // Default to true if null/undefined
              isAcceptingStudents: existingCoach.is_accepting_students || false
            });
          } else {
            console.log('No existing coach profile found - create mode');
            setIsEditMode(false);
          }
        } catch (error) {
          console.error('Error checking existing coach profile:', error);
        }
      }
    };

    checkExistingProfile();
  }, [authUser?.email]);

  // Country detection function
  const detectUserCountry = async () => {
    setCountryDetectionLoading(true);
    try {
      // First try to get location
      const location = await getCurrentLocationForCountry();
      if (location) {
        // Use reverse geocoding to get country
        const country = await getCountryFromCoordinates(location.latitude, location.longitude);
        if (country) {
          console.log('Detected country:', country);
          setDetectedCountry(country);
          setSelectedCountry(country);
        } else {
          // Fallback to Vietnam (default)
          console.log('Could not detect country, defaulting to Vietnam');
          setDetectedCountry('VN');
          setSelectedCountry('VN');
        }
      } else {
        // If location fails, try IP-based detection as fallback
        const ipCountry = await getCountryFromIP();
        if (ipCountry) {
          console.log('Detected country from IP:', ipCountry);
          setDetectedCountry(ipCountry);
          setSelectedCountry(ipCountry);
        } else {
          // Final fallback
          console.log('All detection methods failed, defaulting to Vietnam');
          setDetectedCountry('VN');
          setSelectedCountry('VN');
        }
      }
    } catch (error) {
      console.error('Country detection error:', error);
      // Default to Vietnam
      setDetectedCountry('VN');
      setSelectedCountry('VN');
    } finally {
      setCountryDetectionLoading(false);
    }
  };

  // Get location for country detection (simpler version)
  const getCurrentLocationForCountry = async () => {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.log('Web geolocation failed:', error);
                resolve(null);
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
            );
          } else {
            resolve(null);
          }
        });
      } else {
        try {
          const Location = require('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            return null;
          }
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low, // Lower accuracy for faster response
          });
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        } catch (error) {
          console.log('Mobile location failed:', error);
          return null;
        }
      }
    } catch (error) {
      console.log('Location detection failed:', error);
      return null;
    }
  };

  // Get country from coordinates
  const getCountryFromCoordinates = async (latitude, longitude) => {
    try {
      // Use a simple geocoding service to get country
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { method: 'GET', headers: { 'User-Agent': 'PickleballHero/1.0' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.countryCode;
        
        // Map country codes to our supported countries
        if (countryCode === 'US') return 'US';
        if (countryCode === 'VN') return 'VN';
        
        // Default to VN for Asian countries, US for others
        const asianCountries = ['VN', 'TH', 'SG', 'MY', 'PH', 'ID', 'KH', 'LA', 'MM', 'BN'];
        if (asianCountries.includes(countryCode)) {
          return 'VN';
        } else {
          return 'US';
        }
      }
    } catch (error) {
      console.log('Geocoding country detection failed:', error);
    }
    return null;
  };

  // IP-based country detection as fallback
  const getCountryFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/country_code/', {
        method: 'GET',
        headers: { 'User-Agent': 'PickleballHero/1.0' }
      });
      
      if (response.ok) {
        const countryCode = await response.text();
        
        // Map to our supported countries
        if (countryCode === 'US') return 'US';
        if (countryCode === 'VN') return 'VN';
        
        // Default logic based on region
        const asianCountries = ['VN', 'TH', 'SG', 'MY', 'PH', 'ID', 'KH', 'LA', 'MM', 'BN'];
        if (asianCountries.includes(countryCode)) {
          return 'VN';
        } else {
          return 'US';
        }
      }
    } catch (error) {
      console.log('IP country detection failed:', error);
    }
    return null;
  };

  // Format phone number based on selected country
  const formatPhoneNumber = (number, countryCode) => {
    if (!countryCode || !phoneCountries[countryCode]) return number;
    return phoneCountries[countryCode].format(number);
  };

  // Validate phone number
  const validatePhoneNumber = (number, countryCode) => {
    if (!countryCode || !phoneCountries[countryCode]) return false;
    return phoneCountries[countryCode].validate(number);
  };

  // Infer country from existing phone number format
  const inferCountryFromPhone = (phoneNumber) => {
    if (!phoneNumber) return 'VN'; // Default fallback
    
    // Remove all formatting to get just digits
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
    
    // US format patterns
    if (
      (digitsOnly.length === 10) || // (555) 123-4567 -> 10 digits
      (digitsOnly.length === 11 && digitsOnly.startsWith('1')) || // +1 555 123 4567
      phoneNumber.includes('(') && phoneNumber.includes(')') && phoneNumber.includes('-') // US format pattern
    ) {
      return 'US';
    }
    
    // Vietnam format patterns
    if (
      (digitsOnly.length === 9) || // 123 456 789 -> 9 digits
      (digitsOnly.length === 10 && digitsOnly.startsWith('0')) || // 0123 456 789
      (digitsOnly.length === 11 && digitsOnly.startsWith('84')) || // +84 123 456 789
      phoneNumber.includes(' ') && !phoneNumber.includes('(') // Vietnamese spacing pattern
    ) {
      return 'VN';
    }
    
    // Default to Vietnam if unclear
    return 'VN';
  };

  // Handle currency conversion when country changes
  const convertCurrency = (amount, fromCountry, toCountry) => {
    if (!amount || fromCountry === toCountry) return amount;
    
    // Simple currency conversion (you might want to use real exchange rates)
    const exchangeRates = {
      'US_to_VN': 24000, // 1 USD ≈ 24,000 VND (approximate)
      'VN_to_US': 1/24000  // 1 VND ≈ 0.0000417 USD
    };
    
    const numAmount = parseFloat(amount.replace(/[,\s₫$]/g, ''));
    if (isNaN(numAmount)) return '';
    
    if (fromCountry === 'US' && toCountry === 'VN') {
      return Math.round(numAmount * exchangeRates.US_to_VN).toString();
    } else if (fromCountry === 'VN' && toCountry === 'US') {
      return Math.round(numAmount * exchangeRates.VN_to_US).toString();
    }
    
    return amount;
  };

  // Handle country change
  const handleCountryChange = (newCountry) => {
    const oldCountry = selectedCountry;
    setSelectedCountry(newCountry);
    
    // Convert existing hourly rate if there is one
    if (formData.hourlyRate && oldCountry && oldCountry !== newCountry) {
      const convertedRate = convertCurrency(formData.hourlyRate, oldCountry, newCountry);
      setFormData({
        ...formData,
        phone: '', // Clear phone when changing countries
        hourlyRate: convertedRate
      });
      
      // Show conversion notification
      if (convertedRate !== formData.hourlyRate) {
        const oldCurrency = phoneCountries[oldCountry]?.currency.symbol || '';
        const newCurrency = phoneCountries[newCountry]?.currency.symbol || '';
        Alert.alert(
          'Currency Converted',
          `Your hourly rate has been converted from ${oldCurrency}${formData.hourlyRate} to ${newCurrency}${convertedRate}`,
          [{ text: 'OK' }]
        );
      }
    } else {
      setFormData({...formData, phone: ''});
    }
  };

  // Handle phone number change
  const handlePhoneChange = useCallback((text) => {
    if (!selectedCountry) {
      setFormData(prev => ({...prev, phone: text}));
      return;
    }
    
    // On iOS, skip formatting to prevent keyboard issues
    // On Android, apply formatting for better UX
    const phoneValue = Platform.OS === 'ios' ? text : formatPhoneNumber(text, selectedCountry);
    setFormData(prev => ({...prev, phone: phoneValue}));
  }, [selectedCountry]);

  // Update form data when user profile loads (only for new profiles).
  // Supports both DUPR (pickleball) and skill_rating (padel / Playtomic).
  useEffect(() => {
    const profileRating = userProfile?.dupr_rating ?? userProfile?.skill_rating;
    if (!isEditMode && userProfile && profileRating && !formData.duprRating && !duprManuallyEdited.current) {
      console.log(`Auto-populating ${ratingSystem.label} rating from user profile:`, profileRating);
      setFormData(prevData => ({
        ...prevData,
        name: prevData.name || userProfile.name || '',
        duprRating: parseFloat(profileRating).toFixed(3),
      }));
    }
  }, [userProfile, formData.duprRating, isEditMode]);

  const finishOnboardingAndGoToProfile = useCallback((source) => {
    console.log('[CreateCoachProfile] finishOnboardingAndGoToProfile', {
      source,
      fromOnboarding,
      hasOnSaved: typeof onSaved === 'function',
    });
    if (fromOnboarding && typeof onSaved === 'function') {
      onSaved(source);
    } else {
      console.log('[CreateCoachProfile] finishOnboardingAndGoToProfile → navigation.goBack()');
      navigation.goBack();
    }
  }, [fromOnboarding, onSaved, navigation]);

  const handleBack = useCallback(() => {
    console.log('[CreateCoachProfile] Back tapped', { fromOnboarding, isEditMode });
    finishOnboardingAndGoToProfile('back');
  }, [fromOnboarding, isEditMode, finishOnboardingAndGoToProfile]);

  const handleSaveCoach = async () => {
    console.log('[CreateCoachProfile] Save tapped', { fromOnboarding, isEditMode, loading });
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate messaging preferences if phone number is provided
    if (formData.phone && !isMessagingValid()) {
      Alert.alert(
        'Messaging Options Required', 
        'Please select at least one messaging option for students to contact you.'
      );
      return;
    }

    setLoading(true);
    try {
      const coachData = {
        user_id: authUser.id, // Link coach profile to user account
        name: formData.name,
        email: formData.email,
        bio: formData.bio || '',
        dupr_rating: formData.duprRating ? parseFloat(parseFloat(formData.duprRating).toFixed(3)) : null,
        hourly_rate: formData.hourlyRate ? parseInt(formData.hourlyRate.replace(/[,\s₫$]/g, '')) * (selectedCountry === 'VN' ? 1 : 100) : null, // Store VND as-is, USD in cents
        currency: selectedCountry === 'VN' ? 'VND' : 'USD',
        location: formData.location || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone || '',
        specialties: formData.specialties || [],
        coaching_radius: formData.coachingRadius, // Coaching radius in kilometers
        messaging_preferences: formData.messagingPreferences,
        is_verified: false,            // Manual review gates verification (not dashboard access)
        is_active: Boolean(formData.isActive), // Defaults to true → immediate dashboard access
        is_accepting_students: formData.isAcceptingStudents, // User opts in to directory listing
        rating_avg: 0,
        rating_count: 0
      };

      // Debug: Log the values being saved
      console.log('Saving coach data:', {
        isEditMode,
        isActive: formData.isActive,
        is_active: Boolean(formData.isActive),
        isAcceptingStudents: formData.isAcceptingStudents,
        is_accepting_students: formData.isAcceptingStudents
      });

      let data, error;

      if (isEditMode && existingCoachProfile) {
        // Update existing profile
        console.log('Updating existing coach profile with ID:', existingCoachProfile.id);
        const result = await supabase
          .from('coaches')
          .update(coachData)
          .eq('id', existingCoachProfile.id)
          .select();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new profile
        console.log('Creating new coach profile');
        const result = await supabase
          .from('coaches')
          .insert([coachData])
          .select();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      console.log('[CreateCoachProfile] Save succeeded', {
        fromOnboarding,
        isEditMode,
        coachId: data?.[0]?.id,
      });

      const successMessage = isEditMode 
        ? (formData.isAcceptingStudents 
            ? 'Your coach profile has been updated successfully! Changes will be reviewed by our team.'
            : 'Your coach profile has been updated successfully!')
        : (formData.isAcceptingStudents 
            ? 'Your coach profile has been created successfully! It will be reviewed by our team before being published in the coach directory.'
            : 'Your coach profile has been created successfully! You can publish it in the coach directory anytime by updating your profile.');

      Alert.alert('Success', successMessage, [{
        text: 'OK',
        onPress: () => {
          console.log('[CreateCoachProfile] Success OK tapped', { fromOnboarding, isEditMode });
          finishOnboardingAndGoToProfile('save');
        },
      }]);
      
    } catch (error) {
      console.error('Error saving coach profile:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} coach profile: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('Starting reverse geocoding for:', latitude, longitude);
      
      // Try multiple geocoding services for better reliability
      const geocodingServices = [
        // Service 1: OpenStreetMap Nominatim
        {
          name: 'Nominatim',
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
          parser: (data) => {
            if (data && data.address) {
              const address = data.address;
              const locationComponents = [];
              
              if (address.city) {
                locationComponents.push(address.city);
              } else if (address.town) {
                locationComponents.push(address.town);
              } else if (address.village) {
                locationComponents.push(address.village);
              } else if (address.county) {
                locationComponents.push(address.county);
              }
              
              if (address.state) {
                locationComponents.push(address.state);
              } else if (address.province) {
                locationComponents.push(address.province);
              }
              
              if (address.country) {
                locationComponents.push(address.country);
              }
              
              return locationComponents.join(', ');
            }
            return null;
          }
        },
        // Service 2: BigDataCloud (free tier, good for mobile)
        {
          name: 'BigDataCloud',
          url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          parser: (data) => {
            if (data) {
              const locationComponents = [];
              
              if (data.city) {
                locationComponents.push(data.city);
              } else if (data.locality) {
                locationComponents.push(data.locality);
              }
              
              if (data.principalSubdivision) {
                locationComponents.push(data.principalSubdivision);
              }
              
              if (data.countryName) {
                locationComponents.push(data.countryName);
              }
              
              return locationComponents.join(', ');
            }
            return null;
          }
        },
        // Service 3: Alternative Nominatim endpoint
        {
          name: 'Nominatim-Alt',
          url: `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          parser: (data) => {
            if (data && data.address) {
              const address = data.address;
              const locationComponents = [];
              
              if (address.city || address.town || address.village) {
                locationComponents.push(address.city || address.town || address.village);
              }
              
              if (address.state) {
                locationComponents.push(address.state);
              }
              
              if (address.country) {
                locationComponents.push(address.country);
              }
              
              return locationComponents.join(', ');
            }
            return null;
          }
        }
      ];
      
      // Try each service until one succeeds
      for (const service of geocodingServices) {
        try {
          console.log(`Trying ${service.name} geocoding service...`);
          
          const response = await fetch(service.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'PickleballHero/1.0'
            }
          });
          
          if (!response.ok) {
            console.log(`${service.name} service returned ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`${service.name} response:`, data);
          
          const locationString = service.parser(data);
          if (locationString) {
            console.log(`Successfully geocoded with ${service.name}:`, locationString);
            return locationString;
          }
        } catch (serviceError) {
          console.log(`${service.name} service failed:`, serviceError.message);
          continue;
        }
      }
      
      console.log('All geocoding services failed');
      return null;
      
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      if (Platform.OS === 'web') {
        // Web platform - use browser geolocation API
        return new Promise((resolve) => {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('Got current location (web):', position.coords.latitude, position.coords.longitude);
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.error('Web geolocation error:', error);
                Alert.alert(
                  'Location Error',
                  'Unable to get your current location. You can manually select a location on the map.',
                  [{ text: 'OK' }]
                );
                resolve(null);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
          } else {
            console.log('Geolocation not supported on web');
            Alert.alert(
              'Location Not Supported',
              'Location services are not available. You can manually select a location.',
              [{ text: 'OK' }]
            );
            resolve(null);
          }
        });
      } else {
        // Mobile platforms (iOS/Android) - use Expo Location
        try {
          // Dynamically import expo-location only on mobile
          const Location = require('expo-location');
          
          // Request permissions
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Location Permission Required',
              'Please enable location permissions to use this feature. You can still manually select a location.',
              [{ text: 'OK' }]
            );
            return null;
          }

          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          console.log('Got current location (mobile):', location.coords.latitude, location.coords.longitude);
          
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        } catch (error) {
          console.error('Mobile location error:', error);
          Alert.alert(
            'Location Error',
            'Unable to get your current location. You can manually select a location.',
            [{ text: 'OK' }]
          );
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. You can manually select a location.',
        [{ text: 'OK' }]
      );
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    console.log('Getting user location...');
    setLocationLoading(true);
    
    try {
      // Get current location
      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location permissions and try again, or enter your location manually.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('Got current location:', currentLocation);
      
      // Perform reverse geocoding to get address
      const locationString = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
      
      // Update form data directly
      setFormData({
        ...formData,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location: locationString || formData.location, // Keep existing if geocoding fails
      });
      
      if (locationString) {
        Alert.alert(
          'Location Set Successfully',
          `Your coaching location has been set to: "${locationString}"`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Coordinates Set',
          'Your coordinates have been saved! The automatic location detection didn\'t find a city name, but you can manually enter it in the location field above.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your location. Please try again or enter your location manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
    >
      <View style={styles.countryPickerOverlay}>
        <View style={styles.countryPickerContainer}>
          <View style={styles.countryPickerHeader}>
            <TouchableOpacity
              style={styles.countryPickerCancelButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.countryPickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.countryPickerTitle}>Select Country</Text>
            <View style={styles.countryPickerSpacer} />
          </View>
          
          <View style={styles.countryPickerContent}>
            {Object.entries(phoneCountries).map(([code, country]) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.countryOption,
                  selectedCountry === code && styles.countryOptionSelected
                ]}
                onPress={() => {
                  handleCountryChange(code);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryOptionFlag}>{country.flag}</Text>
                <View style={styles.countryOptionTextContainer}>
                  <Text style={styles.countryOptionName}>{country.name}</Text>
                  <Text style={styles.countryOptionDialCode}>{country.dialCode}</Text>
                </View>
                {selectedCountry === code && (
                  <Check size={20} color={t.accentPurple} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title={isEditMode ? 'Edit Coach Profile' : 'Create Coach Profile'}
        onBack={handleBack}
        rightAction={
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: t.accentPurple }]}
            onPress={handleSaveCoach}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? t.fabTextColor : '#fff'} />
            ) : (
              <Text style={[styles.saveButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>
                {isEditMode ? 'Update' : 'Save'}
              </Text>
            )}
          </TouchableOpacity>
        }
      />
      {renderCountryPicker()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isEditMode && !coachIsVerified && (
            <View style={styles.reviewPendingBanner}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#D97706" style={{ marginRight: 12, flexShrink: 0, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewPendingTitle, { fontFamily: t.fontBodyBold }]}>Profile under review</Text>
                <Text style={[styles.reviewPendingText, { fontFamily: t.fontBody }]}>
                  We verify every coach as part of our quality process. Your profile will be visible in the directory once approved — this typically takes up to 48 hours. Feel free to update your details in the meantime.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.introSection}>
            <Text style={[styles.introTitle, { color: t.textPrimary, fontFamily: t.fontDisplay }]}>Earn More with AcademyPro</Text>
            <Text style={[styles.introDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
              Share your pickleball expertise and help others improve their game. Fill out your profile to get started.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Basic Information</Text>
            
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Full Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB', color: t.textPrimary }]}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholderTextColor={t.textMuted}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Email Address *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: isDark ? t.surfaceRaised : '#F9FAFB', borderColor: isDark ? t.border : '#D1D5DB', color: t.textMuted }]}
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={t.textMuted}
                editable={false}
              />
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Phone Number</Text>
              {countryDetectionLoading ? (
                <View style={styles.countryDetectionLoading}>
                  <ActivityIndicator size="small" color={t.accentPurple} />
                  <Text style={[styles.countryDetectionText, { color: t.textMuted, fontFamily: t.fontBody }]}>Detecting your country...</Text>
                </View>
              ) : (
                <View style={[styles.phoneInputContainer, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB' }]}>
                  <TouchableOpacity
                    style={[styles.countrySelector, { borderRightColor: isDark ? t.border : '#E5E7EB' }]}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    {selectedCountry && phoneCountries[selectedCountry] ? (
                      <>
                        <Text style={styles.countryFlag}>{phoneCountries[selectedCountry].flag}</Text>
                        <Text style={[styles.dialCode, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{phoneCountries[selectedCountry].dialCode}</Text>
                        <ChevronDown size={14} color={t.textMuted} strokeWidth={2} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.countryFlag}>🌍</Text>
                        <Text style={[styles.dialCode, { color: t.textMuted }]}>+?</Text>
                        <ChevronDown size={14} color={t.textMuted} strokeWidth={2} />
                      </>
                    )}
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.phoneInput, { color: t.textPrimary }]}
                    placeholder={selectedCountry && phoneCountries[selectedCountry] ? phoneCountries[selectedCountry].placeholder : "Enter phone number"}
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    placeholderTextColor={t.textMuted}
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    returnKeyType="done"
                    blurOnSubmit={false}
                    enablesReturnKeyAutomatically={false}
                  />
                </View>
              )}
              {selectedCountry && formData.phone && (
                <View style={styles.phoneValidation}>
                  {validatePhoneNumber(formData.phone, selectedCountry) ? (
                    <Text style={styles.phoneValidationSuccess}>✅ Valid phone number</Text>
                  ) : (
                    <Text style={styles.phoneValidationError}>❌ Invalid phone number format</Text>
                  )}
                </View>
              )}
              {detectedCountry && (
                <Text style={styles.countryDetectionResult}>
                  {isEditMode && formData.phone 
                    ? `📱 Inferred from phone: ${phoneCountries[detectedCountry]?.name || detectedCountry}`
                    : `📍 Auto-detected: ${phoneCountries[detectedCountry]?.name || detectedCountry}`
                  }
                </Text>
              )}
            </View>

            {/* Messaging Preferences Section */}
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Preferred Messaging Apps *</Text>
              <Text style={[styles.formDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                Select how students can reach you. Choose at least one option.
              </Text>
              
              <View style={styles.messagingOptionsContainer}>
                {getAvailableMessagingOptions(selectedCountry || 'VN').map(option => {
                  const isSelected = formData.messagingPreferences[option.id];
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.messagingOption,
                        { backgroundColor: t.surface, borderColor: isDark ? t.border : '#E5E7EB' },
                        isSelected && { backgroundColor: '#F0FDF4', borderColor: '#16A34A', borderWidth: 2 },
                      ]}
                      onPress={() => handleMessagingPreferenceChange(option.id, !isSelected)}
                    >
                      <View style={styles.messagingOptionContent}>
                        <View style={styles.messagingOptionHeader}>
                          {option.iconType === 'image' ? (
                            <Image source={option.iconSource} style={[styles.messagingOptionIconImage, option.id === 'whatsapp' && styles.whatsappIconRounded]} />
                          ) : (
                            <Text style={styles.messagingOptionIcon}>{option.icon}</Text>
                          )}
                          <Text style={[styles.messagingOptionName, { color: isSelected ? '#16A34A' : t.textPrimary, fontFamily: t.fontBodySemibold }]}>
                            {option.name}
                          </Text>
                          <View style={[styles.messagingCheckbox, isSelected && { backgroundColor: '#16A34A', borderColor: '#16A34A' }]}>
                            {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                          </View>
                        </View>
                        <Text style={[styles.messagingOptionDescription, { color: isSelected ? '#15803D' : t.textMuted, fontFamily: t.fontBody }]}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {!isMessagingValid() && formData.phone && (
                <View style={styles.messagingValidation}>
                  <Text style={styles.messagingValidationError}>
                    ⚠️ Please select at least one messaging option
                  </Text>
                </View>
              )}
              
              {selectedCountry === 'US' && (
                <View style={styles.messagingNote}>
                  <Text style={styles.messagingNoteText}>
                    💡 Zalo is primarily used in Vietnam and is not available for US coaches
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textArea, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB', color: t.textPrimary }]}
                placeholder="Tell us about your background, experience, and coaching philosophy..."
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                multiline
                numberOfLines={4}
                placeholderTextColor={t.textMuted}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Professional Details</Text>
            
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>
                {ratingSystem.label} Rating
              </Text>
              <Text style={[styles.formDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                {userProfile?.dupr_rating || userProfile?.skill_rating
                  ? 'Auto-populated from your profile. You can edit if needed (x.xxx format)'
                  : `Enter your ${ratingSystem.label} rating (${ratingSystem.placeholder})`
                }
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB', color: t.textPrimary }]}
                placeholder={ratingSystem.placeholder}
                value={formData.duprRating}
                onChangeText={(text) => {
                  duprManuallyEdited.current = true;
                  const cleanedText = text.replace(/[^0-9.]/g, '');
                  if (cleanedText === '') {
                    setFormData({...formData, duprRating: ''});
                    return;
                  }
                  const parts = cleanedText.split('.');
                  if (parts.length > 2) return;
                  if (parts[0] && parts[0].length > 1) {
                    parts[0] = parts[0].slice(0, 1);
                  }
                  if (parts[1] && parts[1].length > 3) {
                    parts[1] = parts[1].slice(0, 3);
                  }
                  const formattedText = parts.join('.');
                  const numValue = parseFloat(formattedText);
                  if (!isNaN(numValue) && numValue > ratingSystem.max) return;
                  setFormData({...formData, duprRating: formattedText});
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={t.textMuted}
                maxLength={5}
              />
              {formData.duprRating && (
                <Text style={[styles.duprValidationText, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {(() => {
                    const rating = parseFloat(formData.duprRating);
                    if (isNaN(rating)) return '❌ Invalid format';
                    if (rating < ratingSystem.min || rating > ratingSystem.max) {
                      return `❌ ${ratingSystem.inputHint}`;
                    }
                    return `✅ Valid ${ratingSystem.label} rating: ${rating.toFixed(3)}`;
                  })()}
                </Text>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>
                Hourly Rate ({selectedCountry && phoneCountries[selectedCountry] ? phoneCountries[selectedCountry].currency.symbol : '$'})
              </Text>
              {selectedCountry && phoneCountries[selectedCountry] && (
                <Text style={[styles.formDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  {phoneCountries[selectedCountry].currency.description}
                </Text>
              )}
              <TextInput
                style={[styles.formInput, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB', color: t.textPrimary }]}
                placeholder={selectedCountry && phoneCountries[selectedCountry] ? phoneCountries[selectedCountry].currency.placeholder : '75'}
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData({...formData, hourlyRate: text})}
                keyboardType="numeric"
                placeholderTextColor={t.textMuted}
              />
              {selectedCountry && formData.hourlyRate && phoneCountries[selectedCountry] && (
                <View style={styles.currencyValidation}>
                  {phoneCountries[selectedCountry].currency.validate(formData.hourlyRate) ? (
                    <Text style={styles.currencyValidationSuccess}>
                      ✅ Valid rate: {phoneCountries[selectedCountry].currency.format(formData.hourlyRate)}/hour
                    </Text>
                  ) : (
                    <Text style={styles.currencyValidationError}>
                      ❌ Rate should be within typical range for {phoneCountries[selectedCountry].name}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Location</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB', color: t.textPrimary }]}
                placeholder="City, State"
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={[styles.mapPickerButton, { backgroundColor: `${t.accentPurple}15`, borderColor: t.accentPurple }]}
                onPress={handleUseMyLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={t.accentPurple} />
                ) : (
                  <MapPin size={18} color={t.accentPurple} strokeWidth={2} />
                )}
                <Text style={[styles.mapPickerButtonText, { color: t.accentPurple, fontFamily: t.fontBodySemibold }]}>
                  {locationLoading 
                    ? 'Getting Location...' 
                    : formData.latitude && formData.longitude 
                      ? 'Update My Location'
                      : 'Use My Location'
                  }
                </Text>
              </TouchableOpacity>
              {formData.latitude && formData.longitude && (
                <View style={styles.locationSummary}>
                  <Text style={styles.coordinatesText}>
                    📍 {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </Text>
                  <Text style={styles.radiusSummaryText}>
                    🎯 Coaching radius: {formData.coachingRadius < 1 
                      ? `${Math.round(formData.coachingRadius * 1000)}m` 
                      : `${formData.coachingRadius}km`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Coaching Radius</Text>
              <Text style={[styles.formDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>How far are you willing to travel for coaching sessions?</Text>
              <View style={styles.radiusSelector}>
                <View style={styles.radiusSliderContainer}>
                  <Text style={[styles.radiusValue, { color: t.accentPurple, fontFamily: t.fontDisplay }]}>
                    {formData.coachingRadius < 1 
                      ? `${Math.round(formData.coachingRadius * 1000)}m` 
                      : `${formData.coachingRadius}km`}
                  </Text>
                  <View style={styles.radiusSlider}>
                    <View style={styles.radiusOptions}>
                      {[0.5, 1, 2, 5, 10, 15, 20, 30].map(radius => {
                        const isSelected = formData.coachingRadius === radius;
                        return (
                          <TouchableOpacity
                            key={radius}
                            style={[
                              styles.radiusOption,
                              { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB' },
                              isSelected && { backgroundColor: t.accentPurple, borderColor: t.accentPurple },
                            ]}
                            onPress={() => setFormData({...formData, coachingRadius: radius})}
                          >
                            <Text style={[styles.radiusOptionText, { color: isSelected ? (isDark ? t.fabTextColor : '#fff') : t.textMuted, fontFamily: t.fontBodySemibold }]}>
                              {radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>Specialties</Text>
              <Text style={[styles.formDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>Select your areas of expertise</Text>
              <View style={styles.specialtyPicker}>
                {['Technique', 'Mental Game', 'Beginners', 'Advanced', 'Competition', 'Youth', 'Fitness', 'Strategy'].map(specialty => {
                  const isSelected = formData.specialties.includes(specialty);
                  return (
                    <TouchableOpacity
                      key={specialty}
                      style={[
                        styles.specialtyOption,
                        { backgroundColor: t.surface, borderColor: isDark ? t.border : '#D1D5DB' },
                        isSelected && { backgroundColor: t.accentPurple, borderColor: t.accentPurple },
                      ]}
                      onPress={() => {
                        const newSpecialties = isSelected
                          ? formData.specialties.filter(s => s !== specialty)
                          : [...formData.specialties, specialty];
                        setFormData({...formData, specialties: newSpecialties});
                      }}
                    >
                      <Text style={[styles.specialtyOptionText, { color: isSelected ? (isDark ? t.fabTextColor : '#fff') : t.textMuted, fontFamily: t.fontBodySemibold }]}>{specialty}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Availability & Visibility</Text>
            
            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, { borderColor: isDark ? t.border : '#D1D5DB' }, formData.isActive && { backgroundColor: t.accentPurple, borderColor: t.accentPurple }]}
                  onPress={() => setFormData({...formData, isActive: !formData.isActive})}
                >
                  {formData.isActive && <Check size={14} color={isDark ? t.fabTextColor : '#fff'} strokeWidth={3} />}
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={[styles.checkboxLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Activate my coach account</Text>
                  <Text style={[styles.checkboxDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    Enables access to the coach dashboard. Uncheck only if you want to deactivate your account.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, { borderColor: isDark ? t.border : '#D1D5DB' }, formData.isAcceptingStudents && { backgroundColor: t.accentPurple, borderColor: t.accentPurple }]}
                  onPress={() => setFormData({...formData, isAcceptingStudents: !formData.isAcceptingStudents})}
                >
                  {formData.isAcceptingStudents && <Check size={14} color={isDark ? t.fabTextColor : '#fff'} strokeWidth={3} />}
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={[styles.checkboxLabel, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Publish my profile in the coach directory</Text>
                  <Text style={[styles.checkboxDescription, { color: t.textMuted, fontFamily: t.fontBody }]}>
                    When checked, your profile will be visible to students looking for coaches. You can change this anytime.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.disclaimerSection}>
            <View style={[styles.disclaimerCard, { backgroundColor: `${t.accentPurple}10`, borderColor: `${t.accentPurple}30` }]}>
              <Phone size={18} color={t.accentPurple} strokeWidth={2} />
              <View style={styles.disclaimerContent}>
                <Text style={[styles.disclaimerTitle, { color: t.accentPurple, fontFamily: t.fontBodyBold }]}>Profile Review & Publishing</Text>
                <Text style={[styles.disclaimerText, { color: t.textSecondary, fontFamily: t.fontBody }]}>
                  Your coach profile will be reviewed by our team before it can be published. This typically takes 1-2 business days. You can choose to publish your profile in the coach directory once it's approved, or keep it private until you're ready.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  reviewPendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  reviewPendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  reviewPendingText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 19,
  },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    marginBottom: 32,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  duprValidationText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  specialtyPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  specialtyOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  specialtyOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  specialtyOptionTextSelected: {
    color: '#FFFFFF',
  },
  radiusSelector: {
    marginTop: 8,
  },
  radiusSliderContainer: {
    alignItems: 'center',
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 16,
    textAlign: 'center',
  },
  radiusSlider: {
    width: '100%',
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  radiusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 50,
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  radiusOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  disclaimerSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  disclaimerContent: {
    flex: 1,
    marginLeft: 12,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  mapPickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  locationSummary: {
    marginTop: 8,
    alignItems: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  radiusSummaryText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  mapPickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mapPickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  mapPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  mapPickerConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mapPickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  map: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webMapContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  openInGoogleMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  openInGoogleMapsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  mobileMapContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  mobileMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobileMapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  mobileMapContent: {
    padding: 16,
  },
  coordinateDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  coordinateDisplayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  coordinateDisplayValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
    fontFamily: 'monospace',
  },
  openMapsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  openMapsAppText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  coordinateInputsSection: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  coordinateInputsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapPickerFooter: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  useMyLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  useMyLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  mapPickerInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'monospace',
  },
  webMapPlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  webCoordinateInputs: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  coordinateInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  coordinateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    width: '100%',
    textAlign: 'center',
  },
  coordinateHelper: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  coordinateHelperText: {
    fontSize: 13,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  locationPreview: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  locationPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 6,
  },
  locationPreviewText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
    marginLeft: 22,
  },
  // Phone number and country picker styles
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 85,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 4,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    }),
  },
  phoneValidation: {
    marginTop: 4,
  },
  phoneValidationSuccess: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  phoneValidationError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  countryDetectionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  countryDetectionText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 8,
  },
  countryDetectionResult: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Country picker modal styles
  countryPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  countryPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  countryPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  countryPickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  countryPickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  countryPickerSpacer: {
    width: 60, // Same width as cancel button for balance
  },
  countryPickerContent: {
    paddingVertical: 8,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  countryOptionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryOptionTextContainer: {
    flex: 1,
  },
  countryOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  countryOptionDialCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  // Messaging preferences styles
  messagingOptionsContainer: {
    marginTop: 8,
  },
  messagingOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  messagingOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
    borderWidth: 2,
  },
  messagingOptionContent: {
    flex: 1,
  },
  messagingOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messagingOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  messagingOptionIconImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  whatsappIconRounded: {
    borderRadius: 6,
  },
  messagingOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  messagingOptionNameSelected: {
    color: '#059669',
  },
  messagingCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  messagingCheckboxSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  messagingOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 32, // Align with the text above
  },
  messagingOptionDescriptionSelected: {
    color: '#065F46',
  },
  messagingValidation: {
    marginTop: 8,
  },
  messagingValidationError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  messagingNote: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  messagingNoteText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  // Currency validation styles
  currencyValidation: {
    marginTop: 4,
  },
  currencyValidationSuccess: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  currencyValidationError: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
});