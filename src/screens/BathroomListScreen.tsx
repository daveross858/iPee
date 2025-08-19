import React, { useState, useEffect, useRef } from 'react';
// ...existing code...
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  // @ts-ignore
  ({ MapView, Marker, PROVIDER_GOOGLE } = require('react-native-maps'));
}
import { Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, SearchFilters } from '../types/bathroom';
import { LinearGradient } from 'expo-linear-gradient';

const MAP_HEIGHT = 220;
export default function BathroomListScreen() {
  const { location } = useLocation();
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [filteredBathrooms, setFilteredBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    maxDistance: 10000, // 10km
    isFree: false,
    isAccessible: false,
    hasChangingTable: false,
    isOpen: true,
    minRating: 0,
  });

  // For typeahead suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const getSuggestions = () => {
    if (!searchQuery.trim()) return [];
    return bathrooms
      .filter(bathroom =>
        bathroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bathroom.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  };

  // Keyboard navigation for suggestions
  // Keyboard navigation for suggestions
  const handleKeyDown = (e: any) => {
    const suggestions = getSuggestions();
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
      e.preventDefault && e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      e.preventDefault && e.preventDefault();
    } else if (e.key === 'Enter') {
      if (suggestions[activeSuggestion]) {
        setSearchQuery(suggestions[activeSuggestion].name);
        setShowSuggestions(false);
        e.preventDefault && e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      e.preventDefault && e.preventDefault();
    }
  };

  // Attach real keydown event for web
  useEffect(() => {
    if (Platform.OS === 'web' && inputRef.current) {
      // @ts-ignore
      const node = inputRef.current._inputElement || inputRef.current;
      if (!node) return;
      const listener = (e: KeyboardEvent) => handleKeyDown(e);
      node.addEventListener('keydown', listener);
      return () => node.removeEventListener('keydown', listener);
    }
  }, [showSuggestions, activeSuggestion, searchQuery, bathrooms]);

  // Highlight match helper
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <Text style={styles.suggestionHighlight}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </>
    );
  };

  useEffect(() => {
    if (location) {
      searchBathrooms();
    }
  }, [location, filters]);

  useEffect(() => {
    filterBathrooms();
  }, [bathrooms, searchQuery]);

  const searchBathrooms = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const results = await BathroomService.searchNearbyFirestore(
        location.coords.latitude,
        location.coords.longitude,
        filters
      );
      setBathrooms(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search for bathrooms');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchBathrooms();
    setRefreshing(false);
  };


  // Synonym map for bathroom search
  const BATHROOM_SYNONYMS = [
    'bathroom', 'restroom', 'public restroom', 'toilet', 'washroom', 'wc', 'lavatory', 'loo', 'public toilet', 'men', 'women', 'gender neutral', 'accessible', 'family restroom', 'changing table'
  ];

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, '');

  const filterBathrooms = () => {
    let filtered = bathrooms;

    if (searchQuery.trim()) {
      const query = normalize(searchQuery);
      // If the query matches a synonym, search for all synonyms
      const matchedSynonyms = BATHROOM_SYNONYMS.filter(syn => query.includes(syn));
      const terms = matchedSynonyms.length > 0 ? matchedSynonyms : [query];

      filtered = filtered.filter(bathroom => {
        const name = normalize(bathroom.name);
        const address = normalize(bathroom.address);
        // Match if any term is in name or address
        return terms.some(term => name.includes(term) || address.includes(term));
      });
    }

    setFilteredBathrooms(filtered);
  };

  const toggleFilter = (key: keyof SearchFilters) => {
    if (key === 'maxDistance' || key === 'minRating') return;
    
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateDistance = (distance: number) => {
    setFilters(prev => ({
      ...prev,
      maxDistance: distance,
    }));
  };

  const updateRating = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: rating,
    }));
  };

  const getBathroomCard = (bathroom: Bathroom) => (
    <TouchableOpacity
      key={bathroom.id}
      style={styles.bathroomCard}
      onPress={() => {
        // In a real app, navigate to bathroom details
        Alert.alert(bathroom.name, bathroom.address);
      }}
    >
      <View style={styles.bathroomHeader}>
        <View style={styles.bathroomInfo}>
          <Text style={styles.bathroomName}>{bathroom.name}</Text>
          <Text style={styles.bathroomAddress}>{bathroom.address}</Text>
        </View>
        <View style={styles.bathroomRating}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {bathroom.rating?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.bathroomDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#4A90E2" />
            <Text style={styles.detailText}>
              {(bathroom.distance || 0) / 1000}km away
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#50C878" />
            <Text style={styles.detailText}>
              {bathroom.hours || 'Hours N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.bathroomFeatures}>
          {bathroom.isFree && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Free</Text>
            </View>
          )}
          {bathroom.isAccessible && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Accessible</Text>
            </View>
          )}
          {bathroom.hasChangingTable && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Changing Table</Text>
            </View>
          )}
          {!bathroom.isOpen && (
            <View style={[styles.featureTag, styles.closedTag]}>
              <Text style={styles.featureTagText}>Closed</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getFilterSection = () => (
    <View style={styles.filtersSection}>
      <Text style={styles.sectionTitle}>Filters</Text>
      
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Max Distance:</Text>
        <View style={styles.distanceOptions}>
          {[1, 2, 5, 10].map((km) => (
            <TouchableOpacity
              key={km}
              style={[
                styles.distanceOption,
                filters.maxDistance === km * 1000 && styles.distanceOptionActive
              ]}
              onPress={() => updateDistance(km * 1000)}
            >
              <Text style={[
                styles.distanceOptionText,
                filters.maxDistance === km * 1000 && styles.distanceOptionTextActive
              ]}>
                {km}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Min Rating:</Text>
        <View style={styles.ratingOptions}>
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingOption,
                filters.minRating === rating && styles.ratingOptionActive
              ]}
              onPress={() => updateRating(rating)}
            >
              <Text style={[
                styles.ratingOptionText,
                filters.minRating === rating && styles.ratingOptionTextActive
              ]}>
                {rating === 0 ? 'Any' : rating}+
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterChips}>
        <TouchableOpacity
          style={[styles.filterChip, filters.isFree && styles.filterChipActive]}
          onPress={() => toggleFilter('isFree')}
        >
          <Ionicons 
            name="card" 
            size={16} 
            color={filters.isFree ? 'white' : '#4A90E2'} 
          />
          <Text style={[styles.filterChipText, filters.isFree && styles.filterChipTextActive]}>
            Free Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.isAccessible && styles.filterChipActive]}
          onPress={() => toggleFilter('isAccessible')}
        >
          <Ionicons 
            name="accessibility" 
            size={16} 
            color={filters.isAccessible ? 'white' : '#4A90E2'} 
          />
          <Text style={[styles.filterChipText, filters.isAccessible && styles.filterChipTextActive]}>
            Accessible
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.hasChangingTable && styles.filterChipActive]}
          onPress={() => toggleFilter('hasChangingTable')}
        >
          <Ionicons 
            name="woman" 
            size={16} 
            color={filters.hasChangingTable ? 'white' : '#4A90E2'} 
          />
          <Text style={[styles.filterChipText, filters.hasChangingTable && styles.filterChipTextActive]}>
            Changing Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filters.isOpen && styles.filterChipActive]}
          onPress={() => toggleFilter('isOpen')}
        >
          <Ionicons 
            name="time" 
            size={16} 
            color={filters.isOpen ? 'white' : '#4A90E2'} 
          />
          <Text style={[styles.filterChipText, filters.isOpen && styles.filterChipTextActive]}>
            Open Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.container}>

      {/* Map with markers (native only) */}
      {Platform.OS !== 'web' && MapView && (
        <MapView
          style={{ width: '100%', height: MAP_HEIGHT }}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          region={initialRegion}
          showsUserLocation
        >
          {filteredBathrooms.map(bathroom => (
            <Marker
              key={bathroom.id}
              coordinate={{ latitude: bathroom.latitude, longitude: bathroom.longitude }}
              title={bathroom.name}
              description={bathroom.address}
            />
          ))}
        </MapView>
      )}

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.headerTitle}>Nearby Bathrooms</Text>
            <Text style={styles.headerSubtitle}>
              Find the perfect bathroom for your needs
            </Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#4A90E2', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 12 }}
            onPress={onRefresh}
            disabled={loading || refreshing}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{loading || refreshing ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
      </View>


      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              setShowSuggestions(!!text);
              setActiveSuggestion(0);
            }}
            placeholder="Search bathrooms..."
            placeholderTextColor="#999"
            onFocus={() => setShowSuggestions(!!searchQuery)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            // onKeyPress removed; handled by real DOM event for web
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {showSuggestions && getSuggestions().length > 0 && (
          <View style={styles.suggestionsDropdown}>
            {getSuggestions().map((suggestion, idx) => (
              <TouchableOpacity
                key={suggestion.id}
                style={[styles.suggestionItem, idx === activeSuggestion && styles.suggestionItemActive]}
                onPress={() => {
                  setSearchQuery(suggestion.name);
                  setShowSuggestions(false);
                }}
              >
                <Text style={styles.suggestionText}>
                  {highlightMatch(suggestion.name, searchQuery)}
                </Text>
                <Text style={styles.suggestionSubText}>
                  {highlightMatch(suggestion.address, searchQuery)}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.suggestionPowered}><Ionicons name="logo-google" size={14} color="#888" /><Text style={styles.suggestionPoweredText}>Suggestions</Text></View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilterSection()}

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>
              Results ({filteredBathrooms.length})
            </Text>
            {loading && <ActivityIndicator size="small" color="#4A90E2" />}
          </View>

          {filteredBathrooms.length > 0 ? (
            filteredBathrooms.map(bathroom => getBathroomCard(bathroom))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#CCC" />
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() 
                  ? 'No bathrooms match your search'
                  : 'No bathrooms found nearby'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#FFF',
    flexDirection: 'column',
  },
  suggestionItemActive: {
    backgroundColor: '#F0F6FF',
  },
  suggestionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  suggestionSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  suggestionHighlight: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  suggestionPowered: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'flex-end',
    backgroundColor: '#F9F9F9',
  },
  suggestionPoweredText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  filtersSection: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  distanceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  distanceOptionActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  distanceOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  distanceOptionTextActive: {
    color: 'white',
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ratingOptionActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingOptionTextActive: {
    color: 'white',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  resultsSection: {
    margin: 20,
    marginTop: 0,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bathroomCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bathroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bathroomInfo: {
    flex: 1,
    marginRight: 12,
  },
  bathroomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bathroomAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bathroomRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '600',
    marginLeft: 4,
  },
  bathroomDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  bathroomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  closedTag: {
    backgroundColor: '#FF6B6B',
  },
  featureTagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});
