import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
  Search,
  X,
  BadgeCheck,
  Star,
  MapPin,
  Lock,
  SlidersHorizontal,
  MessageCircle,
  ChevronRight,
  Users,
  Check,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreload } from '../context/PreloadContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCoaches, transformCoachData, supabase } from '../lib/supabase';
import { CoachSkeletonCard } from '../components/SkeletonCard';
import SeededAvatar from '../components/SeededAvatar';
import { ScreenHeaderShell } from '../components/logbook/ScreenHeader';

const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

function deviceUsesMetricDistance() {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const region = locale.split('-')[1]?.toUpperCase();
    if (region) return !IMPERIAL_REGIONS.has(region);
    return !locale.toLowerCase().includes('us');
  } catch {
    return false;
  }
}

function formatCoachLocationShort(location) {
  if (!location) return '';
  const cleaned = location.replace(/\s*\([^)]*\)$/, '').trim();
  const parts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) return cleaned;
  const country = parts[parts.length - 1];
  if (country === 'United States' || country === 'USA') {
    return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : parts[0];
  }
  return `${parts[0]}, ${country}`;
}

function formatDistanceAway(distanceMiles, useKm) {
  if (distanceMiles == null || Number.isNaN(distanceMiles)) return '';
  if (distanceMiles > 500) return 'Far away';
  const value = useKm ? distanceMiles * 1.60934 : distanceMiles;
  const unit = useKm ? 'km' : 'mi';
  if (value < 10) return `${value.toFixed(1)} ${unit} away`;
  return `${Math.round(value).toLocaleString()} ${unit} away`;
}

