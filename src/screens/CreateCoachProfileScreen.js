import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlatformMap, PlatformMarker } from '../components/PlatformMap';
import ModernIcon from '../components/ModernIcon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function CreateCoachProfileScreen({ navigation }) {
  const { user: authUser, profile: userProfile } = useAuth();
  const insets = useSafeAreaInsets();
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
    isVerified: false,
    isActive: true,
    isAcceptingStudents: false // Default to not published
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState({
    latitude: 10.7786, // Default to Ho Chi Minh City
    longitude: 106.7131,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.7786,
    longitude: 106.7131,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [previewLocation, setPreviewLocation] = useState('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [existingCoachProfile, setExistingCoachProfile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Add debug useEffect
  useEffect(() => {
    console.log('Component mounted');
    console.log('Platform:', Platform.OS);
    console.log('Initial map region:', mapRegion);
  }, []);

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
            
            // Populate form with existing data
            setFormData({
              name: existingCoach.name || '',
              email: existingCoach.email || '',
              bio: existingCoach.bio || '',
              duprRating: existingCoach.dupr_rating ? existingCoach.dupr_rating.toFixed(3) : '',
              hourlyRate: existingCoach.hourly_rate ? (existingCoach.hourly_rate / 100).toString() : '',
              location: existingCoach.location || '',
              latitude: existingCoach.latitude,
              longitude: existingCoach.longitude,
              phone: existingCoach.phone || '',
              specialties: existingCoach.specialties || [],
              coachingRadius: existingCoach.coaching_radius || 5,
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

  // Update form data when user profile loads (only for new profiles)
  useEffect(() => {
    if (!isEditMode && userProfile && userProfile.dupr_rating && !formData.duprRating) {
      console.log('Auto-populating DUPR rating from user profile:', userProfile.dupr_rating);
      setFormData(prevData => ({
        ...prevData,
        name: prevData.name || userProfile.name || '',
        duprRating: userProfile.dupr_rating.toFixed(3)
      }));
    }
  }, [userProfile, formData.duprRating, isEditMode]);

  // Auto-reverse geocode when coordinates change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (tempCoordinates.latitude && tempCoordinates.longitude && 
          (tempCoordinates.latitude !== 10.7786 || tempCoordinates.longitude !== 106.7131)) {
        try {
          setGeocodingLoading(true);
          const locationString = await reverseGeocode(tempCoordinates.latitude, tempCoordinates.longitude);
          setPreviewLocation(locationString || '');
        } catch (error) {
          console.error('Auto-reverse geocoding failed:', error);
          setPreviewLocation('');
        } finally {
          setGeocodingLoading(false);
        }
      } else {
        setPreviewLocation('');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [tempCoordinates.latitude, tempCoordinates.longitude]);

  const handleSaveCoach = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const coachData = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio || '',
        dupr_rating: formData.duprRating ? parseFloat(parseFloat(formData.duprRating).toFixed(3)) : null,
        hourly_rate: formData.hourlyRate ? parseInt(formData.hourlyRate) * 100 : null, // Convert to cents
        location: formData.location || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone || '',
        specialties: formData.specialties || [],
        coaching_radius: formData.coachingRadius, // Coaching radius in kilometers
        is_verified: false, // New coach profiles start as unverified
        is_active: Boolean(formData.isActive), // Convert to boolean explicitly
        is_accepting_students: formData.isAcceptingStudents, // User's choice to publish
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

      const successMessage = isEditMode 
        ? (formData.isAcceptingStudents 
            ? 'Your coach profile has been updated successfully! Changes will be reviewed by our team.'
            : 'Your coach profile has been updated successfully!')
        : (formData.isAcceptingStudents 
            ? 'Your coach profile has been created successfully! It will be reviewed by our team before being published in the coach directory.'
            : 'Your coach profile has been created successfully! You can publish it in the coach directory anytime by updating your profile.');
        
      Alert.alert(
        'Success', 
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
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

  const handleConfirmLocation = async () => {
    try {
      console.log('Confirming location:', tempCoordinates);
      setLocationLoading(true);
      
      // Perform reverse geocoding to get address
      const locationString = await reverseGeocode(tempCoordinates.latitude, tempCoordinates.longitude);
      
      // Update form data with coordinates and location string
      setFormData({
        ...formData,
        latitude: tempCoordinates.latitude,
        longitude: tempCoordinates.longitude,
        location: locationString || formData.location, // Keep existing if geocoding fails
      });
      
      setShowMapPicker(false);
      
      if (locationString) {
        Alert.alert(
          'Location Saved',
          `Coordinates and location "${locationString}" saved successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Saved',
          'Coordinates saved successfully! The automatic location detection didn\'t work, but you can manually enter the city name in the location field.',
          [
            { text: 'OK' },
            { 
              text: 'Help', 
              onPress: () => Alert.alert(
                'Finding Your Location',
                'To find your city name:\n\n1. Open Google Maps\n2. Search for your coordinates\n3. Copy the city and state name\n4. Paste it in the location field',
                [{ text: 'Got it' }]
              )
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setLocationLoading(false);
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

  const handleOpenMapPicker = async () => {
    console.log('Opening map picker...');
    
    try {
      // For Android, directly get location and populate without opening modal
      if (Platform.OS === 'android') {
        setLocationLoading(true);
        
        try {
          // Try to get current location first
          const currentLocation = await getCurrentLocation();
          if (currentLocation) {
            console.log('Android: Got current location:', currentLocation);
            
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
                'Location Set',
                `Your location has been set to: "${locationString}"`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Location Set',
                'Your coordinates have been saved! You can manually enter the city name in the location field if needed.',
                [{ text: 'OK' }]
              );
            }
            
            return; // Exit early for Android
          } else {
            Alert.alert(
              'Location Error',
              'Unable to get your current location. Please try again or enter your location manually.',
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (error) {
          console.error('Android location error:', error);
          Alert.alert(
            'Location Error',
            'Failed to get your location. Please try again or enter your location manually.',
            [{ text: 'OK' }]
          );
          return;
        } finally {
          setLocationLoading(false);
        }
      }
      
      // For iOS and Web, continue with the map picker modal
      let targetLocation;
      
      // If coordinates already exist, use them
      if (formData.latitude && formData.longitude) {
        console.log('Using existing coordinates:', formData.latitude, formData.longitude);
        targetLocation = {
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
      } else {
        // Try to get current location first
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          console.log('Using current location:', currentLocation);
          targetLocation = currentLocation;
        } else {
          // Fall back to Ho Chi Minh City (since you're there)
          console.log('Using Ho Chi Minh City as default');
          targetLocation = {
            latitude: 10.7786,
            longitude: 106.7131,
          };
        }
      }
      
      // Set both temp coordinates and map region
      setTempCoordinates(targetLocation);
      setMapRegion({
        ...targetLocation,
        latitudeDelta: 0.01, // Closer zoom
        longitudeDelta: 0.01,
      });
      
      // Show the map picker
      setShowMapPicker(true);
      
    } catch (error) {
      console.error('Error opening map picker:', error);
      Alert.alert('Error', 'Failed to open map picker. Please try again.');
    }
  };

  const renderMapPicker = () => (
    <Modal
      visible={showMapPicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.mapPickerContainer}>
        <View style={styles.mapPickerHeader}>
          <TouchableOpacity
            style={styles.mapPickerCancelButton}
            onPress={() => setShowMapPicker(false)}
          >
            <Text style={styles.mapPickerCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.mapPickerTitle}>Select Location</Text>
          <TouchableOpacity
            style={styles.mapPickerConfirmButton}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.mapPickerConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
        
        {/* Debug Info - Remove in production */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Map Region: {mapRegion.latitude.toFixed(4)}, {mapRegion.longitude.toFixed(4)}
          </Text>
          <Text style={styles.debugText}>
            Temp Coords: {tempCoordinates.latitude.toFixed(4)}, {tempCoordinates.longitude.toFixed(4)}
          </Text>
        </View>
        
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMapContainer}>
              <iframe
                key={`${tempCoordinates.latitude}-${tempCoordinates.longitude}`}
                src={`https://maps.google.com/maps?q=${tempCoordinates.latitude},${tempCoordinates.longitude}&hl=en&z=15&output=embed`}
                style={{ width: '100%', height: '350px', border: 'none', borderRadius: 8 }}
                title="Location Map"
                loading="lazy"
              />
              <View style={styles.mapOverlay}>
                <TouchableOpacity
                  style={styles.openInGoogleMapsButton}
                  onPress={() => {
                    const url = `https://maps.google.com/?q=${tempCoordinates.latitude},${tempCoordinates.longitude}`;
                    if (typeof window !== 'undefined') window.open(url, '_blank');
                  }}
                >
                  <Ionicons name="open-outline" size={16} color="#059669" />
                  <Text style={styles.openInGoogleMapsText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // MOBILE: Show a real MapView
            <PlatformMap
              style={{ height: 350, width: '100%' }}               // ensure non-zero height!
              initialRegion={{
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
                latitudeDelta: mapRegion.latitudeDelta,
                longitudeDelta: mapRegion.longitudeDelta,
              }}
              region={{
                latitude: tempCoordinates.latitude,
                longitude: tempCoordinates.longitude,
                latitudeDelta: mapRegion.latitudeDelta,
                longitudeDelta: mapRegion.longitudeDelta,
              }}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setTempCoordinates({ latitude, longitude });
              }}
              onMapReady={() => console.log('Map ready')}
              onRegionChangeComplete={(r) => setMapRegion(r)}
            >
              <PlatformMarker
                coordinate={{
                  latitude: tempCoordinates.latitude,
                  longitude: tempCoordinates.longitude,
                }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setTempCoordinates({ latitude, longitude });
                }}
              />
            </PlatformMap>
          )}
          
          <View style={styles.coordinateInputsSection}>
            <Text style={styles.coordinateInputsTitle}>
              📍 Set Location Coordinates
            </Text>
            <View style={styles.webCoordinateInputs}>
              <View style={styles.coordinateInputContainer}>
                <Text style={styles.coordinateLabel}>Latitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  placeholder="10.7786"
                  value={tempCoordinates.latitude.toString()}
                  onChangeText={(text) => {
                    const lat = parseFloat(text) || 0;
                    setTempCoordinates({...tempCoordinates, latitude: lat});
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.coordinateInputContainer}>
                <Text style={styles.coordinateLabel}>Longitude</Text>
                <TextInput
                  style={styles.coordinateInput}
                  placeholder="106.7131"
                  value={tempCoordinates.longitude.toString()}
                  onChangeText={(text) => {
                    const lng = parseFloat(text) || 0;
                    setTempCoordinates({...tempCoordinates, longitude: lng});
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            {previewLocation ? (
              <View style={styles.locationPreview}>
                <View style={styles.locationPreviewHeader}>
                  {geocodingLoading ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <Ionicons name="location" size={16} color="#059669" />
                  )}
                  <Text style={styles.locationPreviewTitle}>
                    {geocodingLoading ? 'Finding location...' : 'Detected Location:'}
                  </Text>
                </View>
                {!geocodingLoading && (
                  <Text style={styles.locationPreviewText}>{previewLocation}</Text>
                )}
              </View>
            ) : null}
            
            <View style={styles.coordinateHelper}>
              <Text style={styles.coordinateHelperText}>
                💡 Adjust the coordinates above to see the map and location update in real-time. You can also click "Open in Google Maps" to find your exact location.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.mapPickerFooter}>
          <TouchableOpacity
            style={styles.useMyLocationButton}
            onPress={async () => {
              const currentLocation = await getCurrentLocation();
              if (currentLocation) {
                setTempCoordinates(currentLocation);
                setMapRegion({
                  ...currentLocation,
                  latitudeDelta: 0.01, // Smaller delta for more zoom
                  longitudeDelta: 0.01,
                });
                
                // Auto-reverse geocode when location is obtained
                try {
                  const locationString = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
                  if (locationString) {
                    console.log('Auto-populated location from GPS:', locationString);
                    // Show a preview of what location will be set
                    Alert.alert(
                      'Location Detected',
                      `Found location: "${locationString}". This will be saved when you confirm.`,
                      [{ text: 'OK' }]
                    );
                  }
                } catch (error) {
                  console.error('Auto-reverse geocoding failed:', error);
                }
              }
            }}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Ionicons name="locate" size={20} color="#059669" />
            )}
            <Text style={styles.useMyLocationText}>
              {locationLoading ? 'Getting Location...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.mapPickerInstructionsText}>
            Tap on the map to select your coaching location or drag the marker
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isEditMode ? 'Edit Your Coach Profile' : 'Create Your Coach Profile'}
      </Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveCoach}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Update' : 'Save'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderMapPicker()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Earn More with PicklePro</Text>
            <Text style={styles.introDescription}>
              Share your pickleball expertise and help others improve their game. Fill out your profile to get started.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Email Address *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="your@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={false} // Pre-filled from auth user
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Tell us about your background, experience, and coaching philosophy..."
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Professional Details</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>DUPR Rating</Text>
              <Text style={styles.formDescription}>
                {userProfile?.dupr_rating 
                  ? 'Auto-populated from your profile. You can edit if needed (x.xxx format)'
                  : 'Enter your rating in x.xxx format (e.g., 4.125, 3.750)'
                }
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="4.125"
                value={formData.duprRating}
                onChangeText={(text) => {
                  // Allow only numbers and decimal point
                  const cleanedText = text.replace(/[^0-9.]/g, '');
                  
                  // Ensure only one decimal point
                  const parts = cleanedText.split('.');
                  if (parts.length > 2) {
                    return; // Don't update if more than one decimal point
                  }
                  
                  // Limit to x.xxx format (one digit before decimal, up to 3 after)
                  if (parts[0] && parts[0].length > 1) {
                    parts[0] = parts[0].slice(0, 1); // Keep only first digit before decimal
                  }
                  if (parts[1] && parts[1].length > 3) {
                    parts[1] = parts[1].slice(0, 3); // Keep only 3 digits after decimal
                  }
                  
                  const formattedText = parts.join('.');
                  
                  // Validate range (DUPR ratings are typically 1.000 to 8.000)
                  const numValue = parseFloat(formattedText);
                  if (formattedText !== '' && (isNaN(numValue) || numValue < 1 || numValue > 8)) {
                    return; // Don't update if outside valid range
                  }
                  
                  setFormData({...formData, duprRating: formattedText});
                }}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                maxLength={5} // x.xxx = 5 characters max
              />
              {formData.duprRating && (
                <Text style={styles.duprValidationText}>
                  {(() => {
                    const rating = parseFloat(formData.duprRating);
                    if (isNaN(rating)) return '❌ Invalid format';
                    if (rating < 1 || rating > 8) return '❌ Rating must be between 1.000 and 8.000';
                    return `✅ Valid DUPR rating: ${rating.toFixed(3)}`;
                  })()}
                </Text>
              )}
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Hourly Rate ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="75"
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData({...formData, hourlyRate: text})}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                placeholder="City, State"
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.mapPickerButton}
                onPress={handleOpenMapPicker}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Ionicons name="location-outline" size={20} color="#059669" />
                )}
                <Text style={styles.mapPickerButtonText}>
                  {locationLoading 
                    ? 'Getting Location...' 
                    : formData.latitude && formData.longitude 
                      ? (Platform.OS === 'android' ? 'Update My Location' : 'Update Map Location')
                      : (Platform.OS === 'android' ? 'Get My Location' : 'Set Map Location')
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
              <Text style={styles.formLabel}>Coaching Radius</Text>
              <Text style={styles.formDescription}>How far are you willing to travel for coaching sessions?</Text>
              <View style={styles.radiusSelector}>
                <View style={styles.radiusSliderContainer}>
                  <Text style={styles.radiusValue}>
                    {formData.coachingRadius < 1 
                      ? `${Math.round(formData.coachingRadius * 1000)}m` 
                      : `${formData.coachingRadius}km`}
                  </Text>
                  <View style={styles.radiusSlider}>
                    {/* Custom slider using buttons for better cross-platform compatibility */}
                    <View style={styles.radiusOptions}>
                      {[0.5, 1, 2, 5, 10, 15, 20, 30].map(radius => (
                        <TouchableOpacity
                          key={radius}
                          style={[
                            styles.radiusOption,
                            formData.coachingRadius === radius && styles.radiusOptionSelected
                          ]}
                          onPress={() => setFormData({...formData, coachingRadius: radius})}
                        >
                          <Text style={[
                            styles.radiusOptionText,
                            formData.coachingRadius === radius && styles.radiusOptionTextSelected
                          ]}>
                            {radius < 1 ? `${Math.round(radius * 1000)}m` : `${radius}km`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Specialties</Text>
              <Text style={styles.formDescription}>Select your areas of expertise</Text>
              <View style={styles.specialtyPicker}>
                {['Technique', 'Mental Game', 'Beginners', 'Advanced', 'Competition', 'Youth', 'Fitness', 'Strategy'].map(specialty => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.specialtyOption,
                      formData.specialties.includes(specialty) && styles.specialtyOptionSelected
                    ]}
                    onPress={() => {
                      const newSpecialties = formData.specialties.includes(specialty)
                        ? formData.specialties.filter(s => s !== specialty)
                        : [...formData.specialties, specialty];
                      setFormData({...formData, specialties: newSpecialties});
                    }}
                  >
                    <Text style={[
                      styles.specialtyOptionText,
                      formData.specialties.includes(specialty) && styles.specialtyOptionTextSelected
                    ]}>{specialty}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Availability & Visibility</Text>
            
            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isActive && styles.checkboxChecked]}
                  onPress={() => {
                    console.log('Toggling isActive from', formData.isActive, 'to', !formData.isActive);
                    setFormData({...formData, isActive: !formData.isActive});
                  }}
                >
                  {formData.isActive && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Available for new students</Text>
              </View>
            </View>

            <View style={styles.formField}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, formData.isAcceptingStudents && styles.checkboxChecked]}
                  onPress={() => setFormData({...formData, isAcceptingStudents: !formData.isAcceptingStudents})}
                >
                  {formData.isAcceptingStudents && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxLabel}>Publish my profile in the coach directory</Text>
                  <Text style={styles.checkboxDescription}>
                    When checked, your profile will be visible to students looking for coaches. You can change this anytime.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.disclaimerSection}>
            <View style={styles.disclaimerCard}>
              <ModernIcon name="help" size={20} color="#059669" />
              <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerTitle}>Profile Review & Publishing</Text>
                <Text style={styles.disclaimerText}>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
      web: { outline: 'none' }
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
});