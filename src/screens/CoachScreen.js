import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';
import { getCoaches, transformCoachData } from '../lib/supabase';

export default function CoachScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('Rating');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  
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
  
  const specialtyFilters = ['Verified', 'Beginners', 'Technique', 'Strategy', 'Mental Game', 'Tournament Prep', 'Fitness'];
  const sortOptions = ['Rating', 'Price', 'Location'];

  // Request location permission and get user location on component mount
  useEffect(() => {
    requestLocationPermission();
    fetchCoaches();
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

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
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

  const onRefresh = () => {
    fetchCoaches(true);
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
          return a.hourlyRate - b.hourlyRate; // Lowest price first
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
      iconType: 'emoji',
      icon: '💬',
      color: '#007AFF',
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
    const message = encodeURIComponent(`Hi ${coachName}, I found your profile on PicklePro and I'm interested in pickleball coaching. Are you available?`);
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
      const message = encodeURIComponent(`Hi ${coachName}, I found your profile on PicklePro and I'm interested in pickleball coaching. Are you available?`);
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
      const message = encodeURIComponent(`Hi ${coach.name}, I found your profile on PicklePro and I'm interested in pickleball coaching. Are you available?`);
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

  const getAvailableMessagingOptions = (coach) => {
    if (!coach.messagingPreferences) return [];
    
    return Object.entries(messagingOptions)
      .filter(([key, option]) => coach.messagingPreferences[key] === true)
      .map(([key, option]) => option);
  };

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <View style={styles.sortRow}>
        <View style={styles.sortLabel}>
          <ModernIcon name="settings" size={16} color="#9CA3AF" />
          <Text style={styles.sortText}>Sort by:</Text>
        </View>
        <View style={styles.sortButtons}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.sortButtonActive,
                option === 'Location' && !locationPermissionGranted && styles.sortButtonDisabled
              ]}
              onPress={() => {
                if (option === 'Location' && !locationPermissionGranted) {
                  Alert.alert(
                    'Location Permission Required',
                    'Please allow location access to sort coaches by distance.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Allow', onPress: requestLocationPermission }
                    ]
                  );
                } else {
                  setSortBy(option);
                }
              }}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option && styles.sortButtonTextActive,
                option === 'Location' && !locationPermissionGranted && styles.sortButtonTextDisabled
              ]}>
                {option}
                {option === 'Location' && locationLoading && ' 📍'}
                {option === 'Location' && !locationPermissionGranted && !locationLoading && ' 🔒'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderExpandableSearch = () => (
    <View style={[styles.expandableSearchContainer, isSearchExpanded && styles.expandableSearchExpanded]}>
      <View style={styles.searchInputContainer}>
        <WebIcon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={isSearchExpanded}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <WebIcon name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {specialtyFilters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilters.includes(filter) && styles.filterChipActive
            ]}
            onPress={() => toggleFilter(filter)}
          >
            <View style={styles.filterChipContent}>
              {filter === 'Verified' && (
                <WebIcon 
                  name="checkmark-circle" 
                  size={14} 
                  color={selectedFilters.includes(filter) ? 'white' : '#10B981'} 
                  style={styles.filterIcon}
                />
              )}
              <Text style={[
                styles.filterChipText,
                selectedFilters.includes(filter) && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCoachCard = (coach) => (
      <View key={coach.id} style={styles.coachCard}>
        <View style={styles.coachHeader}>
          <View style={styles.coachAvatar}>
            {coach.image ? (
            <Image 
              source={{ uri: coach.image }} 
              style={styles.coachAvatarImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Failed to load coach avatar:', coach.image, error);
              }}
              defaultSource={require('../../assets/images/icon.png')} // Fallback image
            />
          ) : (
            <Text style={styles.coachAvatarText}>
              {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          )}
        </View>
        
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <Text style={styles.coachName}>{coach.name}</Text>
            {coach.verified && (
              <WebIcon name="checkmark-circle" size={16} color="#10B981" />
            )}
          </View>
          
          <View style={styles.coachMetrics}>
            {coach.duprRating && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DUPR:</Text>
                <Text style={styles.metricValue}>{coach.duprRating}</Text>
              </View>
            )}
            <View style={styles.metricItem}>
              <WebIcon name="star" size={14} color="#F59E0B" />
              <Text style={styles.metricValue}>{coach.rating}</Text>
              <Text style={styles.metricLabel}>({coach.reviewCount})</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.coachPrice}>
          <Text style={styles.priceText}>${coach.hourlyRate}</Text>
          <Text style={styles.priceLabel}>per hour</Text>
        </View>
      </View>
      
      <Text style={styles.coachBio} numberOfLines={2}>
        {coach.bio}
      </Text>
      
      <View style={styles.specialtiesContainer}>
        {coach.specialties.slice(0, 3).map((specialty) => (
          <View key={specialty} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
        {coach.specialties.length > 3 && (
          <View style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>+{coach.specialties.length - 3}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.coachLocation}>
        <WebIcon name="location-outline" size={14} color="#6B7280" />
        <Text style={styles.locationText}>
          {coach.location.replace(/\s*\([^)]*\)$/, '')} {/* Remove coordinates from display */}
          {userLocation && locationPermissionGranted && (() => {
            const coachCoords = getCoachCoordinates(coach);
            if (coachCoords) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coachCoords.latitude,
                coachCoords.longitude
              );
              return ` • ${distance.toFixed(1)} mi away`;
            }
            return '';
          })()}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={() => handleContactCoach(coach)}
      >
        <Text style={styles.contactButtonText}>Contact Coach</Text>
      </TouchableOpacity>
    </View>
  );

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
                <Ionicons name="close" size={24} color="#6B7280" />
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
                        ) : (
                          <Text style={styles.messagingOptionIcon}>{option.icon}</Text>
                        )}
                        <View style={styles.messagingOptionTextContainer}>
                          <Text style={styles.messagingOptionName}>{option.name}</Text>
                          <Text style={styles.messagingOptionDescription}>{option.description}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
                  <Text style={styles.messagingOptionIcon}>💬</Text>
                  <View style={styles.messagingOptionTextContainer}>
                    <Text style={styles.messagingOptionName}>SMS</Text>
                    <Text style={styles.messagingOptionDescription}>Send a text message</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderMessagingModal()}
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Certified Coaches</Text>
          <TouchableOpacity 
            style={styles.searchIconButton}
            onPress={toggleSearch}
          >
            <WebIcon 
              name={isSearchExpanded ? "close" : "search"} 
              size={24} 
              color="#1F2937" 
            />
          </TouchableOpacity>
        </View>
        {isSearchExpanded && renderExpandableSearch()}
        {renderFilters()}
        {renderSortOptions()}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading coaches...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load coaches</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCoaches}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        >
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredAndSortedCoaches.length} {filteredAndSortedCoaches.length === 1 ? 'coach' : 'coaches'} found
            </Text>
            
            {filteredAndSortedCoaches.length > 0 ? (
              filteredAndSortedCoaches.map(renderCoachCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No coaches match your criteria</Text>
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
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
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
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 24,
  },
  filterChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  // Sort styles - matching exact UI
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 0,
  },
  sortButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sortButtonActive: {
    backgroundColor: '#1F2937',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  sortButtonDisabled: {
    opacity: 0.5,
  },
  sortButtonTextDisabled: {
    color: '#9CA3AF',
  },
  resultsContainer: {
    paddingHorizontal: 24,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    backgroundColor: '#4F46E5',
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
  },
  contactButton: {
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#3B82F6',
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
});
