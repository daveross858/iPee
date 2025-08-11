import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { reverseGeocodeAsync } from '../services/reverseGeocode';
import { Bathroom, SearchFilters } from '../types/bathroom';
import { LinearGradient } from 'expo-linear-gradient';

// Web map imports
// Web map components (typed as any to avoid TS errors)
let MapContainer: any, TileLayer: any, WebMarker: any, Popup: any;
// Native map components
let MapView: any, NativeMarker: any, Callout: any;
if (Platform.OS === 'web') {
  // Only require on web to avoid breaking native
  // @ts-ignore
  ({ MapContainer, TileLayer, Marker: WebMarker, Popup } = require('react-leaflet'));
  // Import leaflet CSS
  require('leaflet/dist/leaflet.css');
} else {
  // Only require on native to avoid breaking web
  // @ts-ignore
  ({ default: MapView, Marker: NativeMarker, Callout } = require('react-native-maps'));
}

export default function MapScreen() {
  const { location } = useLocation();
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    maxDistance: 5000, // 5km
    isFree: false,
    isAccessible: false,
    hasChangingTable: false,
    isOpen: true,
    minRating: 0,
  });

  // Address for current location
  const [currentAddress, setCurrentAddress] = useState<string>('');

  useEffect(() => {
    const fetchAddress = async () => {
      if (location) {
        const addr = await reverseGeocodeAsync(location.coords.latitude, location.coords.longitude);
        setCurrentAddress(addr);
      } else {
        setCurrentAddress('');
      }
    };
    fetchAddress();
  }, [location]);

  useEffect(() => {
    if (location) {
      searchBathrooms();
    }
  }, [location, filters]);

  const searchBathrooms = async () => {
    if (!location) return;
    
    setLoading(true);
    try {
      const results = await BathroomService.searchNearby(
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

  const toggleFilter = (key: keyof SearchFilters) => {
    if (key === 'maxDistance') return;
    
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

  const getMarkerColor = (bathroom: Bathroom) => {
    if (!bathroom.isOpen) return '#FF6B6B';
    if (bathroom.isFree) return '#50C878';
    return '#4A90E2';
  };

  const getMarkerIcon = (bathroom: Bathroom) => {
    if (!bathroom.isOpen) return 'close-circle';
    if (bathroom.isAccessible) return 'accessibility';
    if (bathroom.hasChangingTable) return 'baby';
    return 'water';
  };

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  // Filters UI (shared)
  const filtersUI = (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, filters.isFree && styles.filterChipActive]}
          onPress={() => toggleFilter('isFree')}
        >
          <Ionicons 
            name="card" 
            size={16} 
            color={filters.isFree ? 'white' : '#4A90E2'} 
          />
          <Text style={[styles.filterText, filters.isFree && styles.filterTextActive]}>
            Free
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
          <Text style={[styles.filterText, filters.isAccessible && styles.filterTextActive]}>
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
          <Text style={[styles.filterText, filters.hasChangingTable && styles.filterTextActive]}>
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
          <Text style={[styles.filterText, filters.isOpen && styles.filterTextActive]}>
            Open Now
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.distanceContainer}>
        <Text style={styles.distanceLabel}>Max Distance: {filters.maxDistance / 1000}km</Text>
        <View style={styles.distanceSlider}>
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
    </View>
  );

  // Results info (shared)
  const resultsInfo = (
    <View style={styles.resultsInfo}>
      <Text style={styles.resultsText}>
        Found {bathrooms.length} bathroom{bathrooms.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  // Loading overlay (shared)
  const loadingOverlay = loading && (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.loadingText}>Searching for bathrooms...</Text>
    </View>
  );


  if (Platform.OS === 'web') {
    // Web: Use react-leaflet
    return (
      <View style={styles.container}>
        {currentAddress ? (
          <View style={styles.addressBar}>
            <Ionicons name="location" size={18} color="#4A90E2" style={{ marginRight: 6 }} />
            <Text style={styles.addressText}>{currentAddress}</Text>
          </View>
        ) : null}
        {filtersUI}
        <View style={{ flex: 1, minHeight: 400 }}>
          <MapContainer
            center={[location.coords.latitude, location.coords.longitude]}
            zoom={15}
            style={{ height: '400px', width: '100%', borderRadius: 16 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {bathrooms.map((bathroom) => (
              <WebMarker
                key={bathroom.id}
                position={[bathroom.latitude, bathroom.longitude]}
              >
                <Popup>
                  <div>
                    <strong>{bathroom.name}</strong><br />
                    {bathroom.address}<br />
                    Rating: {bathroom.rating?.toFixed(1) || 'N/A'}<br />
                    Distance: {(bathroom.distance || 0) / 1000}km<br />
                    {bathroom.isFree && <span>Free<br /></span>}
                    {bathroom.isAccessible && <span>Accessible<br /></span>}
                    {bathroom.hasChangingTable && <span>Changing Table<br /></span>}
                  </div>
                </Popup>
              </WebMarker>
            ))}
          </MapContainer>
        </View>
        {loadingOverlay}
        {resultsInfo}
      </View>
    );
  }

  // Native: Use react-native-maps
  return (
    <View style={styles.container}>
      {currentAddress ? (
        <View style={styles.addressBar}>
          <Ionicons name="location" size={18} color="#4A90E2" style={{ marginRight: 6 }} />
          <Text style={styles.addressText}>{currentAddress}</Text>
        </View>
      ) : null}
      {filtersUI}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {bathrooms.map((bathroom) => (
          <NativeMarker
            key={bathroom.id}
            coordinate={{
              latitude: bathroom.latitude,
              longitude: bathroom.longitude,
            }}
            pinColor={getMarkerColor(bathroom)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{bathroom.name}</Text>
                <Text style={styles.calloutAddress}>{bathroom.address}</Text>
                <View style={styles.calloutDetails}>
                  <View style={styles.calloutDetail}>
                    <Ionicons 
                      name="star" 
                      size={14} 
                      color="#FFD700" 
                    />
                    <Text style={styles.calloutDetailText}>
                      {bathroom.rating?.toFixed(1) || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.calloutDetail}>
                    <Ionicons 
                      name="location" 
                      size={14} 
                      color="#4A90E2" 
                    />
                    <Text style={styles.calloutDetailText}>
                      {(bathroom.distance || 0) / 1000}km
                    </Text>
                  </View>
                </View>
                <View style={styles.calloutFeatures}>
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
            </Callout>
          </NativeMarker>
        ))}
      </MapView>
      {loadingOverlay}
      {resultsInfo}
    </View>
  );
}

const styles = StyleSheet.create({
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
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
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  distanceContainer: {
    marginTop: 16,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  distanceSlider: {
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
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  calloutContainer: {
    width: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calloutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  calloutFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  featureTagText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
});
