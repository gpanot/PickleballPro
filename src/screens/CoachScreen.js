import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebIcon from '../components/WebIcon';
import ModernIcon from '../components/ModernIcon';

import { coaches } from '../data/mockData';

export default function CoachScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('Rating');
  const insets = useSafeAreaInsets();
  
  const specialtyFilters = ['Beginners', 'Technique', 'Strategy', 'Mental Game', 'Tournament Prep', 'Fitness'];
  const sortOptions = ['Rating', 'Price', 'Location'];
  
  const filteredAndSortedCoaches = coaches
    .filter(coach => {
      const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           coach.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = selectedFilters.length === 0 || 
                            selectedFilters.some(filter => coach.specialties.includes(filter));
      
      return matchesSearch && matchesFilters;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Rating':
          return b.rating - a.rating; // Highest rating first
        case 'Price':
          return a.hourlyRate - b.hourlyRate; // Lowest price first
        case 'Location':
          return a.location.localeCompare(b.location); // Alphabetical order
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

  const handleContactCoach = (coach) => {
    Alert.alert(
      'Contact Coach',
      `Would you like to contact ${coach.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Message', onPress: () => Alert.alert('Feature Coming Soon', 'Messaging feature will be available in the next update.') },
        { text: 'Call', onPress: () => Alert.alert('Feature Coming Soon', 'Calling feature will be available in the next update.') },
      ]
    );
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
                sortBy === option && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option && styles.sortButtonTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <WebIcon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
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
            <Text style={[
              styles.filterChipText,
              selectedFilters.includes(filter) && styles.filterChipTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCoachCard = (coach) => (
    <View key={coach.id} style={styles.coachCard}>
      <View style={styles.coachHeader}>
        <View style={styles.coachAvatar}>
          <Text style={styles.coachAvatarText}>
            {coach.name.split(' ').map(n => n[0]).join('')}
          </Text>
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
        <Text style={styles.locationText}>{coach.location}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={() => handleContactCoach(coach)}
      >
        <Text style={styles.contactButtonText}>Contact Coach</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Find Your Perfect Coach</Text>
          <Text style={styles.headerSubtitle}>
            Connect with certified pickleball coaches in your area
          </Text>
        </View>
        {renderSearchAndFilters()}
        {renderSortOptions()}
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredAndSortedCoaches.length} {filteredAndSortedCoaches.length === 1 ? 'coach' : 'coaches'} found
          </Text>
          
          {filteredAndSortedCoaches.map(renderCoachCard)}
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerSafeArea: {
    backgroundColor: '#F9FAFB',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
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
  filtersContainer: {
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
});
