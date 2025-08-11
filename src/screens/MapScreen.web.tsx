import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, SearchFilters } from '../types/bathroom';
// Web map imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// Custom icon for user location (blue dot)
const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Button to recenter map on user location
function LocateButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #4A90E2',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#4A90E2',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
      onClick={() => map.setView([lat, lng], 15)}
      title="Center on your location"
    >
      📍 My Location
    </button>
  );
}
import 'leaflet/dist/leaflet.css';


export default function MapScreen() {
  // Force browser scroll on body for web
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.body.style.overflowY = 'scroll';
    }
    return () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        document.body.style.overflowY = '';
      }
    };
  }, []);
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

  useEffect(() => {
    if (location) {
      searchBathrooms();
    }
  }, [location, filters]);

  // Debug: log location and bathrooms
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('Location:', location);
    // eslint-disable-next-line no-console
    console.log('Bathrooms:', bathrooms);
  }, [location, bathrooms]);

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

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  // Fallback: If location is present but map doesn't render, show debug info
  if (!location.coords || typeof location.coords.latitude !== 'number' || typeof location.coords.longitude !== 'number') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location data is invalid or unavailable.</Text>
        <Text selectable style={{ color: '#333', marginTop: 10, fontSize: 12 }}>
          {JSON.stringify(location, null, 2)}
        </Text>
      </View>
    );
  }

  const filtersUI = (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, filters.isFree && styles.filterChipActive]}
          onPress={() => toggleFilter('isFree')}
        >
          <Ionicons name="card" size={16} color={filters.isFree ? 'white' : '#4A90E2'} />
          <Text style={[styles.filterText, filters.isFree && styles.filterTextActive]}>Free</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.isAccessible && styles.filterChipActive]}
          onPress={() => toggleFilter('isAccessible')}
        >
          <Ionicons name="accessibility" size={16} color={filters.isAccessible ? 'white' : '#4A90E2'} />
          <Text style={[styles.filterText, filters.isAccessible && styles.filterTextActive]}>Accessible</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.hasChangingTable && styles.filterChipActive]}
          onPress={() => toggleFilter('hasChangingTable')}
        >
          <Ionicons name="woman" size={16} color={filters.hasChangingTable ? 'white' : '#4A90E2'} />
          <Text style={[styles.filterText, filters.hasChangingTable && styles.filterTextActive]}>Changing Table</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filters.isOpen && styles.filterChipActive]}
          onPress={() => toggleFilter('isOpen')}
        >
          <Ionicons name="time" size={16} color={filters.isOpen ? 'white' : '#4A90E2'} />
          <Text style={[styles.filterText, filters.isOpen && styles.filterTextActive]}>Open Now</Text>
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
              ]}>{km}km</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const resultsInfo = (
    <View style={styles.resultsInfo}>
      <Text style={styles.resultsText}>
        Found {bathrooms.length} bathroom{bathrooms.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const loadingOverlay = loading && (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.loadingText}>Searching for bathrooms...</Text>
    </View>
  );

  // Inject style for layout before rendering
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    let style = document.querySelector('style[data-map-global]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-map-global', 'true');
      style.innerHTML = `
        html, body, #root { width: 100% !important; min-height: 100% !important; height: auto !important; box-sizing: border-box; }
        body { background: #F5F5F5 !important; }
      `;
      document.head.appendChild(style);
    }
  }
  return (
    <div style={{ width: '100%', height: '100vh', overflowY: 'auto', background: '#F5F5F5' }}>
      {filtersUI}
      <div style={{ width: '100%', minHeight: 400, position: 'relative', marginBottom: 24 }}>
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
          {/* User location marker */}
          <Marker
            position={[location.coords.latitude, location.coords.longitude]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
          {/* Bathroom markers */}
          {bathrooms.length === 0 && (
            <Popup position={[location.coords.latitude, location.coords.longitude]}>
              <div>No bathrooms found nearby.</div>
            </Popup>
          )}
          {bathrooms.map((bathroom) => (
            <Marker
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
            </Marker>
          ))}
          {/* Locate button overlays the map */}
          <LocateButton lat={location.coords.latitude} lng={location.coords.longitude} />
        </MapContainer>
      </div>
      {loadingOverlay}
      {resultsInfo}
    </div>
  );
}

const styles = StyleSheet.create({
  webScrollContainer: {
    backgroundColor: '#F5F5F5',
  overflow: 'scroll',
    width: '100%',
  },
  container: {
    backgroundColor: '#F5F5F5',
    width: '100%',
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
});