export default function CoachScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('Rating');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { getDataWithFallback, hasPreloadedData, refreshData } = usePreload();
  const { user } = useAuth();
  const { logbookTheme: t, isDark } = useTheme();
  
  // API state
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Messaging state
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  
  // Avatar modal state
  const [selectedAvatarCoach, setSelectedAvatarCoach] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Coach profile sheet
  const [profileCoach, setProfileCoach] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // P-3: Academy detail sheet
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [showAcademyModal, setShowAcademyModal] = useState(false);
  const [academyDetailData, setAcademyDetailData] = useState(null);
  const [academyDetailLoading, setAcademyDetailLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const specialtyFilters = ['Verified', 'Beginners', 'Technique', 'Strategy', 'Mental Game', 'Tournament Prep', 'Fitness'];
  const sortOptions = ['Rating', 'Price', 'Location'];
  const px = t.headerPaddingH;
  const useMetricDistance = useMemo(() => deviceUsesMetricDistance(), []);
  const headerFadeColor = t.bg;
  const activeFilterCount = selectedFilters.length + (sortBy !== 'Rating' ? 1 : 0);

  // Request location permission and get user location on component mount
  useEffect(() => {
    requestLocationPermission();
    
    // Check if we have preloaded data first
    const preloadedCoaches = getDataWithFallback('coaches');
    if (preloadedCoaches && preloadedCoaches.length > 0) {
      console.log('🚀 CoachScreen: Using preloaded coaches data - INSTANT LOAD!');
      setCoaches(preloadedCoaches);
      setLoading(false);
      setError(null);
    } else if (hasPreloadedData('coaches')) {
      // We have preloaded data but it's empty
      console.log('📭 CoachScreen: Preloaded coaches data is empty - INSTANT LOAD!');
      setCoaches([]);
      setLoading(false);
      setError(null);
    } else {
      // No preloaded data, fetch normally
      console.log('⏳ CoachScreen: No preloaded data, fetching coaches...');
      fetchCoaches();
    }
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to sort coaches by distance.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      // Request permission with descriptive message
      const { status } = await Location.requestForegroundPermissionsAsync({
        requestMessage: "Your location is used to locate the nearest available coach"
      });
      
      if (status === 'granted') {
        setLocationPermissionGranted(true);
        await getUserLocation();
      } else {
        setLocationPermissionGranted(false);
        Alert.alert(
          'Location Permission Required',
          'To sort coaches by distance, please allow location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission.');
    } finally {
      setLocationLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      console.log('User location obtained:', location.coords);
      
      // Get and save city only if not already set
      if (user?.id) {
        try {
          // Check if user already has a city set
          const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('city')
            .eq('id', user.id)
            .single();
          
          if (fetchError) {
            console.error('Error fetching user city:', fetchError);
          }
          
          // Only get city if it's not already set
          if (!userData?.city) {
            const [reverseGeocode] = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            const city = reverseGeocode?.city || reverseGeocode?.subregion || reverseGeocode?.region || 'Unknown';
            console.log('User city obtained (first time):', city);
            
            // Update user's location and city in database
            await supabase
              .from('users')
              .update({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                city: city,
              })
              .eq('id', user.id);
            
            console.log('User location and city saved to database');
          } else {
            console.log('City already set, only updating coordinates');
            // City already exists, just update coordinates
            await supabase
              .from('users')
              .update({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              })
              .eq('id', user.id);
          }
        } catch (geocodeError) {
          console.error('Error getting city from coordinates:', geocodeError);
          // Still save coordinates even if city lookup fails
          await supabase
            .from('users')
            .update({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    }
  };

  const fetchCoaches = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await getCoaches();
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match your current app structure
      const transformedCoaches = transformCoachData(data);
      setCoaches(transformedCoaches);
      setError(null);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError(err.message);
      // Fallback to empty array if API fails
      setCoaches([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Try to refresh from preload context first
      const refreshedCoaches = await refreshData('coaches');
      if (refreshedCoaches) {
        setCoaches(refreshedCoaches);
        setError(null);
      } else {
        // Fallback to direct API call
        await fetchCoaches(true);
      }
    } catch (err) {
      console.error('Error refreshing coaches:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  // Get coach coordinates from the coach object
  const getCoachCoordinates = (coach) => {
    if (coach.latitude && coach.longitude) {
      return {
        latitude: parseFloat(coach.latitude),
        longitude: parseFloat(coach.longitude)
      };
    }
    return null;
  };
  
  const filteredAndSortedCoaches = coaches
    .filter(coach => {
      const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           coach.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = selectedFilters.length === 0 || 
                            selectedFilters.some(filter => {
                              if (filter === 'Verified') {
                                return coach.verified;
                              }
                              return coach.specialties.includes(filter);
                            });
      
      return matchesSearch && matchesFilters;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Rating':
          return b.rating - a.rating; // Highest rating first
        case 'Price':
          // Handle coaches with no price (show them at the end)
          if (!a.hourlyRate && !b.hourlyRate) return 0;
          if (!a.hourlyRate) return 1; // a goes to end
          if (!b.hourlyRate) return -1; // b goes to end
          
          // Convert both prices to USD for fair comparison
          const aUSDRate = a.currency === 'VND' ? a.hourlyRate / 24000 : a.hourlyRate;
          const bUSDRate = b.currency === 'VND' ? b.hourlyRate / 24000 : b.hourlyRate;
          return aUSDRate - bUSDRate; // Lowest price first
        case 'Location':
          if (userLocation && locationPermissionGranted) {
            // Sort by distance from user location
            const aCoords = getCoachCoordinates(a);
            const bCoords = getCoachCoordinates(b);
            
            if (aCoords && bCoords) {
              const distanceA = calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                aCoords.latitude, 
                aCoords.longitude
              );
              const distanceB = calculateDistance(
                userLocation.latitude, 
                userLocation.longitude, 
                bCoords.latitude, 
                bCoords.longitude
              );
              return distanceA - distanceB; // Closest first
            } else if (aCoords && !bCoords) {
              return -1; // Coaches with coordinates come first
            } else if (!aCoords && bCoords) {
              return 1; // Coaches with coordinates come first
            }
          }
          // Fallback to alphabetical order if no user location or coordinates
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const toggleFilter = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleSearch = () => {
    if (isSearchExpanded) {
      // When closing, clear the search query as well
      setSearchQuery('');
      setIsSearchExpanded(false);
    } else {
      // When opening, just expand
      setIsSearchExpanded(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchExpanded(false);
  };

  // Messaging options configuration
  const messagingOptions = {
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      iconType: 'image',
      iconSource: require('../../assets/images/whatsapp_icon.png'),
      color: '#25D366',
      description: 'Message via WhatsApp'
    },
    imessage: {
      id: 'imessage',
      name: 'iMessage',
      iconType: 'lucide',
      lucideIcon: MessageCircle,
      color: '#6366F1',
      description: 'Message via iMessage (iOS only)'
    },
    zalo: {
      id: 'zalo',
      name: 'Zalo',
      iconType: 'image',
      iconSource: require('../../assets/images/zalo_icon.jpg'),
      color: '#0068FF',
      description: 'Message via Zalo'
    }
  };

  const handleContactCoach = (coach) => {
    setSelectedCoach(coach);
    
    Alert.alert(
      'Contact Coach',
      `How would you like to contact ${coach.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Message', 
          onPress: () => {
            if (coach.phone && coach.messagingPreferences) {
              setShowMessagingModal(true);
            } else {
              handleFallbackSMS(coach);
            }
          }
        },
        { text: 'Call', onPress: () => handleCall(coach) },
      ]
    );
  };

  const handleCall = (coach) => {
    if (coach.phone) {
      const phoneUrl = `tel:${coach.phone.replace(/[^0-9+]/g, '')}`;
      Linking.canOpenURL(phoneUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(phoneUrl);
          } else {
            Alert.alert('Error', 'Unable to make phone calls on this device.');
          }
        })
        .catch((error) => {
          console.error('Error opening phone app:', error);
          Alert.alert('Error', 'Failed to open phone app.');
        });
    } else {
      Alert.alert('No Phone Number', 'This coach has not provided a phone number.');
    }
  };

  const handleMessagingOption = (option, coach) => {
    const phoneNumber = coach.phone?.replace(/[^0-9+]/g, '') || '';
    
    switch (option.id) {
      case 'whatsapp':
        handleWhatsApp(phoneNumber, coach.name);
        break;
      case 'imessage':
        handleiMessage(phoneNumber, coach.name);
        break;
      case 'zalo':
        handleZalo(phoneNumber, coach.name);
        break;
      default:
        handleFallbackSMS(coach);
    }
    
    setShowMessagingModal(false);
  };

  const handleWhatsApp = (phoneNumber, coachName) => {
    const message = encodeURIComponent(`Hi ${coachName}, I found your profile on AcademyPro and I'm interested in coaching. Are you available?`);
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          Linking.openURL(webWhatsappUrl);
        }
      })
      .catch(() => {
        // Final fallback to SMS
        handleFallbackSMS({ phone: phoneNumber, name: coachName });
      });
  };

  const handleiMessage = (phoneNumber, coachName) => {
    if (Platform.OS === 'ios') {
      const message = encodeURIComponent(`Hi ${coachName}, I found your profile on AcademyPro and I'm interested in coaching. Are you available?`);
      const imessageUrl = `sms:${phoneNumber}&body=${message}`;
      
      Linking.openURL(imessageUrl)
        .catch(() => {
          handleFallbackSMS({ phone: phoneNumber, name: coachName });
        });
    } else {
      Alert.alert(
        'iMessage Not Available',
        'iMessage is only available on iOS devices. Would you like to send an SMS instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send SMS', onPress: () => handleFallbackSMS({ phone: phoneNumber, name: coachName }) }
        ]
      );
    }
  };

  const handleZalo = (phoneNumber, coachName) => {
    // Zalo deep linking (if available)
    const zaloUrl = `zalo://conversation?phone=${phoneNumber}`;
    
    Linking.canOpenURL(zaloUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(zaloUrl);
        } else {
          Alert.alert(
            'Zalo Not Installed',
            'Zalo app is not installed on your device. Would you like to send an SMS instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Install Zalo', onPress: () => {
                const storeUrl = Platform.OS === 'ios' 
                  ? 'https://apps.apple.com/app/zalo/id579523206'
                  : 'https://play.google.com/store/apps/details?id=com.zing.zalo';
                Linking.openURL(storeUrl);
              }},
              { text: 'Send SMS', onPress: () => handleFallbackSMS({ phone: phoneNumber, name: coachName }) }
            ]
          );
        }
      })
      .catch(() => {
        handleFallbackSMS({ phone: phoneNumber, name: coachName });
      });
  };

  const handleFallbackSMS = (coach) => {
    const phoneNumber = coach.phone?.replace(/[^0-9+]/g, '') || '';
    if (phoneNumber) {
      const message = encodeURIComponent(`Hi ${coach.name}, I found your profile on AcademyPro and I'm interested in coaching. Are you available?`);
      const smsUrl = `sms:${phoneNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${message}`;
      
      Linking.openURL(smsUrl)
        .catch((error) => {
          console.error('Error opening SMS app:', error);
          Alert.alert('Error', 'Unable to open messaging app. Please contact the coach directly.');
        });
    } else {
      Alert.alert('No Phone Number', 'This coach has not provided a phone number.');
    }
  };

  const handleAvatarPress = (coach) => {
    setSelectedAvatarCoach(coach);
    setShowAvatarModal(true);
  };

  const openCoachProfile = (coach) => {
    setProfileCoach(coach);
    setShowProfileModal(true);
  };

  // P-3: fetch academy detail for the Academy detail sheet
  // Two-step: academy_members → user_ids → coaches (no direct FK between these tables)
  const fetchAcademyDetail = async (academyId) => {
    setAcademyDetailLoading(true);
    setAcademyDetailData(null);
    try {
      // Step 1: get user_ids of coach members
      const { data: memberRows, error: memberErr } = await supabase
        .from('academy_members')
        .select('user_id')
        .eq('academy_id', academyId)
        .eq('role', 'coach');
      if (memberErr) throw memberErr;

      const coachUserIds = (memberRows || []).map(m => m.user_id).filter(Boolean);
      let coaches = [];
      if (coachUserIds.length > 0) {
        // Step 2: get coach profiles by user_id
        const { data: coachRows, error: coachErr } = await supabase
          .from('coaches')
          .select('id, name, rating_avg, is_verified, avatar_url')
          .in('user_id', coachUserIds)
          .eq('is_active', true);
        if (coachErr) throw coachErr;
        coaches = coachRows || [];
      }

      const coachCount = coaches.length;
      const ratingsWithValue = coaches.filter(c => c.rating_avg && c.rating_avg > 0);
      const avgRating = ratingsWithValue.length > 0
        ? (ratingsWithValue.reduce((sum, c) => sum + c.rating_avg, 0) / ratingsWithValue.length).toFixed(1)
        : null;
      setAcademyDetailData({ coaches, coachCount, avgRating });
    } catch (err) {
      console.error('fetchAcademyDetail error:', err);
    } finally {
      setAcademyDetailLoading(false);
    }
  };

  const getCoachDistanceMiles = (coach) => {
    if (!userLocation || !locationPermissionGranted) return null;
    const coachCoords = getCoachCoordinates(coach);
    if (!coachCoords) return null;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      coachCoords.latitude,
      coachCoords.longitude
    );
  };

  const getCoachLocationLine = (coach) => {
    const shortLocation = formatCoachLocationShort(coach.location);
    const distanceMiles = getCoachDistanceMiles(coach);
    if (distanceMiles == null) return shortLocation;
    return `${shortLocation} • ${formatDistanceAway(distanceMiles, useMetricDistance)}`;
  };

  const handleSortSelection = (option) => {
    if (option === 'Location' && !locationPermissionGranted) {
      Alert.alert(
        'Location Permission Required',
        'Please allow location access to sort coaches by distance.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Allow', onPress: requestLocationPermission },
        ]
      );
      return;
    }
    setSortBy(option);
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSortBy('Rating');
  };

  const renderVerifiedBadge = (compact = false) => (
    <View style={[
      styles.verifiedBadge,
      compact && styles.verifiedBadgeCompact,
      { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5' },
    ]}>
      <BadgeCheck size={compact ? 12 : 14} color="#10B981" strokeWidth={2.5} />
      <Text style={[
        styles.verifiedBadgeText,
        compact && styles.verifiedBadgeTextCompact,
        { fontFamily: t.fontBodySemibold },
      ]}>
        Verified
      </Text>
    </View>
  );

  const renderCoachRating = (coach) => {
    if (!coach.reviewCount) {
      return (
        <Text style={[styles.noReviewsText, { color: t.textSecondary, fontFamily: t.fontBody }]}>
          No reviews yet
        </Text>
      );
    }

    return (
      <View style={styles.metricItem}>
        <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
        <Text style={[styles.metricValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>
          {coach.rating}
        </Text>
        <Text style={[styles.metricLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>
          ({coach.reviewCount})
        </Text>
      </View>
    );
  };

  const getAvailableMessagingOptions = (coach) => {
    if (!coach.messagingPreferences) return [];
    
    return Object.entries(messagingOptions)
      .filter(([key, option]) => coach.messagingPreferences[key] === true)
      .map(([key, option]) => option);
  };

  // Format price based on currency
  const formatPrice = (hourlyRate, currency) => {
    if (!hourlyRate || hourlyRate === 0) return 'Contact';
    
    if (currency === 'VND') {
      return `${hourlyRate.toLocaleString('vi-VN')} ₫`;
    }

    return `$${hourlyRate}`;
  };

  const renderFilterChip = (filter, { inModal = false } = {}) => {
    const active = selectedFilters.includes(filter);
    const label = filter === 'Verified' && active && inModal ? 'Verified only' : filter;

    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterChip,
          inModal && styles.filterChipModal,
          { backgroundColor: isDark ? t.surfaceRaised : '#fff', borderColor: isDark ? t.border : '#E5E7EB' },
          active && { backgroundColor: t.accentPurple, borderColor: t.accentPurple },
        ]}
        onPress={() => toggleFilter(filter)}
        activeOpacity={0.7}
      >
        <View style={styles.filterChipContent}>
          {filter === 'Verified' && (
            <BadgeCheck
              size={inModal ? 14 : 12}
              color={active ? (isDark ? t.fabTextColor : 'white') : '#10B981'}
              strokeWidth={2}
              style={styles.filterIcon}
            />
          )}
          <Text style={[
            styles.filterChipText,
            inModal && styles.filterChipTextModal,
            { color: t.textSecondary, fontFamily: t.fontBody },
            active && { color: isDark ? t.fabTextColor : 'white', fontFamily: t.fontBodySemibold },
          ]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={[styles.filterModalContainer, { backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
          <View style={[styles.filterModalHeader, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
            <Text style={[styles.filterModalTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
              Filter & Sort
            </Text>
            <TouchableOpacity
              style={[styles.filterModalCloseButton, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]}
              onPress={() => setShowFilterModal(false)}
            >
              <X size={22} color={t.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.filterModalScroll}
            contentContainerStyle={styles.filterModalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.filterModalSectionLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>
              SORT BY
            </Text>
            <View style={styles.sortOptionList}>
              {sortOptions.map((option) => {
                const selected = sortBy === option;
                const locationLocked = option === 'Location' && !locationPermissionGranted;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sortOptionRow,
                      {
                        backgroundColor: t.surface,
                        borderColor: selected ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
                      },
                      selected && { backgroundColor: isDark ? t.accentPurpleMuted : '#F5F3FF' },
                    ]}
                    onPress={() => handleSortSelection(option)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sortOptionLeft}>
                      <SlidersHorizontal size={16} color={selected ? t.accentPurple : t.textSecondary} strokeWidth={2} />
                      <Text style={[
                        styles.sortOptionText,
                        { color: t.textPrimary, fontFamily: selected ? t.fontBodySemibold : t.fontBody },
                      ]}>
                        {option}
                      </Text>
                      {locationLocked ? (
                        <Lock size={13} color={t.textCaption} strokeWidth={2} />
                      ) : null}
                    </View>
                    {selected ? (
                      <View style={[styles.sortOptionCheck, { backgroundColor: t.accentPurple }]}>
                        <Check size={14} color={isDark ? t.fabTextColor : '#fff'} strokeWidth={2.5} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterModalSectionLabel, { color: t.textSecondary, fontFamily: t.fontBodySemibold }]}>
              SPECIALTIES
            </Text>
            <View style={styles.filterModalChips}>
              {specialtyFilters.map((filter) => renderFilterChip(filter, { inModal: true }))}
            </View>
          </ScrollView>

          <View style={[styles.filterModalFooter, { borderTopColor: isDark ? t.border : '#E5E7EB', backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
            <TouchableOpacity
              style={styles.filterModalClearButton}
              onPress={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              <Text style={[
                styles.filterModalClearText,
                { color: activeFilterCount > 0 ? t.accentPurple : t.textCaption, fontFamily: t.fontBodySemibold },
              ]}>
                Clear all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterModalApplyButton, { backgroundColor: t.accentPurple }]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={[styles.filterModalApplyText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExpandableSearch = () => (
    <View style={[styles.expandableSearchContainer, { paddingHorizontal: px }, isSearchExpanded && styles.expandableSearchExpanded]}>
      <View style={[styles.searchInputContainer, { backgroundColor: t.surface }]}>
        <Search size={20} color={t.textMuted} strokeWidth={2} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary, fontFamily: t.fontBody }]}
          placeholder="Search coaches..."
          placeholderTextColor={t.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={isSearchExpanded}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={18} color={t.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { paddingHorizontal: px, borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[
            styles.filterCtaButton,
            {
              backgroundColor: isDark ? t.surfaceRaised : '#fff',
              borderColor: activeFilterCount > 0 ? t.accentPurple : (isDark ? t.border : '#E5E7EB'),
            },
            activeFilterCount > 0 && { backgroundColor: isDark ? t.accentPurpleMuted : '#F5F3FF' },
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? t.accentPurple : t.textSecondary}
            strokeWidth={2}
          />
          {activeFilterCount > 0 ? (
            <View style={[styles.filterCtaBadge, { backgroundColor: t.accentPurple }]}>
              <Text style={[styles.filterCtaBadgeText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.filtersScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {specialtyFilters.map((filter) => renderFilterChip(filter))}
          </ScrollView>
          <LinearGradient
            colors={[`${headerFadeColor}00`, headerFadeColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.filterFade}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );

  const renderCoachCard = (coach) => {
    const hasValidImage = coach.image && 
      (coach.image.startsWith('http') || coach.image.startsWith('blob:'));
    const bio = coach.bio?.trim();
    
    return (
      <TouchableOpacity
        key={coach.id}
        style={[styles.coachCard, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
        activeOpacity={0.85}
        onPress={() => openCoachProfile(coach)}
      >
        <View style={styles.coachHeader}>
          <TouchableOpacity 
            onPress={() => handleAvatarPress(coach)}
            activeOpacity={0.7}
          >
            <SeededAvatar
              uri={hasValidImage ? coach.image : null}
              name={coach.name}
              size={60}
            />
          </TouchableOpacity>
        
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <Text style={[styles.coachName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{coach.name}</Text>
            {coach.verified && renderVerifiedBadge(true)}
          </View>
          
          <View style={styles.coachMetrics}>
            {coach.duprRating ? (
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Rating:</Text>
                <Text style={[styles.metricValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>{coach.duprRating}</Text>
              </View>
            ) : null}
            {renderCoachRating(coach)}
          </View>
        </View>
        
        <View style={styles.coachPrice}>
          <Text style={[styles.priceText, { fontFamily: t.fontDisplay }]}>{formatPrice(coach.hourlyRate, coach.currency)}</Text>
          <Text style={[styles.priceLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>per hour</Text>
        </View>
      </View>
      
      {bio ? (
        <Text style={[styles.coachBio, { color: t.textSecondary, fontFamily: t.fontBody }]} numberOfLines={2}>
          {bio}
        </Text>
      ) : null}
      
      <View style={styles.specialtiesContainer}>
        {coach.specialties.slice(0, 3).map((specialty) => (
          <View key={specialty} style={[styles.specialtyTag, { backgroundColor: isDark ? t.accentPurpleMuted : '#F3F4F6' }]}>
            <Text style={[styles.specialtyText, { color: isDark ? t.accentPurple : '#4B5563', fontFamily: t.fontBody }]}>{specialty}</Text>
          </View>
        ))}
        {coach.specialties.length > 3 && (
          <View style={[styles.specialtyTag, { backgroundColor: isDark ? t.accentPurpleMuted : '#F3F4F6' }]}>
            <Text style={[styles.specialtyText, { color: isDark ? t.accentPurple : '#4B5563', fontFamily: t.fontBody }]}>+{coach.specialties.length - 3}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.coachLocation}>
        <MapPin size={14} color={t.textSecondary} strokeWidth={2} />
        <Text
          style={[styles.locationText, { color: t.textSecondary, fontFamily: t.fontBody }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {getCoachLocationLine(coach)}
        </Text>
      </View>

      {coach.academy ? (
        <View style={[styles.academyBadge, { backgroundColor: isDark ? t.accentPurpleMuted : '#EFF6FF', borderColor: isDark ? t.accentPurple : '#BFDBFE' }]}>
          <Users size={12} color={isDark ? t.accentPurple : '#2563EB'} strokeWidth={2} />
          <Text style={[styles.academyBadgeText, { color: isDark ? t.accentPurple : '#1D4ED8', fontFamily: t.fontBody }]} numberOfLines={1}>
            {coach.academy.name}
          </Text>
        </View>
      ) : null}
      
      <TouchableOpacity 
        style={[styles.contactButton, { backgroundColor: t.accentPurple }]}
        onPress={() => handleContactCoach(coach)}
      >
        <Text style={[styles.contactButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Contact Coach</Text>
      </TouchableOpacity>
    </TouchableOpacity>
    );
  };

  const renderCoachProfileModal = () => {
    if (!profileCoach) return null;

    const hasValidImage = profileCoach.image &&
      (profileCoach.image.startsWith('http') || profileCoach.image.startsWith('blob:'));
    const bio = profileCoach.bio?.trim();

    return (
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={[styles.profileModalOverlay, { backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
          <View style={[styles.profileModalContainer, { backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
            <View style={[styles.profileModalHeader, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
              <Text style={[styles.profileModalTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
                Coach Profile
              </Text>
              <TouchableOpacity
                style={[styles.profileModalCloseButton, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]}
                onPress={() => setShowProfileModal(false)}
              >
                <X size={22} color={t.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.profileModalScroll}
              contentContainerStyle={styles.profileModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profileHero}>
                <SeededAvatar
                  uri={hasValidImage ? profileCoach.image : null}
                  name={profileCoach.name}
                  size={88}
                />
                <Text style={[styles.profileName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
                  {profileCoach.name}
                </Text>
                {profileCoach.verified ? renderVerifiedBadge(false) : null}
              </View>

              <View style={[styles.profileStatsRow, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                {profileCoach.duprRating ? (
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Rating</Text>
                    <Text style={[styles.profileStatValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
                      {profileCoach.duprRating}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.profileStat}>
                  <Text style={[styles.profileStatLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Rating</Text>
                  {profileCoach.reviewCount ? (
                    <View style={styles.profileRatingValue}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                      <Text style={[styles.profileStatValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>
                        {profileCoach.rating} ({profileCoach.reviewCount})
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.profileStatValue, { color: t.textSecondary, fontFamily: t.fontBody }]}>
                      No reviews yet
                    </Text>
                  )}
                </View>
                <View style={styles.profileStat}>
                  <Text style={[styles.profileStatLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Rate</Text>
                  <Text style={[styles.profileStatValue, { color: '#10B981', fontFamily: t.fontBodyBold }]}>
                    {formatPrice(profileCoach.hourlyRate, profileCoach.currency)}
                  </Text>
                  <Text style={[styles.profileStatSub, { color: t.textSecondary, fontFamily: t.fontBody }]}>per hour</Text>
                </View>
              </View>

              {bio ? (
                <View style={[styles.profileSection, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                  <Text style={[styles.profileSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>About</Text>
                  <Text style={[styles.profileBio, { color: t.textSecondary, fontFamily: t.fontBody }]}>{bio}</Text>
                </View>
              ) : null}

              {profileCoach.specialties?.length > 0 ? (
                <View style={[styles.profileSection, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                  <Text style={[styles.profileSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Specialties</Text>
                  <View style={styles.specialtiesContainer}>
                    {profileCoach.specialties.map((specialty) => (
                      <View key={specialty} style={[styles.specialtyTag, { backgroundColor: isDark ? t.accentPurpleMuted : '#F3F4F6' }]}>
                        <Text style={[styles.specialtyText, { color: isDark ? t.accentPurple : '#4B5563', fontFamily: t.fontBody }]}>{specialty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={[styles.profileSection, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <Text style={[styles.profileSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Location</Text>
                <View style={styles.coachLocation}>
                  <MapPin size={14} color={t.textSecondary} strokeWidth={2} />
                  <Text style={[styles.profileLocationText, { color: t.textSecondary, fontFamily: t.fontBody }]}>
                    {getCoachLocationLine(profileCoach)}
                  </Text>
                </View>
              </View>

              {profileCoach.academy ? (
                <View style={[styles.profileSection, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                  <Text style={[styles.profileSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Academy</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {profileCoach.academy.logo_url ? (
                          <Image source={{ uri: profileCoach.academy.logo_url }} style={{ width: 38, height: 38 }} resizeMode="cover" />
                        ) : (
                          <Users size={18} color="#6B7280" strokeWidth={2} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.profileStatValue, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]} numberOfLines={1}>
                          {profileCoach.academy.name}
                        </Text>
                        <Text style={[{ fontSize: 12, color: t.textSecondary, fontFamily: t.fontBody }]}>@{profileCoach.academy.slug}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: isDark ? t.accentPurpleMuted : '#EFF6FF', borderWidth: 1, borderColor: isDark ? t.accentPurple : '#BFDBFE' }}
                      onPress={() => {
                        setSelectedAcademy(profileCoach.academy);
                        setShowAcademyModal(true);
                        fetchAcademyDetail(profileCoach.academy.id);
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? t.accentPurple : '#1D4ED8', fontFamily: t.fontBodySemibold }}>View Academy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.contactButton, styles.profileContactButton, { backgroundColor: t.accentPurple }]}
                onPress={() => {
                  setShowProfileModal(false);
                  handleContactCoach(profileCoach);
                }}
              >
                <Text style={[styles.contactButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>
                  Contact Coach
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // P-3: Academy detail sheet
  const renderAcademyDetailModal = () => {
    if (!showAcademyModal || !selectedAcademy) return null;
    return (
      <Modal
        visible={showAcademyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
        onRequestClose={() => setShowAcademyModal(false)}
      >
        <View style={[styles.profileModalOverlay, { backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
          <View style={[styles.profileModalContainer, { backgroundColor: isDark ? t.bg : '#F9FAFB' }]}>
            {/* Header */}
            <View style={[styles.profileModalHeader, { borderBottomColor: isDark ? t.border : '#E5E7EB' }]}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
                onPress={() => setShowAcademyModal(false)}
              >
                <Ionicons name="chevron-back" size={18} color="#3B82F6" />
                <Text style={{ fontSize: 14, color: '#3B82F6', fontWeight: '600', fontFamily: t.fontBodySemibold }}>Back</Text>
              </TouchableOpacity>
              <Text style={[styles.profileModalTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>Academy</Text>
              <TouchableOpacity
                style={[styles.profileModalCloseButton, { backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6' }]}
                onPress={() => setShowAcademyModal(false)}
              >
                <X size={22} color={t.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.profileModalScroll}
              contentContainerStyle={styles.profileModalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Academy hero */}
              <View style={styles.profileHero}>
                <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: isDark ? t.surfaceRaised : '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 }}>
                  {selectedAcademy.logo_url ? (
                    <Image source={{ uri: selectedAcademy.logo_url }} style={{ width: 80, height: 80 }} resizeMode="cover" />
                  ) : (
                    <Users size={36} color={isDark ? t.accentPurple : '#6B7280'} strokeWidth={1.5} />
                  )}
                </View>
                <Text style={[styles.profileName, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{selectedAcademy.name}</Text>
                <Text style={{ fontSize: 14, color: t.textSecondary, fontFamily: t.fontBody }}>@{selectedAcademy.slug}</Text>
              </View>

              {/* Stats row */}
              {academyDetailLoading ? (
                <ActivityIndicator size="small" color={t.accentPurple} style={{ marginVertical: 24 }} />
              ) : academyDetailData ? (
                <>
                  <View style={[styles.profileStatsRow, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                    <View style={styles.profileStat}>
                      <Text style={[styles.profileStatLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Coaches</Text>
                      <Text style={[styles.profileStatValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{academyDetailData.coachCount}</Text>
                    </View>
                    <View style={styles.profileStat}>
                      <Text style={[styles.profileStatLabel, { color: t.textSecondary, fontFamily: t.fontBody }]}>Avg Rating</Text>
                      {academyDetailData.avgRating ? (
                        <View style={styles.profileRatingValue}>
                          <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                          <Text style={[styles.profileStatValue, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>{academyDetailData.avgRating}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.profileStatValue, { color: t.textSecondary, fontFamily: t.fontBody }]}>—</Text>
                      )}
                    </View>
                  </View>

                  {/* Coach roster */}
                  {academyDetailData.coaches.length > 0 ? (
                    <View style={[styles.profileSection, { backgroundColor: t.surface, borderColor: isDark ? t.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                      <Text style={[styles.profileSectionTitle, { color: t.textPrimary, fontFamily: t.fontBodySemibold }]}>Coaches</Text>
                      {academyDetailData.coaches.map((c, i) => (
                        <View key={c.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: isDark ? t.border : '#F3F4F6' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? t.surfaceRaised : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? t.textPrimary : '#374151' }}>
                              {(c.name || 'C').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary, fontFamily: t.fontBodySemibold }}>{c.name}</Text>
                            {c.rating_avg ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Star size={11} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                                <Text style={{ fontSize: 12, color: t.textSecondary, fontFamily: t.fontBody }}>{c.rating_avg}</Text>
                              </View>
                            ) : null}
                          </View>
                          {c.is_verified ? (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#ECFDF5' }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#059669' }}>Verified</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAvatarModal = () => {
    if (!selectedAvatarCoach) return null;
    
    // Check if coach has a valid image URL
    const hasValidImage = selectedAvatarCoach.image && 
      (selectedAvatarCoach.image.startsWith('http') || selectedAvatarCoach.image.startsWith('blob:'));
    
    return (
      <Modal
        visible={showAvatarModal}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.avatarModalOverlay}>
          <TouchableOpacity
            style={styles.avatarModalCloseArea}
            onPress={() => setShowAvatarModal(false)}
            activeOpacity={1}
          >
            <View style={styles.avatarModalContainer}>
              <TouchableOpacity
                style={styles.avatarModalCloseButton}
                onPress={() => setShowAvatarModal(false)}
              >
                <X size={28} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              
              <View style={styles.avatarModalContent}>
                {hasValidImage ? (
                  <Image 
                    source={{ uri: selectedAvatarCoach.image }} 
                    style={styles.avatarModalImage}
                    resizeMode="contain"
                    onError={(error) => {
                      console.log('❌ Failed to load coach avatar in modal:', selectedAvatarCoach.name, selectedAvatarCoach.image, error);
                    }}
                  />
                ) : (
                  <View style={styles.avatarModalFallback}>
                    <Text style={styles.avatarModalFallbackText}>
                      {selectedAvatarCoach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
                
                <View style={styles.avatarModalInfo}>
                  <Text style={styles.avatarModalName}>{selectedAvatarCoach.name}</Text>
                  {selectedAvatarCoach.verified && (
                    <View style={styles.avatarModalVerified}>
                      <BadgeCheck size={20} color="#10B981" strokeWidth={2} />
                      <Text style={styles.avatarModalVerifiedText}>Verified Coach</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const renderMessagingModal = () => {
    if (!selectedCoach) return null;
    
    const availableOptions = getAvailableMessagingOptions(selectedCoach);
    
    return (
      <Modal
        visible={showMessagingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
      >
        <View style={styles.messagingModalOverlay}>
          <View style={styles.messagingModalContainer}>
            <View style={styles.messagingModalHeader}>
              <Text style={styles.messagingModalTitle}>
                Message {selectedCoach.name}
              </Text>
              <TouchableOpacity
                style={styles.messagingModalCloseButton}
                onPress={() => setShowMessagingModal(false)}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.messagingOptionsContainer}>
              {availableOptions.length > 0 ? (
                <>
                  <Text style={styles.messagingOptionsDescription}>
                    Choose your preferred messaging platform:
                  </Text>
                  {availableOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.messagingOptionCard}
                      onPress={() => handleMessagingOption(option, selectedCoach)}
                    >
                      <View style={styles.messagingOptionContent}>
                        {option.iconType === 'image' ? (
                          <Image 
                            source={option.iconSource} 
                            style={[
                              styles.messagingOptionIconImage,
                              option.id === 'whatsapp' && styles.whatsappIconRounded
                            ]} 
                          />
                        ) : option.iconType === 'lucide' && option.lucideIcon ? (
                          <option.lucideIcon size={24} color={option.color} strokeWidth={2} style={styles.messagingOptionLucideIcon} />
                        ) : null}
                        <View style={styles.messagingOptionTextContainer}>
                          <Text style={styles.messagingOptionName}>{option.name}</Text>
                          <Text style={styles.messagingOptionDescription}>{option.description}</Text>
                        </View>
                        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.noMessagingOptions}>
                  <Text style={styles.noMessagingOptionsText}>
                    This coach hasn't set up messaging preferences yet.
                  </Text>
                </View>
              )}
              
              {/* Always show SMS fallback */}
              <TouchableOpacity
                style={[styles.messagingOptionCard, styles.smsOptionCard]}
                onPress={() => {
                  handleFallbackSMS(selectedCoach);
                  setShowMessagingModal(false);
                }}
              >
                <View style={styles.messagingOptionContent}>
                  <MessageCircle size={24} color="#6366F1" strokeWidth={2} style={styles.messagingOptionLucideIcon} />
                  <View style={styles.messagingOptionTextContainer}>
                    <Text style={styles.messagingOptionName}>SMS</Text>
                    <Text style={styles.messagingOptionDescription}>Send a text message</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Check if we're in a stack navigation (opened from CoachDetail)
  const showBackButton = navigation && navigation.canGoBack && navigation.canGoBack();

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      {renderAvatarModal()}
      {renderMessagingModal()}
      {renderCoachProfileModal()}
      {renderAcademyDetailModal()}
      {renderFilterModal()}
      <ScreenHeaderShell
        tokens={t}
        isDark={isDark}
        background="bg"
        bordered
        title="Certified Coaches"
        onBack={showBackButton ? () => navigation.goBack() : undefined}
        rightAction={(
          <TouchableOpacity
            style={[styles.searchIconButton, { backgroundColor: isDark ? t.surfaceRaised : t.accentPurpleMuted }]}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            {isSearchExpanded ? (
              <X size={22} color={t.textPrimary} strokeWidth={2} />
            ) : (
              <Search size={22} color={t.textPrimary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      >
        {isSearchExpanded && renderExpandableSearch()}
        {renderFilters()}
      </ScreenHeaderShell>
      
      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {[1, 2, 3, 4].map(i => <CoachSkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: t.fontBody }]}>Failed to load coaches</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: t.accentPurple }]} onPress={fetchCoaches}>
            <Text style={[styles.retryButtonText, { color: isDark ? t.fabTextColor : '#fff', fontFamily: t.fontBodySemibold }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[t.accentPurple]}
              tintColor={t.accentPurple}
            />
          }
        >
          <View style={[styles.resultsContainer, { paddingHorizontal: px }]}>
            {filteredAndSortedCoaches.length > 0 ? (
              filteredAndSortedCoaches.map(renderCoachCard)
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateIcon, { backgroundColor: isDark ? t.surfaceRaised : t.accentPurpleMuted }]}>
                  <Users size={32} color={t.accentPurple} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: t.textPrimary, fontFamily: t.fontBodyBold }]}>No coaches found</Text>
                <Text style={[styles.emptyStateSubtitle, { color: t.textMuted, fontFamily: t.fontBody }]}>
                  Try adjusting your search or filters to find coaches in your area.
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 10,
  },
  expandableSearchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    maxHeight: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  expandableSearchExpanded: {
    paddingVertical: 12,
    maxHeight: 100,
    opacity: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filtersContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterCtaButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    position: 'relative',
  },
  filterCtaBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCtaBadgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
  filtersScrollWrap: {
    flex: 1,
    position: 'relative',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingRight: 24,
    alignItems: 'center',
  },
  filterFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 24,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
  },
  filterChipModal: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 3,
  },
  filterChipText: {
    fontSize: 13,
  },
  filterChipTextModal: {
    fontSize: 14,
  },
  filterChipTextActive: {
    color: 'white',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  filterModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
  },
  filterModalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  filterModalScroll: {
    flexGrow: 0,
  },
  filterModalContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  filterModalSectionLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  sortOptionList: {
    gap: 8,
    marginBottom: 22,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortOptionText: {
    fontSize: 15,
  },
  sortOptionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 12,
  },
  filterModalClearButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterModalClearText: {
    fontSize: 15,
  },
  filterModalApplyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterModalApplyText: {
    fontSize: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  verifiedBadgeText: {
    fontSize: 12,
    color: '#047857',
  },
  verifiedBadgeTextCompact: {
    fontSize: 11,
  },
  noReviewsText: {
    fontSize: 13,
  },
  resultsContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  coachCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  coachAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  coachMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 2,
  },
  coachPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  coachBio: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  coachLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  academyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  academyBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contactButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 24,
  },
  // Loading, error, and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Messaging modal styles
  messagingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messagingModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
    maxHeight: '80%',
  },
  messagingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messagingModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  messagingModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  messagingOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messagingOptionsDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  messagingOptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  smsOptionCard: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  messagingOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  messagingOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  messagingOptionIconImage: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  messagingOptionLucideIcon: {
    marginRight: 12,
  },
  whatsappIconRounded: {
    borderRadius: 6,
  },
  messagingOptionTextContainer: {
    flex: 1,
  },
  messagingOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  messagingOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  noMessagingOptions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noMessagingOptionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Avatar modal styles
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarModalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  avatarModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  avatarModalImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
    marginBottom: 20,
  },
  avatarModalFallback: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarModalFallbackText: {
    fontSize: 72,
    fontWeight: '600',
    color: 'white',
  },
  avatarModalInfo: {
    alignItems: 'center',
  },
  avatarModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  avatarModalVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  avatarModalVerifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  profileModalOverlay: {
    flex: 1,
  },
  profileModalContainer: {
    flex: 1,
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  profileModalTitle: {
    fontSize: 18,
  },
  profileModalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileModalScroll: {
    flex: 1,
  },
  profileModalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  profileHero: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  profileName: {
    fontSize: 24,
    textAlign: 'center',
  },
  profileStatsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  profileStatValue: {
    fontSize: 16,
    textAlign: 'center',
  },
  profileStatSub: {
    fontSize: 11,
  },
  profileRatingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileSectionTitle: {
    fontSize: 15,
    marginBottom: 10,
  },
  profileBio: {
    fontSize: 15,
    lineHeight: 22,
  },
  profileLocationText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  profileContactButton: {
    marginTop: 8,
  },
});
