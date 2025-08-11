import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
// Web map for route page
let RouteMapWeb: any;
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  RouteMapWeb = require('./RouteMap.web').default;
}
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, Route, RoutePoint } from '../types/bathroom';
import { reverseGeocodeAsync } from '../services/reverseGeocode';
import { LinearGradient } from 'expo-linear-gradient';
function RouteScreen() {
  const { location } = useLocation();
  const [startLocation, setStartLocation] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [startLocationEdited, setStartLocationEdited] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [endLocation, setEndLocation] = useState('');
  const [routeBathrooms, setRouteBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  // Typeahead for end location
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const endInputRef = useRef(null);

  useEffect(() => {
    // Load all bathrooms for typeahead
    async function fetchBathrooms() {
      // Use mock location if not available
      const lat = location?.coords.latitude || 40.7580;
      const lng = location?.coords.longitude || -73.9855;
      // Load all bathrooms for typeahead (ignore distance)
      const results = await BathroomService.searchNearby(lat, lng, {
        maxDistance: 1000000, // 1000km, effectively disables distance filter
        isFree: false,
        isAccessible: false,
        hasChangingTable: false,
        isOpen: false,
        minRating: 0,
      });
      setBathrooms(results);
    }
    fetchBathrooms();
  }, [location]);

  const getSuggestions = () => {
    if (!endLocation.trim()) return [];
    return bathrooms
      .filter(bathroom =>
        bathroom.name.toLowerCase().includes(endLocation.toLowerCase()) ||
        bathroom.address.toLowerCase().includes(endLocation.toLowerCase())
      )
      .slice(0, 5);
  };

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
        setEndLocation(suggestions[activeSuggestion].name);
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
    if (Platform.OS === 'web' && endInputRef.current) {
      // @ts-ignore
      const node = endInputRef.current._inputElement || endInputRef.current;
      if (!node) return;
      const listener = (e: KeyboardEvent) => handleKeyDown(e);
      node.addEventListener('keydown', listener);
      return () => node.removeEventListener('keydown', listener);
    }
  }, [showSuggestions, activeSuggestion, endLocation, bathrooms]);

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
    const fetchAddress = async () => {
      console.log('Location object:', location);
      if (location) {
        setAddressLoading(true);
        const addr = await reverseGeocodeAsync(location.coords.latitude, location.coords.longitude);
        console.log('Reverse geocode result:', addr);
        setCurrentAddress(addr);
        setAddressLoading(false);
        // Only set startLocation if user hasn't edited it
        setStartLocation(prev => (startLocationEdited ? prev : addr));
      } else {
        setCurrentAddress('');
        setStartLocation('');
        setAddressLoading(false);
      }
    };
    fetchAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const planRoute = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Error', 'Please enter both start and end locations');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would use a routing service like Google Directions API
      // For now, we'll simulate finding bathrooms along a route
      const bathrooms = await BathroomService.searchAlongRoute(
        location.coords.latitude,
        location.coords.longitude,
        // Mock end coordinates (in real app, geocode the end location)
        location.coords.latitude + 0.01,
        location.coords.longitude + 0.01,
        {
          maxDistance: 10000, // 10km
          isFree: false,
          isAccessible: false,
          hasChangingTable: false,
          isOpen: true,
          minRating: 0,
        }
      );

      setRouteBathrooms(bathrooms);

      // Create a mock route
      const mockRoute: Route = {
        id: Date.now().toString(),
        startPoint: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          name: startLocation,
          type: 'start',
        },
        endPoint: {
          latitude: location.coords.latitude + 0.01,
          longitude: location.coords.longitude + 0.01,
          name: endLocation,
          type: 'end',
        },
        bathrooms: bathrooms,
        totalDistance: 1500, // Mock distance in meters
        estimatedTime: 20, // Mock time in minutes
        createdAt: new Date().toISOString(),
      };

      setCurrentRoute(mockRoute);
    } catch (error) {
      Alert.alert('Error', 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (location) {
      setStartLocation('Current Location');
    }
  };

  const getRouteSummary = () => {
    if (!currentRoute) return null;

    return (
      <View style={styles.routeSummary}>
        <Text style={styles.routeSummaryTitle}>Route Summary</Text>
        <View style={styles.routeInfo}>
          <View style={styles.routeInfoItem}>
            <Ionicons name="location" size={16} color="#4A90E2" />
            <Text style={styles.routeInfoText}>
              Start: {currentRoute.startPoint.name}
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="flag" size={16} color="#FF6B6B" />
            <Text style={styles.routeInfoText}>
              End: {currentRoute.endPoint.name}
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="map" size={16} color="#50C878" />
            <Text style={styles.routeInfoText}>
              Distance: {currentRoute.totalDistance}m
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="time" size={16} color="#FFD700" />
            <Text style={styles.routeInfoText}>
              Time: {currentRoute.estimatedTime} min
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getBathroomCard = (bathroom: Bathroom, index: number) => (
    <View key={bathroom.id} style={styles.bathroomCard}>
      <View style={styles.bathroomHeader}>
        <View style={styles.bathroomNumber}>
          <Text style={styles.bathroomNumberText}>{index + 1}</Text>
        </View>
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
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan Your Route</Text>
        <Text style={styles.headerSubtitle}>
          Find bathrooms along your journey
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Start Location</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={addressLoading ? 'Fetching address…' : (startLocation || (!addressLoading && !currentAddress ? 'Address not available' : startLocation))}
              editable={!addressLoading}
              onChangeText={text => {
                setStartLocation(text);
                setStartLocationEdited(true);
              }}
              placeholder="Enter start location"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={async () => {
                if (location) {
                  const addr = await reverseGeocodeAsync(location.coords.latitude, location.coords.longitude);
                  setCurrentAddress(addr);
                  setStartLocation(addr);
                }
              }}
            >
              <Ionicons name="location" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>End Location</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              ref={endInputRef}
              style={styles.textInput}
              value={endLocation}
              onChangeText={text => {
                setEndLocation(text);
                setShowSuggestions(!!text);
                setActiveSuggestion(0);
              }}
              placeholder="Enter destination"
              placeholderTextColor="#999"
              onFocus={() => setShowSuggestions(!!endLocation)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              // onKeyPress removed; handled by real DOM event for web
            />
            {showSuggestions && getSuggestions().length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {getSuggestions().map((suggestion, idx) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[styles.suggestionItem, idx === activeSuggestion && styles.suggestionItemActive]}
                    onPress={() => {
                      setEndLocation(suggestion.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionText}>
                      {highlightMatch(suggestion.name, endLocation)}
                    </Text>
                    <Text style={styles.suggestionSubText}>
                      {highlightMatch(suggestion.address, endLocation)}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.suggestionPowered}><Ionicons name="logo-google" size={14} color="#888" /><Text style={styles.suggestionPoweredText}>Suggestions</Text></View>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.planButton}
          onPress={planRoute}
          disabled={loading}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.planButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="map" size={20} color="white" />
                <Text style={styles.planButtonText}>Plan Route</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {currentRoute && getRouteSummary()}


      {routeBathrooms.length > 0 && (
        <View style={styles.bathroomsSection}>
          <Text style={styles.sectionTitle}>
            Bathrooms Along Route ({routeBathrooms.length})
          </Text>
          {routeBathrooms.map((bathroom, index) => 
            getBathroomCard(bathroom, index)
          )}
        </View>
      )}

      {/* Show map for route on web */}
      {typeof window !== 'undefined' && Platform.OS === 'web' && (
        <RouteMapWeb
          start={currentRoute?.startPoint}
          end={currentRoute?.endPoint}
          bathrooms={routeBathrooms}
        />
      )}

      {!loading && !currentRoute && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>
            Enter your start and end locations to plan a route with bathroom stops
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  inputContainer: {
    backgroundColor: 'white',
    margin: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  currentLocationButton: {
    marginLeft: 12,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  planButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  planButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  planButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  routeSummary: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
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
  routeSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeInfo: {
    gap: 12,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  bathroomsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  bathroomNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bathroomNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bathroomInfo: {
    flex: 1,
  },
  bathroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bathroomAddress: {
    fontSize: 14,
    color: '#666',
  },
  bathroomRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
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

export default RouteScreen;
